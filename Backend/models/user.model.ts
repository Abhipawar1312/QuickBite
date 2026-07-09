import mongoose, { Document, Model } from "mongoose";

export interface IUser {
    fullname: string;
    email: string;
    password?: string;
    contact?: number;
    address: string;
    city: string;
    country: string;
    profilePicture: string;
    admin: boolean;
    role?: 'user' | 'restaurant_owner' | 'admin' | 'rider';
    isRoleSelected?: boolean;
    lastLogin?: Date;
    isVerified?: boolean;
    resetPasswordToken?: string;
    resetPasswordTokenExpiresAt?: Date;
    verificationToken?: string;
    verificationTokenExpiresAt?: Date
}

export interface IUserDocument extends IUser, Document {
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    contact: {
        type: Number,
        required: false
    },
    address: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    profilePicture: {
        type: String,
        default: ""
    },
    admin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'restaurant_owner', 'admin', 'rider'],
        default: 'user'
    },
    isRoleSelected: {
        type: Boolean,
        default: false
    },
    // from here starts advanced authentication
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordTokenExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date
}, { timestamps: true });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", userSchema);

