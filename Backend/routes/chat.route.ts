import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { getChatMessages, sendChatMessage } from "../controller/chat.controller";

const router = express.Router();

router.route("/:orderId").get(isAuthenticated, getChatMessages);
router.route("/:orderId").post(isAuthenticated, sendChatMessage);

export default router;
