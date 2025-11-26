import api from "./client";
import { ServiceProvider, Service } from "../types";

type RequestConfig = {
  signal?: AbortSignal;
};

export const adminApi = {
  getAllProviders: (params = {}, options: { signal?: AbortSignal } = {}) =>
    api.get("/admin-get-providers", { params, signal: options.signal }),

  approveProvider: (
    providerId: string,
    payload: { isApproved: boolean; cvStatus?: string },
    config?: RequestConfig
  ) =>
    api.patch<{ msg: string; provider: ServiceProvider }>(
      `/admin-approve-provider/${providerId}`,
      payload,
      { signal: config?.signal }
    ),

  getAllUsers: (options = {}) => api.get("/admin-get-users", options),

  deleteUser: (userId: string, config?: RequestConfig) =>
    api.delete<{ msg: string }>(`/admin-delete-user/${userId}`, {
      signal: config?.signal,
    }),

  getAllServices: (config?: RequestConfig) =>
    api.get<{ services: Service[] }>("/admin/services", {
      signal: config?.signal,
    }),

  updateService: (
    serviceId: string,
    payload: {
      name?: string;
      description?: string;
      price?: number;
      emojiIcon?: string;
      category?: string;
      rating?: number;
      tags?: string | string[];
    },
    config?: RequestConfig
  ) =>
    api.patch<{ msg: string; service: Service }>(
      `/admin/service/${serviceId}`,
      payload,
      { signal: config?.signal }
    ),

  deleteService: (serviceId: string, config?: RequestConfig) =>
    api.delete<{ msg: string }>(`/admin/service/${serviceId}`, {
      signal: config?.signal,
    }),
};

export default adminApi;
