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
    if (!user?.id || !selectedCvFile)
      return showToast("Attach a PDF CV first", "error");

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
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-pink-400 rounded-3xl shadow-2xl p-10 mb-8 relative overflow-hidden">
          <div className="absolute -left-16 -top-12 w-56 h-56 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -right-20 -bottom-16 w-72 h-72 bg-purple-900/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2">
                Provider Hub
              </h1>
              <p className="text-pink-100 text-lg">
                Welcome back, {user?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            icon={Briefcase}
            value={services.length}
            label="Total Services"
          />
          <Card
            icon={Calendar}
            value={bookings.length}
            label="Total Bookings"
            pending={pendingBookings.length}
            bg="bg-black text-white"
            pendingColor="text-purple-400"
          />
          <Card
            icon={ShieldCheck}
            value={
              providerProfile?.smartScore
                ? `${(providerProfile.smartScore * 100).toFixed(0)}%`
                : "0%"
            }
            label="Smart Score"
            bg="bg-purple-600 text-white"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <ActionCard
            href="#/vendor/services"
            title="My Services"
            desc="Manage your services"
            Icon={Briefcase}
          />
          <ActionCard
            href="#/vendor/bookings"
            title="Bookings"
            desc="Review and manage"
            Icon={Calendar}
            primary
            pending={pendingBookings.length}
          />
          <ActionCard
            href="#/vendor/chat"
            title="Messages"
            desc="Chat with customers"
            Icon={MessageCircle}
          />
          <ActionCard
            href="#/vendor/complaints"
            title="Complaints"
            desc="View feedback"
            Icon={AlertCircle}
          />
        </div>
      </div>
    </Layout>
  );
}

// Card component for stats
function Card({
  icon: Icon,
  value,
  label,
  pending,
  bg = "bg-white text-black",
  pendingColor = "text-purple-600",
}: any) {
  return (
    <div className={`${bg} rounded-2xl shadow-lg p-8 relative`}>
      <Icon className="w-10 h-10 mb-4" />
      <h3 className="text-4xl font-black mb-2">{value}</h3>
      <p className="text-sm uppercase tracking-wider">{label}</p>
      {pending !== undefined && (
        <p className={`text-xs mt-2 font-semibold ${pendingColor}`}>
          {pending} pending
        </p>
      )}
    </div>
  );
}

// Reusable ActionCard
function ActionCard({
  href,
  title,
  desc,
  Icon,
  primary = false,
  pending,
}: any) {
  return (
    <motion.a
      whileHover={{ y: -4 }}
      href={href}
      className={`group flex flex-col justify-between rounded-2xl p-6 shadow-lg no-underline ${
        primary
          ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white"
          : "bg-white border-2 border-black text-black"
      }`}
    >
      <div
        className={`w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:brightness-110`}
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
        {pending && (
          <p
            className={`mt-2 text-sm font-bold ${
              primary ? "text-white" : "text-purple-600"
            }`}
          >
            {pending} pending
          </p>
        )}
      </div>
    </motion.a>
  );
}
