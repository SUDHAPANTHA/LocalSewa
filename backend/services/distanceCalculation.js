import {
  findAreaByIdentifier,
  dijkstraShortestRoute,
} from "../constants/kathmanduAreas.js";

/**
 * Calculate distance using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculate distance between user location and provider location
 * Uses Dijkstra for Kathmandu areas, Haversine for custom coordinates
 * @param {Object} userLocation - User's location object
 * @param {Object} providerLocation - Provider's location object
 * @returns {number|null} - Distance in kilometers, or null if cannot calculate
 */
export function calculateDistance(userLocation, providerLocation) {
  // Handle missing location data
  if (!userLocation || !providerLocation) {
    return null;
  }

  // Try area-based calculation first (Dijkstra)
  if (userLocation.customerAreaSlug && providerLocation.primaryAreaSlug) {
    const route = dijkstraShortestRoute(
      userLocation.customerAreaSlug,
      providerLocation.primaryAreaSlug
    );
    if (route) {
      return route.distanceKm;
    }
  }

  // Try coordinate-based calculation (Haversine)
  const userCoords = userLocation.customerLocation?.coordinates || userLocation.coordinates;
  const providerCoords = providerLocation.location?.coordinates || providerLocation.coordinates;

  if (userCoords && providerCoords && userCoords.length === 2 && providerCoords.length === 2) {
    // GeoJSON format is [lng, lat]
    return haversineDistance(
      userCoords[1], // lat
      userCoords[0], // lng
      providerCoords[1], // lat
      providerCoords[0] // lng
    );
  }

  // If area slug exists, try to get coordinates from area data
  if (userLocation.customerAreaSlug) {
    const userArea = findAreaByIdentifier(userLocation.customerAreaSlug);
    if (userArea && providerCoords && providerCoords.length === 2) {
      return haversineDistance(
        userArea.coordinates.lat,
        userArea.coordinates.lng,
        providerCoords[1],
        providerCoords[0]
      );
    }
  }

  if (providerLocation.primaryAreaSlug) {
    const providerArea = findAreaByIdentifier(providerLocation.primaryAreaSlug);
    if (providerArea && userCoords && userCoords.length === 2) {
      return haversineDistance(
        userCoords[1],
        userCoords[0],
        providerArea.coordinates.lat,
        providerArea.coordinates.lng
      );
    }
  }

  return null;
}
