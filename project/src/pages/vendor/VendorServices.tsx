// src/pages/vendor/VendorServices.tsx
import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { servicesApi, UpsertServicePayload } from "../../api/services";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";
import { formatNpr } from "../../utils/currency";

const CATEGORIES = [
  "plumbing",
  "electrical",
  "cleaning",
  "appliance",
  "painting",
  "moving",
  "handyman",
  "gardening",
  "security",
  "wellness",
];

export function VendorServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "handyman",
  });

  // Fetch services
  const fetchServices = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const resp = await servicesApi.getProviderServices(user.id);
      const loaded = resp?.data?.services ?? resp?.data ?? [];
      setServices(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to fetch services"), "error");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "handyman",
    });
  };

  // Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload: UpsertServicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: formData.category,
    };

    if (!payload.name || !payload.description || Number.isNaN(payload.price)) {
      showToast("Fill in all required fields with valid values", "error");
      return;
    }
    if (payload.price < 0) {
      showToast("Price must be 0 or greater", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await servicesApi.addService(user.id, payload);
      showToast(
        "Service added successfully! It will appear after admin approval.",
        "success"
      );
      setIsAddModalOpen(false);
      resetForm();
      fetchServices();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to add service"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const payload: Partial<UpsertServicePayload> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: formData.category,
    };

    if (payload.price !== undefined && Number.isNaN(payload.price)) {
      showToast("Enter a valid price", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await servicesApi.updateService(selectedService._id, payload);
      showToast("Service updated successfully", "success");
      setIsEditModalOpen(false);
      setSelectedService(null);
      resetForm();
      fetchServices();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update service"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId: string) => {
    if (!user || !confirm("Delete this service? This cannot be undone."))
      return;

    try {
      await servicesApi.deleteService(user.id, serviceId);
      showToast("Service deleted", "success");
      fetchServices();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete service"), "error");
    }
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: String(service.price ?? ""),
      category: service.category || "handyman",
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (service: Service) => {
    setSelectedService(service);
    setIsViewModalOpen(true);
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              My Services
            </h1>
            <p className="text-slate-500 mt-2">
              Manage your service listings. Services require admin approval before appearing to users.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>

        {/* Services Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">
              No services yet
            </h3>
            <p className="text-slate-500">
              Create your first service listing to start receiving bookings.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {services.map((service) => (
                    <tr key={service._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {service.name}
                            </div>
                            <div className="text-sm text-slate-500 line-clamp-1">
                              {service.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm capitalize">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {formatNpr(service.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {service.provider &&
                        typeof service.provider === "object" &&
                        service.provider.isApproved ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(service)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(service)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="p-2 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add New Service"
      >
        <ServiceForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddService}
          primaryLabel={isSubmitting ? "Adding..." : "Add Service"}
          disabled={isSubmitting}
        />
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedService(null);
          resetForm();
        }}
        title="Edit Service"
      >
        <ServiceForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateService}
          primaryLabel={isSubmitting ? "Saving..." : "Save Changes"}
          disabled={isSubmitting}
        />
      </Modal>

      {/* View Service Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedService(null);
        }}
        title="Service Details"
      >
        {selectedService && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Service Name
                </label>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedService.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Description
                </label>
                <p className="text-slate-700">{selectedService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Category
                  </label>
                  <p className="text-slate-900 capitalize">
                    {selectedService.category}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Price
                  </label>
                  <p className="text-lg font-bold text-slate-900">
                    {formatNpr(selectedService.price)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Status
                </label>
                {selectedService.provider &&
                typeof selectedService.provider === "object" &&
                selectedService.provider.isApproved ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Approved - Visible to users
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    Pending admin approval
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedService);
                }}
                className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                Edit Service
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleDeleteService(selectedService._id);
                }}
                className="flex-1 py-2 px-4 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700"
              >
                Delete Service
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

function ServiceForm({
  formData,
  setFormData,
  onSubmit,
  primaryLabel,
  disabled = false,
}: {
  formData: {
    name: string;
    description: string;
    price: string;
    category: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      price: string;
      category: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  primaryLabel: string;
  disabled?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Service Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
          placeholder="e.g., Home Plumbing Service"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Description (No icons/images, text only)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
          placeholder="Describe your service in detail..."
          required
          disabled={disabled}
        />
        <p className="text-xs text-slate-500 mt-1">
          Please describe your service using text only. Do not include emojis or icons.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Price (NPR)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            placeholder="1500"
            required
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none capitalize"
            required
            disabled={disabled}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {primaryLabel}
      </button>
    </form>
  );
}
