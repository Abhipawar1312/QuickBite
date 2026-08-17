import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
  getFrequentlyPaired,
  getTrending,
  getPersonalized,
} from "../controller/recommendation.controller";

const router = express.Router();

router.route("/frequently-paired").get(getFrequentlyPaired);
router.route("/trending").get(getTrending);
router.route("/personalized").get(isAuthenticated, getPersonalized);

export default router;
