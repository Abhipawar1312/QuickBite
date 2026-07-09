import mongoose, { Document } from "mongoose";

export interface IRestaurant {
    user: mongoose.Schema.Types.ObjectId;
    restaurantName: string;
    city: string;
    country: string;
    address: string;
    deliveryTime: number;
    cuisines: string[];
    imageUrl: string;
    menus: mongoose.Types.ObjectId[];
    contactNumber: string;
    isOpen: boolean;
    isVerified: boolean;
    averageRating?: number;
    numReviews?: number;
    location?: {
        type: "Point";
        coordinates: [number, number];
    };
}
export interface IRestaurantDocument extends IRestaurant, Document {
    createdAt: Date;
    updatedAt: Date;
}

const restaurantSchema = new mongoose.Schema<IRestaurantDocument>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    restaurantName: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        default: "N/A"
    },
    deliveryTime: {
        type: Number,
        required: true
    },
    cuisines: [{ type: String, required: true }],
    menus: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }],
    imageUrl: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true,
        default: "N/A"
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
}, { timestamps: true });
restaurantSchema.index({ location: "2dsphere" });
export const Restaurant = mongoose.model("Restaurant", restaurantSchema);