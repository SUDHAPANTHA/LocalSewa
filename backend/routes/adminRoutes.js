import express from "express";
import {
  getProviders,
  approveProvider,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/admin/providers", getProviders);

router.patch("/admin/provider-approve/:id", approveProvider);

export default router;
