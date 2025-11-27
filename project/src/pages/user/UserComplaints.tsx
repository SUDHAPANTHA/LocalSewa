import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { complaintsApi } from "../../api/complaints";
import { Complaint } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { AlertCircle, Edit, Trash2, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

export function UserComplaints() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "quality",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
  });

  useEffect(() => {
    if (user?.id) {
      fetchComplaints();
    }
  }, [user?.id]);

  const fetchComplaints = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await complaintsApi.getUserComplaints(user.id);
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Failed to fetch complaints", error);
      showToast(getApiErrorMessage(error, "Failed to load complaints"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      if (editingComplaint) {
        // Update existing complaint
        await complaintsApi.updateComplaint(editingComplaint._id, {
          ...formData,
          actor: user.id,
        });
        showToast("Complaint updated successfully", "success");
      } else {
        // Create new complaint
        await complaintsApi.create({
          userId: user.id,
          bookingId: "", // Optional - can be linked to booking
          ...formData,
        });
        showToast("Complaint submitted successfully", "success");
      }
      
      setShowModal(false);
      setEditingComplaint(null);
      resetForm();
      fetchComplaints();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to submit complaint"), "error");
    }
  };

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      category: complaint.category,
      description: complaint.description,
      priority: complaint.priority,
    });
    setShowModal(true);
  };

  const handleDelete = async (complaintId: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;

    try {
      await complaintsApi.updateComplaint(complaintId, {
        status: "closed",
        note: "Deleted by user",
        actor: user?.id,
      });
      showToast("Complaint deleted successfully", "success");
      fetchComplaints();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to delete complaint"), "error");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "quality",
      description: "",
      priority: "medium",
    });
  };

  const openNewComplaintModal = () => {
    setEditingComplaint(null);
    resetForm();
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

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-black rounded-3xl shadow-2xl p-10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">My Complaints</h1>
              <p className="text-purple-100">Track and manage your complaints</p>
            </div>
            <button
              onClick={openNewComplaintModal}
              className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Complaint
            </button>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No complaints yet</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any complaints</p>
            <button
              onClick={openNewComplaintModal}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
            >
              Submit Your First Complaint
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
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
                      <span>Category: <span className="font-semibold text-gray-700">{complaint.category}</span></span>
                      <span>•</span>
                      <span>{new Date(complaint.createdAt || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {complaint.status !== "closed" && complaint.status !== "resolved" && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(complaint)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(complaint._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingComplaint(null);
          resetForm();
        }}
        title={editingComplaint ? "Edit Complaint" : "New Complaint"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief title for your complaint"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="quality">Quality Issue</option>
              <option value="pricing">Pricing Issue</option>
              <option value="timeliness">Timeliness Issue</option>
              <option value="behavior">Behavior Issue</option>
              <option value="safety">Safety Concern</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe your complaint in detail..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingComplaint(null);
                resetForm();
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
            >
              {editingComplaint ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
