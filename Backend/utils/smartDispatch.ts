import { Rider } from "../models/rider.model";
import { Order } from "../models/order.model";
import { getIo } from "./socket";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export interface CandidateRider {
  riderId: string;
  userId: string;
  distanceKM: number;
  activeDeliveriesCount: number;
}

/**
 * Smart Rider Dispatch Algorithm
 * Finds closest online, verified riders within a 5KM radius and dispatches real-time delivery offer.
 */
export async function smartDispatchOrder(orderId: string, maxRadiusKM: number = 5): Promise<CandidateRider[]> {
  try {
    const order = await Order.findById(orderId).populate("restaurant");
    if (!order || !order.restaurant) {
      console.error(`[smartDispatch] Order or restaurant not found for orderId: ${orderId}`);
      return [];
    }

    const restCoords = (order.restaurant as any).location?.coordinates; // [lng, lat]
    if (!restCoords || restCoords.length < 2 || (restCoords[0] === 0 && restCoords[1] === 0)) {
      console.log(`[smartDispatch] Restaurant has no valid coordinates. Broadcasting to all online riders.`);
    }

    const restLng = restCoords ? restCoords[0] : 72.978;
    const restLat = restCoords ? restCoords[1] : 19.218;

    // 1. Find all online and verified riders
    const onlineRiders = await Rider.find({
      isOnline: true,
      isVerified: true,
    }).populate("user", "fullname contact");

    if (onlineRiders.length === 0) {
      console.log(`[smartDispatch] No online verified riders found for order: ${orderId}`);
      return [];
    }

    // 2. Compute distance and sort by proximity
    const candidates: CandidateRider[] = [];

    for (const rider of onlineRiders) {
      let distance = 2.0; // fallback default
      if (rider.location?.coordinates && rider.location.coordinates.length === 2 && rider.location.coordinates[0] !== 0) {
        const [riderLng, riderLat] = rider.location.coordinates;
        distance = haversineDistance(restLat, restLng, riderLat, riderLng);
      }

      if (distance <= maxRadiusKM) {
        candidates.push({
          riderId: (rider as any)._id?.toString() || "",
          userId: (rider.user as any)?._id?.toString() || "",
          distanceKM: distance,
          activeDeliveriesCount: (rider as any).activeDeliveries?.length || 0,
        });
      }

    }

    // 3. Rank: lowest active deliveries first, then closest distance
    candidates.sort((a, b) => {
      if (a.activeDeliveriesCount !== b.activeDeliveriesCount) {
        return a.activeDeliveriesCount - b.activeDeliveriesCount;
      }
      return a.distanceKM - b.distanceKM;
    });

    console.log(`[smartDispatch] Found ${candidates.length} candidate riders for order: ${orderId}`);

    // 4. Emit targeted socket event to top candidates
    const io = getIo();
    if (io && candidates.length > 0) {
      const topCandidates = candidates.slice(0, 3);
      for (const candidate of topCandidates) {
        const deliveryOffer = {
          _id: order._id,
          orderId: order._id,
          restaurant: {
            restaurantName: (order.restaurant as any).restaurantName,
            address: (order.restaurant as any).address,
            city: (order.restaurant as any).city,
          },
          deliveryDetails: order.deliveryDetails,
          distanceKM: candidate.distanceKM,
          deliveryFee: order.deliveryFee || 25,
          tipAmount: order.tipAmount || 0,
          totalAmount: order.totalAmount,
          cartItems: order.cartItems,
          countdownSeconds: 30,
        };

        io.emit("new_delivery_offer", deliveryOffer);
      }
    }

    return candidates;
  } catch (error) {
    console.error("[smartDispatch] Error running dispatch algorithm:", error);
    return [];
  }
}
