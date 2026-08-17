import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAdmin } from "../middlewares/role.middleware";
import {
    applyCoupon,
    getActiveCoupons,
    getAllCouponsAdmin,
    createCouponAdmin,
    toggleCouponAdmin,
    deleteCouponAdmin
} from "../controller/coupon.controller";

const router = express.Router();

// Customer endpoints
router.route("/apply").post(isAuthenticated, applyCoupon);
router.route("/active").get(isAuthenticated, getActiveCoupons);

// Admin endpoints
router.route("/admin/all").get(isAuthenticated, isAdmin, getAllCouponsAdmin);
router.route("/admin/create").post(isAuthenticated, isAdmin, createCouponAdmin);
router.route("/admin/:id/toggle").put(isAuthenticated, isAdmin, toggleCouponAdmin);
router.route("/admin/:id").delete(isAuthenticated, isAdmin, deleteCouponAdmin);

export default router;
