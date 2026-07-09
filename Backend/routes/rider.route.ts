import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAdmin, isRider } from "../middlewares/role.middleware";
import {
    submitRiderDetails,
    toggleOnlineStatus,
    acceptOrder,
    updateDeliveryWorkflow,
    getAllRidersAdmin,
    verifyRiderAdmin,
    deleteRiderAdmin,
    getRiderProfile,
    getRiderEarnings
} from "../controller/rider.controller";

const router = express.Router();

router.route("/profile").get(isAuthenticated, getRiderProfile);
router.route("/submit").post(isAuthenticated, submitRiderDetails);
router.route("/toggle-online").post(isAuthenticated, toggleOnlineStatus);
router.route("/earnings").get(isAuthenticated, isRider, getRiderEarnings);
router.route("/order/:orderId/accept").put(isAuthenticated, isRider, acceptOrder);
router.route("/order/:orderId/workflow").put(isAuthenticated, isRider, updateDeliveryWorkflow);

// Admin dashboard routes for riders
router.route("/admin/all").get(isAuthenticated, isAdmin, getAllRidersAdmin);
router.route("/admin/:id/verify").put(isAuthenticated, isAdmin, verifyRiderAdmin);
router.route("/admin/:id").delete(isAuthenticated, isAdmin, deleteRiderAdmin);

export default router;
