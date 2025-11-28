import { ServiceProvider, Service } from "../models/serviceprovider.js";
import Booking from "../models/booking.js";
import { isActiveBooking } from "./bookingValidation.js";
import { calculateDistance } from "./distanceCalculation.js";

/**
 * Get user's active bookings with providers
 * @param {string} userId - The user's ID
 * @returns {Promise<Set>} - Set of provider IDs with active bookings
 */
async function getUserActiveBookings(userId) {
  if (!userId) return new Set();

  const bookings = await Booking.find({ user: userId }).lean();
  const activeProviderIds = new Set();

  bookings.forEach((booking) => {
    if (isActiveBooking(booking)) {
      activeProviderIds.add(booking.provider.toString());
    }
  });

  return activeProviderIds;
}

/**
 * Get recommended providers based on filters and location
 * @param {Object} options - Recommendation options
 * @param {string} options.serviceCategory - Filter by service category
 * @param {string} options.userId - User ID to check for existing bookings
 * @param {Object} options.userLocation - User's location for distance calculation
 * @param {boolean} options.hideBooked - Whether to hide already-booked providers
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} - Array of provider recommendations with distance
 */
export async function getRecommendedProviders(options = {}) {
  const {
    serviceCategory,
    userId,
    userLocation,
    hideBooked = false,
    limit = 10,
  } = options;

  try {
    // Build service query
    const serviceQuery = {};
    if (serviceCategory) {
      serviceQuery.category = serviceCategory.toLowerCase();
    }

    // Find services matching criteria
    const services = await Service.find(serviceQuery)
      .populate("provider")
      .lean();

    // Get user's active bookings
    const bookedProviderIds = await getUserActiveBookings(userId);

    // Build provider recommendations
    const recommendations = [];
    const seenProviders = new Set();

    for (const service of services) {
      if (!service.provider) continue;

      const providerId = service.provider._id.toString();

      // Skip if already processed this provider
      if (seenProviders.has(providerId)) continue;
      seenProviders.add(providerId);

      const isBooked = bookedProviderIds.has(providerId);

      // Skip booked providers if hideBooked is true
      if (hideBooked && isBooked) continue;

      // Calculate distance if user location is provided
      let distanceKm = null;
      if (userLocation) {
        distanceKm = calculateDistance(userLocation, service.provider);
      }

      recommendations.push({
        provider: service.provider,
        service: service,
        distanceKm,
        isBooked,
      });
    }

    // Sort by distance if available, otherwise keep original order
    if (userLocation) {
      recommendations.sort((a, b) => {
        // Put items without distance at the end
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    // Apply limit
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error("Error getting recommended providers:", error);
    throw error;
  }
}
