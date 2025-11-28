// server.js
import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mongoose from "mongoose";
import { WebSocketServer, WebSocket } from "ws";
import connectDB from "./config/conn.js";
import UserModel from "./models/user.js";
import {
  ServiceProvider,
  Service,
  SERVICE_CATEGORIES,
} from "./models/serviceprovider.js";
import BookingModel, { BOOKING_STATUS } from "./models/booking.js";
import MessageModel from "./models/message.js";
import AdminModel from "./models/admin.js";
import { CORE_SERVICES } from "./constants/coreServices.js";
import Review, { REVIEW_STATUS, REVIEW_SENTIMENT } from "./models/review.js";
import Complaint, {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
} from "./models/complaint.js";
import Conversation from "./models/conversation.js";

import {
  listKathmanduAreas,
  dijkstraShortestRoute,
  findAreaByIdentifier,
  getNearbyAreas,
} from "./constants/kathmanduAreas.js";
import { successResponse, errorResponse } from "./utils/apiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);
const serviceEmitter = new EventEmitter();
const wss = new WebSocketServer({ server, path: "/ws" });
const wsClients = new Set();
const SSE_KEEP_ALIVE_MS = 25000;
const DEFAULT_EMOJI = "🛠️";
const CORE_PROVIDER_EMAIL =
  process.env.CORE_PROVIDER_EMAIL || "system@sajilosewa.com";
const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);
const REVIEW_DISTRIBUTION_KEYS = [5, 4, 3, 2, 1];
const NPR_FORMATTER = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "for",
  "with",
  "service",
  "services",
  "repair",
  "best",
  "top",
  "local",
  "near",
  "me",
  "in",
  "of",
  "at",
  "on",
  "home",
]);
const CATEGORY_SYNONYMS = {
  plumbing: ["plumb", "pipe", "leak", "clog", "tap", "toilet"],
  electrical: ["electric", "wiring", "light", "breaker", "inverter", "battery"],
  cleaning: ["clean", "sweep", "sanitize", "maid"],
  appliance: ["appliance", "fridge", "washing", "microwave", "tv"],
  painting: ["paint", "wall", "brush", "repaint"],
  moving: ["move", "relocate", "shift", "pack"],
  handyman: ["fix", "repair", "install", "maintenance"],
  gardening: ["garden", "lawn", "landscape", "plants"],
  security: ["security", "guard", "cctv", "camera"],
  wellness: ["spa", "massage", "therapy", "yoga"],
};

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const cvUploadsDir = path.join(uploadsDir, "cvs");
if (!fs.existsSync(cvUploadsDir)) fs.mkdirSync(cvUploadsDir);

// ========================= WEBSOCKET SETUP ========================== //
wss.on("connection", (socket) => {
  wsClients.add(socket);
  socket.isAlive = true;
  socket.send(
    JSON.stringify({
      type: "handshake",
      payload: {
        message: "Connected to LocalSewa realtime channel",
        timestamp: new Date().toISOString(),
      },
    })
  );

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      if (parsed?.type === "ping") {
        socket.send(
          JSON.stringify({
            type: "pong",
            payload: { timestamp: new Date().toISOString() },
          })
        );
      }
      if (parsed?.type === "subscribe" && parsed.scope === "areas") {
        socket.send(
          JSON.stringify({
            type: "areas-sync",
            payload: { areas: listKathmanduAreas() },
            at: new Date().toISOString(),
          })
        );
      }
    } catch (err) {
      socket.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Invalid websocket payload" },
        })
      );
    }
  });

  socket.on("close", () => wsClients.delete(socket));
  socket.on("error", () => wsClients.delete(socket));
});

const wsHeartbeat = setInterval(() => {
  wss.clients.forEach((socket) => {
    if (socket.isAlive === false) {
      wsClients.delete(socket);
      return socket.terminate();
    }
    socket.isAlive = false;
    socket.ping();
  });
}, 30000);

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cvUploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `cv-${unique}-${sanitized}`);
  },
});

const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF CV uploads are supported"), false);
    }
  },
});

// ========================= HELPER FUNCTIONS ========================== //
function isValidDateString(dateStr) {
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
function isValidTimeString(timeStr) {
  // HH:MM 24-hour
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

const bookingPopulateOptions = [
  { path: "user", select: "name email" },
  {
    path: "provider",
    select:
      "name email phone avatarEmoji cvStatus cvScore smartScore serviceRadiusKm",
  },
  { path: "service", select: "name price emojiIcon category" },
];

function sanitizeEmojiSymbol(symbol) {
  if (!symbol) return DEFAULT_EMOJI;
  return symbol.trim().slice(0, 4) || DEFAULT_EMOJI;
}

function isValidCategory(category) {
  if (!category) return false;
  return SERVICE_CATEGORIES.includes(category.toLowerCase());
}

function normalizeTags(tags) {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? tags.split(",")
    : [];

  return list
    .map((tag) =>
      typeof tag === "string" ? tag.trim().toLowerCase().slice(0, 24) : ""
    )
    .filter(Boolean)
    .slice(0, 5);
}

function formatPriceNpr(amount) {
  const safe = Number(amount) || 0;
  return {
    amount: safe,
    currency: "NPR",
    formatted: NPR_FORMATTER.format(safe),
  };
}

function attachPriceMetadata(serviceDoc) {
  if (!serviceDoc) return serviceDoc;
  const serialized =
    typeof serviceDoc.toObject === "function"
      ? serviceDoc.toObject()
      : { ...serviceDoc };
  const priceMeta = formatPriceNpr(serialized.price);
  return {
    ...serialized,
    priceNpr: priceMeta.amount,
    priceLabel: priceMeta.formatted,
    currency: serialized.currency || "NPR",
  };
}

function tokenizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function vectorizeTokens(tokens = []) {
  const vector = new Map();
  tokens.forEach((token) => {
    vector.set(token, (vector.get(token) || 0) + 1);
  });
  return vector;
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;

  vecA.forEach((value, key) => {
    magA += value * value;
    if (vecB.has(key)) {
      dot += value * vecB.get(key);
    }
  });

  vecB.forEach((value) => {
    magB += value * value;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildServiceVector(serviceDoc) {
  const provider = serviceDoc.provider || {};
  const text = [
    serviceDoc.name,
    serviceDoc.description,
    serviceDoc.category,
    (serviceDoc.tags || []).join(" "),
    (provider.skillTags || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  return vectorizeTokens(tokenizeText(text));
}

function generateConfirmationCode() {
  const alpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  const numeric = Math.floor(1000 + Math.random() * 9000);
  return `SJ-${alpha}${numeric}`;
}

function asActorLabel(value, fallback = "system") {
  if (!value) return fallback;
  return typeof value === "string" ? value : value.toString();
}

function recordStatusChange(booking, status, note, actor = "system") {
  if (!BOOKING_STATUS_VALUES.includes(status)) return;
  if (!booking.statusTimeline) booking.statusTimeline = [];
  booking.statusTimeline.push({
    status,
    note,
    changedBy: actor,
    changedAt: new Date(),
  });
  booking.status = status;
}

function asPlainService(serviceDoc) {
  if (!serviceDoc) return null;
  const serialized = attachPriceMetadata(serviceDoc);
  return {
    ...serialized,
    emojiIcon: serialized.emojiIcon || DEFAULT_EMOJI,
  };
}

function emitServiceEvent(type, payload) {
  const event = {
    type,
    payload,
    at: new Date().toISOString(),
  };
  serviceEmitter.emit("update", event);
  broadcastWsEvent(event);
}

function broadcastWsEvent(event) {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(event));
      } catch (err) {
        console.error("Failed to push websocket event", err.message);
      }
    }
  });
}

const CV_KEYWORD_GROUPS = {
  plumbing: ["plumb", "pipe", "drain", "boiler", "leak", "pump"],
  electrical: ["electrical", "wiring", "circuit", "panel", "voltage", "solar"],
  cleaning: ["clean", "janitor", "sanitize", "deep clean", "housekeep"],
  appliance: ["appliance", "fridge", "washing machine", "oven", "repair"],
  painting: ["paint", "coating", "brush", "roller", "wall prep"],
  moving: ["moving", "logistics", "packaging", "relocation", "fleet"],
  handyman: ["handyman", "maintenance", "fixture", "install", "repair"],
  gardening: ["garden", "landscape", "horticulture", "lawn", "irrigation"],
  security: ["security", "cctv", "guard", "patrol", "surveillance"],
  wellness: ["wellness", "massage", "therapy", "fitness", "yoga"],
};

const CV_RISK_PATTERNS = [
  { token: "terminated", flag: "employment_gap" },
  { token: "fired", flag: "employment_gap" },
  { token: "pending case", flag: "compliance_flag" },
  { token: "no experience", flag: "experience_gap" },
];

const DEFAULT_NEAREST_RADIUS_KM = 35;

const SAMPLE_PROVIDER_SEED = [
  // Existing providers
  {
    name: "Ram Shrestha",
    email: "ram.elec01@gmail.com",
    password: "Ram@12345",
    serviceName: "Koteshwor Electrician",
    category: "electrical",
    price: 1800,
    emoji: "⚡",
    area: "koteshwor",
    description: "Emergency electrician for homes and offices in Koteshwor.",
  },
  {
    name: "Sita Gurung",
    email: "sita.plumb02@gmail.com",
    password: "Sita@12345",
    serviceName: "Baneshwor Plumbing",
    category: "plumbing",
    price: 1500,
    emoji: "🚰",
    area: "baneshwor",
    description: "Certified plumber for leaks, bathroom fixes and kitchen repairs.",
  },
  {
    name: "Raj Tamang",
    email: "raj.paint03@gmail.com",
    password: "Raj@12345",
    serviceName: "Kalanki Painters",
    category: "painting",
    price: 2200,
    emoji: "🎨",
    area: "kalanki",
    description: "Interior and exterior painting with on-time delivery.",
  },
  {
    name: "Maya KC",
    email: "maya.clean04@gmail.com",
    password: "Maya@12345",
    serviceName: "Bouddha Cleaning Squad",
    category: "cleaning",
    price: 1300,
    emoji: "🧼",
    area: "boudha",
    description: "Deep cleaning for apartments, clinics and studios across Bouddha.",
  },
  {
    name: "Bishal Thapa",
    email: "bishal.ac05@gmail.com",
    password: "Bishal@12345",
    serviceName: "Chabahil AC Repair",
    category: "appliance",
    price: 2500,
    emoji: "❄️",
    area: "chabahil",
    description: "Split/VRF AC installation, servicing and emergency repair.",
  },
  // Additional providers for all areas
  {
    name: "Tinkune Services",
    email: "tinkune.plumb@gmail.com",
    password: "Tinkune@123",
    serviceName: "Home Plumbing Service",
    category: "plumbing",
    price: 1500,
    emoji: "🔧",
    area: "tinkune",
    description: "Professional plumbing repairs and installations",
  },
  {
    name: "Maitighar Services",
    email: "maitighar.laundry@gmail.com",
    password: "Maitighar@123",
    serviceName: "Laundry Service",
    category: "cleaning",
    price: 800,
    emoji: "👕",
    area: "maitighar",
    description: "Professional laundry and dry cleaning",
  },
  {
    name: "Sinamangal Services",
    email: "sinamangal.airport@gmail.com",
    password: "Sinamangal@123",
    serviceName: "Airport Transfer",
    category: "moving",
    price: 1000,
    emoji: "✈️",
    area: "sinamangal",
    description: "Reliable airport pickup and drop services",
  },
  {
    name: "Gaushala Services",
    email: "gaushala.pet@gmail.com",
    password: "Gaushala@123",
    serviceName: "Pet Grooming",
    category: "wellness",
    price: 1200,
    emoji: "🐕",
    area: "gaushala",
    description: "Professional pet grooming and care",
  },
  {
    name: "Putalisadak Services",
    email: "putalisadak.computer@gmail.com",
    password: "Putalisadak@123",
    serviceName: "Computer Repair",
    category: "appliance",
    price: 1500,
    emoji: "💻",
    area: "putalisadak",
    description: "Computer and laptop repair services",
  },
];

async function extractCvText(filePath) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const parsed = await pdfParse(buffer);
    return (parsed.text || "").replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("CV parsing failed", error);
    return "";
  }
}

function detectKeywordSignals(text) {
  const lower = text.toLowerCase();
  const keywordHits = [];
  const categoryHits = {};

  Object.entries(CV_KEYWORD_GROUPS).forEach(([category, tokens]) => {
    tokens.forEach((token) => {
      if (lower.includes(token)) {
        keywordHits.push(token);
        categoryHits[category] = (categoryHits[category] || 0) + 1;
      }
    });
  });

  return { keywordHits, categoryHits };
}

function estimateExperienceYears(text) {
  const match = text.match(/(\d{1,2})\s*\+?\s*(years|yrs)/i);
  if (!match) return 0;
  return Math.min(40, Number(match[1]) || 0);
}

function detectCertifications(text) {
  return (text.match(/certified|certification|license|licence/gi) || []).length;
}

function detectManagementSignals(text) {
  return (text.match(/managed|supervis(ed|or)|led team|team lead/gi) || [])
    .length;
}

function detectRiskFlags(text) {
  const lower = text.toLowerCase();
  const flags = CV_RISK_PATTERNS.filter(({ token }) =>
    lower.includes(token)
  ).map(({ flag }) => flag);
  return [...new Set(flags)];
}

function summarizeCv(text, keywords) {
  if (!text) return "";
  const summary = text.slice(0, 420);
  const keywordPreview = keywords.slice(0, 5).join(", ");
  return `${summary}${summary.length === text.length ? "" : " ..."}${
    keywordPreview ? `\nKey skills: ${keywordPreview}` : ""
  }`;
}

async function evaluateCvFile(filePath) {
  const text = await extractCvText(filePath);
  const { keywordHits, categoryHits } = detectKeywordSignals(text);
  const uniqueKeywords = [...new Set(keywordHits)];
  const experienceYears = estimateExperienceYears(text);
  const certifications = detectCertifications(text);
  const managementExperience = detectManagementSignals(text);
  const riskFlags = detectRiskFlags(text);

  const skillScore = Math.min(1, uniqueKeywords.length / 14);
  const experienceScore = Math.min(1, experienceYears / 12);
  const certificationScore = Math.min(1, certifications / 5);
  const managementScore = Math.min(1, managementExperience / 5);

  const score =
    skillScore * 0.45 +
    experienceScore * 0.3 +
    certificationScore * 0.15 +
    managementScore * 0.1;

  const topCategories = Object.entries(categoryHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  return {
    text,
    summary: summarizeCv(text, uniqueKeywords),
    score: Number(score.toFixed(3)),
    keywords: uniqueKeywords.slice(0, 25),
    categoryHits,
    topCategories,
    experienceYears,
    certifications,
    managementExperience,
    riskFlags,
    totalMentions: keywordHits.length,
  };
}

function computeSmartScore({
  cvScore = 0,
  bookingCount = 0,
  preferenceBoost = 0,
}) {
  const bookingSignal =
    bookingCount > 0 ? Math.log1p(bookingCount) / Math.log1p(100) : 0;
  return Number(
    (cvScore * 0.6 + bookingSignal * 0.3 + preferenceBoost * 0.1).toFixed(3)
  );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resolveAreaInput(value) {
  if (!value) return null;
  if (typeof value === "string") return findAreaByIdentifier(value);
  if (value.slug) return findAreaByIdentifier(value.slug);
  if (value.name) return findAreaByIdentifier(value.name);
  return null;
}

async function recalcProviderSmartScore(providerId) {
  const provider = await ServiceProvider.findById(providerId).populate(
    "services"
  );
  if (!provider) return null;
  const bookingLoad = (provider.services || []).reduce(
    (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
    0
  );
  provider.smartScore = computeSmartScore({
    cvScore: provider.cvScore || 0.4,
    bookingCount: bookingLoad,
  });
  await provider.save();
  return provider.smartScore;
}

function defaultReviewSummary() {
  return {
    total: 0,
    average: 0,
    lastReviewAt: null,
    distribution: {
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    },
  };
}

async function updateServiceReviewStats(serviceId) {
  if (!serviceId) return defaultReviewSummary();
  const objectId = new mongoose.Types.ObjectId(serviceId);
  const [stats] = await Review.aggregate([
    {
      $match: {
        service: objectId,
        status: REVIEW_STATUS.PUBLISHED,
      },
    },
    {
      $group: {
        _id: "$service",
        total: { $sum: 1 },
        average: { $avg: "$rating" },
        lastReviewAt: { $max: "$updatedAt" },
        five: {
          $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
        },
        four: {
          $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
        },
        three: {
          $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
        },
        two: {
          $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
        },
        one: {
          $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
        },
      },
    },
  ]);

  const summary = stats
    ? {
        total: stats.total,
        average: Number((stats.average || 0).toFixed(2)),
        lastReviewAt: stats.lastReviewAt,
        distribution: {
          five: stats.five,
          four: stats.four,
          three: stats.three,
          two: stats.two,
          one: stats.one,
        },
      }
    : defaultReviewSummary();

  await Service.findByIdAndUpdate(serviceId, {
    reviewStats: summary,
    rating: summary.total > 0 ? summary.average : 4.7,
  });

  return summary;
}

function computeSentimentFromRating(rating) {
  if (rating >= 4) return REVIEW_SENTIMENT.POSITIVE;
  if (rating <= 2) return REVIEW_SENTIMENT.NEGATIVE;
  return REVIEW_SENTIMENT.NEUTRAL;
}

async function searchServicesUsingCosine(query, options = {}) {
  const normalizedQuery = (query || "").trim();
  if (!normalizedQuery) return [];
  const {
    onlyReviewed = false,
    filterCvQualified = false,
    limit = 10,
  } = options;
  const queryVector = vectorizeTokens(tokenizeText(normalizedQuery));

  const services = await Service.find()
    .populate({
      path: "provider",
      select:
        "name phone address email isApproved avatarEmoji cvStatus cvScore smartScore skillTags serviceRadiusKm location",
    })
    .lean();

  return services
    .filter((svc) => {
      const providerApproved = svc.isCore || svc.provider?.isApproved;
      if (!providerApproved) return false;
      if (filterCvQualified) {
        if (
          !svc.provider ||
          svc.provider.cvStatus !== "approved" ||
          (svc.provider.cvScore || 0) < 0.55
        ) {
          return false;
        }
      }
      if (onlyReviewed && !(svc.reviewStats?.total > 0)) {
        return false;
      }
      return true;
    })
    .map((svc) => {
      const vector = buildServiceVector(svc);
      const cosineScore = cosineSimilarity(queryVector, vector);
      return {
        service: attachPriceMetadata(svc),
        cosineScore,
      };
    })
    .filter((entry) => entry.cosineScore > 0)
    .sort((a, b) => b.cosineScore - a.cosineScore)
    .slice(0, limit);
}

function detectCategoryFromMessage(message = "") {
  const lower = message.toLowerCase();
  for (const category of SERVICE_CATEGORIES) {
    const synonyms = CATEGORY_SYNONYMS[category] || [];
    if (lower.includes(category)) return category;
    if (synonyms.some((token) => lower.includes(token))) {
      return category;
    }
  }
  return null;
}

function detectBudgetCeiling(message = "") {
  const cleaned = message.replace(/,/g, "").toLowerCase();
  const budgetMatch = cleaned.match(
    /(under|below|less than|upto|up to)\s*(\d+(?:\.\d+)?)(k|m)?/
  );
  if (!budgetMatch) return null;
  let value = Number(budgetMatch[2]);
  if (budgetMatch[3] === "k") value *= 1000;
  if (budgetMatch[3] === "m") value *= 1_000_000;
  return Number.isNaN(value) ? null : value;
}

function detectAreaFromMessage(message = "") {
  if (!message) return null;
  const lower = message.toLowerCase();
  const areas = listKathmanduAreas();
  return (
    areas.find(
      (area) =>
        lower.includes(area.name.toLowerCase()) ||
        lower.includes(area.slug.toLowerCase())
    ) || null
  );
}

function filterServicesByBudget(services = [], budgetCeiling) {
  if (!budgetCeiling) return services;
  return services.filter(
    (svc) =>
      Number(svc.service?.priceNpr ?? svc.service?.price ?? 0) <= budgetCeiling
  );
}

function pushComplaintTimeline(complaintDoc, status, note, actor = "system") {
  if (!complaintDoc.timeline) complaintDoc.timeline = [];
  complaintDoc.timeline.push({
    status,
    note,
    actor,
    createdAt: new Date(),
  });
  complaintDoc.status = status;
}

async function ensureSystemProvider() {
  let provider = await ServiceProvider.findOne({ email: CORE_PROVIDER_EMAIL });

  if (!provider) {
    const hashed = await bcrypt.hash(
      process.env.CORE_PROVIDER_PASSWORD || "core-provider-strong-pass",
      10
    );

    provider = new ServiceProvider({
      name: "LocalSewa HQ",
      email: CORE_PROVIDER_EMAIL,
      password: hashed,
      phone: process.env.CORE_PROVIDER_PHONE || "9800000000",
      address: process.env.CORE_PROVIDER_ADDRESS || "Kathmandu Valley",
      role: "service_provider",
      isApproved: true,
      avatarEmoji: "🏡",
    });

    await provider.save();
  } else if (!provider.isApproved) {
    provider.isApproved = true;
    await provider.save();
  }

  return provider;
}

async function seedCoreServices() {
  const provider = await ensureSystemProvider();
  const allowedSlugs = CORE_SERVICES.map((svc) => svc.slug);

  await Service.deleteMany({
    isCore: true,
    coreSlug: { $nin: allowedSlugs },
  });

  const seededServices = [];

  for (const [index, svc] of CORE_SERVICES.entries()) {
    const payload = {
      name: svc.name,
      description: svc.description,
      price: svc.price,
      emojiIcon: svc.emojiIcon,
      category: svc.category,
      provider: provider._id,
      isCore: true,
      systemRank: index,
      coreSlug: svc.slug,
      rating: svc.rating,
      bookingCount: svc.bookingCount,
      tags: svc.tags,
    };

    const doc = await Service.findOneAndUpdate(
      { coreSlug: svc.slug },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("provider", "name email phone isApproved avatarEmoji");

    seededServices.push(doc._id);
  }

  provider.services = seededServices;
  await provider.save();
}

async function seedSampleProviders() {
  for (const vendor of SAMPLE_PROVIDER_SEED) {
    const areaMeta = resolveAreaInput(vendor.area);
    const baseLocation = areaMeta
      ? {
          type: "Point",
          coordinates: [areaMeta.coordinates.lng, areaMeta.coordinates.lat],
          formattedAddress: areaMeta.name,
          city: areaMeta.district,
          locality: areaMeta.name,
          country: "Nepal",
        }
      : undefined;

    let provider = await ServiceProvider.findOne({ email: vendor.email });
    if (!provider) {
      provider = new ServiceProvider({
        name: vendor.name,
        email: vendor.email,
        password: await bcrypt.hash(vendor.password, 10),
        role: "service_provider",
        isApproved: true,
        avatarEmoji: vendor.emoji || "🧰",
        primaryAreaSlug: areaMeta?.slug,
        primaryAreaName: areaMeta?.name,
        areaFocus: areaMeta ? [areaMeta.slug] : [],
        location: baseLocation,
        address: areaMeta?.name || "Kathmandu",
        serviceRadiusKm: 8,
      });
      await provider.save();
    } else if (!provider.primaryAreaSlug && areaMeta) {
      provider.primaryAreaSlug = areaMeta.slug;
      provider.primaryAreaName = areaMeta.name;
      provider.areaFocus = Array.from(
        new Set([...(provider.areaFocus || []), areaMeta.slug])
      );
      if (!provider.location?.coordinates) {
        provider.location = baseLocation;
      }
      provider.isApproved = true;
      await provider.save();
    }

    const existingService = await Service.findOne({
      provider: provider._id,
      name: vendor.serviceName,
    });
    if (existingService) continue;

    const serviceDoc = await Service.create({
      name: vendor.serviceName,
      description: vendor.description,
      price: vendor.price,
      emojiIcon: vendor.emoji || DEFAULT_EMOJI,
      category: vendor.category,
      provider: provider._id,
      rating: 4.8,
      bookingCount: 8,
      areaTags: provider.areaFocus || (areaMeta ? [areaMeta.slug] : []),
      tags: [vendor.category],
      priceHistory: [
        {
          amount: vendor.price,
          currency: "NPR",
          effectiveFrom: new Date(),
        },
      ],
    });

    provider.services = provider.services || [];
    provider.services.push(serviceDoc._id);
    await provider.save();
  }
}

app.get("/service-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  res.write(`retry: 10000\n\n`);

  const keepAliveTimer = setInterval(() => {
    res.write(":keep-alive\n\n");
  }, SSE_KEEP_ALIVE_MS);

  const forwardEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  serviceEmitter.on("update", forwardEvent);

  req.on("close", () => {
    clearInterval(keepAliveTimer);
    serviceEmitter.off("update", forwardEvent);
  });
});

// ========================= REGISTER FUNCTION ============================= //
async function register(model, roleName, req, res) {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const exists = await model.findOne({ email });
    if (exists) return res.status(400).json({ msg: `${email} already exists` });

    const hashed = await bcrypt.hash(password, 10);
    let areaMeta = null;

    if (roleName === "service_provider") {
      const areaInput =
        req.body.localAreaSlug ||
        req.body.localArea ||
        req.body.areaSlug ||
        req.body.locality;
      areaMeta = resolveAreaInput(areaInput);
      if (!areaMeta) {
        return res.status(400).json({
          msg: "Select a valid Kathmandu local area for your service coverage",
        });
      }
    }

    const payload = {
      name,
      email,
      password: hashed,
      phone,
      address,
      role: roleName,
    };

    if (roleName === "service_provider") {
      payload.isApproved = false;
      payload.primaryAreaSlug = areaMeta.slug;
      payload.primaryAreaName = areaMeta.name;
      payload.areaFocus = [areaMeta.slug];
      payload.address = address || areaMeta.name;
      payload.location = {
        type: "Point",
        coordinates: [areaMeta.coordinates.lng, areaMeta.coordinates.lat],
        formattedAddress: areaMeta.name,
        city: areaMeta.district,
        locality: areaMeta.name,
        country: "Nepal",
      };
    }
    if (roleName === "admin") payload.isApproved = true;

    const doc = new model(payload);
    await doc.save();

    res.json({
      msg: `${roleName} registered`,
      data: {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        isApproved: doc.isApproved,
        primaryArea: doc.primaryAreaName || null,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Registration error", error: err.message });
  }
}

// ========================= LOGIN FUNCTION ============================= //
async function login(model, roleName, req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const user = await model.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log(`Wrong password for: ${email}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json({
      msg: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || roleName,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Login error", error: err.message });
  }
}

// ========================= AUTH ROUTES ============================= //
app.post("/user-register", (req, res) => register(UserModel, "user", req, res));
app.post("/provider-register", (req, res) =>
  register(ServiceProvider, "service_provider", req, res)
);
app.post("/admin-register", (req, res) =>
  register(AdminModel, "admin", req, res)
);

app.post("/user-login", (req, res) => login(UserModel, "user", req, res));
app.post("/provider-login", (req, res) =>
  login(ServiceProvider, "service_provider", req, res)
);
app.post("/admin-login", (req, res) => login(AdminModel, "admin", req, res));

// ========================= ADMIN ROUTES ============================= //
app.get("/admin-get-providers", async (req, res) => {
  try {
    const { cvStatus, approved, search } = req.query;
    const query = {};

    if (
      cvStatus &&
      ["pending", "approved", "rejected", "not_provided"].includes(
        cvStatus.toLowerCase()
      )
    ) {
      query.cvStatus = cvStatus.toLowerCase();
    }

    if (approved === "true") query.isApproved = true;
    if (approved === "false") query.isApproved = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await ServiceProvider.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ providers });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/admin-get-users", async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.delete("/admin-delete-user/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    await BookingModel.deleteMany({ user: req.params.id });
    await user.deleteOne();

    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/admin-get-all-bookings", async (req, res) => {
  try {
    const bookings = await BookingModel.find()
      .populate(bookingPopulateOptions)
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
app.patch("/admin-approve-booking/:id", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    const isApproved = Boolean(req.body.isAdminApproved);
    booking.isAdminApproved = isApproved;

    const nextStatus = isApproved
      ? BOOKING_STATUS.SCHEDULED
      : BOOKING_STATUS.CANCELLED;
    const note = isApproved ? "Approved by admin" : "Rejected by admin";

    recordStatusChange(booking, nextStatus, note, asActorLabel("admin"));

    await booking.save();
    await booking.populate(bookingPopulateOptions);

    emitServiceEvent("booking-admin-review", {
      bookingId: booking._id,
      status: booking.status,
      isAdminApproved: booking.isAdminApproved,
    });

    res.json({ msg: "Admin approval updated", booking });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status, note, actor } = req.body;

    if (!BOOKING_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ msg: "Invalid booking status" });
    }

    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    recordStatusChange(
      booking,
      status,
      note || `Status updated to ${status}`,
      asActorLabel(actor, "system")
    );

    await booking.save();
    await booking.populate(bookingPopulateOptions);

    emitServiceEvent("booking-status", {
      bookingId: booking._id,
      status: booking.status,
    });

    res.json({ msg: "Booking status updated", booking });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.patch("/admin-approve-provider/:id", async (req, res) => {
  try {
    const { isApproved, cvStatus, reviewerNote, reviewer } = req.body;
    const update = {};

    if (typeof isApproved === "boolean") {
      update.isApproved = isApproved;
    }

    if (
      cvStatus &&
      ["pending", "approved", "rejected"].includes(cvStatus.toLowerCase())
    ) {
      update.cvStatus = cvStatus.toLowerCase();
      update.cvReviewedAt = new Date();
      update.cvReviewer = reviewer || "admin";
      if (reviewerNote) update.cvReviewerNote = reviewerNote;
      if (update.isApproved === undefined) {
        update.isApproved = update.cvStatus === "approved";
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ msg: "No update payload provided" });
    }

    const doc = await ServiceProvider.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!doc) return res.status(404).json({ msg: "Provider not found" });

    await recalcProviderSmartScore(doc._id);

    res.json({
      msg: `Provider ${
        doc.cvStatus === "approved" || doc.isApproved ? "approved" : "updated"
      }`,
      provider: doc,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/admin/services", async (req, res) => {
  try {
    const services = await Service.find()
      .populate("provider", "name email phone isApproved")
      .sort({ createdAt: -1 });

    res.json({ services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.patch("/admin/service/:id", async (req, res) => {
  try {
    const updates = {};
    let priceHistoryPush = null;
    const allowedFields = ["name", "description"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.price !== undefined) {
      const parsedPrice = Number(req.body.price);
      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({ msg: "Price must be a number" });
      }
      updates.price = parsedPrice;
    }

    if (req.body.emojiIcon !== undefined) {
      updates.emojiIcon = sanitizeEmojiSymbol(req.body.emojiIcon);
    }

    if (req.body.category !== undefined) {
      if (!isValidCategory(req.body.category)) {
        return res.status(400).json({ msg: "Invalid category" });
      }
      updates.category = req.body.category.toLowerCase();
    }

    if (req.body.rating !== undefined) {
      const parsedRating = Number(req.body.rating);
      if (Number.isNaN(parsedRating)) {
        return res.status(400).json({ msg: "Rating must be a number" });
      }
      updates.rating = Math.max(1, Math.min(5, parsedRating));
    }

    if (req.body.tags !== undefined) {
      updates.tags = normalizeTags(req.body.tags);
    }

    if (req.body.areaTags !== undefined) {
      updates.areaTags = normalizeTags(req.body.areaTags);
    }

    if (req.body.price !== undefined) {
      const parsedAdminPrice = Number(req.body.price);
      if (Number.isNaN(parsedAdminPrice) || parsedAdminPrice < 0) {
        return res.status(400).json({ msg: "Price must be a positive number" });
      }
      updates.price = parsedAdminPrice;
      priceHistoryPush = {
        amount: parsedAdminPrice,
        currency: "NPR",
        effectiveFrom: new Date(),
      };
      updates.currency = "NPR";
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: "No updates provided" });
    }

    const updatePayload = { ...updates };
    if (priceHistoryPush) {
      updatePayload.$push = { priceHistory: priceHistoryPush };
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      {
        new: true,
      }
    ).populate("provider", "name email phone isApproved avatarEmoji");

    if (!service) return res.status(404).json({ msg: "Service not found" });

    emitServiceEvent("service-updated", { service: asPlainService(service) });

    res.json({ msg: "Service updated", service });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.delete("/admin/service/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: "Service not found" });
    if (service.isCore) {
      return res
        .status(400)
        .json({ msg: "Core marketplace services cannot be deleted" });
    }

    await ServiceProvider.updateMany(
      { services: service._id },
      { $pull: { services: service._id } }
    );
    await BookingModel.deleteMany({ service: service._id });

    if (service.image) {
      const normalizedPath = service.image.replace(/^\/+/, "");
      const filePath = path.join(__dirname, normalizedPath);
      fs.stat(filePath, (err) => {
        if (err) return;
        fs.unlink(filePath, () => {});
      });
    }

    await service.deleteOne();

    emitServiceEvent("service-removed", { serviceId: req.params.id });

    res.json({ msg: "Service deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.patch("/admin/service-approve/:id", async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    if (typeof isApproved !== "boolean") {
      return res.status(400).json({ msg: "isApproved must be a boolean" });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate("provider", "name email phone isApproved");

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    emitServiceEvent("service-approval-updated", { 
      service: asPlainService(service),
      isApproved 
    });

    res.json({ 
      msg: `Service ${isApproved ? "approved" : "rejected"}`, 
      service 
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/admin/complaints", async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = {};

    if (status && Object.values(COMPLAINT_STATUS).includes(status)) {
      query.status = status;
    }
    if (priority && Object.values(COMPLAINT_PRIORITY).includes(priority)) {
      query.priority = priority;
    }

    const complaints = await Complaint.find(query)
      .populate("user", "name email")
      .populate("provider", "name email phone")
      .populate("service", "name emojiIcon price")
      .populate("booking", "confirmationCode status bookingDate")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load complaints", error: err.message });
  }
});

app.get("/admin/reviews", async (req, res) => {
  try {
    const { status, minRating, maxRating } = req.query;
    const query = {};

    if (status && Object.values(REVIEW_STATUS).includes(status)) {
      query.status = status;
    }
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = Number(minRating);
      if (maxRating) query.rating.$lte = Number(maxRating);
    }

    const reviews = await Review.find(query)
      .populate("user", "name email")
      .populate("provider", "name email")
      .populate("service", "name emojiIcon price")
      .populate("booking", "confirmationCode status")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ msg: "Failed to load reviews", error: err.message });
  }
});

app.patch("/admin/review/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!Object.values(REVIEW_STATUS).includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    await updateServiceReviewStats(review.service);

    res.json({ msg: "Review status updated", review });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to update review", error: err.message });
  }
});

app.get("/admin/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      approvedProviders,
      pendingProviders,
      totalServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalComplaints,
      openComplaints,
      totalReviews,
    ] = await Promise.all([
      UserModel.countDocuments(),
      ServiceProvider.countDocuments(),
      ServiceProvider.countDocuments({ isApproved: true }),
      ServiceProvider.countDocuments({ cvStatus: "pending" }),
      Service.countDocuments(),
      BookingModel.countDocuments(),
      BookingModel.countDocuments({ status: BOOKING_STATUS.PENDING }),
      BookingModel.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: COMPLAINT_STATUS.OPEN }),
      Review.countDocuments({ status: REVIEW_STATUS.PUBLISHED }),
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers },
        providers: {
          total: totalProviders,
          approved: approvedProviders,
          pending: pendingProviders,
        },
        services: { total: totalServices },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          completed: completedBookings,
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
        },
        reviews: { total: totalReviews },
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to load stats", error: err.message });
  }
});

// ========================= SERVICE PROVIDER APIS ============================= //
app.post(
  "/provider/:id/upload-cv",
  (req, res, next) => {
    cvUpload.single("cv")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ msg: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const provider = await ServiceProvider.findById(req.params.id).populate(
        "services"
      );
      if (!provider) {
        return res.status(404).json({ msg: "Provider not found" });
      }
      if (!req.file) {
        return res.status(400).json({ msg: "CV file is required" });
      }

      const evaluation = await evaluateCvFile(req.file.path);

      provider.cvFile = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/cvs/${req.file.filename}`,
        uploadedAt: new Date(),
      };
      provider.cvStatus = "pending";
      provider.isApproved = false;
      provider.cvScore = evaluation.score;
      provider.cvSummary = evaluation.summary;
      provider.cvKeywords = evaluation.keywords;
      provider.cvSignals = {
        totalMentions: evaluation.totalMentions,
        certifications: evaluation.certifications,
        managementExperience: evaluation.managementExperience,
        riskFlags: evaluation.riskFlags,
      };
      provider.skillTags = evaluation.keywords.slice(0, 12);
      provider.experienceYears = evaluation.experienceYears;
      provider.cvReviewerNote = undefined;
      provider.cvReviewedAt = undefined;
      provider.cvReviewer = undefined;

      const bookingLoad = (provider.services || []).reduce(
        (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
        0
      );
      provider.smartScore = computeSmartScore({
        cvScore: provider.cvScore || 0,
        bookingCount: bookingLoad,
      });

      await provider.save();

      res.json({
        msg: "CV uploaded successfully. Pending admin review.",
        provider,
        evaluation,
      });
    } catch (err) {
      console.error("CV upload failed", err);
      res.status(500).json({ msg: "CV upload failed", error: err.message });
    }
  }
);

app.patch("/provider/:id/location", async (req, res) => {
  try {
    const lat = Number(req.body.lat ?? req.body.latitude);
    const lng = Number(req.body.lng ?? req.body.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res
        .status(400)
        .json({ msg: "Latitude and longitude are required numbers" });
    }

    const localityArea = findAreaByIdentifier(
      req.body.locality || req.body.formattedAddress || req.body.city
    );

    const update = {
      location: {
        type: "Point",
        coordinates: [lng, lat],
        formattedAddress: req.body.formattedAddress || req.body.address,
        city: req.body.city || localityArea?.district,
        locality: localityArea?.name || req.body.locality,
        country: req.body.country,
      },
    };

    if (req.body.serviceRadiusKm !== undefined) {
      const radius = Number(req.body.serviceRadiusKm);
      if (Number.isNaN(radius)) {
        return res.status(400).json({ msg: "serviceRadiusKm must be numeric" });
      }
      update.serviceRadiusKm = Math.max(5, Math.min(100, radius));
    }

    const updatePayload = { ...update };
    if (localityArea?.slug) {
      updatePayload.$addToSet = { areaFocus: localityArea.slug };
    }

    const provider = await ServiceProvider.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    )
      .select("-password")
      .populate("services");

    if (!provider) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    const bookingLoad = (provider.services || []).reduce(
      (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
      0
    );
    provider.smartScore = computeSmartScore({
      cvScore: provider.cvScore || 0.4,
      bookingCount: bookingLoad,
    });
    await provider.save();

    res.json({ msg: "Location updated", provider });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.post("/provider-add-service/:id", async (req, res) => {
  try {
    const providerId = req.params.id;
    const { name, description, price, emojiIcon, category, tags, rating } =
      req.body;

    if (!name || !description) {
      return res.status(400).json({ msg: "Name and description are required" });
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ msg: "Price must be a positive number" });
    }

    if (!isValidCategory(category)) {
      return res
        .status(400)
        .json({ msg: "Invalid category. Choose an available category." });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    if (!provider.isApproved) {
      return res.status(403).json({
        msg: "Provider not approved yet. Complete CV onboarding for admin approval.",
      });
    }

    const areaHints = normalizeTags(req.body.areaTags);
    const localitySlug = provider.location?.locality
      ? findAreaByIdentifier(provider.location.locality)?.slug
      : null;
    const mergedAreaTags = Array.from(
      new Set(
        [
          ...(provider.areaFocus || []),
          ...(areaHints || []),
          localitySlug,
        ].filter(Boolean)
      )
    );

    const newService = new Service({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      currency: "NPR",
      emojiIcon: sanitizeEmojiSymbol(emojiIcon),
      category: category.toLowerCase(),
      provider: providerId,
      isApproved: null, // Pending admin approval
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : undefined,
      tags: normalizeTags(tags),
      areaTags: mergedAreaTags,
      priceHistory: [
        {
          amount: parsedPrice,
          currency: "NPR",
          effectiveFrom: new Date(),
        },
      ],
    });

    const saved = await newService.save();
    await saved.populate("provider", "name email phone isApproved avatarEmoji");

    provider.services.push(saved._id);
    await provider.save();

    await provider.populate("services");

    const providerBookingLoad = (provider.services || []).reduce(
      (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
      0
    );
    provider.smartScore = computeSmartScore({
      cvScore: provider.cvScore || 0.4,
      bookingCount: providerBookingLoad,
    });
    await provider.save();

    emitServiceEvent("service-added", { service: asPlainService(saved) });

    res.json({ msg: "Service added", services: provider.services });
  } catch (err) {
    res.status(500).json({ msg: "Add service failed", error: err.message });
  }
});

app.get("/provider/:id", async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id)
      .select("-password")
      .populate("services");

    if (!provider) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    res.json({ provider });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/provider-services/:id", async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id).populate(
      "services"
    );

    if (!provider) {
      return res.status(404).json({ msg: "Provider not found" });
    }

    res.json({ services: provider.services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.get("/provider-bookings/:providerId", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      provider: req.params.providerId,
    })
      .populate(bookingPopulateOptions)
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.put("/provider-update-service/:serviceId", async (req, res) => {
  try {
    const { name, description, price, emojiIcon, category, tags, areaTags } =
      req.body;
    const baseUpdate = {};
    let priceHistoryPush = null;

    if (name !== undefined) baseUpdate.name = name.trim();
    if (description !== undefined) baseUpdate.description = description.trim();

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ msg: "Price must be a positive number" });
      }
      baseUpdate.price = parsedPrice;
      baseUpdate.currency = "NPR";
      priceHistoryPush = {
        amount: parsedPrice,
        currency: "NPR",
        effectiveFrom: new Date(),
      };
    }

    if (emojiIcon !== undefined) {
      baseUpdate.emojiIcon = sanitizeEmojiSymbol(emojiIcon);
    }

    if (category !== undefined) {
      if (!isValidCategory(category)) {
        return res.status(400).json({ msg: "Invalid category" });
      }
      baseUpdate.category = category.toLowerCase();
    }

    if (tags !== undefined) {
      baseUpdate.tags = normalizeTags(tags);
    }

    if (areaTags !== undefined) {
      baseUpdate.areaTags = normalizeTags(areaTags);
    }

    if (Object.keys(baseUpdate).length === 0 && priceHistoryPush === null) {
      return res.status(400).json({ msg: "No updates provided" });
    }

    const updatePayload = { ...baseUpdate };
    if (priceHistoryPush) {
      updatePayload.$push = { priceHistory: priceHistoryPush };
    }

    const service = await Service.findByIdAndUpdate(
      req.params.serviceId,
      updatePayload,
      { new: true }
    ).populate("provider", "name email phone isApproved avatarEmoji");

    if (!service) return res.status(404).json({ msg: "Service not found" });

    emitServiceEvent("service-updated", { service: asPlainService(service) });

    res.json({ msg: "Service updated", service });
  } catch (err) {
    res.status(500).json({ msg: "Update fail", error: err.message });
  }
});

app.delete(
  "/provider-delete-service/:providerId/:serviceId",
  async (req, res) => {
    try {
      const { providerId, serviceId } = req.params;

      const serviceDoc = await Service.findById(serviceId);
      if (!serviceDoc)
        return res.status(404).json({ msg: "Service not found" });
      if (serviceDoc.isCore) {
        return res
          .status(400)
          .json({ msg: "Core marketplace services cannot be deleted" });
      }

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) return res.status(404).json({ msg: "Provider not found" });

      provider.services = provider.services.filter(
        (id) => id.toString() !== serviceId
      );

      await provider.save();

      if (serviceDoc.image) {
        const normalizedPath = serviceDoc.image.replace(/^\/+/, "");
        const filePath = path.join(__dirname, normalizedPath);
        fs.stat(filePath, (err) => {
          if (err) return;
          fs.unlink(filePath, () => {});
        });
      }

      await BookingModel.deleteMany({ service: serviceId });
      await serviceDoc.deleteOne();
      await provider.populate("services");

      const providerBookingLoad = (provider.services || []).reduce(
        (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
        0
      );
      provider.smartScore = computeSmartScore({
        cvScore: provider.cvScore || 0.4,
        bookingCount: providerBookingLoad,
      });
      await provider.save();

      emitServiceEvent("service-removed", { serviceId });

      res.json({ msg: "Service deleted", services: provider.services });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// ========================= BOOKINGS ============================= //
app.post("/create-booking", async (req, res) => {
  try {
    const { user, provider, service, bookingDate, bookingTime } = req.body;

    if (!user || !provider || !service || !bookingDate || !bookingTime) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Validate date/time formats
    if (!isValidDateString(bookingDate)) {
      return res
        .status(400)
        .json({ msg: "Invalid bookingDate format. Use YYYY-MM-DD" });
    }
    if (!isValidTimeString(bookingTime)) {
      return res
        .status(400)
        .json({ msg: "Invalid bookingTime format. Use HH:MM (24-hour)" });
    }

    // Combine into a Date object (local time)
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    if (isNaN(bookingDateTime.getTime())) {
      return res.status(400).json({ msg: "Invalid booking date/time" });
    }

    const now = new Date();
    if (bookingDateTime.getTime() < now.getTime()) {
      return res
        .status(400)
        .json({ msg: "Cannot book for past date/time. Choose a future time." });
    }

    // Optional: verify referenced records exist
    const svc = await Service.findById(service);
    if (!svc) return res.status(404).json({ msg: "Service not found" });

    // Skip provider validation for demo providers (IDs starting with "demo-")
    const isDemoProvider = provider.toString().startsWith("demo-");
    
    if (!isDemoProvider) {
      const prov = await ServiceProvider.findById(provider);
      if (!prov) return res.status(404).json({ msg: "Provider not found" });

      if (!prov.isApproved) {
        return res
          .status(400)
          .json({ msg: "Provider is not approved. Service not available." });
      }
    }

    const confirmationCode = generateConfirmationCode();
    const bookingSource = svc.isCore ? "core" : "vendor";

    const userAreaInput =
      req.body.userAreaSlug ||
      req.body.userArea ||
      req.body.customerArea ||
      req.body.areaSlug ||
      req.body.locality;
    const resolvedArea = resolveAreaInput(userAreaInput);
    const userLat = Number(
      req.body.userLatitude ?? req.body.userLat ?? req.body.latitude
    );
    const userLng = Number(
      req.body.userLongitude ?? req.body.userLng ?? req.body.longitude
    );
    const hasCustomCoordinates =
      !Number.isNaN(userLat) && !Number.isNaN(userLng);
    const originCoords = hasCustomCoordinates
      ? { lat: userLat, lng: userLng }
      : resolvedArea
      ? {
          lat: resolvedArea.coordinates.lat,
          lng: resolvedArea.coordinates.lng,
        }
      : null;

    // Check for duplicate booking (user already has active booking with this provider)
    // Skip duplicate check for demo providers to allow testing
    const activeBooking = !isDemoProvider ? await BookingModel.findOne({
      user,
      provider,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.SCHEDULED] },
    }) : null;
    
    if (activeBooking) {
      // User already has an active booking with this provider
      const suggestions = await findNearestAlternatives({
        category: svc.category,
        excludeProviderId: provider,
        bookingDate,
        bookingTime,
        originAreaSlug: resolvedArea?.slug,
        originCoordinates: originCoords,
        limit: 5,
      });
      
      return res.status(409).json({
        error: "DUPLICATE_BOOKING",
        message: "You already have an active booking with this provider",
        existingBooking: {
          id: activeBooking._id,
          status: activeBooking.status,
          bookingDate: activeBooking.bookingDate,
          bookingTime: activeBooking.bookingTime,
          confirmationCode: activeBooking.confirmationCode,
        },
        alternatives: suggestions.map((alt) => ({
          provider: {
            id: alt.provider._id,
            name: alt.provider.name,
            avatarEmoji: alt.provider.avatarEmoji,
            experienceYears: alt.provider.experienceYears,
          },
          service: {
            id: alt.service._id,
            name: alt.service.name,
            price: alt.service.price,
            currency: alt.service.currency,
            category: alt.service.category,
          },
          distanceKm: alt.distanceKm,
        })),
      });
    }

    const existingSlot = await BookingModel.findOne({
      provider,
      bookingDate,
      bookingTime,
      status: { $ne: BOOKING_STATUS.CANCELLED },
    });
    if (existingSlot) {
      const suggestions = await findNearestAlternatives({
        category: svc.category,
        excludeProviderId: provider,
        bookingDate,
        bookingTime,
        originAreaSlug: resolvedArea?.slug,
        originCoordinates: originCoords,
        limit: 3,
      });
      return res.status(409).json({
        msg: "Selected provider is already booked for that slot",
        reason: "provider_booked",
        suggestions,
      });
    }

    // Create booking: store date and time separately as strings and also store raw Date
    const book = new BookingModel({
      user,
      provider,
      service,
      bookingDate, // YYYY-MM-DD
      bookingTime, // HH:MM
      bookingDateTime,
      totalAmount: svc.price,
      confirmationCode,
      source: bookingSource,
      status: BOOKING_STATUS.PENDING,
      statusTimeline: [],
      customerAreaSlug: resolvedArea?.slug,
      customerAreaName: resolvedArea?.name || req.body.userAreaName,
      customerLocation: originCoords
        ? {
            type: "Point",
            coordinates: [originCoords.lng, originCoords.lat],
            formattedAddress:
              resolvedArea?.name || req.body.userAreaName || undefined,
            city: resolvedArea?.district,
            locality: resolvedArea?.name,
            country: "Nepal",
          }
        : undefined,
    });

    recordStatusChange(
      book,
      BOOKING_STATUS.PENDING,
      "Booking submitted by customer",
      asActorLabel(user, "user")
    );

    await book.save();

    await Service.findByIdAndUpdate(service, {
      $inc: { bookingCount: 1 },
    });

    // Populate response for convenience
    const populated = await BookingModel.findById(book._id).populate(
      bookingPopulateOptions
    );

    emitServiceEvent("booking-created", {
      bookingId: populated._id,
      status: populated.status,
      providerId: provider,
      userId: user,
    });

    res.json({ msg: "Booking created", booking: populated });
  } catch (err) {
    res.status(500).json({ msg: "Booking failed", error: err.message });
  }
});

app.get("/get-user-bookings/:userId", async (req, res) => {
  try {
    const bookings = await BookingModel.find({ user: req.params.userId })
      .populate(bookingPopulateOptions)
      .sort({ createdAt: -1 });

    res.json(successResponse({ bookings }, "Bookings fetched"));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to load bookings", { error: err.message }));
  }
});

app.patch("/user-update-booking/:id", async (req, res) => {
  try {
    const { date } = req.body;

    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    if (booking.isProviderApproved) {
      return res.status(400).json({
        msg: "Cannot update booking after provider approval",
      });
    }

    let scheduleUpdated = false;

    if (date) {
      // expecting ISO combined or separate date/time? support YYYY-MM-DD and optional time
      // If client sends { date: "YYYY-MM-DD HH:MM" } or sends { bookingDate, bookingTime }
      let newDateStr = null;
      let newTimeStr = null;

      if (typeof date === "string" && date.includes(" ")) {
        const [d, t] = date.split(" ");
        newDateStr = d;
        newTimeStr = t;
      } else if (typeof date === "string" && isValidDateString(date)) {
        newDateStr = date;
      } else if (
        req.body.bookingDate &&
        isValidDateString(req.body.bookingDate)
      ) {
        newDateStr = req.body.bookingDate;
      }

      if (req.body.bookingTime && isValidTimeString(req.body.bookingTime)) {
        newTimeStr = req.body.bookingTime;
      }

      if (!newDateStr) {
        return res
          .status(400)
          .json({ msg: "Provide new bookingDate in YYYY-MM-DD format" });
      }

      // default time to existing bookingTime if not provided
      if (!newTimeStr) newTimeStr = booking.bookingTime || "00:00";

      if (!isValidTimeString(newTimeStr)) {
        return res
          .status(400)
          .json({ msg: "Provide new bookingTime in HH:MM format" });
      }

      const parsed = new Date(`${newDateStr}T${newTimeStr}:00`);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ msg: "Invalid date/time provided" });
      }
      if (parsed.getTime() < Date.now()) {
        return res
          .status(400)
          .json({ msg: "Cannot set booking to a past date/time" });
      }

      booking.bookingDate = newDateStr;
      booking.bookingTime = newTimeStr;
      booking.bookingDateTime = parsed;
      scheduleUpdated = true;
    }

    if (scheduleUpdated) {
      const note = `Rescheduled by customer for ${booking.bookingDate} ${booking.bookingTime}`;
      recordStatusChange(
        booking,
        BOOKING_STATUS.PENDING,
        note.trim(),
        asActorLabel(booking.user?._id || booking.user, "user")
      );
    }

    await booking.save();
    await booking.populate(bookingPopulateOptions);

    emitServiceEvent("booking-updated", {
      bookingId: booking._id,
      status: booking.status,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    });

    res.json({ msg: "Booking updated", booking });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.delete("/user-cancel-booking/:id", async (req, res) => {
  try {
    const book = await BookingModel.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: "Booking not found" });

    if (book.isProviderApproved)
      return res
        .status(400)
        .json({ msg: "Cannot cancel after provider approval" });

    await Service.updateOne(
      { _id: book.service, bookingCount: { $gt: 0 } },
      { $inc: { bookingCount: -1 } }
    );

    recordStatusChange(
      book,
      BOOKING_STATUS.CANCELLED,
      "Cancelled by customer",
      asActorLabel(book.user?._id || book.user, "user")
    );
    book.isProviderApproved = false;
    book.isAdminApproved = false;

    await book.save();
    await book.populate(bookingPopulateOptions);

    emitServiceEvent("booking-cancelled", {
      bookingId: book._id,
      status: book.status,
    });

    res.json({ msg: "Booking cancelled", booking: book });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.patch("/provider-approve-booking/:id", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    const isApproved = Boolean(req.body.isProviderApproved);
    booking.isProviderApproved = isApproved;

    const nextStatus = isApproved
      ? BOOKING_STATUS.CONFIRMED
      : BOOKING_STATUS.CANCELLED;
    const note = isApproved ? "Approved by provider" : "Rejected by provider";

    recordStatusChange(
      booking,
      nextStatus,
      note,
      asActorLabel(booking.provider, "provider")
    );

    await booking.save();
    await booking.populate(bookingPopulateOptions);

    emitServiceEvent("booking-provider-review", {
      bookingId: booking._id,
      status: booking.status,
      isProviderApproved: booking.isProviderApproved,
    });

    res.json({ msg: "Provider approval updated", booking });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ========================= MESSAGES ============================= //
app.post("/messages", async (req, res) => {
  try {
    const msg = await MessageModel.create(req.body);
    res.json({ msg: "Message sent", message: msg });
  } catch (err) {
    res.status(500).json({ msg: "Message error", error: err.message });
  }
});

app.get("/messages/:userId/:otherId", async (req, res) => {
  try {
    const conv = await MessageModel.find({
      $or: [
        { sender: req.params.userId, receiver: req.params.otherId },
        { sender: req.params.otherId, receiver: req.params.userId },
      ],
    }).sort("createdAt");
    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ msg: "Conversation error", error: err.message });
  }
});

// ========================= GET ALL SERVICES (FOR USERS) ===================== //
function sortServicesForMarketplace(a, b) {
  if (a.isCore && !b.isCore) return -1;
  if (!a.isCore && b.isCore) return 1;
  if (a.isCore && b.isCore) {
    const rankA = a.systemRank ?? 999;
    const rankB = b.systemRank ?? 999;
    return rankA - rankB;
  }

  if (a.bookingCount !== b.bookingCount) {
    return (b.bookingCount || 0) - (a.bookingCount || 0);
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

app.get("/services", async (req, res) => {
  try {
    const { search, minPrice, maxPrice, category } = req.query;
    const onlyReviewed = req.query.onlyReviewed === "true";
    const requireCvQualified = req.query.cvQualified === "true";
    const areaFilter = req.query.area
      ? findAreaByIdentifier(req.query.area)
      : null;
    const areaRadiusKm = req.query.areaRadiusKm
      ? Math.max(1, Math.min(15, Number(req.query.areaRadiusKm)))
      : 4;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category && isValidCategory(category)) {
      query.category = category.toLowerCase();
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const services = await Service.find(query)
      .populate({
        path: "provider",
        select:
          "name phone address email rating isApproved avatarEmoji role cvStatus cvScore smartScore skillTags serviceRadiusKm location",
      })
      .lean();

    const filtered = services.filter((svc) => {
      // Only show approved services or core services
      const serviceApproved = svc.isCore || svc.isApproved === true;
      if (!serviceApproved) return false;
      
      const providerApproved = svc.isCore || svc.provider?.isApproved;
      if (!providerApproved) return false;
      if (requireCvQualified) {
        if (
          !svc.provider ||
          svc.provider.cvStatus !== "approved" ||
          (svc.provider.cvScore || 0) < 0.55
        ) {
          return false;
        }
      }
      if (onlyReviewed && !(svc.reviewStats?.total > 0)) {
        return false;
      }
      if (areaFilter) {
        const coords = svc.provider?.location?.coordinates;
        if (!coords || coords.length !== 2) return false;
        const distance = haversineDistance(
          areaFilter.coordinates.lat,
          areaFilter.coordinates.lng,
          coords[1],
          coords[0]
        );
        if (distance > areaRadiusKm) return false;
      }
      return true;
    });

    const normalized = filtered
      .map((svc) => {
        const plain = asPlainService(svc);
        return {
          ...plain,
          bookingCount: Math.max(0, plain.bookingCount || 0),
        };
      })
      .sort(sortServicesForMarketplace);

    const pinned = normalized.filter((svc) => svc.isCore).slice(0, 10);

    res.json(
      successResponse(
        {
          count: normalized.length,
          services: normalized,
          pinned,
          categories: SERVICE_CATEGORIES,
          filters: {
            onlyReviewed,
            cvQualified: requireCvQualified,
            area: areaFilter?.name || null,
            areaRadiusKm,
          },
        },
        "Services fetched"
      )
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(
        errorResponse("Failed to fetch services", { error: err.message })
      );
  }
});

async function findNearestAlternatives({
  category,
  excludeProviderId,
  bookingDate,
  bookingTime,
  originAreaSlug,
  originCoordinates,
  limit = 3,
}) {
  if (!category) return [];
  const area =
    !originCoordinates && originAreaSlug
      ? findAreaByIdentifier(originAreaSlug)
      : null;
  const baseCoords = originCoordinates || area?.coordinates || null;
  const searchRadii = baseCoords ? [3, 6, 12, 20] : [10, 25, 40];
  const collected = [];

  for (const radiusKm of searchRadii) {
    const geoFilter =
      baseCoords && baseCoords.lat && baseCoords.lng
        ? {
            location: {
              $nearSphere: {
                $geometry: {
                  type: "Point",
                  coordinates: [baseCoords.lng, baseCoords.lat],
                },
                $maxDistance: radiusKm * 1000,
              },
            },
          }
        : {};

    const providers = await ServiceProvider.find({
      isApproved: true,
      _id: { $ne: excludeProviderId },
      ...geoFilter,
    })
      .limit(limit * 5)
      .populate({
        path: "services",
        match: { category },
        options: { sort: { bookingCount: -1 } },
      })
      .lean();

    if (!providers.length) {
      continue;
    }

    const providerIds = providers.map((provider) => provider._id);
    const busyProviders = new Set(
      (
        await BookingModel.find({
          provider: { $in: providerIds },
          bookingDate,
          bookingTime,
          status: { $ne: BOOKING_STATUS.CANCELLED },
        }).select("provider")
      ).map((booking) => booking.provider.toString())
    );

    for (const provider of providers) {
      if (
        busyProviders.has(provider._id.toString()) ||
        !Array.isArray(provider.services) ||
        provider.services.length === 0
      ) {
        continue;
      }

      const coords = provider.location?.coordinates;
      const providerDistance =
        baseCoords &&
        coords &&
        coords.length === 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
          ? haversineDistance(
              baseCoords.lat,
              baseCoords.lng,
              coords[1],
              coords[0]
            )
          : null;

      provider.services.slice(0, 1).forEach((svcDoc) => {
        if (collected.length >= limit) return;
        const plain = asPlainService(svcDoc);
        collected.push({
          ...plain,
          provider: {
            _id: provider._id,
            name: provider.name,
            avatarEmoji: provider.avatarEmoji || "🧰",
            location: provider.location,
            cvScore: provider.cvScore,
            cvStatus: provider.cvStatus,
          },
          distanceKm:
            providerDistance != null
              ? Number(providerDistance.toFixed(2))
              : null,
        });
      });

      if (collected.length >= limit) break;
    }

    if (collected.length >= limit) {
      break;
    }
  }

  return collected.slice(0, limit);
}

app.get("/services/nearest", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ msg: "lat and lng query params required" });
    }

    const category =
      typeof req.query.category === "string" &&
      isValidCategory(req.query.category)
        ? req.query.category.toLowerCase()
        : null;

    let requestedRadius = DEFAULT_NEAREST_RADIUS_KM;
    if (req.query.radiusKm !== undefined) {
      const parsedRadius = Number(req.query.radiusKm);
      if (Number.isNaN(parsedRadius)) {
        return res.status(400).json({ msg: "radiusKm must be numeric" });
      }
      requestedRadius = Math.max(5, Math.min(120, parsedRadius));
    }

    const onlyReviewed = req.query.onlyReviewed === "true";
    const requireCvQualified = req.query.cvQualified === "true";

    const providers = await ServiceProvider.find({
      isApproved: true,
      "location.coordinates": { $exists: true },
    })
      .populate({
        path: "services",
        match: category ? { category } : {},
        options: { sort: { bookingCount: -1 } },
      })
      .lean();

    const results = providers
      .map((provider) => {
        const coords = provider.location?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) return null;
        const distanceKm = haversineDistance(lat, lng, coords[1], coords[0]);
        const providerRadius =
          provider.serviceRadiusKm ||
          requestedRadius ||
          DEFAULT_NEAREST_RADIUS_KM;
        if (distanceKm > providerRadius || distanceKm > requestedRadius) {
          return null;
        }

        if (
          requireCvQualified &&
          (provider.cvStatus !== "approved" || (provider.cvScore || 0) < 0.55)
        ) {
          return null;
        }

        const services = (provider.services || [])
          .map((svc) => {
            const plain = asPlainService(svc);
            return {
              ...plain,
              bookingCount: Math.max(0, plain.bookingCount || 0),
              provider: plain.provider || provider._id,
            };
          })
          .filter((svc) => (onlyReviewed ? svc.reviewStats?.total > 0 : true));

        if (category && services.length === 0) return null;

        const bookingLoad = services.reduce(
          (sum, svc) => sum + Math.max(0, svc.bookingCount || 0),
          0
        );

        const smartScore = computeSmartScore({
          cvScore: provider.cvScore || 0.4,
          bookingCount: bookingLoad,
          preferenceBoost: category && services.length ? 0.15 : 0,
        });

        return {
          providerId: provider._id,
          providerName: provider.name,
          avatarEmoji: provider.avatarEmoji || "🏷️",
          distanceKm: Number(distanceKm.toFixed(2)),
          smartScore,
          cvScore: provider.cvScore,
          cvStatus: provider.cvStatus,
          location: provider.location,
          serviceRadiusKm: provider.serviceRadiusKm,
          skillTags: provider.skillTags,
          services: services.slice(0, 3),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 12);

    res.json(
      successResponse(
        {
          providers: results,
          meta: {
            requestedRadiusKm: requestedRadius,
            totalCandidates: providers.length,
            onlyReviewed,
            cvQualified: requireCvQualified,
          },
        },
        "Nearest providers fetched"
      )
    );
  } catch (err) {
    res.status(500).json(
      errorResponse("Failed to fetch nearest providers", {
        error: err.message,
      })
    );
  }
});

app.get("/services/pinned", async (req, res) => {
  try {
    const services = await Service.find({ isCore: true })
      .sort({ systemRank: 1 })
      .populate({
        path: "provider",
        select:
          "name phone address email rating isApproved avatarEmoji role cvStatus cvScore smartScore skillTags serviceRadiusKm location",
      })
      .lean();

    const normalized = services.map((svc) => {
      const plain = asPlainService(svc);
      return {
        ...plain,
        bookingCount: Math.max(0, plain.bookingCount || 0),
      };
    });

    res.json(
      successResponse(
        {
          services: normalized,
          categories: SERVICE_CATEGORIES,
        },
        "Pinned services fetched"
      )
    );
  } catch (err) {
    res
      .status(500)
      .json(
        errorResponse("Failed to fetch pinned services", { error: err.message })
      );
  }
});

app.get("/services/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate({
      path: "provider",
      select:
        "name phone address email rating isApproved cvStatus cvScore smartScore skillTags serviceRadiusKm location",
    });

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    if (!service.provider?.isApproved) {
      return res.status(404).json({ msg: "Service not available" });
    }

    res.json({ success: true, service: asPlainService(service) });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

app.get("/services/recommended/:userId", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const [services, recentBookings] = await Promise.all([
      Service.find()
        .populate({
          path: "provider",
          select:
            "name phone address email rating isApproved avatarEmoji role cvStatus cvScore smartScore skillTags serviceRadiusKm location",
        })
        .lean(),
      BookingModel.find({ user: user._id })
        .populate("service", "category createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const filteredServices = services.filter(
      (svc) => svc.isCore || (svc.provider && svc.provider.isApproved)
    );

    const preferenceCounts = recentBookings.reduce((acc, booking) => {
      const category = booking.service?.category;
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});

    const maxPreference = Object.values(preferenceCounts).reduce(
      (max, count) => Math.max(max, count),
      0
    );
    const preferenceFallback = maxPreference === 0 ? 0.4 : 0;

    const maxBookingCount = filteredServices.reduce(
      (max, svc) => Math.max(max, Math.max(0, svc.bookingCount || 0)),
      0
    );

    const now = Date.now();
    const recencyWindowDays = 90;

    const recommendations = filteredServices
      .map((svc) => {
        const plain = asPlainService(svc);
        const safeBookingCount = Math.max(0, plain.bookingCount || 0);
        const ratingScore = Math.min(1, (plain.rating || 4.5) / 5);
        const popularityScore =
          maxBookingCount > 0
            ? Math.log1p(safeBookingCount) / Math.log1p(maxBookingCount)
            : 0.3;

        const categoryPreference = preferenceCounts[plain.category] || 0;
        const preferenceScore =
          maxPreference > 0
            ? categoryPreference / maxPreference
            : plain.isCore
            ? 0.6
            : preferenceFallback;

        const createdAt = plain.createdAt
          ? new Date(plain.createdAt).getTime()
          : now;
        const ageDays = Math.max(0, (now - createdAt) / (1000 * 60 * 60 * 24));
        const recencyScore = Math.max(0, 1 - ageDays / recencyWindowDays);

        const providerQualitySignal =
          typeof plain.provider?.smartScore === "number"
            ? Math.min(1, plain.provider.smartScore)
            : typeof plain.provider?.cvScore === "number"
            ? Math.min(1, plain.provider.cvScore)
            : 0.5;

        const score =
          ratingScore * 0.3 +
          popularityScore * 0.25 +
          preferenceScore * 0.25 +
          recencyScore * 0.1 +
          providerQualitySignal * 0.1;

        return {
          ...plain,
          bookingCount: safeBookingCount,
          recommendationScore: Number(score.toFixed(3)),
          scoreBreakdown: {
            rating: Number((ratingScore * 0.3).toFixed(3)),
            popularity: Number((popularityScore * 0.25).toFixed(3)),
            preference: Number((preferenceScore * 0.25).toFixed(3)),
            recency: Number((recencyScore * 0.1).toFixed(3)),
            quality: Number((providerQualitySignal * 0.1).toFixed(3)),
          },
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 8);

    res.json(
      successResponse(
        {
          recommendations,
          categories: SERVICE_CATEGORIES,
          meta: {
            totalCandidates: filteredServices.length,
            preferenceSignals: recentBookings.length,
          },
        },
        "Recommendations ready"
      )
    );
  } catch (err) {
    res
      .status(500)
      .json(
        errorResponse("Failed to build recommendations", {
          error: err.message,
        })
      );
  }
});

app.get("/services/search/smart", async (req, res) => {
  try {
    const query = (req.query.q || "").toString();
    if (!query.trim()) {
      return res.status(400).json({ msg: "Search query is required" });
    }
    const onlyReviewed = req.query.onlyReviewed === "true";
    const requireCvQualified = req.query.cvQualified === "true";
    const limit = req.query.limit
      ? Math.max(3, Math.min(25, Number(req.query.limit)))
      : 10;

    const results = await searchServicesUsingCosine(query, {
      onlyReviewed,
      filterCvQualified: requireCvQualified,
      limit,
    });

    res.json({
      success: true,
      results: results.map((entry) => ({
        ...entry.service,
        cosineScore: Number(entry.cosineScore.toFixed(4)),
      })),
      meta: {
        query,
        limit,
        onlyReviewed,
        cvQualified: requireCvQualified,
      },
    });
  } catch (err) {
    console.error("Smart search failed", err);
    res
      .status(500)
      .json({ msg: "Failed to run smart search", error: err.message });
  }
});

// Provider recommendations endpoint with booking filter
app.get("/recommendations", async (req, res) => {
  try {
    const { serviceCategory, userLocation, hideBooked, limit, userId } = req.query;
    
    // Parse user location
    let parsedLocation = null;
    if (userLocation) {
      if (userLocation.includes(",")) {
        const [lat, lng] = userLocation.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedLocation = {
            coordinates: [lng, lat], // GeoJSON format
          };
        }
      } else {
        // Area slug
        parsedLocation = {
          customerAreaSlug: userLocation.toLowerCase(),
        };
      }
    }
    
    // Get user's active bookings if userId provided
    const bookedProviderIds = new Set();
    if (userId) {
      const activeBookings = await BookingModel.find({
        user: userId,
        status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.SCHEDULED] },
      }).select("provider").lean();
      
      activeBookings.forEach(booking => {
        bookedProviderIds.add(booking.provider.toString());
      });
    }
    
    // Build service query
    const serviceQuery = {};
    if (serviceCategory) {
      serviceQuery.category = serviceCategory.toLowerCase();
    }
    
    // Find services
    const services = await Service.find(serviceQuery)
      .populate("provider")
      .lean();
    
    // Build recommendations
    const recommendations = [];
    const seenProviders = new Set();
    
    for (const service of services) {
      if (!service.provider) continue;
      
      const providerId = service.provider._id.toString();
      
      // Skip if already processed
      if (seenProviders.has(providerId)) continue;
      seenProviders.add(providerId);
      
      const isBooked = bookedProviderIds.has(providerId);
      
      // Skip booked providers if hideBooked is true
      if (hideBooked === "true" && isBooked) continue;
      
      // Calculate distance if location provided
      let distanceKm = null;
      if (parsedLocation) {
        const userCoords = parsedLocation.coordinates;
        const providerCoords = service.provider.location?.coordinates;
        
        if (userCoords && providerCoords && userCoords.length === 2 && providerCoords.length === 2) {
          distanceKm = haversineDistance(
            userCoords[1], // lat
            userCoords[0], // lng
            providerCoords[1], // lat
            providerCoords[0] // lng
          );
          distanceKm = Number(distanceKm.toFixed(2));
        }
      }
      
      recommendations.push({
        provider: {
          id: service.provider._id,
          name: service.provider.name,
          avatarEmoji: service.provider.avatarEmoji,
          experienceYears: service.provider.experienceYears,
          primaryAreaSlug: service.provider.primaryAreaSlug,
          primaryAreaName: service.provider.primaryAreaName,
        },
        service: {
          id: service._id,
          name: service.name,
          description: service.description,
          price: service.price,
          currency: service.currency,
          category: service.category,
          emojiIcon: service.emojiIcon,
        },
        distanceKm,
        isBooked,
      });
    }
    
    // Sort by distance if available
    if (parsedLocation) {
      recommendations.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    
    // Apply limit
    const resultLimit = limit ? parseInt(limit) : 10;
    const limitedResults = recommendations.slice(0, resultLimit);
    
    res.json({
      providers: limitedResults,
      total: limitedResults.length,
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ msg: err.message });
  }
});

app.get("/services/:serviceId/reviews", async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ msg: "Invalid service id" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(25, Math.max(5, Number(req.query.limit) || 10));
    const statusFilter =
      req.query.status &&
      Object.values(REVIEW_STATUS).includes(req.query.status)
        ? req.query.status
        : REVIEW_STATUS.PUBLISHED;

    const filter = {
      service: serviceId,
      status: statusFilter,
    };
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      filter.user = req.query.userId;
    }

    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email")
        .populate("booking", "confirmationCode status createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    const summary = await updateServiceReviewStats(serviceId);

    res.json({
      success: true,
      reviews: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (err) {
    console.error("Fetch reviews failed", err);
    res.status(500).json({ msg: "Failed to load reviews", error: err.message });
  }
});

app.post("/services/:serviceId/reviews", async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { userId, bookingId, rating, comment, title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ msg: "Invalid service id" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId || "")) {
      return res.status(400).json({ msg: "Invalid user id" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId || "")) {
      return res.status(400).json({ msg: "Booking reference required" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      user: userId,
      service: serviceId,
    }).populate("provider", "_id");
    if (!booking) {
      return res
        .status(400)
        .json({ msg: "Booking not found for this service and user" });
    }

    const service = await Service.findById(serviceId).populate(
      "provider",
      "name"
    );
    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    const review = await Review.findOneAndUpdate(
      { service: serviceId, user: userId },
      {
        service: serviceId,
        user: userId,
        provider: booking.provider || service.provider?._id,
        booking: bookingId,
        rating: parsedRating,
        comment: comment?.toString().trim(),
        title: title?.toString().trim(),
        sentiment: computeSentimentFromRating(parsedRating),
        status: REVIEW_STATUS.PUBLISHED,
        editedAt: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("user", "name email")
      .populate("booking", "confirmationCode status createdAt");

    const summary = await updateServiceReviewStats(serviceId);
    emitServiceEvent("review-created", {
      reviewId: review._id,
      serviceId,
      summary,
    });

    res.json({
      msg: "Review saved",
      review,
      summary,
    });
  } catch (err) {
    console.error("Create review failed", err);
    res.status(500).json({ msg: "Failed to save review", error: err.message });
  }
});

app.patch("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating, comment, title } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid review id" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId || "")) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "You can only edit your review" });
    }

    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ msg: "Rating must be between 1 and 5" });
      }
      review.rating = parsedRating;
      review.sentiment = computeSentimentFromRating(parsedRating);
    }

    if (comment !== undefined) {
      review.comment = comment?.toString().trim();
    }
    if (title !== undefined) {
      review.title = title?.toString().trim();
    }
    review.editedAt = new Date();

    await review.save();
    await review.populate("user", "name email");

    const summary = await updateServiceReviewStats(review.service);
    emitServiceEvent("review-updated", {
      reviewId: review._id,
      serviceId: review.service,
      summary,
    });

    res.json({ msg: "Review updated", review, summary });
  } catch (err) {
    console.error("Update review failed", err);
    res
      .status(500)
      .json({ msg: "Failed to update review", error: err.message });
  }
});

app.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid review id" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId || "")) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ msg: "Review not found" });
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "You can only delete your review" });
    }

    await review.deleteOne();
    const summary = await updateServiceReviewStats(review.service);
    emitServiceEvent("review-deleted", {
      reviewId: id,
      serviceId: review.service,
      summary,
    });

    res.json({ msg: "Review deleted", summary });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to delete review", error: err.message });
  }
});

app.post("/complaints", async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      category,
      description,
      title,
      priority,
      preferredResolution,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId || "")) {
      return res.status(400).json({ msg: "Invalid user id" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId || "")) {
      return res.status(400).json({ msg: "Invalid booking id" });
    }
    if (!description || !title) {
      return res
        .status(400)
        .json({ msg: "Complaint title and description are required" });
    }

    const booking = await BookingModel.findById(bookingId)
      .populate("service", "name provider")
      .populate("provider", "name");
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    const complaint = new Complaint({
      user: userId,
      provider: booking.provider?._id,
      service: booking.service?._id,
      booking: booking._id,
      title: title.toString().trim(),
      category: category || "other",
      description: description.toString().trim(),
      priority:
        COMPLAINT_PRIORITY[(priority || "").toUpperCase()] ||
        COMPLAINT_PRIORITY.MEDIUM,
      resolution: {
        summary: preferredResolution?.toString().trim(),
      },
    });
    pushComplaintTimeline(
      complaint,
      COMPLAINT_STATUS.OPEN,
      "Complaint submitted by user",
      userId.toString()
    );
    await complaint.save();

    emitServiceEvent("complaint-created", {
      complaintId: complaint._id,
      providerId: complaint.provider,
      serviceId: complaint.service,
      status: complaint.status,
    });

    res.json({ msg: "Complaint submitted", complaint });
  } catch (err) {
    console.error("Create complaint failed", err);
    res
      .status(500)
      .json({ msg: "Failed to submit complaint", error: err.message });
  }
});

app.get("/complaints/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const complaints = await Complaint.find({ user: userId })
      .populate("service", "name emojiIcon price priceNpr priceLabel currency")
      .populate("provider", "name email phone")
      .populate("booking", "confirmationCode status bookingDate bookingTime")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load complaints", error: err.message });
  }
});

app.get("/complaints/provider/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ msg: "Invalid provider id" });
    }

    const complaints = await Complaint.find({ provider: providerId })
      .populate("service", "name emojiIcon price priceNpr priceLabel currency")
      .populate("user", "name email")
      .populate("booking", "confirmationCode status bookingDate bookingTime")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load provider complaints", error: err.message });
  }
});

// Get all complaints (Admin only)
app.get("/complaints/all", async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate("service", "name emojiIcon price priceNpr priceLabel currency")
      .populate("user", "name email")
      .populate("provider", "name email")
      .populate("booking", "confirmationCode status bookingDate bookingTime")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load all complaints", error: err.message });
  }
});

app.patch("/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, actor, resolution } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid complaint id" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ msg: "Complaint not found" });
    }

    if (status) {
      if (!Object.values(COMPLAINT_STATUS).includes(status)) {
        return res.status(400).json({ msg: "Invalid status" });
      }
      pushComplaintTimeline(
        complaint,
        status,
        note || `Status updated to ${status}`,
        actor || "system"
      );
      if (status === COMPLAINT_STATUS.RESOLVED) {
        complaint.resolution = {
          ...(complaint.resolution || {}),
          resolvedAt: new Date(),
          resolvedBy: actor || "system",
          summary: resolution?.summary || complaint.resolution?.summary,
          refundAmount:
            resolution?.refundAmount ?? complaint.resolution?.refundAmount,
        };
      }
    } else if (note) {
      complaint.timeline.push({
        status: complaint.status,
        note,
        actor: actor || "system",
        createdAt: new Date(),
      });
    }

    if (resolution?.summary) {
      complaint.resolution = {
        ...(complaint.resolution || {}),
        summary: resolution.summary,
      };
    }

    await complaint.save();

    emitServiceEvent("complaint-updated", {
      complaintId: complaint._id,
      status: complaint.status,
      providerId: complaint.provider,
    });

    res.json({ msg: "Complaint updated", complaint });
  } catch (err) {
    console.error("Update complaint failed", err);
    res
      .status(500)
      .json({ msg: "Failed to update complaint", error: err.message });
  }
});

app.get("/areas", (req, res) => {
  res.json({ success: true, areas: listKathmanduAreas() });
});

app.get("/areas/:slug/services", async (req, res) => {
  try {
    const area = findAreaByIdentifier(req.params.slug);
    if (!area) {
      return res.status(404).json({ msg: "Area not found" });
    }
    const radiusKm = req.query.radiusKm
      ? Math.max(1, Math.min(12, Number(req.query.radiusKm)))
      : 3;
    const category =
      typeof req.query.category === "string" &&
      isValidCategory(req.query.category)
        ? req.query.category.toLowerCase()
        : null;
    const onlyReviewed = req.query.onlyReviewed === "true";
    const requireCvQualified = req.query.cvQualified === "true";

    const providers = await ServiceProvider.find({
      isApproved: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [area.coordinates.lng, area.coordinates.lat],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .limit(40)
      .populate({
        path: "services",
        match: category ? { category } : {},
      })
      .lean();

    const services = providers
      .filter((provider) => {
        if (
          requireCvQualified &&
          (provider.cvStatus !== "approved" || (provider.cvScore || 0) < 0.55)
        ) {
          return false;
        }
        return true;
      })
      .flatMap((provider) => {
        const coords = provider.location?.coordinates;
        return (provider.services || [])
          .map((svc) => {
            const plain = asPlainService(svc);
            const distanceKm = coords
              ? haversineDistance(
                  area.coordinates.lat,
                  area.coordinates.lng,
                  coords[1],
                  coords[0]
                )
              : null;
            return {
              ...plain,
              provider: {
                _id: provider._id,
                name: provider.name,
                avatarEmoji: provider.avatarEmoji,
                cvScore: provider.cvScore,
                cvStatus: provider.cvStatus,
                location: provider.location,
              },
              distanceKm: distanceKm ? Number(distanceKm.toFixed(2)) : null,
              mapCoordinates:
                coords && coords.length === 2
                  ? { lat: coords[1], lng: coords[0] }
                  : null,
            };
          })
          .filter((svc) => (onlyReviewed ? svc.reviewStats?.total > 0 : true));
      })
      .sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        return (b.reviewStats?.total || 0) - (a.reviewStats?.total || 0);
      })
      .slice(0, 30);

    res.json({
      success: true,
      area,
      services,
      meta: {
        radiusKm,
        category,
        onlyReviewed,
        cvQualified: requireCvQualified,
      },
    });
  } catch (err) {
    console.error("Area services failed", err);
    res
      .status(500)
      .json({ msg: "Failed to load area services", error: err.message });
  }
});

app.post("/routes/shortest", (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({ msg: "from and to are required" });
    }
    const route = dijkstraShortestRoute(from, to);
    if (!route) {
      return res.status(404).json({ msg: "Unable to compute route" });
    }
    res.json({ success: true, route });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to compute route", error: err.message });
  }
});

// ========================= CHATBOT ROUTES (MULTI-CHAT) ============================= //
app.post("/conversations", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const conversation = new Conversation({
      user: userId,
      title: title || "New Conversation",
      messages: [],
    });
    await conversation.save();

    res.json({ msg: "Conversation created", conversation });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to create conversation", error: err.message });
  }
});

app.get("/conversations/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const conversations = await Conversation.find({ user: userId })
      .sort({ lastMessageAt: -1 })
      .select("title isActive lastMessageAt createdAt messages")
      .lean();

    const formatted = conversations.map((conv) => ({
      ...conv,
      messageCount: conv.messages?.length || 0,
      lastMessage:
        conv.messages?.length > 0
          ? conv.messages[conv.messages.length - 1].content.slice(0, 60)
          : null,
    }));

    res.json({ success: true, conversations: formatted });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load conversations", error: err.message });
  }
});

app.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load conversation", error: err.message });
  }
});

app.post("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { message, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid conversation id" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ msg: "Message is required" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const detectedCategory = detectCategoryFromMessage(message);
    const budgetCeiling = detectBudgetCeiling(message);
    const detectedArea = detectAreaFromMessage(message);

    let augmentedQuery = message;
    if (detectedCategory) {
      augmentedQuery = `${detectedCategory} ${augmentedQuery}`;
    }
    if (detectedArea) {
      augmentedQuery = `${detectedArea.name} ${augmentedQuery}`;
    }

    let searchResults = await searchServicesUsingCosine(augmentedQuery, {
      onlyReviewed: true,
      filterCvQualified: true,
      limit: 8,
    });
    if (budgetCeiling) {
      searchResults = filterServicesByBudget(searchResults, budgetCeiling);
    }

    if (detectedArea) {
      searchResults = searchResults
        .map((entry) => {
          const providerLocation =
            entry.service?.provider?.location?.coordinates;
          const distanceKm =
            providerLocation?.length === 2
              ? haversineDistance(
                  detectedArea.coordinates.lat,
                  detectedArea.coordinates.lng,
                  providerLocation[1],
                  providerLocation[0]
                )
              : null;
          return {
            ...entry,
            distanceKm,
          };
        })
        .sort((a, b) => {
          if (a.distanceKm != null && b.distanceKm != null) {
            return a.distanceKm - b.distanceKm;
          }
          return b.cosineScore - a.cosineScore;
        });
    }

    const suggestions = searchResults.slice(0, 3).map((entry) => ({
      serviceId: entry.service._id,
      name: entry.service.name,
      price: entry.service.price,
      priceLabel:
        entry.service.priceLabel ||
        formatPriceNpr(entry.service.price).formatted,
      providerName:
        typeof entry.service.provider === "object"
          ? entry.service.provider.name
          : undefined,
      distanceKm:
        entry.distanceKm != null
          ? Number(entry.distanceKm.toFixed(2))
          : undefined,
    }));

    const replyParts = [];
    replyParts.push("Here's what I found for you:");
    if (detectedCategory) {
      replyParts.push(
        `You mentioned ${detectedCategory}, so I prioritized specialists in that category.`
      );
    }
    if (budgetCeiling) {
      replyParts.push(
        `All suggestions are within NPR ${budgetCeiling.toLocaleString()} budget.`
      );
    }
    if (detectedArea) {
      replyParts.push(`Showing services near ${detectedArea.name}.`);
    }
    if (suggestions.length === 0) {
      replyParts.push(
        "I could not find a perfect match yet. Try adjusting your request or widen the area."
      );
    } else {
      replyParts.push(
        `Top pick: ${suggestions[0].name} (${suggestions[0].priceLabel}).`
      );
    }

    const reply = replyParts.join(" ");

    conversation.messages.push({
      role: "user",
      content: message,
    });

    conversation.messages.push({
      role: "assistant",
      content: reply,
      metadata: {
        detectedCategory,
        detectedArea: detectedArea?.name,
        budgetCeiling,
        suggestedServices: suggestions,
      },
    });

    conversation.lastMessageAt = new Date();
    if (conversation.messages.length === 2 && detectedCategory) {
      conversation.title = `${
        detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1)
      } Services`;
    }

    await conversation.save();

    res.json({
      success: true,
      reply,
      suggestions,
      conversation,
    });
  } catch (err) {
    res.status(500).json({ msg: "Chatbot error", error: err.message });
  }
});

app.delete("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid conversation id" });
    }

    const conversation = await Conversation.findByIdAndDelete(id);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    res.json({ msg: "Conversation deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to delete conversation", error: err.message });
  }
});

// Legacy chatbot endpoint (backward compatibility)
app.post("/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ reply: "Message is required" });
    }

    const lowerMessage = message.toLowerCase().trim();

    // Handle greetings and common questions
    const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)$/i;
    const helpPatterns = /^(help|what can you do|how does this work|what services)$/i;
    const thanksPatterns = /^(thanks|thank you|thx|appreciate it)$/i;

    if (greetingPatterns.test(lowerMessage)) {
      return res.json({
        reply: "Hello! 👋 Welcome to LocalSewa! I'm your AI assistant here to help you find the perfect service provider in Kathmandu.\n\nI can help you with:\n🔧 Plumbing, electrical, and handyman services\n🏠 Cleaning, painting, and home maintenance\n🌱 Gardening, pest control, and more\n\nJust tell me what you need! For example:\n• \"I need a plumber in Tinkune\"\n• \"Electrician under 2000 rupees\"\n• \"Cleaning service near Baneshwor\"\n\nHow can I assist you today? 😊",
        suggestions: [],
      });
    }

    if (helpPatterns.test(lowerMessage)) {
      return res.json({
        reply: "I'm here to help you find the best service providers in Kathmandu! 🎯\n\n**Here's what I can do:**\n\n✨ **Find Services** - Just tell me what you need (plumber, electrician, cleaner, etc.)\n💰 **Budget Matching** - Mention your budget and I'll find options within your range\n📍 **Location-Based** - Tell me your area and I'll show nearby providers\n⭐ **Quality Assured** - All recommendations are from verified, highly-rated providers\n\n**Try asking:**\n• \"Plumber in Tinkune under 2000\"\n• \"Best electrician near me\"\n• \"Affordable cleaning service\"\n• \"AC repair in Baneshwor\"\n\nWhat service are you looking for? 😊",
        suggestions: [],
      });
    }

    if (thanksPatterns.test(lowerMessage)) {
      const thanksResponses = [
        "You're very welcome! 😊 Feel free to ask if you need anything else!",
        "Happy to help! 🙌 Let me know if you need more assistance!",
        "My pleasure! 👍 I'm here whenever you need help finding services!",
        "Anytime! ✨ Don't hesitate to reach out if you have more questions!",
      ];
      return res.json({
        reply: thanksResponses[Math.floor(Math.random() * thanksResponses.length)],
        suggestions: [],
      });
    }

    const detectedCategory = detectCategoryFromMessage(message);
    const budgetCeiling = detectBudgetCeiling(message);
    const detectedArea = detectAreaFromMessage(message);

    let augmentedQuery = message;
    if (detectedCategory) {
      augmentedQuery = `${detectedCategory} ${augmentedQuery}`;
    }
    if (detectedArea) {
      augmentedQuery = `${detectedArea.name} ${augmentedQuery}`;
    }

    let searchResults = await searchServicesUsingCosine(augmentedQuery, {
      onlyReviewed: true,
      filterCvQualified: true,
      limit: 8,
    });
    if (budgetCeiling) {
      searchResults = filterServicesByBudget(searchResults, budgetCeiling);
    }

    if (detectedArea) {
      searchResults = searchResults
        .map((entry) => {
          const providerLocation =
            entry.service?.provider?.location?.coordinates;
          const distanceKm =
            providerLocation?.length === 2
              ? haversineDistance(
                  detectedArea.coordinates.lat,
                  detectedArea.coordinates.lng,
                  providerLocation[1],
                  providerLocation[0]
                )
              : null;
          return {
            ...entry,
            distanceKm,
          };
        })
        .sort((a, b) => {
          if (a.distanceKm != null && b.distanceKm != null) {
            return a.distanceKm - b.distanceKm;
          }
          return b.cosineScore - a.cosineScore;
        });
    }

    const suggestions = searchResults.slice(0, 3).map((entry) => ({
      id: entry.service._id,
      name: entry.service.name,
      priceLabel:
        entry.service.priceLabel ||
        formatPriceNpr(entry.service.price).formatted,
      providerName:
        typeof entry.service.provider === "object"
          ? entry.service.provider.name
          : undefined,
      distanceKm:
        entry.distanceKm != null
          ? Number(entry.distanceKm.toFixed(2))
          : undefined,
      rating: entry.service.rating || 4.5,
      bookingCount: entry.service.bookingCount || 0,
    }));

    // Generate natural, ChatGPT-like response
    let reply = "";
    
    if (suggestions.length === 0) {
      // No results found
      const noResultsResponses = [
        `I couldn't find any services matching your exact criteria. ${detectedCategory ? `There might not be ${detectedCategory} services available` : 'Try broadening your search'} ${detectedArea ? `in ${detectedArea.name}` : 'in your area'} ${budgetCeiling ? `within NPR ${budgetCeiling.toLocaleString()}` : ''}. Would you like me to show you similar services or try a different area?`,
        `Hmm, I'm not finding any perfect matches right now. ${detectedCategory ? `${detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1)} services` : 'Services'} ${detectedArea ? `near ${detectedArea.name}` : ''} ${budgetCeiling ? `under NPR ${budgetCeiling.toLocaleString()}` : ''} seem to be limited. Can I help you with something else or adjust the search?`,
      ];
      reply = noResultsResponses[Math.floor(Math.random() * noResultsResponses.length)];
    } else {
      // Results found - generate natural response
      const greetings = [
        "Great question! I found some excellent options for you.",
        "Perfect! I've got just what you need.",
        "I'd be happy to help! Here's what I found:",
        "Excellent! I've found some top-rated services for you.",
        "Let me help you with that! I've found some great matches:",
      ];
      
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      reply = greeting + "\n\n";

      // Add context about what was detected
      const contextParts = [];
      if (detectedCategory) {
        contextParts.push(`${detectedCategory} services`);
      }
      if (detectedArea) {
        contextParts.push(`in ${detectedArea.name}`);
      }
      if (budgetCeiling) {
        contextParts.push(`within your NPR ${budgetCeiling.toLocaleString()} budget`);
      }
      
      if (contextParts.length > 0) {
        reply += `I've searched for ${contextParts.join(' ')} and found ${suggestions.length} excellent ${suggestions.length === 1 ? 'option' : 'options'}.\n\n`;
      }

      // Highlight top recommendation with personality
      const topService = suggestions[0];
      const topRecommendations = [
        `🌟 My top recommendation is **${topService.name}** at ${topService.priceLabel}. ${topService.providerName ? `Provided by ${topService.providerName}, ` : ''}they have a ${topService.rating} star rating with ${topService.bookingCount} successful bookings. ${topService.distanceKm ? `Plus, they're only ${topService.distanceKm} km away from you!` : ''}`,
        `✨ I highly recommend **${topService.name}** (${topService.priceLabel}). ${topService.providerName ? `${topService.providerName} ` : 'They '}have an impressive ${topService.rating}⭐ rating and ${topService.bookingCount} happy customers. ${topService.distanceKm ? `They're conveniently located just ${topService.distanceKm} km away.` : ''}`,
        `💎 **${topService.name}** stands out as the best choice at ${topService.priceLabel}. With a ${topService.rating} star rating and ${topService.bookingCount} completed bookings, ${topService.providerName ? `${topService.providerName} is` : 'they are'} highly trusted. ${topService.distanceKm ? `Distance: ${topService.distanceKm} km.` : ''}`,
      ];
      reply += topRecommendations[Math.floor(Math.random() * topRecommendations.length)];

      // Add info about other options
      if (suggestions.length > 1) {
        reply += `\n\n📋 I've also found ${suggestions.length - 1} other great ${suggestions.length - 1 === 1 ? 'option' : 'options'} for you to compare. `;
        if (detectedArea) {
          reply += `All services are sorted by proximity to ${detectedArea.name}. `;
        }
        reply += "Check them out below!";
      }

      // Add helpful closing
      const closings = [
        "\n\nFeel free to ask if you need more details or want to explore other options! 😊",
        "\n\nLet me know if you'd like more information about any of these services! 👍",
        "\n\nNeed help with anything else? I'm here to assist! 🙌",
        "\n\nWould you like to know more about any of these options? Just ask! ✨",
      ];
      reply += closings[Math.floor(Math.random() * closings.length)];
    }

    res.json({
      reply: reply,
      suggestions,
    });
  } catch (err) {
    res.status(500).json({ reply: "Chatbot error", error: err.message });
  }
});

// ========================= START SERVER ============================= //
const PORT = process.env.PORT || 5000;

function shutdownSockets() {
  clearInterval(wsHeartbeat);
  wss.clients.forEach((socket) => {
    try {
      socket.terminate();
    } catch (_) {
      // ignore termination errors
    }
  });
}

async function bootstrap() {
  await connectDB();
  await seedCoreServices();
  await seedSampleProviders();
  server.listen(PORT, () => console.log("Server running on port", PORT));
}

process.on("SIGINT", () => {
  shutdownSockets();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdownSockets();
  process.exit(0);
});
process.on("exit", shutdownSockets);

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  shutdownSockets();
  process.exit(1);
});
