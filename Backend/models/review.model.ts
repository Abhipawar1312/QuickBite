import mongoose, { Document, Schema, Model } from "mongoose";

export interface IReview extends Document {
    user: mongoose.Types.ObjectId;
    restaurant: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const Review: Model<IReview> = mongoose.model<IReview>("Review", ReviewSchema);
