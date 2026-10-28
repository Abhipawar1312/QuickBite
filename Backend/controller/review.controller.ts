import { Request, Response } from "express";
import mongoose from "mongoose";
import { Review } from "../models/review.model";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { getIo, sendNotification } from "../utils/socket";
import { cache } from "../utils/cache";

/**
 * High-performance MongoDB Aggregation Pipeline for Restaurant Rating Reconciliation.
 * Replaces O(N) client-side in-memory arrays with server-side aggregation.
 */
export async function recalculateRestaurantRating(
  restaurantId: mongoose.Types.ObjectId | string
): Promise<{ averageRating: number; numReviews: number }> {
  const targetId = new mongoose.Types.ObjectId(restaurantId.toString());

  const stats = await Review.aggregate([
    { $match: { restaurant: targetId } },
    {
      $group: {
        _id: "$restaurant",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? Number(stats[0].averageRating.toFixed(1)) : 0;
  const numReviews = stats.length > 0 ? stats[0].numReviews : 0;

  await Restaurant.findByIdAndUpdate(targetId, {
    averageRating,
    numReviews,
  });

  // Invalidate restaurant cache to reflect fresh rating immediately
  await cache.del(`restaurants:single:${targetId.toString()}`);
  await cache.invalidatePattern("restaurants:search:");

  return { averageRating, numReviews };
}

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

    // Check order status: only delivered orders can be reviewed
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
      comment,
    });

    // Mark order as reviewed
    order.isReviewed = true;
    await order.save();

    // Recalculate restaurant ratings using MongoDB Aggregation Pipeline
    const updatedStats = await recalculateRestaurantRating(order.restaurant._id);
    const updatedRestaurant = await Restaurant.findById(order.restaurant._id);

    // Populate review with user details for response/realtime broadcast
    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "fullname email profilePicture"
    );

    // Broadcast to restaurant owner room in real-time
    if (updatedRestaurant) {
      const restaurantOwnerId = updatedRestaurant.user.toString();
      sendNotification(restaurantOwnerId, "new_review", {
        review: populatedReview,
        restaurant: updatedRestaurant,
      });
    }

    // Broadcast to the order room to notify client page about review completed state
    const io = getIo();
    io.to(`order_${orderId}`).emit("order_reviewed", { orderId, review: populatedReview });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: populatedReview,
      restaurant: updatedRestaurant,
      stats: updatedStats,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error from compound index
      res.status(400).json({ success: false, message: "A review for this order has already been submitted." });
      return;
    }
    console.error("createReview error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    if (review.user.toString() !== userId) {
      res.status(403).json({ success: false, message: "Access denied. You can only update your own reviews." });
      return;
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        return;
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Reconcile aggregated restaurant ratings
    const updatedStats = await recalculateRestaurantRating(review.restaurant);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
      stats: updatedStats,
    });
  } catch (error) {
    console.error("updateReview error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).id;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    if (review.user.toString() !== userId) {
      res.status(403).json({ success: false, message: "Access denied. You can only delete your own reviews." });
      return;
    }

    const restaurantId = review.restaurant;
    const orderId = review.order;

    await Review.findByIdAndDelete(reviewId);

    // Reset order isReviewed flag
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { isReviewed: false });
    }

    // Reconcile aggregated restaurant ratings
    const updatedStats = await recalculateRestaurantRating(restaurantId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      stats: updatedStats,
    });
  } catch (error) {
    console.error("deleteReview error:", error);
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
      reviews,
    });
  } catch (error) {
    console.error("getRestaurantReviews error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
