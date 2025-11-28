// models/serviceprovider.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const SERVICE_CATEGORIES = [
  "plumbing",
  "electrical",
  "cleaning",
  "appliance",
  "painting",
  "moving",
  "handyman",
  "gardening",
  "security",
  "wellness",
];

// Service Schema
const reviewSummarySchema = new Schema(
  {
    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    lastReviewAt: Date,
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NPR" },
    emojiIcon: { type: String, default: "🛠️" },
    category: {
      type: String,
      required: true,
      lowercase: true,
      enum: SERVICE_CATEGORIES,
      default: "handyman",
    },
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider" },
    isCore: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: null },
    systemRank: { type: Number, default: null },
    coreSlug: { type: String, unique: true, sparse: true },
    rating: { type: Number, default: 4.7, min: 1, max: 5 },
    bookingCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    areaTags: [{ type: String, trim: true, lowercase: true }],
    priceHistory: [
      {
        amount: Number,
        currency: { type: String, default: "NPR" },
        effectiveFrom: { type: Date, default: () => new Date() },
      },
    ],
    reviewStats: {
      type: reviewSummarySchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

serviceSchema.index({ isCore: -1, systemRank: 1, createdAt: -1 });

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "Coordinates must be an array [lng, lat]",
      },
    },
    formattedAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    locality: { type: String, trim: true },
  },
  { _id: false }
);

// Service Provider Schema
const providerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    role: { type: String, default: "service_provider" },
    isApproved: { type: Boolean, default: false },
    avatarEmoji: { type: String, default: "🏷️" },
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    skillTags: [{ type: String, lowercase: true, trim: true }],
    experienceYears: { type: Number, default: 0 },
    cvStatus: {
      type: String,
      enum: ["not_provided", "pending", "approved", "rejected"],
      default: "not_provided",
    },
    cvScore: { type: Number, min: 0, max: 1, default: null },
    cvSummary: { type: String },
    cvKeywords: [{ type: String }],
    cvFile: {
      originalName: String,
      fileName: String,
      mimeType: String,
      size: Number,
      url: String,
      uploadedAt: Date,
    },
    cvSignals: {
      totalMentions: { type: Number, default: 0 },
      certifications: { type: Number, default: 0 },
      managementExperience: { type: Number, default: 0 },
      riskFlags: [{ type: String }],
    },
    cvReviewerNote: { type: String },
    cvReviewedAt: { type: Date },
    cvReviewer: { type: String },
    location: locationSchema,
    serviceRadiusKm: { type: Number, default: 25 },
    smartScore: { type: Number, default: null },
    areaFocus: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

providerSchema.index({ "location.coordinates": "2dsphere" });
providerSchema.index({ location: "2dsphere" });

providerSchema.add({
  primaryAreaSlug: { type: String, lowercase: true, trim: true },
  primaryAreaName: { type: String, trim: true },
});

export const ServiceProvider = model("ServiceProvider", providerSchema);
export const Service = model("Service", serviceSchema);
