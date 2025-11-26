import express from "express";
import upload from "../config/multer.js";
import {
  addService,
  getAllServices,
  getServiceById,
  searchServices,
} from "../controllers/serviceController.js";

const router = express.Router();

router.post("/provider-add-service/:id", upload.single("image"), addService);
router.get("/services", getAllServices);
router.get("/service/:id", getServiceById);
router.get("/services-search", searchServices);

export default router;
