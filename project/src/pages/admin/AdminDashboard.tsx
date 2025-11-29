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
    if (abortRef.current) {
      abortRef.current.abort();
    }
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
          if (controller.signal.aborted || attempt === retries) {
            throw err;
          }
          attempt += 1;
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
      if (!controller.signal.aborted) {
        setLoading(false);
      }
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
        "Predictive time-series model that anticipates spikes in service requests so you can staff and promote accordingly.",
      icon: Brain,
      badge: "AI",
    },
    {
      title: "AI Risk & Anomaly Detection",
      description:
        "Monitors bookings for suspicious activity, flagging rapid cancellations or duplicate requests for manual review.",
      icon: Shield,
      badge: "AI",
    },
  ];

  if (loading && !errorMessage) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto animate-fade-in text-center py-20">
          <p className="text-gray-600">Loading admin overview...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in my-12 px-4">
        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-white px-6 py-4 text-black shadow">
            <p className="font-bold">{errorMessage}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-500 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero header (large purple->pink gradient) */}
        <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 p-10">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white mb-2">
                  Admin Control
                </h1>
                <p className="text-pink-100 text-lg">
                  Platform management center
                </p>
              </div>
            </div>
          </div>

          {/* hero bubbles */}
          <div className="pointer-events-none">
            <div className="absolute -left-16 -top-12 w-56 h-56 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -right-20 -bottom-16 w-72 h-72 bg-purple-900/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* KPI section - each card its own unique section with bg + bubbles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <section className="relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-white to-pink-50 overflow-hidden">
            <div className="absolute -left-8 -top-6 w-36 h-36 bg-pink-200/40 rounded-full blur-2xl"></div>
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-pink-400/10 rounded-full blur-3xl"></div>

            <UserIcon className="w-10 h-10 text-pink-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">
              {users.length}
            </h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">
              Total Users
            </p>
          </section>

          {/* Providers */}
          <section className="relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 overflow-hidden">
            <div className="absolute -left-10 -bottom-6 w-44 h-44 bg-purple-200/30 rounded-full blur-3xl"></div>
            <div className="absolute -right-10 -top-8 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl"></div>

            <Users className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-4xl font-black mb-2">{providers.length}</h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">
              Total Providers
            </p>
            <p className="text-xs text-purple-600 mt-2 font-semibold">
              {pendingProviders.length} pending
            </p>
          </section>

          {/* Services */}
          <section className="relative rounded-2xl p-6 shadow-lg text-white bg-gradient-to-br from-purple-600 to-pink-500 overflow-hidden">
            <div className="absolute -left-14 -top-8 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -right-12 -bottom-6 w-40 h-40 bg-purple-900/20 rounded-full blur-3xl"></div>

            <Layers className="w-10 h-10 text-white mb-4" />
            <h3 className="text-4xl font-black mb-2">{services.length}</h3>
            <p className="text-pink-100 text-sm uppercase tracking-wider">
              Active Services
            </p>
          </section>

          {/* Bookings */}
          <section className="relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-white to-purple-50 overflow-hidden">
            <div className="absolute -left-8 -bottom-10 w-44 h-44 bg-purple-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -right-6 -top-8 w-36 h-36 bg-pink-200/20 rounded-full blur-2xl"></div>

            <Calendar className="w-10 h-10 text-pink-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">
              {bookings.length}
            </h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">
              Total Bookings
            </p>
            <p className="text-xs text-pink-600 mt-2 font-semibold">
              {pendingBookings.length} pending
            </p>
          </section>
        </div>

        {/* Action tiles - each tile styled uniquely with subtle bubbles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <a
            href="#/admin/providers"
            className="relative rounded-2xl p-6 shadow-lg no-underline bg-white hover:bg-pink-50 transition transform hover:-translate-y-1"
          >
            <div className="absolute -left-10 -top-6 w-32 h-32 bg-pink-100/40 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-black mb-2">Manage Providers</h3>
            <p className="text-sm text-gray-600">Approve or reject providers</p>
            {pendingProviders.length > 0 && (
              <p className="mt-3 text-pink-600 font-bold text-sm">
                {pendingProviders.length} pending
              </p>
            )}
          </a>

          <a
            href="#/admin/bookings"
            className="relative rounded-2xl p-6 shadow-lg no-underline bg-gradient-to-br from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 transform hover:-translate-y-1 transition"
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black mb-2">Manage Bookings</h3>
            <p className="text-sm">Review and manage bookings</p>
            {pendingBookings.length > 0 && (
              <p className="mt-3 text-white font-bold text-sm">
                {pendingBookings.length} pending
              </p>
            )}
          </a>

          <a
            href="#/admin/users"
            className="relative rounded-2xl p-6 shadow-lg no-underline bg-white hover:bg-purple-50 transition transform hover:-translate-y-1"
          >
            <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-purple-100/30 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-black mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">Review platform users</p>
          </a>

          <a
            href="#/admin/services"
            className="relative rounded-2xl p-6 shadow-lg no-underline bg-white hover:bg-pink-50 transition transform hover:-translate-y-1"
          >
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-pink-100/30 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-black mb-2">Manage Services</h3>
            <p className="text-sm text-gray-600">Approve or reject services</p>
          </a>

          <a
            href="#/admin/complaints"
            className="relative rounded-2xl p-6 shadow-lg no-underline bg-white hover:bg-purple-50 transition transform hover:-translate-y-1"
          >
            <div className="absolute -left-10 -top-6 w-36 h-36 bg-purple-200/30 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-black mb-2">Complaints</h3>
            <p className="text-sm text-gray-600">Manage complaints</p>
          </a>
        </div>

        {/* Platform Intelligence */}
        <div className="mt-10">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-black mb-2">
              Platform Intelligence
            </h2>
            <p className="text-gray-600">AI algorithms powering LocalSewa</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {algorithms.map(({ title, description, icon: Icon, badge }) => (
              <div
                key={title}
                className="relative rounded-2xl p-6 shadow-lg bg-white overflow-hidden"
              >
                <div className="absolute -left-8 -top-6 w-32 h-32 bg-pink-100/30 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-pink-600" />
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-pink-600 text-white">
                    {badge}
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mb-3">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
