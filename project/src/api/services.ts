import api from "./client";
import { NearbyProvider, Service } from "../types";

export interface ServiceListResponse {
  services: any;
  success: boolean;
  data: {
    count?: number;
    services: Service[];
    pinned?: Service[];
    categories?: string[];
    filters?: Record<string, unknown>;
  };
  message?: string;
}

export interface ServiceRecommendationResponse {
  success: boolean;
  recommendations: Service[];
  categories?: string[];
  meta?: {
    totalCandidates: number;
    preferenceSignals: number;
  };
}

export interface NearestProvidersResponse {
  success: boolean;
  providers: NearbyProvider[];
  meta?: {
    requestedRadiusKm: number;
    totalCandidates: number;
  };
}

export type UpsertServicePayload = {
  name: string;
  description: string;
  price: number;
  emojiIcon?: string;
  category: string;
  tags?: string[] | string;
  rating?: number;
};

export type PartialServicePayload = Partial<UpsertServicePayload>;

/**
 * Optional request config used mainly to pass AbortSignal
 */
type ReqConfig = { signal?: AbortSignal };

const normalizeTags = (tags?: string[] | string) => {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return tags;
  // assume comma-separated string (or single tag)
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

export const servicesApi = {
  getProviderServices: (providerId: string, config?: ReqConfig) =>
    api.get<{ services: Service[] }>(`/provider-services/${providerId}`, {
      signal: config?.signal,
    }),

  addService: (providerId: string, payload: UpsertServicePayload, config?: ReqConfig) => {
    const body = {
      ...payload,
      tags: normalizeTags(payload.tags),
    };
    return api.post<{
      created: Service[]; msg: string; services: Service[] 
}>(
      `/provider-add-service/${providerId}`,
      body,
      { signal: config?.signal }
    );
  },

  updateService: (serviceId: string, payload: PartialServicePayload, config?: ReqConfig) =>
    api.put<{ msg: string; service: Service }>(
      `/provider-update-service/${serviceId}`,
      { ...payload, tags: normalizeTags(payload.tags as any) },
      { signal: config?.signal }
    ),

  deleteService: (providerId: string, serviceId: string, config?: ReqConfig) =>
    api.delete<{ msg: string; services: Service[] }>(
      `/provider-delete-service/${providerId}/${serviceId}`,
      { signal: config?.signal }
    ),

  getAllServices: (
    params?: {
      search?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      onlyReviewed?: boolean;
      cvQualified?: boolean;
      area?: string;
      areaRadiusKm?: number;
    },
    config?: ReqConfig
  ) => api.get<ServiceListResponse>("/services", { 
    params, 
    signal: config?.signal,
    timeout: 10000 // 10 second timeout
  }),

  getPinnedServices: (config?: ReqConfig) =>
    api.get<ServiceListResponse>("/services/pinned", { signal: config?.signal }),

  getRecommendedServices: (userId: string, config?: ReqConfig) =>
    api.get<ServiceRecommendationResponse>(`/services/recommended/${userId}`, {
      signal: config?.signal,
    }),

  getNearestProviders: (
    params: {
      lat: number;
      lng: number;
      category?: string;
      radiusKm?: number;
      onlyReviewed?: boolean;
      cvQualified?: boolean;
    },
    config?: ReqConfig
  ) =>
    api.get<NearestProvidersResponse>("/services/nearest", {
      params,
      signal: config?.signal,
    }),

  smartSearch: (
    params: { q: string; limit?: number; onlyReviewed?: boolean; cvQualified?: boolean }
  ) =>
    api.get<{
      [x: string]: any; success: boolean; results: Service[] 
}>(
      "/services/search/smart",
      { params }
    ),
};
