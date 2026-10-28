import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
  createReview,
  getRestaurantReviews,
  updateReview,
  deleteReview,
} from "../controller/review.controller";

const router = express.Router();

router.route("/").post(isAuthenticated, createReview);
router.route("/restaurant/:restaurantId").get(isAuthenticated, getRestaurantReviews);
router.route("/:reviewId").put(isAuthenticated, updateReview).delete(isAuthenticated, deleteReview);

export default router;
