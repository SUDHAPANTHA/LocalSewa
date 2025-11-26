import mongoose from "mongoose";

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const STATUS_VALUES = Object.values(BOOKING_STATUS);

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
    },
    note: { type: String, default: "" },
    changedBy: { type: String, default: "system" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    bookingDate: String,
    bookingTime: String,
    bookingDateTime: Date,
    notes: String,
    totalAmount: Number,
    isProviderApproved: { type: Boolean, default: null },
    isAdminApproved: { type: Boolean, default: null },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: BOOKING_STATUS.PENDING,
    },
    source: {
      type: String,
      enum: ["core", "vendor"],
      default: "vendor",
    },
    customerAreaSlug: { type: String, lowercase: true, trim: true },
    customerAreaName: { type: String, trim: true },
    customerLocation: {
      type: new mongoose.Schema({
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: false,
        },
        formattedAddress: { type: String, trim: true },
        city: { type: String, trim: true },
        locality: { type: String, trim: true },
        country: { type: String, trim: true },
      }, { _id: false }),
      required: false,
      default: undefined,
    },
    confirmationCode: {
      type: String,
      required: true,
      default: () =>
        `SJ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    },
    statusTimeline: {
      type: [timelineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
