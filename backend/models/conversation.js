// models/conversation.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const conversationMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false, timestamps: true }
);

const conversationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    messages: [conversationMessageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 });

const Conversation = model("Conversation", conversationSchema);

export default Conversation;
