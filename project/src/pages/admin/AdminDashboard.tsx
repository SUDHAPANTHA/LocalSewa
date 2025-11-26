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
      <div className="max-w-6xl mx-auto animate-fade-in">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border-2 border-black bg-white px-6 py-4 text-black">
            <p className="font-bold">{errorMessage}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-purple-600 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        )}
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2">Admin Control</h1>
              <p className="text-purple-100 text-lg">Platform management center</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black">
            <UserIcon className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">{users.length}</h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">Total Users</p>
          </div>

          <div className="bg-black rounded-2xl shadow-lg p-8 text-white border border-purple-900/20">
            <Users className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-4xl font-black mb-2">
              {providers.length}
            </h3>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Total Providers</p>
            <p className="text-xs text-purple-400 mt-2 font-semibold">
              {pendingProviders.length} pending
            </p>
          </div>

          <div className="bg-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <Layers className="w-10 h-10 text-purple-200 mb-4" />
            <h3 className="text-4xl font-black mb-2">
              {services.length}
            </h3>
            <p className="text-purple-100 text-sm uppercase tracking-wider">Active Services</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black">
            <Calendar className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">
              {bookings.length}
            </h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">Total Bookings</p>
            <p className="text-xs text-purple-600 mt-2 font-semibold">
              {pendingBookings.length} pending
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <a
            href="#/admin/providers"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <Users className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">
              Manage Providers
            </h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">Approve or reject providers</p>
            {pendingProviders.length > 0 && (
              <p className="mt-3 text-purple-600 group-hover:text-purple-300 font-bold text-sm">
                {pendingProviders.length} pending
              </p>
            )}
          </a>

          <a
            href="#/admin/bookings"
            className="bg-purple-600 text-white rounded-2xl shadow-lg p-8 hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black mb-2">
              Manage Bookings
            </h3>
            <p className="text-purple-100 text-sm">Review and manage bookings</p>
            {pendingBookings.length > 0 && (
              <p className="mt-3 text-white font-bold text-sm">
                {pendingBookings.length} pending
              </p>
            )}
          </a>

          <a
            href="#/admin/users"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <UserIcon className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">
              Manage Users
            </h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">Review platform users</p>
          </a>

          <a
            href="#/admin/services"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <Layers className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">
              View Services
            </h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">
              Audit vendor services
            </p>
          </a>
        </div>

        <div className="mt-10">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-black mb-2">
              Platform Intelligence
            </h2>
            <p className="text-gray-600">
              AI algorithms powering LocalSewa
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {algorithms.map(({ title, description, icon: Icon, badge }) => (
              <div
                key={title}
                className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-purple-600 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-black text-white">
                    {badge}
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mb-3">
                  {title}
                </h3>
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
