import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { complaintsApi } from "../../api/complaints";
import { Complaint } from "../../types";
import { useToast } from "../../components/Toast";
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

export function VendorComplaints() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.id) {
      fetchComplaints();
    }
  }, [user?.id]);

  const fetchComplaints = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await complaintsApi.getProviderComplaints(user.id);
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Failed to fetch complaints", error);
      showToast(getApiErrorMessage(error, "Failed to load complaints"), "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      open: { label: "Open", className: "bg-blue-100 text-blue-700", icon: Clock },
      in_review: { label: "In Review", className: "bg-yellow-100 text-yellow-700", icon: Clock },
      needs_info: { label: "Needs Info", className: "bg-orange-100 text-orange-700", icon: AlertCircle },
      escalated: { label: "Escalated", className: "bg-red-100 text-red-700", icon: AlertCircle },
      resolved: { label: "Resolved", className: "bg-green-100 text-green-700", icon: CheckCircle },
      closed: { label: "Closed", className: "bg-gray-100 text-gray-700", icon: XCircle },
    };

    const badge = badges[status] || badges.open;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { className: string }> = {
      low: { className: "bg-gray-100 text-gray-700" },
      medium: { className: "bg-blue-100 text-blue-700" },
      high: { className: "bg-orange-100 text-orange-700" },
      critical: { className: "bg-red-100 text-red-700" },
    };

    const badge = badges[priority] || badges.medium;

    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${badge.className}`}>
        {priority}
      </span>
    );
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inReview: complaints.filter((c) => c.status === "in_review").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Complaints Against Me</h1>
          <p className="text-purple-100">View and track customer complaints</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
            <p className="text-sm text-gray-600 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-black text-black">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <p className="text-sm text-blue-600 uppercase tracking-wider mb-1">Open</p>
            <p className="text-3xl font-black text-blue-700">{stats.open}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
            <p className="text-sm text-yellow-600 uppercase tracking-wider mb-1">In Review</p>
            <p className="text-3xl font-black text-yellow-700">{stats.inReview}</p>
          </div>
          <div className="bg-green-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <p className="text-sm text-green-600 uppercase tracking-wider mb-1">Resolved</p>
            <p className="text-3xl font-black text-green-700">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "open", "in_review", "resolved", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  filter === status
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {filter === "all" ? "No complaints" : `No ${filter} complaints`}
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "Great! You have no complaints from customers"
                : `No complaints with status: ${filter}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-purple-600 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-black">{complaint.title}</h3>
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Category: <span className="font-semibold text-gray-700">{complaint.category}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Customer:{" "}
                        <span className="font-semibold text-gray-700">
                          {typeof complaint.user === "object" ? complaint.user.name : "Customer"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{new Date(complaint.createdAt || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {complaint.resolution && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm font-bold text-green-800 mb-1">Resolution:</p>
                    <p className="text-sm text-green-700">{complaint.resolution.summary}</p>
                    {complaint.resolution.refundAmount && (
                      <p className="text-sm text-green-700 mt-2">
                        Refund: NPR {complaint.resolution.refundAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {complaint.timeline && complaint.timeline.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-sm font-bold text-gray-800 mb-2">Timeline:</p>
                    <div className="space-y-2">
                      {complaint.timeline.map((entry, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          <span className="font-semibold">{entry.status}</span>
                          {entry.note && <span> - {entry.note}</span>}
                          {entry.createdAt && (
                            <span className="text-gray-400 ml-2">
                              ({new Date(entry.createdAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
