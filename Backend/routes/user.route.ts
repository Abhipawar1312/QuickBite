import express from "express";
import {
    checkAuth,
    forgetPassword,
    googleLogin,
    login,
    logout,
    resetPassword,
    signup,
    updateProfile,
    verifyEmail,
    selectRole,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    toggleFavoriteRestaurant,
    toggleFavoriteMenu,
    getFavorites,
} from "../controller/user.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { authLimiter, otpLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

router.route("/check-auth").get(isAuthenticated, checkAuth);
router.route("/signup").post(authLimiter, signup);
router.route("/login").post(authLimiter, login);
router.route("/google-login").post(authLimiter, googleLogin);
router.route("/logout").post(logout);
router.route("/verify-email").post(otpLimiter, verifyEmail);
router.route("/forgot-password").post(otpLimiter, forgetPassword);
router.route("/reset-password/:token").post(otpLimiter, resetPassword);
router.route("/profile/update").put(isAuthenticated, updateProfile);
router.route("/select-role").put(isAuthenticated, selectRole);

// Address Book
router.route("/saved-address").post(isAuthenticated, addSavedAddress);
router.route("/saved-address/:addressId").put(isAuthenticated, updateSavedAddress).delete(isAuthenticated, deleteSavedAddress);

// Favorites / Wishlist
router.route("/favorites").get(isAuthenticated, getFavorites);
router.route("/favorites/restaurant/:restaurantId").post(isAuthenticated, toggleFavoriteRestaurant);
router.route("/favorites/menu/:menuId").post(isAuthenticated, toggleFavoriteMenu);

export default router;


