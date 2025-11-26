import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../api/bookings";
import { Booking } from "../../types";
import { Calendar, CheckCircle, Clock, Shield } from "lucide-react";

export function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await bookingsApi.getUserBookings(user.id);
      // Backend returns: { success: true, data: { bookings: [...] }, message: "..." }
      const responseData = response.data as any;
      const bookings = responseData?.data?.bookings || responseData?.bookings || [];
      setBookings(bookings);
    } catch (error: any) {
      console.error("Failed to fetch bookings", error);
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error("Request timed out");
      }
      
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduledDate = (date?: string | null, time?: string | null) => {
    if (!date || !time) return "Date not set";
    const normalizedTime = time.slice(0, 5);
    const combined = `${date}T${normalizedTime}`;
    const d = new Date(combined);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const statusBadgeConfig = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-100 text-blue-700",
      icon: CheckCircle,
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-green-100 text-green-800",
      icon: Shield,
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-100 text-rose-700",
      icon: Clock,
    },
  } as const;

  const getStatusBadge = (booking: Booking) => {
    if (booking.status && statusBadgeConfig[booking.status]) {
      const cfg = statusBadgeConfig[booking.status];
      const Icon = cfg.icon;
      return (
        <span
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${cfg.className}`}
        >
          <Icon className="w-4 h-4" /> {cfg.label}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold shadow-sm">
        <Clock className="w-4 h-4" /> Pending
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => b.status !== "cancelled");

  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in px-4 py-6">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your bookings and explore available services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="#/user/services"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Browse Services
            </h3>
            <p className="text-gray-600">Explore available services</p>
          </a>

          <a
            href="#/user/bookings"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              My Bookings
            </h3>
            <p className="text-gray-600">
              {filteredBookings.length} active bookings
            </p>
          </a>

          <a
            href="#/user/chat"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">Messages</h3>
            <p className="text-gray-600">Chat with service providers</p>
          </a>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Recent Bookings
          </h2>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-gray-600">
              No recent bookings. Browse services to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.slice(0, 6).map((booking) => (
                <div
                  key={booking._id}
                  className="relative border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition bg-gradient-to-tr from-white to-slate-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {typeof booking.service === "object"
                        ? booking.service.name
                        : "Service"}
                    </h3>
                    {getStatusBadge(booking)}
                  </div>
                  <p className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    {formatScheduledDate(
                      booking.bookingDate,
                      booking.bookingTime
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Provider:{" "}
                    {typeof booking.provider === "object"
                      ? booking.provider.name
                      : "Provider"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Code: {booking.confirmationCode || "Pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
