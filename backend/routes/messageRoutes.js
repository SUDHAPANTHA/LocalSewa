import express from "express";
import {
  sendMessage,
  getConversation,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/messages", sendMessage);
router.get("/messages/:userId/:otherId", getConversation);

export default router;
