import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRider {
    user: mongoose.Schema.Types.ObjectId;
    vehicleName: string;
    licenseNumber: string;
    contact: string;
    isVerified: boolean;
    isOnline: boolean;
    location?: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
}

export interface IRiderDocument extends IRider, Document {
    createdAt: Date;
    updatedAt: Date;
}

const riderSchema = new Schema<IRiderDocument>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vehicleName: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: false,
        default: ""
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0] // [longitude, latitude]
        }
    }
}, { timestamps: true });

riderSchema.index({ location: "2dsphere" });

export const Rider: Model<IRiderDocument> = mongoose.model<IRiderDocument>("Rider", riderSchema);
