import { Request, Response } from "express";
import Stripe from "stripe";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";

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
        address: string;
        city: string;
    };
    restaurantId: string;
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).id;
        const orders = await Order.find({ user: userId })
            .populate("user", "-password")
            .populate("restaurant");
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("getOrders error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body as CheckoutSessionRequest;
        const userId = (req as any).id;

        // 1️⃣ Fetch restaurant and its menus (if needed)
        const restaurant = await Restaurant.findById(body.restaurantId).populate("menus");
        if (!restaurant) {
            res.status(404).json({ success: false, message: "Restaurant not found." });
            return;
        }

        // 2️⃣ Calculate totalAmount
        const totalAmount = body.cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // 3️⃣ Create the Order document with totalAmount
        const order = new Order({
            user: userId,
            restaurant: restaurant._id,
            deliveryDetails: body.deliveryDetails,
            cartItems: body.cartItems.map(item => ({
                menuId: item.menuId,
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity,
            })),
            totalAmount,           // ← persisted here
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
                        images: [item.image],
                    },
                    unit_amount: item.price * 100,
                },
                quantity: item.quantity,
            }) as Stripe.Checkout.SessionCreateParams.LineItem
        );

        // 5️⃣ Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            shipping_address_collection: { allowed_countries: ["IN"] },
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/order/status`,
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
            }
        }
    }

    res.status(200).send("Received");
};
