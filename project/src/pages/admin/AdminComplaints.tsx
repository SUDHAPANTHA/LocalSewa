import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { complaintsApi } from "../../api/complaints";
import { Complaint } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { AlertCircle, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";
import { useAuth } from "../../context/AuthContext";

export function AdminComplaints() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionForm, setResolutionForm] = useState({
    status: "",
    note: "",
    resolutionSummary: "",
    refundAmount: "",
  });

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const fetchAllComplaints = async () => {
    setLoading(true);
    try {
      // Note: You'll need to add this API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/complaints/all`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Failed to fetch complaints", error);
      showToast("Failed to load complaints", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !user?.id) return;

    try {
      const payload: any = {
        status: resolutionForm.status,
        note: resolutionForm.note,
        actor: user.id,
      };

      if (resolutionForm.resolutionSummary || resolutionForm.refundAmount) {
        payload.resolution = {
          summary: resolutionForm.resolutionSummary,
          refundAmount: resolutionForm.refundAmount ? parseFloat(resolutionForm.refundAmount) : undefined,
        };
      }

      await complaintsApi.updateComplaint(selectedComplaint._id, payload);
      showToast("Complaint updated successfully", "success");
      setShowModal(false);
      setSelectedComplaint(null);
      fetchAllComplaints();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to update complaint"), "error");
    }
  };

  const openUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResolutionForm({
      status: complaint.status,
      note: "",
      resolutionSummary: complaint.resolution?.summary || "",
      refundAmount: complaint.resolution?.refundAmount?.toString() || "",
    });
    setShowModal(true);
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
    escalated: complaints.filter((c) => c.status === "escalated").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Manage Complaints</h1>
          <p className="text-purple-100">Review and resolve customer complaints</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
          <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
            <p className="text-sm text-red-600 uppercase tracking-wider mb-1">Escalated</p>
            <p className="text-3xl font-black text-red-700">{stats.escalated}</p>
          </div>
          <div className="bg-green-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <p className="text-sm text-green-600 uppercase tracking-wider mb-1">Resolved</p>
            <p className="text-3xl font-black text-green-700">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "open", "in_review", "needs_info", "escalated", "resolved", "closed"].map((status) => (
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
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No complaints found</h3>
            <p className="text-gray-600">
              {filter === "all" ? "No complaints in the system" : `No ${filter} complaints`}
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
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
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
                      <span>
                        Provider:{" "}
                        <span className="font-semibold text-gray-700">
                          {typeof complaint.provider === "object" ? complaint.provider.name : "Provider"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{new Date(complaint.createdAt || "").toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openUpdateModal(complaint)}
                    className="ml-4 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="Update Status"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedComplaint(null);
        }}
        title="Update Complaint Status"
      >
        <form onSubmit={handleUpdateComplaint} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={resolutionForm.status}
              onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="needs_info">Needs Info</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Admin Note</label>
            <textarea
              value={resolutionForm.note}
              onChange={(e) => setResolutionForm({ ...resolutionForm, note: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              placeholder="Add a note about this update..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Resolution Summary</label>
            <textarea
              value={resolutionForm.resolutionSummary}
              onChange={(e) => setResolutionForm({ ...resolutionForm, resolutionSummary: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              placeholder="How was this complaint resolved?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Refund Amount (NPR)</label>
            <input
              type="number"
              value={resolutionForm.refundAmount}
              onChange={(e) => setResolutionForm({ ...resolutionForm, refundAmount: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setSelectedComplaint(null);
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
