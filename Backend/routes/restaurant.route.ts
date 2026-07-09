import express from "express";
import {
    createRestaurant,
    getRestaurant,
    getRestaurantOrder,
    getSingleRestaurant,
    searchRestaurant,
    updateOrderStatus,
    updateRestaurant,
    toggleRestaurantStatus,
    getAllRestaurantsAdmin,
    verifyRestaurantAdmin,
    deleteRestaurantAdmin
} from "../controller/restaurant.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAdmin, isRestaurantOwner } from "../middlewares/role.middleware";
import upload from "../middlewares/multer";

const router = express.Router();

router.route("/").post(isAuthenticated, upload.single("imageFile"), createRestaurant);
router.route("/").get(isAuthenticated, getRestaurant);
router.route("/").put(isAuthenticated, upload.single("imageFile"), updateRestaurant);
router.route("/order").get(isAuthenticated, getRestaurantOrder);
router.route("/order/:orderId/status").put(isAuthenticated, updateOrderStatus);
router.route("/search/:searchText").get(isAuthenticated, searchRestaurant);
router.route("/status").put(isAuthenticated, isRestaurantOwner, toggleRestaurantStatus);

// Admin dashboard routes
router.route("/admin/all").get(isAuthenticated, isAdmin, getAllRestaurantsAdmin);
router.route("/admin/:id/verify").put(isAuthenticated, isAdmin, verifyRestaurantAdmin);
router.route("/admin/:id").delete(isAuthenticated, isAdmin, deleteRestaurantAdmin);

router.route("/:id").get(isAuthenticated, getSingleRestaurant);

export default router;


