import { Request, Response } from "express";
import mongoose from "mongoose";
import { Rider } from "../models/rider.model";
import { Restaurant } from "../models/restaurant.model";
import { Order } from "../models/order.model";
import { sendNotification, getIo } from "../utils/socket";

// Helper function to calculate distance in meters
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

export const submitRiderDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vehicleName, licenseNumber, contact } = req.body;
        const userId = req.id;

        if (!vehicleName || !licenseNumber || !contact) {
            res.status(400).json({ success: false, message: "Vehicle name, license number, and contact number are required." });
            return;
        }

        let rider = await Rider.findOne({ user: userId });
        if (rider) {
            res.status(400).json({ success: false, message: "Rider details already submitted." });
            return;
        }

        rider = await Rider.create({
            user: userId,
            vehicleName,
            licenseNumber,
            contact,
            isVerified: false,
            isOnline: false,
        });

        res.status(201).json({
            success: true,
            message: "Rider registration details submitted successfully. Awaiting admin verification.",
            rider
        });
    } catch (error) {
        console.error("submitRiderDetails error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const toggleOnlineStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isOnline, latitude, longitude } = req.body;
        const userId = req.id;

        const rider = await Rider.findOne({ user: userId });
        if (!rider) {
            res.status(404).json({ success: false, message: "Rider profile not found." });
            return;
        }

        if (!rider.isVerified) {
            res.status(400).json({ success: false, message: "Rider account is not verified by admin yet. You cannot go online." });
            return;
        }

        if (isOnline) {
            const riderLat = Number(latitude);
            const riderLng = Number(longitude);

            if (!riderLat || !riderLng) {
                res.status(400).json({ success: false, message: "GPS coordinates are required to go online." });
                return;
            }

            rider.isOnline = true;
            rider.location = {
                type: "Point",
                coordinates: [riderLng, riderLat]
            };
        } else {
            rider.isOnline = false;
        }

        await rider.save();

        res.status(200).json({
            success: true,
            message: `You are now ${rider.isOnline ? 'Online' : 'Offline'}`,
            rider
        });
    } catch (error) {
        console.error("toggleOnlineStatus error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const acceptOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.id;

        const rider = await Rider.findOne({ user: userId });
        if (!rider || !rider.isVerified || !rider.isOnline) {
            res.status(400).json({ success: false, message: "You must be a verified and online rider to accept orders." });
            return;
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }

        // Check if order is already assigned
        if (order.rider) {
            res.status(400).json({ success: false, message: "Order already taken" });
            return;
        }

        order.rider = new mongoose.Types.ObjectId(userId);
        order.riderStatus = "accepted";
        if (order.status !== "ready_for_riders") {
            order.status = "preparing"; // Advance status to preparing
        }
        await order.save();

        // Notify customer and restaurant that a rider has accepted
        const restaurant = await Restaurant.findById(order.restaurant);
        sendNotification(order.user.toString(), "rider_accepted", {
            orderId: order._id,
            riderId: userId,
            message: "A delivery rider has accepted your order and is moving towards the restaurant!"
        });
        if (restaurant) {
            sendNotification(restaurant.user.toString(), "rider_accepted_restaurant", {
                orderId: order._id,
                message: "Rider has accepted the order and is on their way."
            });
        }

        // Notify other riders to remove the order from their screen
        const io = getIo();
        io.emit("order_taken", { orderId });

        const populatedOrder = await Order.findById(order._id)
            .populate("restaurant")
            .populate("user", "-password")
            .populate("rider");

        if (populatedOrder) {
            // Send to customer
            sendNotification(populatedOrder.user._id.toString(), "order_status_updated", populatedOrder);
            // Send to restaurant owner
            if (restaurant) {
                sendNotification(restaurant.user.toString(), "order_status_updated", populatedOrder);
            }
            // Send to order room
            io.to(`order_${order._id}`).emit("order_status_updated", populatedOrder);
        }

        res.status(200).json({
            success: true,
            message: "Order accepted successfully! Please head to the restaurant.",
            order: populatedOrder || order
        });
    } catch (error) {
        console.error("acceptOrder error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateDeliveryWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'reached_restaurant' or 'delivered'
        const userId = req.id;

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }

        if (order.rider?.toString() !== userId.toString()) {
            res.status(403).json({ success: false, message: "Access Denied: You are not assigned to this order." });
            return;
        }

        if (status === "reached_restaurant") {
            order.riderStatus = "reached_restaurant";
            order.status = "outfordelivery";
            await order.save();

            sendNotification(order.user.toString(), "rider_reached_restaurant", {
                orderId: order._id,
                message: "Your delivery partner has picked up your food and is out for delivery!"
            });
        } else if (status === "delivered") {
            order.riderStatus = "delivered";
            order.status = "delivered";
            await order.save();

            sendNotification(order.user.toString(), "order_delivered_notification", {
                orderId: order._id,
                message: "Your order has been delivered successfully! Bon appétit!"
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid workflow status." });
            return;
        }

        const populatedOrder = await Order.findById(order._id)
            .populate("restaurant")
            .populate("user", "-password")
            .populate("rider");

        if (populatedOrder) {
            // Send to customer
            sendNotification(populatedOrder.user._id.toString(), "order_status_updated", populatedOrder);
            // Send to restaurant owner
            const rest = await Restaurant.findById(order.restaurant);
            if (rest) {
                sendNotification(rest.user.toString(), "order_status_updated", populatedOrder);
            }
            // Send to order room
            const io = getIo();
            io.to(`order_${order._id}`).emit("order_status_updated", populatedOrder);
        }

        res.status(200).json({
            success: true,
            message: "Workflow updated successfully.",
            order: populatedOrder || order
        });
    } catch (error) {
        console.error("updateDeliveryWorkflow error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Admin rider dashboards
export const getAllRidersAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const riders = await Rider.find().populate("user", "fullname email contact");
        res.status(200).json({ success: true, riders });
    } catch (error) {
        console.error("getAllRidersAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const verifyRiderAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const rider = await Rider.findById(id);
        if (!rider) {
            res.status(404).json({ success: false, message: "Rider not found" });
            return;
        }

        rider.isVerified = true;
        await rider.save();

        // Notify the rider in real-time — their "Profile Under Review" screen will auto-update
        sendNotification(rider.user.toString(), "rider_verified", {
            message: "Congratulations! Your rider profile has been verified. You can now go online!",
            rider: rider.toObject()
        });

        res.status(200).json({
            success: true,
            message: "Rider verified successfully"
        });
    } catch (error) {
        console.error("verifyRiderAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteRiderAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const rider = await Rider.findByIdAndDelete(id);
        if (!rider) {
            res.status(404).json({ success: false, message: "Rider not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Rider deleted successfully"
        });
    } catch (error) {
        console.error("deleteRiderAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getRiderProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.id;
        const rider = await Rider.findOne({ user: userId }).populate("user", "fullname email contact");
        
        res.status(200).json({
            success: true,
            rider: rider || null
        });
    } catch (error) {
        console.error("getRiderProfile error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getRiderEarnings = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.id;
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const deliveredOrders = await Order.find({
            rider: userId,
            status: "delivered"
        }).populate("restaurant").sort({ createdAt: -1 });

        let todayEarnings = 0;
        let weekEarnings = 0;
        let totalEarnings = 0;
        let tripsToday = 0;
        let tripsWeek = 0;
        const tripsTotal = deliveredOrders.length;

        deliveredOrders.forEach(order => {
            const fee = order.deliveryFee || 0;
            const created = new Date(order.createdAt);
            totalEarnings += fee;

            if (created >= startOfToday) {
                todayEarnings += fee;
                tripsToday++;
            }
            if (created >= startOfWeek) {
                weekEarnings += fee;
                tripsWeek++;
            }
        });

        res.status(200).json({
            success: true,
            earnings: {
                today: todayEarnings,
                week: weekEarnings,
                total: totalEarnings,
                tripsToday,
                tripsWeek,
                tripsTotal
            },
            deliveries: deliveredOrders
        });
    } catch (error) {
        console.error("getRiderEarnings error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

