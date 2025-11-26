import api from "./client";

export interface KathmanduArea {
  name: string;
  slug: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  tags?: string[];
  adjacency?: Array<{
    to: string;
    distanceKm: number;
  }>;
}

export const areasApi = {
  // Get all Kathmandu areas
  getAll: () =>
    api.get<{ success: boolean; areas: KathmanduArea[] }>("/areas"),

  // Get services by area
  getServicesByArea: (
    slug: string,
    params?: {
      radiusKm?: number;
      category?: string;
      onlyReviewed?: boolean;
      cvQualified?: boolean;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.radiusKm) queryParams.append("radiusKm", params.radiusKm.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.onlyReviewed) queryParams.append("onlyReviewed", "true");
    if (params?.cvQualified) queryParams.append("cvQualified", "true");

    const queryString = queryParams.toString();
    return api.get(`/areas/${slug}/services${queryString ? `?${queryString}` : ""}`);
  },
};
