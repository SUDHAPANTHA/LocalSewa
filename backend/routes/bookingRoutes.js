import express from "express";
import { createBooking, getProviderRecommendations } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/create-booking", createBooking);
router.get("/recommendations", getProviderRecommendations);

export default router;
