import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { servicesApi } from "../../api/services";
import { bookingsApi } from "../../api/bookings";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { DollarSign, Calendar, MessageCircle } from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

// Extract provider ID from hash route
function parseProviderIdFromHash(hash: string) {
  const match = hash.match(/\/user\/provider\/([^/?#]+)/);
  return match ? match[1] : "";
}

export function ProviderDetail() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [providerId, setProviderId] = useState(() =>
    parseProviderIdFromHash(window.location.hash)
  );
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Returns min date for datetime-local input (local timezone)
  const getLocalISOString = () => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const onHashChange = () => {
      const id = parseProviderIdFromHash(window.location.hash);
      setProviderId(id);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setSelectedService(null);
    setScheduledDate("");
  }, [providerId]);

  useEffect(() => {
    if (!providerId) {
      setServices([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await servicesApi.getProviderServices(providerId);
        setServices(res.data.services || []);
      } catch (err) {
        console.error("Failed to fetch services", err);
        showToast("Failed to fetch services", "error");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const handleBookService = async () => {
    if (!user) {
      showToast("Please log in to book", "error");
      return;
    }
    if (!selectedService || !scheduledDate) {
      showToast("Please select service and date", "error");
      return;
    }

    setBookingLoading(true);
    try {
      // scheduledDate comes from datetime-local input "YYYY-MM-DDTHH:MM"
      const [bookingDate, bookingTimeRaw] = scheduledDate.split("T");
      const bookingTime = bookingTimeRaw ? bookingTimeRaw.slice(0, 5) : "";

      await bookingsApi.createBooking({
        user: user.id,
        provider: providerId,
        service: selectedService._id,
        bookingDate,
        bookingTime,
      });

      showToast("Booking created successfully!", "success");
      setSelectedService(null);
      setScheduledDate("");
    } catch (error) {
      console.error("Booking error", error);
      showToast(getApiErrorMessage(error, "Booking failed"), "error");
    } finally {
      setBookingLoading(false);
    }
  };

  const relatedServices = services
    .filter((s) => s._id !== selectedService?._id)
    .slice(0, 3);

  if (!providerId) {
    return (
      <Layout>
        <p className="text-center text-gray-600 mt-12">No provider selected.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      {ToastComponent}

      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Services
          </button>
          <h1 className="text-4xl font-bold text-gray-800">
            Service Provider Details
          </h1>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No services available
            </h3>
            <p className="text-gray-600">
              This provider hasn't added any services yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={service._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">
                      {service.emojiIcon || "🛠️"}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                        {service.category}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {service.name}
                      </h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />$
                      {service.price}
                    </span>
                    {service.rating && (
                      <span>Rating {service.rating.toFixed(1)}</span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedService(service)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <a
            href={`#/user/chat?receiver=${providerId}`}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <MessageCircle className="w-5 h-5" />
            Message Provider
          </a>
        </div>
      </div>

      <Modal
        isOpen={!!selectedService}
        onClose={() => {
          setSelectedService(null);
          setScheduledDate("");
        }}
        title="Book Service"
      >
        {selectedService && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {selectedService.name}
              </h3>
              <p className="text-gray-600 mt-2">
                {selectedService.description}
              </p>

              <div className="flex items-center gap-2 text-green-600 font-bold text-2xl mt-4">
                <DollarSign className="w-6 h-6" />
                <span>${selectedService.price}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date & Time
              </label>

              <input
                type="datetime-local"
                value={scheduledDate}
                min={getLocalISOString()}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {relatedServices.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-800 mb-3">
                  You might also like:
                </h4>

                <div className="space-y-2">
                  {relatedServices.map((rs) => (
                    <div
                      key={rs._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{rs.emojiIcon || "🛠️"}</span>
                        <div>
                          <p className="font-medium text-gray-800">{rs.name}</p>
                          <p className="text-sm text-green-600 font-bold">
                            ${rs.price}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedService(rs)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleBookService}
              disabled={bookingLoading || !scheduledDate}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {bookingLoading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
