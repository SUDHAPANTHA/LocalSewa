import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const REVIEW_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  HIDDEN: "hidden",
};

export const REVIEW_SENTIMENT = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  NEGATIVE: "negative",
};

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1200,
    },
    sentiment: {
      type: String,
      enum: Object.values(REVIEW_SENTIMENT),
      default: REVIEW_SENTIMENT.NEUTRAL,
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PUBLISHED,
    },
    photos: [
      {
        url: String,
        caption: String,
      },
    ],
    helpfulVotes: {
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 },
    },
    editedAt: Date,
    publishedAt: {
      type: Date,
      default: () => new Date(),
    },
    meta: {
      tags: [{ type: String, trim: true, lowercase: true }],
      highlightedPros: [{ type: String }],
      highlightedCons: [{ type: String }],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ service: 1, createdAt: -1 });
reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ user: 1, service: 1 }, { unique: true });
reviewSchema.index({ booking: 1 }, { sparse: true, unique: true });

export default model("Review", reviewSchema);

