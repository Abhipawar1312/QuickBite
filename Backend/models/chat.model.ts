import mongoose, { Document, Schema, Model } from "mongoose";

export interface IChatMessage extends Document {
    order: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const ChatMessage: Model<IChatMessage> = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
