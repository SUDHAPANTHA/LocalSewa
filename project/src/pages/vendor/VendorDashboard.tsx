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
  FileText,
  Eye,
  Trash2,
} from "lucide-react";

import { useToast } from "../../components/Toast";
import { getApiErrorMessage } from "../../utils/errors";

export function VendorDashboard() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providerProfile, setProviderProfile] =
    useState<ServiceProvider | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState(0);

  /** Fetch initial data */
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
      setServices(servicesRes.data.services || []);
      setBookings(bookingsRes.data.bookings || []);
      setProviderProfile(profileRes.data.provider || null);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to load dashboard"), "error");
    } finally {
      setLoading(false);
    }
  };

  /** CV File Change */
  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type !== "application/pdf") {
      showToast("Only PDF files are allowed", "error");
      return;
    }
    setSelectedCvFile(file || null);
  };

  /** Submit CV */
  const handleCvUpload = async () => {
    if (!selectedCvFile || !user?.id) {
      showToast("Select a PDF CV first", "error");
      return;
    }

    setCvUploading(true);
    setCvUploadProgress(5);

    const interval = setInterval(() => {
      setCvUploadProgress((p) => Math.min(95, p + Math.random() * 10));
    }, 300);

    try {
      await providerApi.uploadCv(user.id, selectedCvFile);
      clearInterval(interval);
      setCvUploadProgress(100);
      showToast("CV uploaded successfully", "success");

      setSelectedCvFile(null);
      fetchData(user.id);
    } catch (error) {
      clearInterval(interval);
      showToast("Failed to upload CV", "error");
      setCvUploadProgress(0);
    } finally {
      setTimeout(() => {
        setCvUploading(false);
        setCvUploadProgress(0);
      }, 800);
    }
  };

  /** Delete CV */
  const deleteCv = async (id: string) => {
    try {
      await providerApi.deleteCv(id);
      showToast("CV deleted", "success");
      fetchData(id);
    } catch (err) {
      showToast("Failed to delete CV", "error");
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
      {ToastComponent}

      <div className="min-h-screen bg-gray-100">
        {/* ===================== HEADER ======================= */}
        <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 text-white py-12 px-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-white/80 mt-2">Your vendor performance center</p>
          </div>
        </div>

        {/* ===================== STATS ======================= */}
        <div className="max-w-7xl mx-auto px-4 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6 border">
              <p className="text-gray-500 text-sm">Total Services</p>
              <p className="text-3xl font-bold">{stats.totalServices}</p>
              <Briefcase className="w-10 h-10 text-purple-600 float-right" />
            </div>

            <div className="bg-white rounded-xl shadow p-6 border">
              <p className="text-gray-500 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold">{stats.totalBookings}</p>
              <Calendar className="w-10 h-10 text-blue-600 float-right" />
            </div>

            <div className="bg-white rounded-xl shadow p-6 border">
              <p className="text-gray-500 text-sm">Smart Score</p>
              <p className="text-3xl font-bold">{stats.smartScore}%</p>
              <CheckCircle className="w-10 h-10 text-green-600 float-right" />
            </div>
          </div>
        </div>

        {/* ===================== QUICK ACTIONS ======================= */}
        <div className="max-w-7xl mx-auto px-4 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Services */}
            <a
              href="#/vendor/services"
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <Briefcase className="w-10 h-10 text-white mb-3" />
              <h3 className="text-lg font-semibold">My Services</h3>
              <p className="text-white/90 text-sm mt-1">
                Manage and publish services
              </p>
            </a>

            {/* Bookings */}
            <a
              href="#/vendor/bookings"
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <Calendar className="w-10 h-10 text-white mb-3" />
              <h3 className="text-lg font-semibold">Bookings</h3>
              <p className="text-white/90 text-sm mt-1">Customer requests</p>
            </a>

            {/* Messages */}
            <a
              href="#/vendor/chat"
              className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <MessageCircle className="w-10 h-10 text-white mb-3" />
              <h3 className="text-lg font-semibold">Messages</h3>
              <p className="text-white/90 text-sm mt-1">Chat with customers</p>
            </a>

            {/* Complaints */}
            <a
              href="#/vendor/complaints"
              className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <AlertCircle className="w-10 h-10 text-white mb-3" />
              <h3 className="text-lg font-semibold">Complaints</h3>
              <p className="text-white/90 text-sm mt-1">View & Respond</p>
            </a>
          </div>
        </div>

        {/* ===================== CV & COMPLIANCE ======================= */}
        <div className="max-w-7xl mx-auto px-4 mt-12">
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-purple-600" />
              CV & Compliance
            </h2>

            {/* CV Status Badge */}
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                providerProfile?.cvStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : providerProfile?.cvStatus === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : providerProfile?.cvStatus === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {providerProfile?.cvStatus || "Not Provided"}
            </span>

            {/* Helper text */}
            <p className="text-gray-600 text-sm mt-2 mb-4">
              {providerProfile?.cvStatus === "approved"
                ? "Your CV is approved. You can now accept bookings."
                : providerProfile?.cvStatus === "pending"
                ? "Your CV is under review."
                : providerProfile?.cvStatus === "rejected"
                ? "Your CV was rejected. Upload a new one."
                : "Upload a PDF CV to start verification."}
            </p>

            {/* File Picker */}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-600">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>{selectedCvFile?.name || "Attach CV (PDF)"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCvFileChange}
              />
            </label>

            {/* Submit CV Button */}
            <button
              onClick={handleCvUpload}
              disabled={cvUploading || !selectedCvFile}
              className="mt-4 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {cvUploading ? "Uploading..." : "Submit CV"}
            </button>

            {/* Upload progress bar */}
            {cvUploading && (
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="h-2 bg-purple-600 rounded-full transition-all"
                  style={{ width: `${cvUploadProgress}%` }}
                />
              </div>
            )}

            {/* Reviewer note */}
            {providerProfile?.cvReviewerNote && (
              <p className="text-sm text-red-600 mt-3">
                Reviewer note: {providerProfile.cvReviewerNote}
              </p>
            )}

            {/* View/Delete CV if uploaded */}
            {providerProfile?.cvFile?.url && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-semibold text-gray-800">
                    {providerProfile.cvFile.originalName || "CV.pdf"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${providerProfile.cvFile.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View CV
                  </a>
                  <button
                    onClick={() => {
                      if (user?.id && confirm("Are you sure you want to delete your CV? This cannot be undone.")) {
                        deleteCv(user.id);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
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
                No recent bookings found.
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
