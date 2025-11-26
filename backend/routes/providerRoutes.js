import express from "express";
import { getProviderServices } from "../controllers/providerController.js";

const router = express.Router();

router.get("/provider/:providerId/services", getProviderServices);

export default router;
