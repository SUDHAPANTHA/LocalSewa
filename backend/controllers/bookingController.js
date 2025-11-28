import Booking from "../models/booking.js";
import { Service } from "../models/serviceprovider.js";
import { validateBookingRequest } from "../services/bookingValidation.js";
import { getRecommendedProviders } from "../services/providerRecommendation.js";

export const createBooking = async (req, res) => {
  try {
    const { user, provider, service, customerLocation, customerAreaSlug, customerAreaName } = req.body;

    // Validate for duplicate bookings
    if (user && provider) {
      const validation = await validateBookingRequest(user, provider);

      if (!validation.isValid) {
        // Get service details to find category for alternatives
        let serviceCategory = null;
        if (service) {
          const serviceDoc = await Service.findById(service).lean();
          serviceCategory = serviceDoc?.category;
        }

        // Get alternative providers
        const userLocation = customerLocation || customerAreaSlug || customerAreaName
          ? {
              customerLocation,
              customerAreaSlug,
              customerAreaName,
            }
          : null;

        const alternatives = await getRecommendedProviders({
          serviceCategory,
          userId: user,
          userLocation,
          hideBooked: true,
          limit: 5,
        });

        // Duplicate booking detected - return with alternatives
        return res.status(409).json({
          error: "DUPLICATE_BOOKING",
          message: "You already have an active booking with this provider",
          existingBooking: {
            id: validation.existingBooking._id,
            status: validation.existingBooking.status,
            bookingDate: validation.existingBooking.bookingDate,
            bookingTime: validation.existingBooking.bookingTime,
            confirmationCode: validation.existingBooking.confirmationCode,
          },
          alternatives: alternatives.map((alt) => ({
            provider: {
              id: alt.provider._id,
              name: alt.provider.name,
              avatarEmoji: alt.provider.avatarEmoji,
              experienceYears: alt.provider.experienceYears,
            },
            service: {
              id: alt.service._id,
              name: alt.service.name,
              price: alt.service.price,
              currency: alt.service.currency,
              category: alt.service.category,
            },
            distanceKm: alt.distanceKm,
          })),
        });
      }
    }

    // Create booking if validation passes
    const booking = await Booking.create(req.body);
    res.json({ msg: "Booking created", booking });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getProviderRecommendations = async (req, res) => {
  try {
    const { serviceCategory, userLocation, hideBooked, limit, userId } = req.query;

    // Parse user location if provided (format: "lat,lng" or area slug)
    let parsedLocation = null;
    if (userLocation) {
      if (userLocation.includes(",")) {
        const [lat, lng] = userLocation.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedLocation = {
            coordinates: [lng, lat], // GeoJSON format [lng, lat]
          };
        }
      } else {
        // Assume it's an area slug or name
        parsedLocation = {
          customerAreaSlug: userLocation.toLowerCase(),
        };
      }
    }

    // Get recommendations
    const providers = await getRecommendedProviders({
      serviceCategory: serviceCategory?.toLowerCase(),
      userId: userId || req.user?.id,
      userLocation: parsedLocation,
      hideBooked: hideBooked === "true" || hideBooked === true,
      limit: limit ? parseInt(limit) : 10,
    });

    res.json({
      providers: providers.map((item) => ({
        provider: {
          id: item.provider._id,
          name: item.provider.name,
          avatarEmoji: item.provider.avatarEmoji,
          experienceYears: item.provider.experienceYears,
          primaryAreaSlug: item.provider.primaryAreaSlug,
          primaryAreaName: item.provider.primaryAreaName,
        },
        service: {
          id: item.service._id,
          name: item.service.name,
          description: item.service.description,
          price: item.service.price,
          currency: item.service.currency,
          category: item.service.category,
          emojiIcon: item.service.emojiIcon,
        },
        distanceKm: item.distanceKm,
        isBooked: item.isBooked || false,
      })),
      total: providers.length,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
