import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { adminApi } from "../../api/admin";
import { bookingsApi } from "../../api/bookings";
import { ServiceProvider, Booking, User, Service } from "../../types";
import {
  Shield,
  Users,
  Calendar,
  Layers,
  User as UserIcon,
  Brain,
  Sparkles,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

export function AdminDashboard() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMessage(null);

    const withRetry = async <T,>(
      task: (signal: AbortSignal) => Promise<T>,
      retries = 1
    ): Promise<T> => {
      let attempt = 0;
      while (attempt <= retries) {
        try {
          return await task(controller.signal);
        } catch (err) {
          if (controller.signal.aborted || attempt === retries) throw err;
          attempt++;
        }
      }
      throw new Error("Retry attempts exceeded");
    };

    try {
      const [providersRes, bookingsRes, usersRes, servicesRes] =
        await Promise.all([
          withRetry((signal) =>
            adminApi.getAllProviders(undefined, { signal })
          ),
          withRetry((signal) => bookingsApi.adminGetAllBookings({ signal })),
          withRetry((signal) => adminApi.getAllUsers({ signal })),
          withRetry((signal) => adminApi.getAllServices({ signal })),
        ]);

      if (controller.signal.aborted) return;
      setProviders(providersRes.data.providers);
      setBookings(bookingsRes.data.bookings);
      setUsers(usersRes.data.users);
      setServices(servicesRes.data.services);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Failed to fetch admin dashboard data", error);
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to reach the admin services. Please ensure the backend is running and try again."
        )
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const pendingProviders = providers.filter((p) => !p.isApproved);
  const pendingBookings = bookings.filter(
    (b) => b.isAdminApproved === undefined || b.isAdminApproved === null
  );

  const algorithms = [
    {
      title: "Smart Recommendation Engine",
      description:
        "Analyzes booking trends and provider performance to recommend top vendors for users in each location.",
      icon: Sparkles,
      badge: "Recommendation",
    },
    {
      title: "AI Demand Forecasting",
      description:
        "Predictive time-series model anticipating spikes in service requests for better planning.",
      icon: Brain,
      badge: "AI",
    },
    {
      title: "AI Risk & Anomaly Detection",
      description:
        "Monitors bookings for suspicious activity, flagging rapid cancellations or duplicate requests.",
      icon: Shield,
      badge: "AI",
    },
  ];

  if (loading && !errorMessage) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-20 text-center">
          <div className="inline-block px-6 py-4 bg-purple-600 text-white rounded-xl shadow-lg font-bold animate-pulse">
            Loading admin dashboard...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ===================== HEADER ======================= */}
      <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 text-white py-12 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black">Admin Dashboard</h1>
          <p className="text-white/80 mt-2">
            Manage users, providers, bookings & platform intelligence
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-300 p-5 rounded-xl text-red-700 shadow">
            <p className="font-bold">{errorMessage}</p>
            <button
              onClick={fetchData}
              className="mt-3 bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* ===================== STATS ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-xl transition">
            <UserIcon className="w-10 h-10 text-purple-600 mb-3" />
            <p className="text-gray-500">Total Users</p>
            <p className="text-3xl font-black">{users.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-xl transition">
            <Users className="w-10 h-10 text-green-600 mb-3" />
            <p className="text-gray-500">Service Providers</p>
            <p className="text-3xl font-black">{providers.length}</p>
            {pendingProviders.length > 0 && (
              <p className="text-yellow-600 font-semibold mt-1">
                {pendingProviders.length} pending
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-xl transition">
            <Layers className="w-10 h-10 text-pink-600 mb-3" />
            <p className="text-gray-500">Services</p>
            <p className="text-3xl font-black">{services.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-xl transition">
            <Calendar className="w-10 h-10 text-blue-600 mb-3" />
            <p className="text-gray-500">Bookings</p>
            <p className="text-3xl font-black">{bookings.length}</p>
            {pendingBookings.length > 0 && (
              <p className="text-yellow-600 font-semibold mt-1">
                {pendingBookings.length} pending
              </p>
            )}
          </div>
        </div>

        {/* ===================== QUICK ACTIONS ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <a
            href="#/admin/providers"
            className="group rounded-2xl p-6 shadow-lg bg-gradient-to-br from-purple-600 to-pink-500 text-white hover:-translate-y-2 transition-all"
          >
            <Users className="w-10 h-10 text-white mb-3" />
            <h3 className="text-xl font-bold">Manage Providers</h3>
            <p className="text-white/90 text-sm mt-1">
              Approve or reject providers
            </p>
          </a>

          <a
            href="#/admin/bookings"
            className="group rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:-translate-y-2 transition-all"
          >
            <Calendar className="w-10 h-10 text-white mb-3" />
            <h3 className="text-xl font-bold">Manage Bookings</h3>
            <p className="text-white/90 text-sm mt-1">
              Review & manage bookings
            </p>
          </a>

          <a
            href="#/admin/users"
            className="group rounded-2xl p-6 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:-translate-y-2 transition-all"
          >
            <UserIcon className="w-10 h-10 text-white mb-3" />
            <h3 className="text-xl font-bold">Manage Users</h3>
            <p className="text-white/90 text-sm mt-1">View platform users</p>
          </a>

          <a
            href="#/admin/services"
            className="group rounded-2xl p-6 shadow-lg bg-gradient-to-br from-pink-500 to-red-500 text-white hover:-translate-y-2 transition-all"
          >
            <Layers className="w-10 h-10 text-white mb-3" />
            <h3 className="text-xl font-bold">Manage Services</h3>
            <p className="text-white/90 text-sm mt-1">Approve services</p>
          </a>

          <a
            href="#/admin/complaints"
            className="group rounded-2xl p-6 shadow-lg bg-gradient-to-br from-orange-500 to-rose-600 text-white hover:-translate-y-2 transition-all"
          >
            <Shield className="w-10 h-10 text-white mb-3" />
            <h3 className="text-xl font-bold">Complaints</h3>
            <p className="text-white/90 text-sm mt-1">Handle complaints</p>
          </a>
        </div>

        {/* ===================== PLATFORM INTELLIGENCE ======================= */}
        <div>
          <h2 className="text-3xl font-bold mb-4">Platform Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {algorithms.map(({ title, description, icon: Icon, badge }) => (
              <div
                key={title}
                className="rounded-2xl p-6 shadow bg-white border hover:-translate-y-2 hover:shadow-xl transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white">
                    {badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
