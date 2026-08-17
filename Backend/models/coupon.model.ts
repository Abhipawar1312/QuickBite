import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICoupon {
    code: string;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    isActive: boolean;
    expiresAt?: Date;
}

export interface ICouponDocument extends ICoupon, Document {
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            default: ""
        },
        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            required: true,
            default: 'percentage'
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderValue: {
            type: Number,
            required: true,
            default: 0
        },
        maxDiscount: {
            type: Number,
            required: false,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        expiresAt: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
);

export const Coupon: Model<ICouponDocument> = mongoose.model<ICouponDocument>("Coupon", couponSchema);
