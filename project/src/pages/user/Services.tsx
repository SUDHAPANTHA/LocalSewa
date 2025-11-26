import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { servicesApi } from "../../api/services";
import { bookingsApi } from "../../api/bookings";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { getApiErrorMessage } from "../../utils/errors";
import { formatNpr } from "../../utils/currency";
import { Search, Star, Clock, Loader2 } from "lucide-react";

const HARDCODED_SERVICES = [
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
  },
];

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
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

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
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return;
        }
        
        console.error("Failed to fetch services:", error);
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
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

  // Combine vendor services (on top) with hardcoded services
  const allServices = [...vendorServices, ...HARDCODED_SERVICES];

  // Filter services based on search query
  const filteredServices = allServices.filter((service) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query)
    );
  });

  const handleBooking = async () => {
    if (!user) {
      showToast("Please log in to book a service", "error");
      return;
    }

    if (!selectedService || !scheduledDate) {
      showToast("Select a service and date first", "error");
      return;
    }

    // Don't allow booking hardcoded services
    if (selectedService.isHardcoded) {
      showToast(
        "This is a demo service. Please contact the provider directly.",
        "info"
      );
      return;
    }

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

    console.log("Booking data:", {
      user: user.id,
      provider: providerId,
      service: selectedService._id,
      bookingDate,
      bookingTime,
    });

    setBookingLoading(true);
    try {
      // Create booking without location data (it's optional)
      const response = await bookingsApi.createBooking({
        user: user.id,
        provider: providerId,
        service: selectedService._id,
        bookingDate,
        bookingTime,
      });
      
      console.log("Booking response:", response.data);
      
      // Backend returns: { msg: "...", booking: { confirmationCode: "..." } }
      const responseData = response.data as any;
      const confirmation = responseData?.booking?.confirmationCode || "pending";
      
      showToast(`Booking received! Confirmation ${confirmation}`, "success");
      setSelectedService(null);
      setScheduledDate("");
    } catch (error: any) {
      console.error("Booking error:", error);
      console.error("Error response:", error.response?.data);
      
      // Show specific error message from backend
      const errorMessage = error.response?.data?.msg || 
                          error.response?.data?.message || 
                          error.message || 
                          "Booking failed";
      
      showToast(errorMessage, "error");
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
        </div>

        {/* Services List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Available Services
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
              No services match your search.
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
                        {!service.isHardcoded && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Vendor
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400" />
                      {service.rating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {service.bookingCount || 0} bookings
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatNpr(service.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedService(service)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                    >
                      {service.isHardcoded ? "View Details" : "Book Now"}
                    </button>
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

            {selectedService.isHardcoded ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  This is a demo service for display purposes. Please contact
                  the service provider directly for bookings.
                </p>
              </div>
            ) : (
              <>
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
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
