import Booking, { BOOKING_STATUS } from "../models/booking.js";

/**
 * Check if a booking status is considered "active"
 * Active bookings are: pending, confirmed, or scheduled
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking is active
 */
export function isActiveBooking(booking) {
  const activeStatuses = [
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.SCHEDULED,
  ];
  return activeStatuses.includes(booking.status);
}

/**
 * Validate if a user can create a booking with a provider
 * Checks for existing active bookings between user and provider
 * @param {string} userId - The user's ID
 * @param {string} providerId - The provider's ID
 * @returns {Promise<Object>} - Validation result with isValid flag and existingBooking if found
 */
export async function validateBookingRequest(userId, providerId) {
  try {
    // Query for existing bookings between this user and provider
    const existingBookings = await Booking.find({
      user: userId,
      provider: providerId,
    }).lean();

    // Filter for active bookings
    const activeBooking = existingBookings.find((booking) =>
      isActiveBooking(booking)
    );

    if (activeBooking) {
      return {
        isValid: false,
        existingBooking: activeBooking,
        reason: "DUPLICATE_BOOKING",
      };
    }

    return {
      isValid: true,
      existingBooking: null,
    };
  } catch (error) {
    console.error("Error validating booking request:", error);
    throw error;
  }
}
