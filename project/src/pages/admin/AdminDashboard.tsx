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
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
            <p>{errorMessage}</p>
            <button
              onClick={fetchData}
              className="mt-2 inline-flex items-center gap-1 text-rose-700 underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <Shield className="w-16 h-16" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-red-100">Manage platform operations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <UserIcon className="w-12 h-12 text-blue-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-800">{users.length}</h3>
            <p className="text-gray-600">Total Users</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <Users className="w-12 h-12 text-indigo-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-800">
              {providers.length}
            </h3>
            <p className="text-gray-600">Total Providers</p>
            <p className="text-xs text-gray-400 mt-1">
              {pendingProviders.length} awaiting approval
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <Layers className="w-12 h-12 text-purple-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-800">
              {services.length}
            </h3>
            <p className="text-gray-600">Active Services</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <Calendar className="w-12 h-12 text-green-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-800">
              {bookings.length}
            </h3>
            <p className="text-gray-600">Total Bookings</p>
            <p className="text-xs text-gray-400 mt-1">
              {pendingBookings.length} pending review
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <a
            href="#/admin/providers"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1 no-underline"
          >
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Manage Providers
            </h3>
            <p className="text-gray-600">Approve or reject service providers</p>
            {pendingProviders.length > 0 && (
              <p className="mt-2 text-yellow-600 font-medium">
                {pendingProviders.length} pending approval
              </p>
            )}
          </a>

          <a
            href="#/admin/bookings"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1 no-underline"
          >
            <Calendar className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Manage Bookings
            </h3>
            <p className="text-gray-600">Review and manage all bookings</p>
            {pendingBookings.length > 0 && (
              <p className="mt-2 text-yellow-600 font-medium">
                {pendingBookings.length} pending review
              </p>
            )}
          </a>

          <a
            href="#/admin/users"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1 no-underline"
          >
            <UserIcon className="w-12 h-12 text-sky-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Manage Users
            </h3>
            <p className="text-gray-600">Review and remove platform users</p>
          </a>

          <a
            href="#/admin/services"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1 no-underline"
          >
            <Layers className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              View Services
            </h3>
            <p className="text-gray-600">
              Audit vendor services and take action
            </p>
          </a>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Platform Intelligence
          </h2>
          <p className="text-gray-600 mb-6">
            Key algorithms running behind the scenes to keep LocalSewa reliable
            and proactive.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {algorithms.map(({ title, description, icon: Icon, badge }) => (
              <div
                key={title}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-10 h-10 text-indigo-600" />
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">
                    {badge}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
