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

// Vendor Dashboard — redesigned with modern UI, micro-animations, and polished layout
// Keep business logic intact; styling uses Tailwind + framer-motion for animations

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const profile = profileRes.data.provider;
      setProviderProfile(profile);
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
      badge: "bg-emerald-100 text-emerald-700",
      helper: "You can publish services and receive bookings.",
    },
    pending: {
      label: "Pending review",
      badge: "bg-amber-100 text-amber-700",
      helper: "Admin will review your CV shortly.",
    },
    rejected: {
      label: "Needs revision",
      badge: "bg-rose-100 text-rose-700",
      helper: "Upload a stronger CV to get approved.",
    },
    not_provided: {
      label: "No CV on file",
      badge: "bg-slate-200 text-slate-700",
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

    // small fake progress to make upload feel responsive
    const progressInterval = setInterval(() => {
      setCvUploadProgress((p) => Math.min(95, p + Math.random() * 12));
    }, 350);

    try {
      await providerApi.uploadCv(user.id, selectedCvFile);
      // finish animation
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
      // small delay so the progress bar reaches 100% visually
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

  if (loading) {
    return (
      <Layout>
        {ToastComponent}
        <div className="max-w-4xl mx-auto animate-fade-in text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl shadow-lg text-white"
          >
            Loading provider insights...
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {ToastComponent}

      <div className="max-w-6xl mx-auto my-12 px-4 md:px-0">
        {/* Hero - Matching Admin Dashboard Style */}
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2">Provider Hub</h1>
              <p className="text-purple-100 text-lg">Welcome back, {user?.name}</p>
            </div>
          </div>
          
          {/* CV Status Card */}
          <div className="mt-6 bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-xs text-white/70 uppercase tracking-wider mb-2">CV Status</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{cvBadge.label}</p>
                <p className="text-xs text-white/60">{cvBadge.helper}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cvBadge.badge}`}>
                {currentCvStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards - Matching Admin Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black">
            <Briefcase className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">{services.length}</h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">Total Services</p>
          </div>

          <div className="bg-black rounded-2xl shadow-lg p-8 text-white border border-purple-900/20">
            <Calendar className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-4xl font-black mb-2">{bookings.length}</h3>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Total Bookings</p>
            <p className="text-xs text-purple-400 mt-2 font-semibold">{pendingBookings.length} pending</p>
          </div>

          <div className="bg-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <ShieldCheck className="w-10 h-10 text-purple-200 mb-4" />
            <h3 className="text-4xl font-black mb-2">{providerProfile?.smartScore ? (providerProfile.smartScore * 100).toFixed(0) : '0'}%</h3>
            <p className="text-purple-100 text-sm uppercase tracking-wider">Smart Score</p>
          </div>
        </div>

        {/* Quick Actions - Matching Admin Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <a
            href="#/vendor/services"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <Briefcase className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">My Services</h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">Manage your services</p>
          </a>

          <a
            href="#/vendor/bookings"
            className="bg-purple-600 text-white rounded-2xl shadow-lg p-8 hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black mb-2">Bookings</h3>
            <p className="text-purple-100 text-sm">Review and manage</p>
            {pendingBookings.length > 0 && (
              <p className="mt-3 text-white font-bold text-sm">{pendingBookings.length} pending</p>
            )}
          </a>

          <a
            href="#/vendor/chat"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <MessageCircle className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">Messages</h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">Chat with customers</p>
          </a>

          <a
            href="#/vendor/complaints"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <AlertCircle className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-black mb-2 group-hover:text-white transition-colors duration-300">Complaints</h3>
            <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-sm">View feedback</p>
          </a>
        </div>

        {/* Continue with rest of content */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide">Bookings</p>
                <h3 className="text-3xl font-extrabold mt-1">
                  {bookings.length}
                </h3>
                <p className="text-xs text-white/80 mt-1">Total bookings</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-black"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">
                  Pending
                </p>
                <h3 className="text-3xl font-extrabold text-black mt-1">
                  {pendingBookings.length}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Requests awaiting response
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CV & Compliance */}
        {providerProfile && providerProfile.cvStatus !== "approved" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.04 }}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3"
          >
            <ShieldCheck className="w-6 h-6 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                Finish your CV review to unlock the marketplace
              </p>
              <p className="text-sm text-amber-700">
                Upload a recent PDF CV and set your service radius. Admins use
                it to vet vendors before approving services.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black text-black">
                  CV & Compliance
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload PDF resume for verification
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${cvBadge.badge}`}
              >
                {cvBadge.label}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              {providerProfile?.cvSummary
                ? providerProfile.cvSummary
                : cvBadge.helper}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  CV score
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {providerProfile?.cvScore
                    ? `${Math.round((providerProfile.cvScore || 0) * 100)}%`
                    : "n/a"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Experience
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {providerProfile?.experienceYears
                    ? `${providerProfile.experienceYears}+ yrs`
                    : "—"}
                </p>
              </div>
            </div>

            {providerProfile?.skillTags &&
              providerProfile.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {providerProfile.skillTags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            <div className="mt-5">
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-600 transition-all duration-300">
                <Upload className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-black">
                    {selectedCvFile?.name ||
                      providerProfile?.cvFile?.originalName ||
                      "Attach PDF CV"}
                  </p>
                  <p className="text-xs text-gray-500">Max 8 MB, PDF only</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleCvFileChange}
                />
              </label>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleCvUpload}
                  disabled={cvUploading || !selectedCvFile}
                  className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-purple-600 disabled:opacity-50 transition-all duration-300"
                >
                  {cvUploading ? "Uploading..." : "Submit CV"}
                </button>

                <AnimatePresence>
                  {cvUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1"
                    >
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div
                          style={{ width: `${cvUploadProgress}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${cvUploadProgress}%` }}
                          transition={{ ease: "easeOut", duration: 0.35 }}
                          className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(cvUploadProgress)}%
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {providerProfile?.cvReviewerNote && (
                <p className="text-xs text-rose-600 mt-3">
                  Reviewer note: {providerProfile.cvReviewerNote}
                </p>
              )}
            </div>
          </motion.section>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/** Reusable card pattern with hover animation **/}
          <ActionCard
            href="#/vendor/services"
            title="Manage Services"
            desc="Add, edit, or remove services"
            Icon={Plus}
            accentBg="bg-purple-100"
          />
          <ActionCard
            href="#/vendor/bookings"
            title="View Bookings"
            desc="Manage customer bookings"
            Icon={Calendar}
            accentBg="bg-white/20"
            primary
          />
          <ActionCard
            href="#/vendor/chat"
            title="Messages"
            desc="Chat with customers"
            Icon={MessageCircle}
            accentBg="bg-purple-100"
          />
          <ActionCard
            href="#/vendor/complaints"
            title="Complaints"
            desc="View complaints"
            Icon={AlertCircle}
            accentBg="bg-purple-100"
          />
        </div>

        {/* Optional: Recent bookings list (compact) */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recent Requests</h3>
            <p className="text-sm text-gray-500">{bookings.length} total</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No bookings yet — share your services to get started.
            </p>
          ) : (
            <div className="grid gap-3">
              {bookings.slice(0, 6).map((b) => (
                <div
                  key={(b as any).id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {(b as any).customerName || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(b as any).serviceName || "—"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(b as any).date || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </Layout>
  );
}

// Small presentational ActionCard component
function ActionCard({
  href,
  title,
  desc,
  Icon,
  accentBg,
  primary = false,
}: any) {
  return (
    <motion.a
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      href={href}
      className={`group flex flex-col justify-between rounded-2xl p-6 shadow-lg no-underline ${
        primary
          ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white"
          : "bg-white border-2 border-black text-black"
      }`}
    >
      <div
        className={`w-14 h-14 ${accentBg} rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:brightness-110`}
      >
        <Icon
          className={`w-7 h-7 ${primary ? "text-white" : "text-purple-600"}`}
        />
      </div>
      <div>
        <h4 className={`text-2xl font-black ${primary ? "text-white" : ""}`}>
          {title}
        </h4>
        <p
          className={`text-sm mt-1 ${
            primary ? "text-purple-100" : "text-gray-600"
          }`}
        >
          {desc}
        </p>
      </div>
    </motion.a>
  );
}
