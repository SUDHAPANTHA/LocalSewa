export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "service_provider" | "admin";
  phone?: string;
  address?: string;
  isApproved?: boolean;
}

export interface RecommendationBreakdown {
  rating: number;
  popularity: number;
  preference: number;
  recency: number;
  quality?: number;
}

export interface ReviewDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}

export interface ReviewSummary {
  total: number;
  average: number;
  lastReviewAt?: string | null;
  distribution: ReviewDistribution;
}

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
  formattedAddress?: string;
  city?: string;
  country?: string;
  locality?: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "completed"
  | "cancelled";

export interface BookingStatusEntry {
  status: BookingStatus;
  note?: string;
  changedBy?: string;
  changedAt?: string;
}

export interface Service {
  locality: boolean | undefined;
  locality: any;
  _id: string;
  name: string;
  description: string;
  price: number;
  priceNpr?: number;
  priceLabel?: string;
  currency?: string;
  emojiIcon?: string;
  category: string;
  provider?: string | ServiceProvider;
  rating?: number;
  bookingCount?: number;
  tags?: string[];
  isCore?: boolean;
  isApproved?: boolean | null;
  isHardcoded?: boolean;
  systemRank?: number | null;
  recommendationScore?: number;
  scoreBreakdown?: RecommendationBreakdown;
  createdAt?: string;
  updatedAt?: string;
  distanceKm?: number;
  smartScore?: number;
  reviewStats?: ReviewSummary;
  mapCoordinates?: { lat: number; lng: number };
}

export interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarEmoji?: string;
  services: Service[];
  isApproved: boolean;
  cvStatus?: "not_provided" | "pending" | "approved" | "rejected";
  cvScore?: number | null;
  cvSummary?: string;
  cvKeywords?: string[];
  cvReviewerNote?: string;
  cvReviewedAt?: string;
  cvFile?: {
    originalName?: string;
    url?: string;
    uploadedAt?: string;
    size?: number;
  };
  skillTags?: string[];
  experienceYears?: number;
  smartScore?: number | null;
  serviceRadiusKm?: number;
  location?: GeoLocation;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  msg: string;
  data: User;
}
// src/types.ts
export interface UserRef {
  _id: string;
  name?: string;
  email?: string;
}

export interface ProviderRef {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarEmoji?: string;
}

export interface ServiceRef {
  _id: string;
  name?: string;
  price?: number;
  priceLabel?: string;
  emojiIcon?: string;
  category?: string;
}

export interface Booking {
  _id: string;
  user: string | UserRef;
  provider: string | ProviderRef;
  service: string | ServiceRef;
  bookingDate?: string; // YYYY-MM-DD
  bookingTime?: string; // HH:MM or HH:MM:SS
  bookingDateTime?: string; // optional ISO string if backend stores it
  totalAmount?: number;
  isProviderApproved?: boolean | null;
  isAdminApproved?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  status?: BookingStatus;
  confirmationCode?: string;
  statusTimeline?: BookingStatusEntry[];
  source?: "core" | "vendor";
}

export interface NearbyProvider {
  providerId: string;
  providerName: string;
  avatarEmoji?: string;
  distanceKm: number;
  smartScore?: number | null;
  cvStatus?: string;
  cvScore?: number | null;
  skillTags?: string[];
  services: Service[];
}

export interface Review {
  _id: string;
  user: UserRef;
  service: ServiceRef;
  provider?: ProviderRef;
  booking?: Booking;
  rating: number;
  title?: string;
  comment?: string;
  sentiment?: "positive" | "neutral" | "negative";
  status: "draft" | "published" | "hidden";
  createdAt?: string;
  updatedAt?: string;
  editedAt?: string;
}

export type ComplaintStatus =
  | "open"
  | "in_review"
  | "needs_info"
  | "escalated"
  | "resolved"
  | "closed";

export interface ComplaintTimelineEntry {
  status: ComplaintStatus;
  note?: string;
  actor?: string;
  createdAt?: string;
}

export interface Complaint {
  _id: string;
  user: UserRef;
  provider?: ProviderRef;
  service?: ServiceRef;
  booking?: Booking;
  title: string;
  category: "quality" | "pricing" | "timeliness" | "behavior" | "safety" | "other";
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: ComplaintStatus;
  resolution?: {
    summary?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    refundAmount?: number;
  };
  timeline?: ComplaintTimelineEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KathmanduArea {
  slug: string;
  name: string;
  district: string;
  coordinates: { lat: number; lng: number };
  tags?: string[];
  neighbors?: string[];
}

export interface RouteSegment {
  slug: string;
  name: string;
  coordinates: { lat: number; lng: number };
  district?: string;
}

export interface ShortestRouteResult {
  distanceKm: number;
  path: RouteSegment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

