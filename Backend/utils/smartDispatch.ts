import { Rider } from "../models/rider.model";
import { Order } from "../models/order.model";
import { sendNotification, getIo } from "./socket";
import { calculateHaversineDistance, isValidCoordinate } from "./geo";

export interface CandidateRider {
  riderId: string;
  userId: string;
  distanceKM: number;
  activeDeliveriesCount: number;
  locationFreshnessSeconds: number;
  proximityScore: number;
  workloadScore: number;
  freshnessScore: number;
  compositeScore: number;
}

export interface DispatchWeights {
  proximity: number; // default 0.50
  workload: number;  // default 0.30
  freshness: number; // default 0.20
}

export const DEFAULT_DISPATCH_WEIGHTS: DispatchWeights = {
  proximity: 0.5,
  workload: 0.3,
  freshness: 0.2,
};

/**
 * Normalizes proximity score.
 * 0 KM distance => 1.0 (best)
 * Max radius => 0.0 (worst)
 */
export function calculateProximityScore(distanceKM: number, maxRadiusKM: number): number {
  if (distanceKM <= 0) return 1.0;
  if (distanceKM >= maxRadiusKM) return 0.0;
  return Number((1 - distanceKM / maxRadiusKM).toFixed(4));
}

/**
 * Normalizes workload score.
 * 0 active orders => 1.0
 * 1 active order => 0.6
 * 2 active orders => 0.2
 * > 2 active orders => 0.0 (ineligible)
 */
export function calculateWorkloadScore(activeCount: number): number {
  if (activeCount <= 0) return 1.0;
  if (activeCount === 1) return 0.6;
  if (activeCount === 2) return 0.2;
  return 0.0;
}

/**
 * Normalizes location freshness score based on elapsed seconds since last GPS update.
 * <= 60 seconds => 1.0 (hot)
 * <= 180 seconds => 0.75
 * <= 360 seconds => 0.4
 * > 600 seconds => 0.1 (stale)
 */
export function calculateFreshnessScore(elapsedSeconds: number): number {
  if (elapsedSeconds <= 60) return 1.0;
  if (elapsedSeconds <= 180) return 0.75;
  if (elapsedSeconds <= 360) return 0.4;
  if (elapsedSeconds <= 600) return 0.2;
  return 0.1;
}

/**
 * Computes composite dispatch score from normalized sub-scores and weights.
 */
export function computeCompositeScore(
  proximityScore: number,
  workloadScore: number,
  freshnessScore: number,
  weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS
): number {
  const rawScore =
    weights.proximity * proximityScore +
    weights.workload * workloadScore +
    weights.freshness * freshnessScore;
  return Number(rawScore.toFixed(4));
}

/**
 * In-memory map to track rejected / timed-out rider IDs per orderId
 * Map<orderId, Set<riderUserId>>
 */
const excludedRidersPerOrder = new Map<string, Set<string>>();

export function recordRiderDeclined(orderId: string, riderUserId: string): void {
  const currentSet = excludedRidersPerOrder.get(orderId) || new Set<string>();
  currentSet.add(riderUserId);
  excludedRidersPerOrder.set(orderId, currentSet);
}

export function clearExcludedRidersForOrder(orderId: string): void {
  excludedRidersPerOrder.delete(orderId);
}

/**
 * Smart Rider Dispatch Algorithm
 * Evaluates hard constraints, computes multi-factor ranking scores,
 * and emits targeted delivery offers to top candidate riders.
 *
 * @param orderId MongoDB Order ID
 * @param maxRadiusKM Maximum search radius in kilometers (default 7 KM)
 * @param weights Configurable score weights
 */
export async function smartDispatchOrder(
  orderId: string,
  maxRadiusKM: number = 7,
  weights: DispatchWeights = DEFAULT_DISPATCH_WEIGHTS
): Promise<CandidateRider[]> {
  try {
    const order = await Order.findById(orderId).populate("restaurant");
    if (!order || !order.restaurant) {
      console.error(`[smartDispatch] Order or restaurant not found for orderId: ${orderId}`);
      return [];
    }

    // Extract restaurant coordinates: GeoJSON [longitude, latitude]
    const restCoords = (order.restaurant as any).location?.coordinates;
    let restLng = 72.978;
    let restLat = 19.218;

    if (
      Array.isArray(restCoords) &&
      restCoords.length === 2 &&
      isValidCoordinate(restCoords[1], restCoords[0])
    ) {
      restLng = restCoords[0];
      restLat = restCoords[1];
    } else {
      console.warn(`[smartDispatch] Restaurant has unindexed coordinates. Using default reference coordinates.`);
    }

    const excludedUserIds = excludedRidersPerOrder.get(orderId) || new Set<string>();

    // 1. HARD CONSTRAINTS: Spatial Query using MongoDB 2dsphere $near
    // Finds online, verified riders within maxRadiusKM
    let onlineRiders: any[] = [];
    try {
      onlineRiders = await Rider.find({
        isOnline: true,
        isVerified: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [restLng, restLat], // [lng, lat]
            },
            $maxDistance: maxRadiusKM * 1000, // meters
          },
        },
      }).populate("user", "fullname contact");
    } catch (geoErr) {
      // Graceful fallback if 2dsphere index query fails or riders have [0,0] coordinates
      console.warn("[smartDispatch] Geospatial $near query failed, using fallback query:", geoErr);
      onlineRiders = await Rider.find({
        isOnline: true,
        isVerified: true,
      }).populate("user", "fullname contact");
    }

    if (!onlineRiders || onlineRiders.length === 0) {
      console.log(`[smartDispatch] No online verified riders found within ${maxRadiusKM}KM for order: ${orderId}`);
      return [];
    }

    // 2. HARD CONSTRAINT FILTERING & MULTI-FACTOR RANKING
    const candidates: CandidateRider[] = [];
    const now = Date.now();

    for (const rider of onlineRiders) {
      const riderUserId = (rider.user as any)?._id?.toString() || rider.user?.toString();
      const riderDocId = rider._id?.toString() || "";

      // Constraint: Exclude riders who already declined or timed out for this order
      if (excludedUserIds.has(riderUserId)) {
        continue;
      }

      // Constraint: Incompatible active workload (max 2 active deliveries per rider)
      const activeDeliveriesCount = (rider as any).activeDeliveries?.length || 0;
      if (activeDeliveriesCount >= 3) {
        continue;
      }

      // Calculate exact distance
      let distanceKM = 2.0;
      if (rider.location?.coordinates && rider.location.coordinates.length === 2) {
        const [riderLng, riderLat] = rider.location.coordinates;
        if (isValidCoordinate(riderLat, riderLng)) {
          distanceKM = calculateHaversineDistance(restLat, restLng, riderLat, riderLng, "km");
        }
      }

      // Hard filter: ensure within radius
      if (distanceKM > maxRadiusKM) {
        continue;
      }

      // Calculate location freshness
      const updatedAtTime = rider.updatedAt ? new Date(rider.updatedAt).getTime() : now - 120000;
      const elapsedSeconds = Math.max(0, Math.round((now - updatedAtTime) / 1000));

      // Calculate normalized sub-scores
      const proximityScore = calculateProximityScore(distanceKM, maxRadiusKM);
      const workloadScore = calculateWorkloadScore(activeDeliveriesCount);
      const freshnessScore = calculateFreshnessScore(elapsedSeconds);

      // Composite multi-factor score
      const compositeScore = computeCompositeScore(
        proximityScore,
        workloadScore,
        freshnessScore,
        weights
      );

      candidates.push({
        riderId: riderDocId,
        userId: riderUserId,
        distanceKM,
        activeDeliveriesCount,
        locationFreshnessSeconds: elapsedSeconds,
        proximityScore,
        workloadScore,
        freshnessScore,
        compositeScore,
      });
    }

    if (candidates.length === 0) {
      console.log(`[smartDispatch] All nearby riders are either busy or excluded for order: ${orderId}`);
      return [];
    }

    // 3. RANK BY COMPOSITE SCORE (DESCENDING)
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);

    console.log(
      `[smartDispatch] Ranked ${candidates.length} candidate riders for order ${orderId}. Top score: ${candidates[0]?.compositeScore} (Rider: ${candidates[0]?.userId})`
    );

    // 4. DISPATCH TARGETED REAL-TIME OFFERS TO TOP CANDIDATES
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

      // TARGETED EMIT: Only send to this specific candidate rider's private socket room
      sendNotification(candidate.userId, "new_delivery_offer", deliveryOffer);
    }

    return candidates;
  } catch (error) {
    console.error("[smartDispatch] Error running dispatch algorithm:", error);
    return [];
  }
}
