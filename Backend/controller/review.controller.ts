import { Request, Response } from "express";
import { Review } from "../models/review.model";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { getIo, sendNotification } from "../utils/socket";

export const createReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).id;
        const { orderId, rating, comment } = req.body;

        if (!orderId || !rating || !comment) {
            res.status(400).json({ success: false, message: "Order ID, rating, and comment are required" });
            return;
        }

        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });
            return;
        }

        // Find the order
        const order = await Order.findById(orderId).populate("restaurant");
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        // Check if user owns the order
        if (order.user.toString() !== userId) {
            res.status(403).json({ success: false, message: "You are not authorized to review this order" });
            return;
        }

        // Check order status
        if (order.status !== "delivered") {
            res.status(400).json({ success: false, message: "You can only review delivered orders" });
            return;
        }

        // Check if already reviewed
        if (order.isReviewed) {
            res.status(400).json({ success: false, message: "You have already reviewed this order" });
            return;
        }

        // Create the review
        const review = await Review.create({
            user: userId,
            restaurant: order.restaurant._id,
            order: orderId,
            rating: numericRating,
            comment
        });

        // Mark order as reviewed
        order.isReviewed = true;
        await order.save();

        // Recalculate restaurant ratings
        const reviews = await Review.find({ restaurant: order.restaurant._id });
        const numReviews = reviews.length;
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews;

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            order.restaurant._id,
            {
                averageRating: Number(averageRating.toFixed(1)),
                numReviews
            },
            { new: true }
        );

        // Populate review with user details for response/realtime broadcast
        const populatedReview = await Review.findById(review._id)
            .populate("user", "fullname email profilePicture");

        // Broadcast to restaurant owner room in real-time
        if (updatedRestaurant) {
            const restaurantOwnerId = updatedRestaurant.user.toString();
            sendNotification(restaurantOwnerId, "new_review", {
                review: populatedReview,
                restaurant: updatedRestaurant
            });
        }

        // Broadcast to the order room to notify client page about review completed state
        const io = getIo();
        io.to(`order_${orderId}`).emit("order_reviewed", { orderId, review: populatedReview });

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: populatedReview,
            restaurant: updatedRestaurant
        });
    } catch (error) {
        console.error("createReview error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getRestaurantReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { restaurantId } = req.params;

        if (!restaurantId) {
            res.status(400).json({ success: false, message: "Restaurant ID is required" });
            return;
        }

        const reviews = await Review.find({ restaurant: restaurantId })
            .populate("user", "fullname email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("getRestaurantReviews error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
