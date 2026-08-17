import mongoose, { Document, Model } from "mongoose";

export interface ISavedAddress {
    _id?: mongoose.Types.ObjectId | string;
    label?: string; // 'Home' | 'Work' | 'Other'
    tag?: 'Home' | 'Work' | 'Other';
    address: string;
    city: string;
    pincode?: string;
    deliveryInstructions?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
}

export interface IUser {
    fullname: string;
    email: string;
    password?: string;
    contact?: number;
    address: string;
    city: string;
    country: string;
    pincode?: string;
    profilePicture: string;
    admin: boolean;
    role?: 'user' | 'restaurant_owner' | 'admin' | 'rider';
    isRoleSelected?: boolean;
    savedAddresses?: ISavedAddress[];
    favorites?: {
        restaurants: mongoose.Types.ObjectId[];
        menus: mongoose.Types.ObjectId[];
    };
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

const savedAddressSchema = new mongoose.Schema({
    label: { type: String, default: "Home" },
    tag: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, default: "" },
    deliveryInstructions: { type: String, default: "" },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    isDefault: { type: Boolean, default: false },
});

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
    pincode: {
        type: String,
        default: ""
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
    savedAddresses: {
        type: [savedAddressSchema],
        default: []
    },
    favorites: {
        restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
        menus: [{ type: mongoose.Schema.Types.ObjectId, ref: "Menu" }]
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


