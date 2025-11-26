import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_REVIEW: "in_review",
  NEEDS_INFO: "needs_info",
  ESCALATED: "escalated",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

export const COMPLAINT_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const timelineEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      required: true,
    },
    note: { type: String, trim: true },
    actor: { type: String, trim: true, default: "system" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const complaintSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider" },
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    category: {
      type: String,
      enum: [
        "quality",
        "pricing",
        "timeliness",
        "behavior",
        "safety",
        "other",
      ],
      default: "other",
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    attachments: [
      {
        url: String,
        label: String,
        uploadedAt: { type: Date, default: () => new Date() },
      },
    ],
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.OPEN,
    },
    resolution: {
      summary: String,
      resolvedBy: String,
      resolvedAt: Date,
      refundAmount: Number,
    },
    timeline: {
      type: [timelineEntrySchema],
      default: [],
    },
    escalation: {
      escalatedAt: Date,
      escalatedBy: String,
      note: String,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ provider: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });

export default model("Complaint", complaintSchema);

