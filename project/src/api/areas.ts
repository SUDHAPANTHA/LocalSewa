import api from "./client";
import { KathmanduArea, Service, ShortestRouteResult } from "../types";

export const areasApi = {
  listAreas: () => api.get<{ success: boolean; areas: KathmanduArea[] }>("/areas"),

  getAreaServices: (
    slug: string,
    params?: { radiusKm?: number; category?: string; onlyReviewed?: boolean; cvQualified?: boolean }
  ) => api.get<{ success: boolean; area: KathmanduArea; services: Service[] }>(
      `/areas/${slug}/services`,
      { params }
    ),

  getShortestRoute: (payload: { from: string; to: string }) =>
    api.post<{ success: boolean; route: ShortestRouteResult }>("/routes/shortest", payload),
};

