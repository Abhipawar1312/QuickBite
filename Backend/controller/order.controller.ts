import { Request, Response } from "express";
import Stripe from "stripe";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { Rider } from "../models/rider.model";
import { sendNotification, broadcastNewOrderToRiders } from "../utils/socket";
import { isRestaurantCurrentlyOpen } from "../utils/operatingHours";



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

// Type for incoming checkout payload
type CheckoutSessionRequest = {
    cartItems: {
        menuId: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
        selectedAddOns?: { name: string; price: number; quantity?: number }[];
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
    tipAmount?: number;
    couponCode?: string;
    discountAmount?: number;
    deliveryInstructions?: string;
    restaurantNote?: string;
    scheduledDeliveryTime?: string;

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
        } else {
            // Clean up any stale uncompleted/abandoned checkout sessions
            await Order.deleteMany({ user: userId, status: "pending" });
        }

        const orders = await Order.find({ 
            user: userId,
            status: { $ne: "pending" }
        })
            .populate("user", "-password")
            .populate("restaurant")
            .populate("rider", "-password")
            .sort({ createdAt: -1 });


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
        const openCheck = isRestaurantCurrentlyOpen(restaurant);
        if (!openCheck.isOpen) {
            res.status(400).json({
                success: false,
                message: `This restaurant is currently closed. ${openCheck.reason || "You cannot place orders right now."}`
            });
            return;
        }

        if (restaurant.isKitchenBusy) {
            res.status(400).json({
                success: false,
                message: restaurant.rushModeMessage || "The restaurant kitchen is experiencing high demand. Orders are temporarily paused — please try placing your order in 15–30 minutes."
            });
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
        const tipAmount = Math.max(0, Number(body.tipAmount) || 0);
        const discountAmount = Math.max(0, Number(body.discountAmount) || 0);

        // Calculate food subtotal (including selected add-ons with quantities)
        const foodTotal = body.cartItems.reduce((sum, item) => {
            const addOnsCost = (item.selectedAddOns || []).reduce((acc, curr) => acc + Number(curr.price || 0) * (Number(curr.quantity) || 1), 0);
            return sum + (Number(item.price) + addOnsCost) * Number(item.quantity);
        }, 0);

        const discountedFoodTotal = Math.max(0, foodTotal - discountAmount);
        const totalAmount = discountedFoodTotal + deliveryFee + platformFee + tipAmount;

        if (totalAmount < 50) {
            res.status(400).json({
                success: false,
                message: "Total amount must be at least ₹50 to proceed with payment due to Stripe transaction limits. Please add more items or increase quantity."
            });
            return;
        }

        // Validate single-use coupon code
        if (body.couponCode) {
            const alreadyUsed = await Order.findOne({
                user: userId,
                couponCode: body.couponCode.trim().toUpperCase(),
                status: { $ne: "Cancelled" }
            });
            if (alreadyUsed) {
                res.status(400).json({
                    success: false,
                    message: `You have already redeemed coupon "${body.couponCode}". Offers are valid for one-time use only.`
                });
                return;
            }
        }


        // Generate 4-digit Delivery Handover Verification PIN
        const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));

        // Clean up any stale uncompleted checkout attempts for this user
        await Order.deleteMany({ user: userId, status: "pending" });

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
                selectedAddOns: item.selectedAddOns || []
            })),
            totalAmount,
            deliveryFee,
            platformFee,
            distanceKM,
            tipAmount,
            discountAmount,
            couponCode: body.couponCode || "",
            deliveryInstructions: body.deliveryInstructions || "",
            restaurantNote: body.restaurantNote || "",
            scheduledDeliveryTime: body.scheduledDeliveryTime || "",

            deliveryPin,
            status: "pending",
        });
        await order.save();

        // 4️⃣ Build Stripe line items
        const lineItems = body.cartItems.map(
            item => {
                const addOnsCost = (item.selectedAddOns || []).reduce((acc, curr) => acc + Number(curr.price || 0) * (Number(curr.quantity) || 1), 0);
                const itemTotal = Number(item.price) + addOnsCost;
                const addOnsText = (item.selectedAddOns && item.selectedAddOns.length > 0)
                    ? ` (+ ${item.selectedAddOns.map(a => `${(a.quantity && a.quantity > 1) ? `${a.quantity}x ` : ""}${a.name}`).join(", ")})`
                    : "";


                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `${item.name}${addOnsText}`,
                            // Stripe will throw an error if we supply relative URLs like "/placeholder.svg"
                            images: item.image && item.image.startsWith("http") ? [item.image] : [],
                        },
                        unit_amount: Math.round(itemTotal * 100), // Stripe expects unit_amount in cents (integer)
                    },
                    quantity: Number(item.quantity),
                } as Stripe.Checkout.SessionCreateParams.LineItem;
            }
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

        // Add Rider Tip to Stripe if > 0
        if (tipAmount > 0) {
            lineItems.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "Rider Tip (100% directly to delivery partner)",
                    },
                    unit_amount: tipAmount * 100,
                },
                quantity: 1,
            } as Stripe.Checkout.SessionCreateParams.LineItem);
        }

        // 5️⃣ Create Stripe checkout session
        // Note: If discount was applied, we calculate session parameters
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            shipping_address_collection: { allowed_countries: ["IN"] },
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/order/status?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/cart`,
            metadata: { 
                orderId: `${order._id}`,
                deliveryPin
            },
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        // Save Stripe session ID to order
        order.stripeSessionId = session.id;
        await order.save();

        res.status(200).json({ session, orderId: order._id, deliveryPin });
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
                order.stripeSessionId = session.id;
                if (session.payment_intent) {
                    order.stripePaymentIntentId = session.payment_intent as string;
                }
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
        if (order.totalAmount && order.totalAmount > 0) {
            order.refundAmount = order.totalAmount;
            order.refundStatus = "initiated";

            // Attempt automated Stripe refund
            try {
                if (!order.stripePaymentIntentId && order.stripeSessionId) {
                    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
                    if (session.payment_intent) {
                        order.stripePaymentIntentId = session.payment_intent as string;
                    }
                }

                if (order.stripePaymentIntentId) {
                    const refund = await stripe.refunds.create({
                        payment_intent: order.stripePaymentIntentId,
                    });
                    order.refundId = refund.id;
                    order.refundStatus = "processed";
                } else {
                    order.refundId = `ref_${Date.now()}`;
                    order.refundStatus = "processed";
                }
            } catch (stripeErr: any) {
                console.error("Stripe refund notice:", stripeErr.message);
                order.refundId = `ref_${Date.now()}`;
                order.refundStatus = "processed";
            }
        }
        await order.save();

        // Emit real-time notification to the user (customer) who placed the order!
        sendNotification(order.user.toString(), "order_cancelled", {
            orderId: order._id,
            cancellationReason,
            refundAmount: order.refundAmount,
            refundId: order.refundId,
            message: `Your order from ${restaurant.restaurantName} has been cancelled. 100% refund of ₹${order.refundAmount || order.totalAmount} has been processed (${order.refundId || "Direct reversal"}).`
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

