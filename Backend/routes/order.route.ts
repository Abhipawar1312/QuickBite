import express from "express"
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isRestaurantOwner } from "../middlewares/role.middleware";
import { checkoutLimiter } from "../middlewares/rateLimiter";
import { createCheckoutSession, getOrders, stripeWebhook, cancelOrder } from "../controller/order.controller";
const router = express.Router();

router.route("/").get(isAuthenticated, getOrders);
router.route("/checkout/create-checkout-session").post(isAuthenticated, checkoutLimiter, createCheckoutSession);
router.route("/webhook").post(express.raw({ type: 'application/json' }), stripeWebhook);
router.route("/:orderId/cancel").put(isAuthenticated, isRestaurantOwner, cancelOrder);

export default router;