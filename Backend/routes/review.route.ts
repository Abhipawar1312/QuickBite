import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { createReview, getRestaurantReviews } from "../controller/review.controller";

const router = express.Router();

router.route("/").post(isAuthenticated, createReview);
router.route("/restaurant/:restaurantId").get(isAuthenticated, getRestaurantReviews);

export default router;
