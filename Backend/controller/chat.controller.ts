import { Request, Response } from "express";
import { ChatMessage } from "../models/chat.model";
import { Order } from "../models/order.model";
import { getIo } from "../utils/socket";

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.id;

        if (!orderId) {
            res.status(400).json({ success: false, message: "Order ID is required." });
            return;
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }

        // Verify authorization (only customer or assigned rider can see chat)
        if (order.user.toString() !== userId && order.rider?.toString() !== userId) {
            res.status(403).json({ success: false, message: "You are not authorized to view this chat." });
            return;
        }

        const messages = await ChatMessage.find({ order: orderId })
            .populate("sender", "fullname email profilePicture")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("getChatMessages error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { text } = req.body;
        const userId = req.id;

        if (!orderId || !text) {
            res.status(400).json({ success: false, message: "Order ID and text are required." });
            return;
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }

        // Verify authorization
        if (order.user.toString() !== userId && order.rider?.toString() !== userId) {
            res.status(403).json({ success: false, message: "You are not authorized to send messages in this chat." });
            return;
        }

        const newMessage = await ChatMessage.create({
            order: orderId,
            sender: userId,
            text
        });

        const populatedMessage = await ChatMessage.findById(newMessage._id)
            .populate("sender", "fullname email profilePicture");

        // Broadcast message to order socket room
        const io = getIo();
        io.to(`order_${orderId}`).emit("new_chat_message", populatedMessage);

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        console.error("sendChatMessage error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
