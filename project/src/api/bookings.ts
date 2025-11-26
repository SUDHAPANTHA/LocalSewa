import api from "./client";
import { ApiResponse, Booking, BookingStatus } from "../types";

export const bookingsApi = {
  // CREATE BOOKING
  createBooking: (data: {
    user: string;
    provider: string;
    service: string;
    bookingDate: string; // YYYY-MM-DD
    bookingTime: string; // HH:MM
    userAreaSlug?: string;
    userLatitude?: number;
    userLongitude?: number;
  }) => {
    return api.post<{ msg: string; booking: Booking }>("/create-booking", data, {
      timeout: 10000 // 10 second timeout
    });
  },

  // GET USER BOOKINGS
  getUserBookings: (userId: string) =>
    api.get<{
      bookings: any; success: boolean; data: { bookings: Booking[] }; message?: string 
}>(
      `/get-user-bookings/${userId}`,
      { timeout: 10000 }
    ),

  // GET PROVIDER BOOKINGS
  getProviderBookings: (
    providerId: string,
    config?: { signal?: AbortSignal }
  ) =>
    api.get<{ bookings: Booking[] }>(`/provider-bookings/${providerId}`, {
      signal: config?.signal,
    }),

  // UPDATE BOOKING DATE/TIME
  // expects data.date as "YYYY-MM-DDTHH:MM"
  updateBooking: (bookingId: string, data: { date: string }) => {
    const parts = data.date.split("T");
    const bookingDate = parts[0];
    const bookingTime = parts[1] ? parts[1].slice(0, 5) : ""; // ensure HH:MM

    return api.patch(`/user-update-booking/${bookingId}`, {
      bookingDate,
      bookingTime,
    });
  },

  // CANCEL BOOKING
  cancelBooking: (bookingId: string) =>
    api.delete<{ msg: string; booking: Booking }>(
      `/user-cancel-booking/${bookingId}`
    ),

  // PROVIDER APPROVAL
  providerApproveBooking: (bookingId: string, isApproved: boolean) =>
    api.patch<{ msg: string; booking: Booking }>(
      `/provider-approve-booking/${bookingId}`,
      { isProviderApproved: isApproved }
    ),

  // ADMIN APPROVAL
  adminApproveBooking: (bookingId: string, isApproved: boolean) =>
    api.patch<{ msg: string; booking: Booking }>(
      `/admin-approve-booking/${bookingId}`,
      { isAdminApproved: isApproved }
    ),

  // DIRECT STATUS PATCH (completed, etc.)
  updateBookingStatus: (
    bookingId: string,
    payload: { status: BookingStatus; note?: string; actor?: string }
  ) =>
    api.patch<{ msg: string; booking: Booking }>(
      `/bookings/${bookingId}/status`,
      payload
    ),

  // ADMIN GET ALL BOOKINGS
  adminGetAllBookings: (config?: { signal?: AbortSignal }) =>
    api.get<{ bookings: Booking[] }>("/admin-get-all-bookings", {
      signal: config?.signal,
    }),
};
