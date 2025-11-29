import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../api/bookings";
import { Booking } from "../../types";
import {
  Calendar,
  CheckCircle,
  Clock,
  Shield,
  Search,
  MessageCircle,
  Package,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

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
      const responseData = response.data as any;
      const bookings =
        responseData?.data?.bookings || responseData?.bookings || [];
      setBookings(bookings);
    } catch (error: any) {
      console.error("Failed to fetch bookings", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduledDate = (date?: string | null, time?: string | null) => {
    if (!date || !time) return "Date not set";
    const normalizedTime = time.slice(0, 5);
    const d = new Date(`${date}T${normalizedTime}`);
    if (isNaN(d.getTime())) return "Invalid date";

    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    scheduled: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const getStatusBadge = (booking: Booking) => {
    const color =
      (booking.status && statusColors[booking.status]) ||
      statusColors["pending"];
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
        {booking.status || "Pending"}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => b.status !== "cancelled");

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* ===================== HERO HEADER ======================= */}
        <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 text-white py-12 px-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-white/80 mt-2">
              Your personal service dashboard
            </p>
          </div>
        </div>

        {/* ===================== STATS ======================= */}
        <div className="max-w-7xl mx-auto px-4 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ===================== QUICK ACTIONS ======================= */}
        <div className="max-w-7xl mx-auto px-4 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 🟣 Browse Services */}
            <a
              href="#/user/services"
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl
      hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <Search className="w-10 h-10 text-white mb-3 transform group-hover:scale-110 transition-all duration-300" />
              <h3 className="text-lg font-semibold">Browse Services</h3>
              <p className="text-white/90 text-sm mt-1">
                Discover and book services
              </p>
            </a>

            {/* 🟢 My Bookings */}
            <a
              href="#/user/bookings"
              className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl
      hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <Calendar className="w-10 h-10 text-white mb-3 transform group-hover:scale-110 transition-all duration-300" />
              <h3 className="text-lg font-semibold">My Bookings</h3>
              <p className="text-white/90 text-sm mt-1">
                {filteredBookings.length} active bookings
              </p>
            </a>

            {/* 🔵 Messages */}
            <a
              href="#/user/chat"
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl
      hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <MessageCircle className="w-10 h-10 text-white mb-3 transform group-hover:scale-110 transition-all duration-300" />
              <h3 className="text-lg font-semibold">Messages</h3>
              <p className="text-white/90 text-sm mt-1">Chat with providers</p>
            </a>

            {/* 🔴 Complaints */}
            <a
              href="#/user/complaints"
              className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl
      hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <AlertCircle className="w-10 h-10 text-white mb-3 transform group-hover:scale-110 transition-all duration-300" />
              <h3 className="text-lg font-semibold">Complaints</h3>
              <p className="text-white/90 text-sm mt-1">Submit complaints</p>
            </a>
          </div>
        </div>

        {/* ===================== RECENT BOOKINGS ======================= */}
        <div className="max-w-7xl mx-auto px-4 mt-12 pb-10">
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Recent Bookings
              </h2>
              <a href="#/user/bookings" className="text-purple-600 font-medium">
                View All →
              </a>
            </div>

            {loading ? (
              <p className="py-10 text-center text-gray-600">Loading...</p>
            ) : filteredBookings.length === 0 ? (
              <p className="py-10 text-center text-gray-600">
                No recent bookings
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.slice(0, 6).map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white border rounded-xl p-5 shadow-sm hover:border-purple-600 transition"
                  >
                    <h3 className="font-semibold text-lg">
                      {typeof booking.service === "object"
                        ? booking.service.name
                        : "Service"}
                    </h3>

                    <div className="mt-2">{getStatusBadge(booking)}</div>

                    <p className="text-sm text-gray-700 mt-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      {formatScheduledDate(
                        booking.bookingDate,
                        booking.bookingTime
                      )}
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-semibold">Provider:</span>{" "}
                      {typeof booking.provider === "object"
                        ? booking.provider.name
                        : "Provider"}
                    </p>

                    <p className="text-xs text-gray-500 mt-3">
                      Code:{" "}
                      <span className="font-mono font-semibold text-purple-600">
                        {booking.confirmationCode || "Pending"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
