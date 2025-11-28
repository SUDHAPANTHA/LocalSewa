import { useEffect, useState } from "react";
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

export function VendorDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerProfile, setProviderProfile] =
    useState<ServiceProvider | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
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
      const profile = profileRes.data.provider;
      setProviderProfile(profile);
    } catch (error) {
      console.error("Failed to fetch data", error);
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
    try {
      await providerApi.uploadCv(user.id, selectedCvFile);
      showToast("CV uploaded. Awaiting compliance review.", "success");
      setSelectedCvFile(null);
      fetchData(user.id);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to upload CV"), "error");
    } finally {
      setCvUploading(false);
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
          <p className="text-gray-600">Loading provider insights...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="relative z-10">
            <h1 className="text-5xl font-black text-white mb-2">
              Provider Hub
            </h1>
            <p className="text-purple-100 text-lg">
              Welcome back, {user?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black rounded-2xl shadow-lg p-8 text-white border border-purple-900/20">
            <Briefcase className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-4xl font-black mb-2">{services.length}</h3>
            <p className="text-gray-400 text-sm uppercase tracking-wider">
              Total Services
            </p>
          </div>

          <div className="bg-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <Calendar className="w-10 h-10 text-purple-200 mb-4" />
            <h3 className="text-4xl font-black mb-2">{bookings.length}</h3>
            <p className="text-purple-100 text-sm uppercase tracking-wider">
              Total Bookings
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black">
            <MessageCircle className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-4xl font-black text-black mb-2">
              {pendingBookings.length}
            </h3>
            <p className="text-gray-600 text-sm uppercase tracking-wider">
              Pending Requests
            </p>
          </div>
        </div>

        {providerProfile && providerProfile.cvStatus !== "approved" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                Finish your CV review to unlock the marketplace
              </p>
              <p className="text-sm text-amber-700">
                Upload a recent PDF CV and set your service radius. Admins use
                it to vet vendors before approving services.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="bg-white rounded-2xl shadow-lg p-8 border-2 border-black">
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
                      className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-600 transition-all duration-300">
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
              <button
                onClick={handleCvUpload}
                disabled={cvUploading || !selectedCvFile}
                className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-purple-600 disabled:opacity-50 transition-all duration-300"
              >
                {cvUploading ? "Uploading..." : "Submit CV"}
              </button>
            </div>
            {providerProfile?.cvReviewerNote && (
              <p className="text-xs text-rose-600 mt-3">
                Reviewer note: {providerProfile.cvReviewerNote}
              </p>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <a
            href="#/vendor/services"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <Plus className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2 group-hover:text-white transition-colors duration-300">
                Manage Services
              </h3>
              <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300">
                Add, edit, or remove services
              </p>
            </div>
          </a>

          <a
            href="#/vendor/bookings"
            className="bg-purple-600 text-white rounded-2xl shadow-lg p-8 hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between no-underline"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2">View Bookings</h3>
              <p className="text-purple-100">Manage customer bookings</p>
            </div>
          </a>

          <a
            href="#/vendor/chat"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <MessageCircle className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2 group-hover:text-white transition-colors duration-300">
                Messages
              </h3>
              <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300">
                Chat with customers
              </p>
            </div>
          </a>

          <a
            href="#/vendor/complaints"
            className="group bg-white border-2 border-black rounded-2xl shadow-lg p-8 hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between no-underline"
          >
            <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <AlertCircle className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2 group-hover:text-white transition-colors duration-300">
                Complaints
              </h3>
              <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300">
                View complaints
              </p>
            </div>
          </a>
        </div>
      </div>
    </Layout>
  );
}

