import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryDetails {
    email: string;
    name: string;
    address: string;
    city: string;
    contact?: string;
    latitude?: number;
    longitude?: number;
}

export interface IAddOnItem {
    name: string;
    price: number;
    quantity?: number;
}


export interface ICartItem {
    menuId: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedAddOns?: IAddOnItem[];
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    restaurant: mongoose.Types.ObjectId;
    deliveryDetails: IDeliveryDetails;
    cartItems: ICartItem[];
    totalAmount?: number;
    status: "pending" | "confirmed" | "preparing" | "ready_for_riders" | "outfordelivery" | "delivered" | "Cancelled" | "cancelled";
    deliveryFee: number;
    platformFee: number;
    distanceKM: number;
    tipAmount: number;
    discountAmount: number;
    couponCode?: string;
    deliveryInstructions?: string;
    restaurantNote?: string;
    scheduledDeliveryTime?: string;

    deliveryPin?: string;
    cancellationReason?: string;
    refundStatus?: "initiated" | "processed" | "not_applicable";
    refundAmount?: number;
    refundId?: string;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    rider?: mongoose.Types.ObjectId;
    riderStatus?: 'pending' | 'accepted' | 'reached_restaurant' | 'delivered';
    isReviewed?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryDetailsSchema = new Schema<IDeliveryDetails>({
    email: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    contact: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
});

const AddOnItemSchema = new Schema<IAddOnItem>({
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, default: 1 }
}, { _id: false });


const CartItemSchema = new Schema<ICartItem>({
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    selectedAddOns: { type: [AddOnItemSchema], default: [] }
});

const OrderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
        deliveryDetails: { type: DeliveryDetailsSchema, required: true },
        cartItems: { type: [CartItemSchema], required: true },
        totalAmount: { type: Number },
        status: {
            type: String,
            enum: ["pending", "confirmed", "preparing", "ready_for_riders", "outfordelivery", "delivered", "Cancelled", "cancelled"],
            default: "pending",
        },

        deliveryFee: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 },
        distanceKM: { type: Number, default: 0 },
        tipAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        couponCode: { type: String, default: "" },
        deliveryInstructions: { type: String, default: "" },
        restaurantNote: { type: String, default: "" },
        scheduledDeliveryTime: { type: String, default: "" },

        deliveryPin: { type: String, default: "" },
        cancellationReason: { type: String, default: "" },
        refundStatus: {
            type: String,
            enum: ["initiated", "processed", "not_applicable"],
            default: "not_applicable"
        },
        refundAmount: { type: Number, default: 0 },
        refundId: { type: String, default: "" },
        stripeSessionId: { type: String, default: "" },
        stripePaymentIntentId: { type: String, default: "" },
        rider: { type: Schema.Types.ObjectId, ref: "User", default: null },
        riderStatus: {
            type: String,
            enum: ["pending", "accepted", "reached_restaurant", "delivered"],
            default: "pending"
        },
        isReviewed: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);



export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

