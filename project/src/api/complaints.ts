import api from "./client";
import { Complaint } from "../types";

export const complaintsApi = {
  create: (payload: {
    userId: string;
    bookingId: string;
    category: string;
    description: string;
    title: string;
    priority?: "low" | "medium" | "high" | "critical";
    preferredResolution?: string;
  }) => api.post<{ msg: string; complaint: Complaint }>("/complaints", payload),

  getUserComplaints: (userId: string) =>
    api.get<{ success: boolean; complaints: Complaint[] }>(
      `/complaints/user/${userId}`
    ),

  getProviderComplaints: (providerId: string) =>
    api.get<{ success: boolean; complaints: Complaint[] }>(
      `/complaints/provider/${providerId}`
    ),

  updateComplaint: (
    complaintId: string,
    payload: { status?: string; note?: string; actor?: string; resolution?: { summary?: string; refundAmount?: number } }
  ) => api.patch<{ msg: string; complaint: Complaint }>(`/complaints/${complaintId}`, payload),
};

