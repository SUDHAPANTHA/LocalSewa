import api from "./client";
import { Review, ReviewSummary } from "../types";

export interface ReviewListResponse {
  success: boolean;
  reviews: Review[];
  summary: ReviewSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const reviewsApi = {
  list: (
    serviceId: string,
    params?: { page?: number; limit?: number; status?: string; userId?: string }
  ) => api.get<ReviewListResponse>(`/services/${serviceId}/reviews`, { params }),

  create: (
    serviceId: string,
    payload: { userId: string; bookingId: string; rating: number; comment?: string; title?: string }
  ) => api.post<{ msg: string; review: Review; summary: ReviewSummary }>(`/services/${serviceId}/reviews`, payload),

  update: (
    reviewId: string,
    payload: { userId: string; rating?: number; comment?: string; title?: string }
  ) => api.patch<{ msg: string; review: Review; summary: ReviewSummary }>(`/reviews/${reviewId}`, payload),

  remove: (reviewId: string, userId: string) =>
    api.delete<{ msg: string; summary: ReviewSummary }>(`/reviews/${reviewId}`, {
      params: { userId },
    }),
};

