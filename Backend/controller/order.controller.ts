import { Request, Response } from "express";
import Stripe from "stripe";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { Rider } from "../models/rider.model";
import { sendNotification, broadcastNewOrderToRiders } from "../utils/socket";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

// Type for incoming checkout payload
type CheckoutSessionRequest = {
    cartItems: {
        menuId: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
    }[];
    deliveryDetails: {
        name: string;
        email: string;
        contact?: string;
        address: string;
        city: string;
        country?: string;
        pincode?: string;
        longitude?: number;
        latitude?: number;
    };
    restaurantId: string;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Number(distance.toFixed(1));
}

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).id;
        const confirmSuccess = req.query.confirmSuccess === "true";
        console.log(`[getOrders] Called by userId: ${userId}, confirmSuccess: ${confirmSuccess}`);

        if (confirmSuccess) {
            // Find all pending orders for this user and mark them as confirmed (as if webhook fired!)
            const pendingOrders = await Order.find({ user: userId, status: "pending" });
            console.log(`[getOrders] Found ${pendingOrders.length} pending orders for userId: ${userId}`);
            for (const order of pendingOrders) {
                console.log(`[getOrders] Confirming order ID: ${order._id}`);
                order.status = "confirmed";
                await order.save();

                // Broadcast to riders and notify restaurant owner in real-time!
                const populatedOrder = await Order.findById(order._id)
                    .populate("restaurant")
                    .populate("user", "-password");
                if (populatedOrder) {
                    const restaurantUserId = (populatedOrder.restaurant as any).user.toString();
                    sendNotification(restaurantUserId, "new_restaurant_order", populatedOrder);
                    console.log(`[getOrders] Broadcasted new_restaurant_order to restaurant owner: ${restaurantUserId}`);
                }
            }
        }

        const orders = await Order.find({ user: userId })
            .populate("user", "-password")
            .populate("restaurant")
            .populate("rider", "-password");

        // Enrich orders with rider vehicle name for the live tracking map
        const enriched = await Promise.all(orders.map(async (order) => {
            const obj = order.toObject() as any;
            if (order.rider) {
                const riderProfile = await Rider.findOne({ user: (order.rider as any)._id });
                if (riderProfile) obj.riderVehicle = riderProfile.vehicleName;
            }
            return obj;
        }));

        res.status(200).json({ success: true, orders: enriched });
    } catch (error) {
        console.error("getOrders error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body as CheckoutSessionRequest;
        const userId = (req as any).id;

        console.log("createCheckoutSession body:", body);
        // 1️⃣ Fetch restaurant and its menus (if needed)
        const restaurant = await Restaurant.findById(body.restaurantId).populate("menus");
        if (!restaurant) {
            res.status(404).json({ success: false, message: "Restaurant not found." });
            return;
        }

        // Verify restaurant is verified and open
        if (!restaurant.isVerified) {
            res.status(400).json({ success: false, message: "This restaurant is not verified by admin." });
            return;
        }
        if (!restaurant.isOpen) {
            res.status(400).json({ success: false, message: "This restaurant is currently closed. You cannot place orders." });
            return;
        }

        // Calculate distance
        let distanceKM = 2.5; // Default fallback
        const userLat = Number(body.deliveryDetails.latitude);
        const userLng = Number(body.deliveryDetails.longitude);
        const restCoords = restaurant.location?.coordinates; // [longitude, latitude]

        if (userLat && userLng && restCoords && restCoords.length === 2 && restCoords[0] !== 0) {
            distanceKM = calculateDistance(userLat, userLng, restCoords[1], restCoords[0]);
        }

        // Delivery Fee logic: Free within 2KM, standard rate, higher for long range
        let deliveryFee = 0;
        if (distanceKM > 2 && distanceKM <= 5) {
            deliveryFee = 25;
        } else if (distanceKM > 5) {
            deliveryFee = 25 + Math.round((distanceKM - 5) * 8);
        }

        const platformFee = 5;

        // Calculate food subtotal
        const foodTotal = body.cartItems.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        const totalAmount = foodTotal + deliveryFee + platformFee;

        if (totalAmount < 50) {
            res.status(400).json({
                success: false,
                message: "Total amount must be at least ₹50 to proceed with payment due to Stripe transaction limits. Please add more items or increase quantity."
            });
            return;
        }

        // 3️⃣ Create the Order document with calculated fees
        const order = new Order({
            user: userId,
            restaurant: restaurant._id,
            deliveryDetails: body.deliveryDetails,
            cartItems: body.cartItems.map(item => ({
                menuId: item.menuId,
                name: item.name,
                image: item.image,
                price: Number(item.price),
                quantity: Number(item.quantity),
            })),
            totalAmount,
            deliveryFee,
            platformFee,
            distanceKM,
            status: "pending",
        });
        await order.save();



        // 4️⃣ Build Stripe line items
        const lineItems = body.cartItems.map(
            item => ({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: item.name,
                        // Stripe will throw an error if we supply relative URLs like "/placeholder.svg"
                        images: item.image && item.image.startsWith("http") ? [item.image] : [],
                    },
                    unit_amount: Math.round(Number(item.price) * 100), // Stripe expects unit_amount in cents (integer)
                },
                quantity: Number(item.quantity), // Stripe strictly expects quantity as an integer number
            }) as Stripe.Checkout.SessionCreateParams.LineItem
        );

        // Add Delivery Fee to Stripe if > 0
        if (deliveryFee > 0) {
            lineItems.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "Delivery Fee",
                        description: `Distance: ${distanceKM} km`,
                    },
                    unit_amount: deliveryFee * 100,
                },
                quantity: 1,
            } as Stripe.Checkout.SessionCreateParams.LineItem);
        }

        // Add Platform Fee to Stripe
        lineItems.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Platform Fee",
                },
                unit_amount: platformFee * 100,
            },
            quantity: 1,
        } as Stripe.Checkout.SessionCreateParams.LineItem);

        // 5️⃣ Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            shipping_address_collection: { allowed_countries: ["IN"] },
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/order/status?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/cart`,
            metadata: { orderId: `${order._id}` },
        });

        res.status(200).json({ session });
    } catch (error) {
        console.error("createCheckoutSession error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.WEBHOOK_ENDPOINT_SECRET!;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.status = "confirmed";
                order.totalAmount = session.amount_total ?? order.totalAmount;
                await order.save();

                const populatedOrder = await Order.findById(order._id)
                    .populate("restaurant")
                    .populate("user", "-password");
                if (populatedOrder) {
                    // Notify restaurant owner in real-time
                    const restaurantUserId = (populatedOrder.restaurant as any).user.toString();
                    sendNotification(restaurantUserId, "new_restaurant_order", populatedOrder);
                }
            }

        }
    }

    res.status(200).send("Received");
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { cancellationReason } = req.body;

        if (!cancellationReason || cancellationReason.trim() === "") {
            res.status(400).json({
                success: false,
                message: "Cancellation reason is mandatory."
            });
            return;
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }

        // Verify that the caller is indeed the restaurant owner of this restaurant
        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant || restaurant.user.toString() !== req.id) {
            res.status(403).json({
                success: false,
                message: "Access Denied: You do not own the restaurant associated with this order."
            });
            return;
        }

        order.status = "Cancelled";
        order.cancellationReason = cancellationReason;
        await order.save();

        // Emit real-time notification to the user (customer) who placed the order!
        sendNotification(order.user.toString(), "order_cancelled", {
            orderId: order._id,
            cancellationReason,
            message: `Your order from ${restaurant.restaurantName} has been cancelled.`
        });

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
            order
        });
    } catch (error) {
        console.error("cancelOrder error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
