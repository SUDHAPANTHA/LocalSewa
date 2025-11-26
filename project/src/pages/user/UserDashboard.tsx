import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../api/bookings";
import { Booking } from "../../types";
import { Calendar, CheckCircle, Clock, Shield, Search, MessageCircle, Sparkles, TrendingUp, Package } from "lucide-react";

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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -ml-32 -mb-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white">
                  Welcome, {user?.name}
                </h1>
              </div>
              <p className="text-white/80 text-lg max-w-2xl">
                Your personal service hub
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black rounded-2xl shadow-lg p-8 text-white transform hover:scale-105 transition-all duration-300 border border-purple-900/20">
              <div className="flex items-center justify-between mb-3">
                <Package className="w-8 h-8 text-purple-400" />
                <span className="text-5xl font-black">{stats.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Bookings</h3>
            </div>

            <div className="bg-purple-600 rounded-2xl shadow-lg p-8 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-purple-200" />
                <span className="text-5xl font-black">{stats.pending}</span>
              </div>
              <h3 className="text-sm font-medium text-purple-100 uppercase tracking-wider">Pending</h3>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <span className="text-5xl font-black text-black">{stats.completed}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Completed</h3>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="#/user/services"
              className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
                <Search className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors duration-300">
                Browse Services
              </h3>
              <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300">Discover and book services</p>
            </a>

            <a
              href="#/user/bookings"
              className="group bg-purple-600 text-white rounded-2xl shadow-lg p-8 hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all duration-300">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                My Bookings
              </h3>
              <p className="text-purple-100">{filteredBookings.length} active bookings</p>
            </a>

            <a
              href="#/user/chat"
              className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
                <MessageCircle className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors duration-300">Messages</h3>
              <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300">Chat with providers</p>
            </a>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white border-2 border-black rounded-3xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-black flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Recent Bookings
              </h2>
              <a href="#/user/bookings" className="text-purple-600 hover:text-black font-bold transition-colors">
                View All →
              </a>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-4 font-medium">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start exploring services to make your first booking</p>
                <a
                  href="#/user/services"
                  className="inline-block px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-purple-600 transition-all duration-300 shadow-lg"
                >
                  Browse Services
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.slice(0, 6).map((booking) => (
                  <div
                    key={booking._id}
                    className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-black text-black text-lg mb-2 group-hover:text-purple-600 transition-colors">
                          {typeof booking.service === "object"
                            ? booking.service.name
                            : "Service"}
                        </h3>
                        {getStatusBadge(booking)}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-black">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold">
                          {formatScheduledDate(booking.bookingDate, booking.bookingTime)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-bold">Provider:</span>{" "}
                        {typeof booking.provider === "object"
                          ? booking.provider.name
                          : "Provider"}
                      </p>
                      <div className="pt-3 border-t-2 border-gray-100">
                        <p className="text-xs text-gray-600">
                          Code: <span className="font-mono font-bold text-purple-600">{booking.confirmationCode || "Pending"}</span>
                        </p>
                      </div>
                    </div>
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
