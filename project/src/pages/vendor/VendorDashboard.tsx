import React, { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { servicesApi } from "../../api/services";
import { bookingsApi } from "../../api/bookings";
import { providerApi } from "../../api/providers";
import { Service, Booking, ServiceProvider } from "../../types";

import {
  Briefcase,
  Calendar,
  MessageCircle,
  AlertCircle,
  TrendingUp,
  Upload,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";

export function VendorDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providerProfile, setProviderProfile] =
    useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch data */
  useEffect(() => {
    if (!user?.id) return;
    fetchData(user.id);
  }, [user?.id]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [s, b, p] = await Promise.all([
        servicesApi.getProviderServices(id),
        bookingsApi.getProviderBookings(id),
        providerApi.getProfile(id),
      ]);
      setServices(s.data.services || []);
      setBookings(b.data.bookings || []);
      setProviderProfile(p.data.provider || null);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalServices: services.length,
    totalBookings: bookings.length,
    smartScore: providerProfile?.smartScore
      ? (providerProfile.smartScore * 100).toFixed(0)
      : 0,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 text-white py-12 px-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-white/80 mt-2">Your vendor performance center</p>
          </div>
        </div>

        {/* STATS */}
        <div className="max-w-7xl mx-auto px-4 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Services */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Services</p>
                  <p className="text-3xl font-bold">{stats.totalServices}</p>
                </div>
                <Briefcase className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            {/* All bookings */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {/* Smart score */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Smart Score</p>
                  <p className="text-3xl font-bold">{stats.smartScore}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="max-w-7xl mx-auto px-4 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* My Services */}
            <a
              href="#/vendor/services"
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl
              hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <Briefcase className="w-10 h-10 text-white mb-3 group-hover:scale-110 transition-all" />
              <h3 className="text-lg font-semibold">My Services</h3>
              <p className="text-white/90 text-sm mt-1">
                Manage and publish services
              </p>
            </a>

            {/* Bookings */}
            <a
              href="#/vendor/bookings"
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl
              hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <Calendar className="w-10 h-10 text-white mb-3 group-hover:scale-110 transition-all" />
              <h3 className="text-lg font-semibold">Bookings</h3>
              <p className="text-white/90 text-sm mt-1">Customer requests</p>
            </a>

            {/* Messages */}
            <a
              href="#/vendor/chat"
              className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-xl
              hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <MessageCircle className="w-10 h-10 text-white mb-3 group-hover:scale-110 transition-all" />
              <h3 className="text-lg font-semibold">Messages</h3>
              <p className="text-white/90 text-sm mt-1">Chat with customers</p>
            </a>

            {/* Complaints */}
            <a
              href="#/vendor/complaints"
              className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl
              hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <AlertCircle className="w-10 h-10 text-white mb-3 group-hover:scale-110 transition-all" />
              <h3 className="text-lg font-semibold">Complaints</h3>
              <p className="text-white/90 text-sm mt-1">View & respond</p>
            </a>
          </div>
        </div>

        {/* CV / COMPLIANCE CARD */}
        <div className="max-w-7xl mx-auto px-4 mt-12">
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-purple-600" />
              CV & Compliance
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Upload your CV to increase trust and unlock more visibility.
            </p>

            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-600">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>Upload CV (PDF)</span>
              <input type="file" className="hidden" />
            </label>

            {providerProfile?.cvStatus && (
              <p className="text-sm text-gray-500 mt-3">
                Status:{" "}
                <strong className="text-purple-600">
                  {providerProfile.cvStatus}
                </strong>
              </p>
            )}
          </div>
        </div>

        {/* RECENT BOOKINGS */}
        <div className="max-w-7xl mx-auto px-4 mt-12 pb-10">
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Recent Bookings
              </h2>
              <a
                href="#/vendor/bookings"
                className="text-purple-600 font-medium"
              >
                View All →
              </a>
            </div>

            {loading ? (
              <p className="py-10 text-center text-gray-600">Loading...</p>
            ) : bookings.length === 0 ? (
              <p className="py-10 text-center text-gray-600">
                No recent bookings.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.slice(0, 6).map((b: any) => (
                  <div
                    key={b._id}
                    className="bg-white border rounded-xl p-5 shadow-sm hover:border-purple-600 transition"
                  >
                    <h3 className="font-semibold text-lg">
                      {b.serviceName || "Service"}
                    </h3>

                    <p className="text-sm text-gray-700 mt-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      {b.date || "—"}
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-semibold">Customer:</span>{" "}
                      {b.customerName || "Unknown"}
                    </p>

                    <p className="text-xs text-gray-500 mt-3">
                      Status:{" "}
                      <span className="font-semibold text-purple-600">
                        {b.status || "Pending"}
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
