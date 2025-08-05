import express from "express"
import upload from "../middlewares/multer";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
    addMenu,
    deleteMenu,
    editMenu,
    toggleMenuAvailability,
    getMenusByRestaurant
} from "../controller/menu.controller";

const router = express.Router();

// Create a new menu item
router.route("/").post(isAuthenticated, upload.single("image"), addMenu);

// Get all menus for the authenticated user's restaurant
router.route("/").get(isAuthenticated, getMenusByRestaurant);

// Update a menu item
router.route("/:id").put(isAuthenticated, upload.single("image"), editMenu);

// Delete a menu item
router.route("/:id").delete(isAuthenticated, deleteMenu);

// Toggle menu availability (separate endpoint for better UX)
router.route("/:id/availability").patch(isAuthenticated, toggleMenuAvailability);

export default router;