import mongoose, { Document } from "mongoose";

export interface IMenuAddOn {
    name: string;
    price: number;
}

export interface IMenu {
    name: string;
    description: string;
    price: number;
    image: string;
    availability: 'Available' | 'Out of Stock';
    isVeg?: boolean;
    category?: string;
    addOns?: IMenuAddOn[];
}

export interface IMenuDocument extends IMenu, Document {
    createdAt: Date;
    updatedAt: Date;
}

const addOnSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 }
}, { _id: false });

const menuSchema = new mongoose.Schema<IMenuDocument>({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    availability: {
        type: String,
        enum: ['Available', 'Out of Stock'],
        default: 'Available'
    },
    isVeg: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        default: "Main Course"
    },
    addOns: {
        type: [addOnSchema],
        default: []
    }
}, { timestamps: true });

export const Menu = mongoose.model("Menu", menuSchema);