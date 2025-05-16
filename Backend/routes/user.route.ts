import express from "express";
import {
    checkAuth,
    forgetPassword,
    login,
    logout,
    resetPassword,
    signup,
    updateProfile,
    verifyEmail
} from "../controller/user.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = express.Router();

router.route("/check-auth").get(isAuthenticated, checkAuth);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/verify-email").post(verifyEmail);
router.route("/forgot-password").post(forgetPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/profile/update").put(isAuthenticated, updateProfile);

export default router;
