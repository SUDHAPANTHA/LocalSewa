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
  Plus,
  Upload,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";
import { useToast } from "../../components/Toast";
import { motion, AnimatePresence } from "framer-motion";

export function VendorDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerProfile, setProviderProfile] =
    useState<ServiceProvider | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState(0);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (!user?.id) return;
    fetchData(user.id);
  }, [user?.id]);

  const fetchData = async (providerId: string) => {
    setLoading(true);
    try {
      const [servicesRes, bookingsRes, profileRes] = await Promise.all([
        servicesApi.getProviderServices(providerId),
        bookingsApi.getProviderBookings(providerId),
        providerApi.getProfile(providerId),
      ]);
      setServices(servicesRes.data.services);
      setBookings(bookingsRes.data.bookings);
      setProviderProfile(profileRes.data.provider);
    } catch (error) {
      console.error("Failed to fetch data", error);
      showToast(getApiErrorMessage(error, "Failed to load dashboard"), "error");
    } finally {
      setLoading(false);
    }
  };

  const pendingBookings = bookings.filter(
    (b) => b.isProviderApproved === null || b.isProviderApproved === undefined
  );

  const cvStatusMeta: Record<
    string,
    { label: string; badge: string; helper: string }
  > = {
    approved: {
      label: "CV approved",
      badge: "bg-green-100 text-green-700",
      helper: "You can publish services and receive bookings.",
    },
    pending: {
      label: "Pending review",
      badge: "bg-yellow-100 text-yellow-700",
      helper: "Admin will review your CV shortly.",
    },
    rejected: {
      label: "Needs revision",
      badge: "bg-red-100 text-red-700",
      helper: "Upload a stronger CV to get approved.",
    },
    not_provided: {
      label: "No CV on file",
      badge: "bg-gray-200 text-gray-700",
      helper: "Upload a PDF CV to start the approval process.",
    },
  };

  const currentCvStatus = providerProfile?.cvStatus || "not_provided";
  const cvBadge = cvStatusMeta[currentCvStatus] || cvStatusMeta.not_provided;

  const handleCvUpload = async () => {
    if (!user?.id) return;
    if (!selectedCvFile) {
      showToast("Attach a PDF CV first", "error");
      return;
    }

    setCvUploading(true);
    setCvUploadProgress(6);
    const progressInterval = setInterval(() => {
      setCvUploadProgress((p) => Math.min(95, p + Math.random() * 12));
    }, 350);

    try {
      await providerApi.uploadCv(user.id, selectedCvFile);
      setCvUploadProgress(100);
      clearInterval(progressInterval);
      showToast("CV uploaded. Awaiting compliance review.", "success");
      setSelectedCvFile(null);
      fetchData(user.id);
    } catch (error) {
      clearInterval(progressInterval);
      setCvUploadProgress(0);
      showToast(getApiErrorMessage(error, "Failed to upload CV"), "error");
    } finally {
      setTimeout(() => {
        setCvUploading(false);
        setCvUploadProgress(0);
      }, 700);
    }
  };

  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type !== "application/pdf") {
      showToast("Only PDF CV files are supported", "error");
      event.target.value = "";
      return;
    }
    setSelectedCvFile(file || null);
  };

  const handleDeleteCv = async () => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to delete your CV? This cannot be undone.")) return;

    try {
      await providerApi.deleteCv(user.id);
      showToast("CV deleted successfully", "success");
      fetchData(user.id);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to delete CV"), "error");
    }
  };

  if (loading) {
    return (
      <Layout>
        {ToastComponent}
        <div className="max-w-4xl mx-auto py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-6 py-4 bg-blue-500 text-white rounded-xl shadow-lg font-bold"
          >
            Loading provider dashboard...
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 text-white py-12 px-6 rounded-2xl shadow-md mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-500 mt-1">Your dashboard overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              {services.length}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Total Services</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              {bookings.length}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Total Bookings</p>
            <p className="text-sm text-yellow-600 mt-1">
              {pendingBookings.length} pending
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              {providerProfile?.smartScore
                ? (providerProfile.smartScore * 100).toFixed(0)
                : "0"}
              %
            </h3>
            <p className="text-gray-500 text-sm mt-1">Smart Score</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            href="#/vendor/services"
            className="group relative flex flex-col justify-between rounded-2xl p-6 shadow-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">
              S
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                <Briefcase className="w-6 h-6 group-hover:text-purple-600 text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black">{"My Services"}</h3>
            </div>
            <p className="text-sm">{"Manage your services"}</p>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.1,
            }}
            href="#/vendor/bookings"
            className="group relative flex flex-col justify-between rounded-2xl p-6 shadow-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">
              S
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                <Calendar className="w-6 h-6 group-hover:text-blue-600 text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black">{"Bookings"}</h3>
            </div>
            <p className="text-sm">{"Manage customer bookings"}</p>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            href="#/vendor/chat"
            className="group relative flex flex-col justify-between rounded-2xl p-6 shadow-lg bg-gradient-to-r from-green-400 via-teal-500 to-cyan-500 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">
              S
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                <MessageCircle className="w-6 h-6 group-hover:text-green-600 text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black">{"Messages"}</h3>
            </div>
            <p className="text-sm">{"Chat with customers"}</p>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.3,
            }}
            href="#/vendor/complaints"
            className="group relative flex flex-col justify-between rounded-2xl p-6 shadow-lg bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">
              S
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white">
                <AlertCircle className="w-6 h-6 group-hover:text-red-600 text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-black">{"Complaints"}</h3>
            </div>
            <p className="text-sm">{"View complaints"}</p>
          </motion.a>
        </div>

        {/* CV Upload */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            CV & Compliance
          </h3>
          <p className="text-gray-500 text-sm mb-4">{cvBadge.helper}</p>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-600">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>{selectedCvFile?.name || "Attach PDF CV"}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleCvFileChange}
            />
          </label>
          <button
            onClick={handleCvUpload}
            disabled={cvUploading || !selectedCvFile}
            className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {cvUploading ? "Uploading..." : "Submit CV"}
          </button>

          {cvUploading && (
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${cvUploadProgress}%` }}
              />
            </div>
          )}

          {providerProfile?.cvReviewerNote && (
            <p className="text-sm text-red-600 mt-2">
              Reviewer note: {providerProfile.cvReviewerNote}
            </p>
          )}

          {/* View/Delete CV if uploaded */}
          {providerProfile?.cvFile?.url && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Current CV: {providerProfile.cvFile.originalName || "CV.pdf"}
              </p>
              <div className="flex gap-3">
                <a
                  href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${providerProfile.cvFile.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View CV
                </a>
                <button
                  onClick={handleDeleteCv}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete CV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Recent Bookings
          </h3>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No bookings yet — share your services to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 6).map((b) => (
                <div
                  key={(b as any).id}
                  className="flex justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {(b as any).customerName || "Unknown"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {(b as any).serviceName || "—"}
                    </p>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {(b as any).date || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Small ActionCard
function ActionCard({ href, title, desc, Icon }: any) {
  return (
    <a
      href={href}
      className="flex flex-col items-start p-6 bg-white rounded-xl shadow border border-gray-200 hover:shadow-lg transition"
    >
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      <p className="text-gray-500 text-sm">{desc}</p>
    </a>
  );
}
