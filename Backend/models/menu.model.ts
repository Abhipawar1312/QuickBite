import mongoose, { Document } from "mongoose";

export interface IMenu {
    name: string;
    description: string;
    price: number;
    image: string;
    availability: 'Available' | 'Out of Stock';
}

export interface IMenuDocument extends IMenu, Document {
    createdAt: Date;
    updatedAt: Date;
}

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
    }
}, { timestamps: true });

export const Menu = mongoose.model("Menu", menuSchema);