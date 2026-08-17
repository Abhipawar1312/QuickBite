import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isRestaurantOwner } from "../middlewares/role.middleware";
import { getMerchantAnalytics, exportMerchantAnalyticsCSV } from "../controller/analytics.controller";

const router = express.Router();

router.route("/").get(isAuthenticated, isRestaurantOwner, getMerchantAnalytics);
router.route("/export").get(isAuthenticated, isRestaurantOwner, exportMerchantAnalyticsCSV);

export default router;
