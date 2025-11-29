import api from "./client";
import { ServiceProvider } from "../types";

export interface LocationPayload {
  lat: number;
  lng: number;
  formattedAddress?: string;
  city?: string;
  country?: string;
  locality?: string;
  serviceRadiusKm?: number;
}

export const providerApi = {
  getProfile: (providerId: string) =>
    api.get<{ provider: ServiceProvider }>(`/provider/${providerId}`),

  uploadCv: (providerId: string, file: File) => {
    const formData = new FormData();
    formData.append("cv", file);
    return api.post<{ msg: string; provider: ServiceProvider }>(
      `/provider/${providerId}/upload-cv`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  updateLocation: (providerId: string, payload: LocationPayload) =>
    api.patch<{ msg: string; provider: ServiceProvider }>(
      `/provider/${providerId}/location`,
      payload
    ),

  deleteCv: (providerId: string) =>
    api.delete<{ msg: string; provider: ServiceProvider }>(
      `/provider/${providerId}/cv`
    ),
};

