import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryDetails {
    email: string;
    name: string;
    address: string;
    city: string;
}

export interface ICartItem {
    menuId: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    restaurant: mongoose.Types.ObjectId;
    deliveryDetails: IDeliveryDetails;
    cartItems: ICartItem[];               // ← array!
    totalAmount?: number;
    status: "pending" | "confirmed" | "preparing" | "outfordelivery" | "delivered";
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryDetailsSchema = new Schema<IDeliveryDetails>({
    email: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
});

const CartItemSchema = new Schema<ICartItem>({
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
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
            enum: ["pending", "confirmed", "preparing", "outfordelivery", "delivered"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
