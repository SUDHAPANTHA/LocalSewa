import express from "express";
import { register, login } from "../controllers/authController.js";
import User from "../models/user.js";
import Admin from "../models/admin.js";
import { ServiceProvider } from "../models/serviceprovider.js";

const router = express.Router();

router.post("/user-register", (req, res) => register(User, "user", req, res));

router.post("/provider-register", (req, res) =>
  register(ServiceProvider, "service_provider", req, res)
);

router.post("/admin-register", (req, res) =>
  register(Admin, "admin", req, res)
);

router.post("/user-login", (req, res) => login(User, req, res));
router.post("/provider-login", (req, res) => login(ServiceProvider, req, res));
router.post("/admin-login", (req, res) => login(Admin, req, res));

export default router;
