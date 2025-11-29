import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { servicesApi } from "../../api/services";
import { bookingsApi } from "../../api/bookings";
import { areasApi, KathmanduArea } from "../../api/areas";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { getApiErrorMessage } from "../../utils/errors";
import { formatNpr } from "../../utils/currency";
import {
  Search,
  Star,
  Clock,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { LocalityAutocomplete } from "../../components/LocalityAutocomplete";
import { HARDCODED_SERVICES } from "../../data/hardcodedServices";

// Hardcoded services now imported from separate file: hardcodedServices.ts
// Total: 31 services covering all Kathmandu areas
// Old array below is kept for reference but not used

/* OLD ARRAY - NOT USED ANYMORE
const OLD_HARDCODED_SERVICES = [
  {
    _id: "hc1",
    name: "Home Plumbing Service",
    description: "Professional plumbing repairs and installations",
    price: 1500,
    category: "plumbing",
    emojiIcon: "🔧",
    rating: 4.5,
    bookingCount: 45,
    isHardcoded: true,
    locality: "Tinkune",
    localitySlug: "tinkune",
    provider: {
      _id: "demo-provider-1",
      name: "Tinkune Plumbing Services",
      email: "demo@tinkune.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Tinkune",
      primaryAreaSlug: "tinkune",
    },
  },
  {
    _id: "hc2",
    name: "Electrical Repair",
    description: "Expert electrical wiring and fixture installation",
    price: 1800,
    category: "electrical",
    emojiIcon: "⚡",
    rating: 4.7,
    bookingCount: 38,
    isHardcoded: true,
    locality: "Koteshwor",
    localitySlug: "koteshwor",
    provider: {
      _id: "demo-provider-2",
      name: "Koteshwor Electricians",
      email: "demo@koteshwor.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Koteshwor",
      primaryAreaSlug: "koteshwor",
    },
  },
  {
    _id: "hc3",
    name: "House Cleaning",
    description: "Deep cleaning services for homes and offices",
    price: 1200,
    category: "cleaning",
    emojiIcon: "🧹",
    rating: 4.6,
    bookingCount: 52,
    isHardcoded: true,
    locality: "Baneshwor",
    localitySlug: "baneshwor",
    provider: {
      _id: "demo-provider-3",
      name: "Baneshwor Cleaning Squad",
      email: "demo@baneshwor.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Baneshwor",
      primaryAreaSlug: "baneshwor",
    },
  },
  {
    _id: "hc4",
    name: "AC Repair & Service",
    description: "Air conditioner repair and maintenance",
    price: 2000,
    category: "appliance",
    emojiIcon: "❄️",
    rating: 4.8,
    bookingCount: 41,
    isHardcoded: true,
    locality: "Chabahil",
    localitySlug: "chabahil",
    provider: {
      _id: "demo-provider-4",
      name: "Chabahil AC Services",
      email: "demo@chabahil.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Chabahil",
      primaryAreaSlug: "chabahil",
    },
  },
  {
    _id: "hc5",
    name: "House Painting",
    description: "Interior and exterior painting services",
    price: 2500,
    category: "painting",
    emojiIcon: "🎨",
    rating: 4.4,
    bookingCount: 29,
    isHardcoded: true,
    locality: "Kalanki",
    localitySlug: "kalanki",
    provider: {
      _id: "demo-provider-5",
      name: "Kalanki Painters",
      email: "demo@kalanki.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Kalanki",
      primaryAreaSlug: "kalanki",
    },
  },
  {
    _id: "hc6",
    name: "Moving & Packing",
    description: "Professional moving and packing services",
    price: 3000,
    category: "moving",
    emojiIcon: "📦",
    rating: 4.5,
    bookingCount: 33,
    isHardcoded: true,
    locality: "Thamel",
    localitySlug: "thamel",
    provider: {
      _id: "demo-provider-6",
      name: "Thamel Movers",
      email: "demo@thamel.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Thamel",
      primaryAreaSlug: "thamel",
    },
  },
  {
    _id: "hc7",
    name: "Handyman Service",
    description: "General home repair and maintenance",
    price: 1000,
    category: "handyman",
    emojiIcon: "🔨",
    rating: 4.6,
    bookingCount: 47,
    isHardcoded: true,
    locality: "Boudha",
    localitySlug: "boudha",
    provider: {
      _id: "demo-provider-7",
      name: "Boudha Handyman",
      email: "demo@boudha.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Boudha",
      primaryAreaSlug: "boudha",
    },
  },
  {
    _id: "hc8",
    name: "Garden Maintenance",
    description: "Lawn care and garden maintenance",
    price: 1500,
    category: "gardening",
    emojiIcon: "🌱",
    rating: 4.3,
    bookingCount: 25,
    isHardcoded: true,
    locality: "Baluwatar",
    localitySlug: "baluwatar",
    provider: {
      _id: "demo-provider-8",
      name: "Baluwatar Gardens",
      email: "demo@baluwatar.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Baluwatar",
      primaryAreaSlug: "baluwatar",
    },
  },
  {
    _id: "hc9",
    name: "Security Installation",
    description: "CCTV and security system installation",
    price: 3500,
    category: "security",
    emojiIcon: "🔒",
    rating: 4.7,
    bookingCount: 31,
    isHardcoded: true,
    locality: "Lazimpat",
    localitySlug: "lazimpat",
    provider: {
      _id: "demo-provider-9",
      name: "Lazimpat Security Systems",
      email: "demo@lazimpat.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Lazimpat",
      primaryAreaSlug: "lazimpat",
    },
  },
  {
    _id: "hc10",
    name: "Spa & Massage",
    description: "Relaxing spa and massage services",
    price: 2200,
    category: "wellness",
    emojiIcon: "💆",
    rating: 4.9,
    bookingCount: 56,
    isHardcoded: true,
    locality: "Jawalakhel",
    localitySlug: "jawalakhel",
    provider: {
      _id: "demo-provider-10",
      name: "Jawalakhel Wellness Center",
      email: "demo@jawalakhel.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Jawalakhel",
      primaryAreaSlug: "jawalakhel",
    },
  },
  {
    _id: "hc11",
    name: "Carpentry Work",
    description: "Custom furniture and carpentry services",
    price: 2800,
    category: "handyman",
    emojiIcon: "🪚",
    rating: 4.5,
    bookingCount: 22,
    isHardcoded: true,
    locality: "Sanepa",
    localitySlug: "sanepa",
    provider: {
      _id: "demo-provider-11",
      name: "Sanepa Carpenters",
      email: "demo@sanepa.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Sanepa",
      primaryAreaSlug: "sanepa",
    },
  },
  {
    _id: "hc12",
    name: "Pest Control",
    description: "Professional pest control and fumigation",
    price: 1800,
    category: "cleaning",
    emojiIcon: "🐛",
    rating: 4.4,
    bookingCount: 28,
    isHardcoded: true,
    locality: "Balaju",
    localitySlug: "balaju",
    provider: {
      _id: "demo-provider-12",
      name: "Balaju Pest Control",
      email: "demo@balaju.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Balaju",
      primaryAreaSlug: "balaju",
    },
  },
  {
    _id: "hc13",
    name: "Water Tank Cleaning",
    description: "Water tank cleaning and sanitization",
    price: 1600,
    category: "cleaning",
    emojiIcon: "💧",
    rating: 4.6,
    bookingCount: 19,
    isHardcoded: true,
    locality: "Maharajgunj",
    localitySlug: "maharajgunj",
    provider: {
      _id: "demo-provider-13",
      name: "Maharajgunj Tank Services",
      email: "demo@maharajgunj.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Maharajgunj",
      primaryAreaSlug: "maharajgunj",
    },
  },
  {
    _id: "hc14",
    name: "Solar Panel Installation",
    description: "Solar panel installation and maintenance",
    price: 5000,
    category: "electrical",
    emojiIcon: "☀️",
    rating: 4.8,
    bookingCount: 15,
    isHardcoded: true,
    locality: "Swayambhu",
    localitySlug: "swayambhu",
    provider: {
      _id: "demo-provider-14",
      name: "Swayambhu Solar Solutions",
      email: "demo@swayambhu.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Swayambhu",
      primaryAreaSlug: "swayambhu",
    },
  },
  {
    _id: "hc15",
    name: "Laundry Service",
    description: "Professional laundry and dry cleaning",
    price: 800,
    category: "cleaning",
    emojiIcon: "👕",
    rating: 4.5,
    bookingCount: 42,
    isHardcoded: true,
    locality: "Maitighar",
    localitySlug: "maitighar",
    provider: {
      _id: "demo-provider-15",
      name: "Maitighar Laundry",
      email: "demo@maitighar.com",
      services: [],
      isApproved: true,
      primaryAreaName: "Maitighar",
      primaryAreaSlug: "maitighar",
    },
  },
];
*/ // End of old unused array

const localMinDateTime = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

const getProviderName = (service: Service) => {
  if (!service.provider) return "Service Provider";
  return typeof service.provider === "string"
    ? "Service Provider"
    : service.provider.name || "Service Provider";
};

export function Services() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [vendorServices, setVendorServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("");
  const [selectedArea, setSelectedArea] = useState<KathmanduArea | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [userBookedProviderIds, setUserBookedProviderIds] = useState<
    Set<string>
  >(new Set());
  const [duplicateError, setDuplicateError] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [hideBookedProviders, setHideBookedProviders] = useState(false);
  const [allAreas, setAllAreas] = useState<KathmanduArea[]>([]);

  // Fetch all Kathmandu areas for distance calculation
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areasApi.getAll();
        setAllAreas(response.data.areas || []);
      } catch (error) {
        console.error("Failed to fetch areas", error);
      }
    };

    fetchAreas();
  }, []);

  // Fetch user's active bookings to check which providers are already booked
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserBookings = async () => {
      try {
        const response = await bookingsApi.getUserBookings(user.id);
        const responseData = response.data as any;
        const bookings =
          responseData?.data?.bookings || responseData?.bookings || [];

        // Extract provider IDs from ACTIVE bookings only (pending, confirmed, scheduled)
        const bookedProviderIds = new Set<string>();
        bookings.forEach((booking: any) => {
          // Only consider active bookings
          const status = booking.status?.toLowerCase();
          if (
            status === "pending" ||
            status === "confirmed" ||
            status === "scheduled"
          ) {
            const providerId =
              typeof booking.provider === "object"
                ? booking.provider._id
                : booking.provider;
            if (providerId) bookedProviderIds.add(providerId);
          }
        });

        setUserBookedProviderIds(bookedProviderIds);
      } catch (error) {
        console.error("Failed to fetch user bookings", error);
      }
    };

    fetchUserBookings();
  }, [user?.id]);

  // Fetch vendor-added services (approved by admin)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchVendorServices = async () => {
      if (!isMounted) return;

      setLoading(true);

      try {
        const response = await servicesApi.getAllServices(
          {},
          { signal: controller.signal }
        );

        if (!isMounted) return;

        // Backend returns: { success: true, data: { services: [...], ... }, message: "..." }
        const responseData = response.data;

        // Handle both direct response and nested data
        let services = [];
        if (responseData) {
          if (Array.isArray(responseData)) {
            services = responseData;
          } else if (responseData.data?.services) {
            services = responseData.data.services;
          } else if (responseData.services) {
            services = responseData.services;
          }
        }

        // Filter only approved vendor services (not core/hardcoded)
        // Provider must be approved to show services
        const approved = services.filter(
          (svc: any) =>
            !svc.isCore &&
            svc.provider &&
            typeof svc.provider === "object" &&
            svc.provider.isApproved === true
        );

        if (isMounted) {
          setVendorServices(approved);
        }
      } catch (error: any) {
        if (!isMounted) return;

        // Don't show error if request was cancelled
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }

        console.error("Failed to fetch services:", error);

        // Check if it's a timeout error
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          showToast(
            "Request timed out. Please check your connection and try again.",
            "error"
          );
        } else {
          showToast(
            getApiErrorMessage(error, "Failed to load services"),
            "error"
          );
        }

        if (isMounted) {
          setVendorServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVendorServices();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []); // Empty dependency array - only run once on mount

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
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
  };

  // Get distance for a service based on selected area
  const getServiceDistance = (service: any): number | null => {
    if (!selectedArea) {
      console.log("No area selected, cannot calculate distance");
      return null;
    }

    console.log(
      "Calculating distance for service:",
      service.name,
      "from area:",
      selectedArea.name
    );
    console.log("All areas loaded:", allAreas.length);

    // For hardcoded services, use their locality coordinates
    if (service.isHardcoded && (service as any).localitySlug) {
      console.log(
        "Hardcoded service with locality:",
        (service as any).localitySlug
      );

      // If it's the same area, distance is 0
      if ((service as any).localitySlug === selectedArea.slug) {
        console.log("Same area, distance = 0");
        return 0;
      }

      // Find the provider's area in allAreas
      const providerArea = allAreas.find(
        (a) => a.slug === (service as any).localitySlug
      );
      if (providerArea) {
        const distance = calculateDistance(
          selectedArea.coordinates.lat,
          selectedArea.coordinates.lng,
          providerArea.coordinates.lat,
          providerArea.coordinates.lng
        );
        console.log(
          "Calculated distance for hardcoded service:",
          distance,
          "km"
        );
        return distance;
      }

      console.log("Provider area not found in allAreas");
      return null;
    }

    // Get provider location
    const provider =
      typeof service.provider === "object" ? service.provider : null;
    if (!provider) {
      console.log("No provider object found");
      return null;
    }

    console.log(
      "Provider:",
      provider.name,
      "primaryAreaSlug:",
      provider.primaryAreaSlug
    );

    // Try to get coordinates from provider location
    const providerCoords = provider.location?.coordinates;
    if (providerCoords && providerCoords.length === 2) {
      const distance = calculateDistance(
        selectedArea.coordinates.lat,
        selectedArea.coordinates.lng,
        providerCoords[1], // GeoJSON is [lng, lat]
        providerCoords[0]
      );
      console.log("Calculated distance from coordinates:", distance, "km");
      return distance;
    }

    // Fallback: if provider has primaryAreaSlug, calculate using area coordinates
    if (provider.primaryAreaSlug) {
      // If same area, distance is 0
      if (provider.primaryAreaSlug === selectedArea.slug) {
        console.log("Same area (primaryAreaSlug), distance = 0");
        return 0;
      }

      // Find the provider's area in allAreas
      const providerArea = allAreas.find(
        (a) => a.slug === provider.primaryAreaSlug
      );
      if (providerArea) {
        const distance = calculateDistance(
          selectedArea.coordinates.lat,
          selectedArea.coordinates.lng,
          providerArea.coordinates.lat,
          providerArea.coordinates.lng
        );
        console.log(
          "Calculated distance from primaryAreaSlug:",
          distance,
          "km"
        );
        return distance;
      }

      console.log(
        "Provider area not found in allAreas for slug:",
        provider.primaryAreaSlug
      );
    }

    console.log("Could not calculate distance - no location data available");
    return null;
  };

  // Recommendation Algorithm: Sort services by relevance and distance
  const getRecommendationScore = (service: any) => {
    let score = 0;

    // 1. Rating weight (30%)
    const ratingScore = (service.rating || 4.5) / 5;
    score += ratingScore * 0.3;

    // 2. Popularity weight (25%) - based on booking count
    const maxBookings = 100; // Normalize to 100 bookings
    const popularityScore = Math.min(
      (service.bookingCount || 0) / maxBookings,
      1
    );
    score += popularityScore * 0.25;

    // 3. Vendor priority (15%) - vendor services ranked higher
    const vendorBonus = !service.isHardcoded ? 0.15 : 0;
    score += vendorBonus;

    // 4. Distance weight (20%) - closer is better
    const distance = getServiceDistance(service);
    if (distance !== null) {
      // Normalize distance: 0km = 1.0, 10km = 0.5, 20km+ = 0
      const distanceScore = Math.max(0, 1 - distance / 20);
      score += distanceScore * 0.2;
    }

    // 5. Locality match (10%) - if user selected a locality
    if (selectedArea && (service as any).localitySlug === selectedArea.slug) {
      score += 0.1;
    }

    return score;
  };

  // Show only real vendor services (no demo/hardcoded services)
  const allServices = [...vendorServices].sort((a, b) => {
    // If area is selected, prioritize distance-based sorting
    if (selectedArea) {
      const distA = getServiceDistance(a);
      const distB = getServiceDistance(b);

      // Both have distance - sort by distance first
      if (distA !== null && distB !== null) {
        if (Math.abs(distA - distB) > 0.5) {
          // If distance difference > 0.5km
          return distA - distB; // Closer first
        }
      }

      // One has distance, other doesn't - prioritize the one with distance
      if (distA !== null && distB === null) return -1;
      if (distA === null && distB !== null) return 1;
    }

    // Fall back to recommendation score
    const scoreA = getRecommendationScore(a);
    const scoreB = getRecommendationScore(b);
    return scoreB - scoreA; // Higher score first
  });

  // Filter services based on search query and locality
  let filteredServices = allServices;

  // Step 1: Filter by locality/distance if selected
  if (selectedArea) {
    const MAX_DISTANCE_KM = 3; // Only show services within 3km

    filteredServices = allServices.filter((service) => {
      const distance = getServiceDistance(service);
      // Include services with distance <= 3km, or services without distance data
      return distance === null || distance <= MAX_DISTANCE_KM;
    });
  }

  // Step 2: Apply search query filter (works with or without locality)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredServices = filteredServices.filter((service) => {
      const nameMatch = service.name.toLowerCase().includes(query);
      const descMatch = service.description.toLowerCase().includes(query);
      const catMatch = service.category.toLowerCase().includes(query);
      const localityMatch = (service as any).locality
        ?.toLowerCase()
        .includes(query);
      return nameMatch || descMatch || catMatch || localityMatch;
    });
  }

  // Apply booked provider filter if enabled
  if (hideBookedProviders && user) {
    filteredServices = filteredServices.filter((service) => {
      const providerId =
        typeof service.provider === "object"
          ? service.provider._id
          : service.provider;
      return providerId ? !userBookedProviderIds.has(providerId) : true;
    });
  }

  // Get unique nearby areas from filtered services (when area is selected)
  const getNearbyAreasFromServices = (): string[] => {
    if (!selectedArea || filteredServices.length === 0) return [];

    const nearbyAreas = new Set<string>();

    filteredServices.forEach((service) => {
      // For hardcoded services
      if (service.isHardcoded && (service as any).locality) {
        const locality = (service as any).locality;
        if (locality !== selectedArea.name) {
          nearbyAreas.add(locality);
        }
      }

      // For vendor services
      const provider =
        typeof service.provider === "object" ? service.provider : null;
      const areaName = (provider as any)?.primaryAreaName;
      if (areaName && areaName !== selectedArea.name) {
        nearbyAreas.add(areaName);
      }
    });

    return Array.from(nearbyAreas).slice(0, 5); // Limit to 5 areas
  };

  const nearbyAreasWithServices = getNearbyAreasFromServices();

  const handleBooking = async () => {
    if (!user) {
      showToast("Please log in to book a service", "error");
      return;
    }

    if (!selectedService || !scheduledDate) {
      showToast("Select a service and date first", "error");
      return;
    }

    // Get provider ID (works for both hardcoded and vendor services)
    const providerId =
      typeof selectedService.provider === "string"
        ? selectedService.provider
        : selectedService.provider?._id;

    if (!providerId) {
      showToast("Provider unavailable for this service", "error");
      return;
    }

    // Validate date/time format
    const [bookingDate, bookingTimeRaw] = scheduledDate.split("T");
    const bookingTime = bookingTimeRaw ? bookingTimeRaw.slice(0, 5) : "";

    if (!bookingDate || !bookingTime) {
      showToast("Please select a valid date and time", "error");
      return;
    }

    // Check if date is in the future
    const selectedDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const now = new Date();
    if (selectedDateTime <= now) {
      showToast("Please select a future date and time", "error");
      return;
    }

    const bookingData = {
      user: user.id,
      provider: providerId,
      service: selectedService._id,
      bookingDate,
      bookingTime,
    };

    console.log("=== BOOKING ATTEMPT ===");
    console.log("Booking data:", bookingData);
    console.log("Service:", selectedService);
    console.log("Provider ID:", providerId);

    setBookingLoading(true);
    try {
      // Create booking without location data (it's optional)
      const response = await bookingsApi.createBooking(bookingData);

      console.log("Booking response:", response.data);

      // Backend returns: { msg: "...", booking: { confirmationCode: "..." } }
      const responseData = response.data as any;
      const confirmation = responseData?.booking?.confirmationCode || "pending";

      showToast(`Booking received! Confirmation ${confirmation}`, "success");

      // Refresh user bookings to update the booked providers list
      if (user?.id) {
        try {
          const bookingsResponse = await bookingsApi.getUserBookings(user.id);
          const bookingsData = bookingsResponse.data as any;
          const bookings =
            bookingsData?.data?.bookings || bookingsData?.bookings || [];

          const bookedProviderIds = new Set<string>();
          bookings.forEach((booking: any) => {
            const status = booking.status?.toLowerCase();
            if (
              status === "pending" ||
              status === "confirmed" ||
              status === "scheduled"
            ) {
              const bookingProviderId =
                typeof booking.provider === "object"
                  ? booking.provider._id
                  : booking.provider;
              if (bookingProviderId) bookedProviderIds.add(bookingProviderId);
            }
          });

          setUserBookedProviderIds(bookedProviderIds);
        } catch (err) {
          console.error("Failed to refresh bookings", err);
        }
      }

      setSelectedService(null);
      setScheduledDate("");
      setDuplicateError(null);
      setShowAlternatives(false);
    } catch (error: any) {
      console.error("Booking error:", error);
      console.error("Error response:", error.response?.data);

      // Check if it's a duplicate booking error
      if (
        error.response?.status === 409 &&
        error.response?.data?.error === "DUPLICATE_BOOKING"
      ) {
        const errorData = error.response.data;
        console.log("Duplicate booking error data:", errorData);
        console.log("Alternatives:", errorData.alternatives);
        console.log("Alternatives length:", errorData.alternatives?.length);

        setDuplicateError(errorData);

        // Show alternatives if available
        if (errorData.alternatives && errorData.alternatives.length > 0) {
          console.log("Setting showAlternatives to true");
          setShowAlternatives(true);
          showToast(
            `You already have a booking with this provider. Check out ${errorData.alternatives.length} alternative providers!`,
            "error"
          );
        } else {
          console.log("No alternatives available");
          showToast(
            errorData.message ||
              "You already have an active booking with this provider",
            "error"
          );
        }
      } else {
        // Show specific error message from backend
        console.log("=== BOOKING ERROR (NOT DUPLICATE) ===");
        console.log("Status:", error.response?.status);
        console.log("Error data:", error.response?.data);
        console.log("Error message:", error.message);

        const errorMessage =
          error.response?.data?.msg ||
          error.response?.data?.message ||
          error.message ||
          "Booking failed";

        showToast(`Booking failed: ${errorMessage}`, "error");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-8 rounded-3xl shadow-2xl">
          <h1 className="text-4xl font-black leading-tight">
            Book Trusted Services
          </h1>
          <p className="text-white/80 mt-3 max-w-2xl">
            Browse our marketplace of professional services. Vendor services
            appear first after admin approval.
          </p>
        </header>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search services by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          {/* Locality Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Search by Locality
            </label>
            <LocalityAutocomplete
              value={selectedLocality}
              onChange={(value, area) => {
                setSelectedLocality(value);
                setSelectedArea(area);
              }}
              placeholder="Select Kathmandu locality (e.g., Tinkune, Baneshwor)..."
            />
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-4 pt-2 flex-wrap">
            {user && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideBookedProviders}
                  onChange={(e) => setHideBookedProviders(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-700">
                  Hide providers I've already booked
                </span>
              </label>
            )}
            {selectedArea && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    Showing services sorted by distance from {selectedArea.name}
                  </span>
                </div>
                {nearbyAreasWithServices.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium">Nearby areas:</span>
                    <span>{nearbyAreasWithServices.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Services List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedArea
                ? `Services near ${selectedArea.name}`
                : "Available Services"}
            </h2>
            <span className="text-sm text-slate-500">
              {filteredServices.length} services found
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow p-8 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-slate-500">
              {selectedArea
                ? `No services available in ${selectedArea.name} or nearby areas.`
                : "No services match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <article
                  key={service._id}
                  className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl transition flex flex-col gap-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">
                      {service.emojiIcon || "🛠️"}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-400">
                            {service.category}
                          </p>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {service.name}
                          </h3>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {!service.isHardcoded && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                              Vendor
                            </span>
                          )}
                          {(() => {
                            const providerId =
                              typeof service.provider === "object"
                                ? service.provider._id
                                : service.provider;
                            return (
                              providerId &&
                              userBookedProviderIds.has(providerId)
                            );
                          })() && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                              ✓ Booked
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400" />
                      {service.rating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {service.bookingCount || 0} bookings
                    </span>
                    {(() => {
                      const distance = getServiceDistance(service);

                      // Get area name for the service
                      let areaName = null;
                      if (service.isHardcoded && (service as any).locality) {
                        areaName = (service as any).locality;
                      } else {
                        const provider =
                          typeof service.provider === "object"
                            ? service.provider
                            : null;
                        areaName = (provider as any)?.primaryAreaName || null;
                      }

                      if (distance !== null && selectedArea) {
                        // Show distance with area name
                        if (distance === 0) {
                          return (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <MapPin className="w-4 h-4" />
                              {areaName || selectedArea.name} (here)
                            </span>
                          );
                        }
                        return (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <MapPin className="w-4 h-4" />
                            {areaName ? `${areaName} - ` : ""}
                            {distance} km away
                          </span>
                        );
                      }
                      // Show area name even without distance
                      if (areaName) {
                        return (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            {areaName}
                          </span>
                        );
                      }
                      
                      // Fallback: try to get location from provider
                      const provider = typeof service.provider === "object" ? service.provider : null;
                      const providerLocation = (provider as any)?.location?.formattedAddress || 
                                              (provider as any)?.location?.locality ||
                                              (provider as any)?.address;
                      
                      if (providerLocation) {
                        return (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {providerLocation}
                          </span>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatNpr(service.price)}
                      </p>
                    </div>
                    {(() => {
                      const providerId =
                        typeof service.provider === "object"
                          ? service.provider._id
                          : service.provider;
                      const isBooked =
                        providerId && userBookedProviderIds.has(providerId);

                      if (isBooked) {
                        return (
                          <button
                            disabled
                            className="px-4 py-2 rounded-xl bg-gray-400 text-white font-semibold cursor-not-allowed opacity-60"
                            title="You already have an active booking with this provider"
                          >
                            Already Booked
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={() => setSelectedService(service)}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                        >
                          Book Now
                        </button>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => {
          setSelectedService(null);
          setScheduledDate("");
          setDuplicateError(null);
          setShowAlternatives(false);
        }}
        title={
          selectedService ? `Book ${selectedService.name}` : "Book Service"
        }
      >
        {selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {selectedService.emojiIcon || "🛠️"}
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {selectedService.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedService.isHardcoded
                    ? "Demo Service"
                    : `Provider: ${getProviderName(selectedService)}`}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Price</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatNpr(selectedService.price)}
              </p>
            </div>

            <>
              {selectedService.isHardcoded && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    📍 Demo service - You can book this to test the system!
                  </p>
                </div>
              )}
              {/* Duplicate Booking Error with Alternatives */}
              {duplicateError &&
                showAlternatives &&
                (() => {
                  console.log("Rendering duplicate error modal");
                  console.log("duplicateError:", duplicateError);
                  console.log("showAlternatives:", showAlternatives);
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900">
                            Already Booked
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            {duplicateError.message}
                          </p>
                          {duplicateError.existingBooking && (
                            <p className="text-xs text-red-600 mt-2">
                              Existing booking:{" "}
                              {duplicateError.existingBooking.confirmationCode}
                              {duplicateError.existingBooking.bookingDate &&
                                ` on ${duplicateError.existingBooking.bookingDate}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Alternative Providers */}
                      {duplicateError.alternatives &&
                        duplicateError.alternatives.length > 0 &&
                        (() => {
                          console.log(
                            "Rendering alternatives section, count:",
                            duplicateError.alternatives.length
                          );
                          return (
                            <div className="space-y-3">
                              <h5 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                Try these nearby alternatives instead:
                              </h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {duplicateError.alternatives.map(
                                  (alt: any, idx: number) => {
                                    // Check if this is the nearest alternative
                                    const isNearest =
                                      idx === 0 && alt.distanceKm !== null;

                                    return (
                                      <div
                                        key={idx}
                                        className={`bg-white border rounded-lg p-3 hover:border-blue-400 transition cursor-pointer ${
                                          isNearest
                                            ? "border-blue-300 ring-2 ring-blue-100"
                                            : "border-slate-200"
                                        }`}
                                        onClick={() => {
                                          // Find the service in our list and select it
                                          const altService = allServices.find(
                                            (s) => s._id === alt.service.id
                                          );
                                          if (altService) {
                                            setSelectedService(altService);
                                            setDuplicateError(null);
                                            setShowAlternatives(false);
                                          }
                                        }}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium text-slate-900 text-sm">
                                                {alt.provider.name}
                                              </p>
                                              {isNearest && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                                                  Nearest
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                              {alt.service.name}
                                            </p>
                                            {alt.distanceKm !== null && (
                                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                                                <MapPin className="w-3 h-3" />
                                                {alt.distanceKm} km away
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                              {formatNpr(alt.service.price)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          );
                        })()}

                      <button
                        onClick={() => {
                          setDuplicateError(null);
                          setShowAlternatives(false);
                        }}
                        className="text-sm text-red-700 hover:text-red-900 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  );
                })()}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Choose date & time
                </label>
                <input
                  type="datetime-local"
                  min={localMinDateTime()}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading || !scheduledDate}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
            </>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
