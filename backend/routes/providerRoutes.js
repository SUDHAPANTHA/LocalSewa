import express from "express";
import { getProviderServices } from "../controllers/providerController.js";
import { getProviderRecommendations } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/provider/:providerId/services", getProviderServices);
router.get("/providers/recommendations", getProviderRecommendations);

export default router;
