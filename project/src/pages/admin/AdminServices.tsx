import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { adminApi } from "../../api/admin";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import {
  Edit,
  Trash2,
  DollarSign,
  User,
  Search,
  Star,
  Tag,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    emojiIcon: "🛠️",
    category: "",
    rating: "",
    tags: "",
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // refs to control fetch frequency / concurrency
  const isMounted = useRef(true);
  const inflight = useRef<AbortController | null>(null);
  const lastFetchAt = useRef<number | null>(null);
  const MIN_FETCH_INTERVAL_MS = 700; // throttle window

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (inflight.current) {
        inflight.current.abort();
        inflight.current = null;
      }
    };
  }, []);

  // centralized fetch (abort + throttle + logging)
  const refetchServices = async (reason: string = "manual") => {
    const now = Date.now();
    if (
      lastFetchAt.current &&
      now - lastFetchAt.current < MIN_FETCH_INTERVAL_MS
    ) {
      console.debug(
        `[AdminServices] Skipping fetch (throttled). reason=${reason} elapsed=${
          now - lastFetchAt.current
        }ms`
      );
      return;
    }
    if (inflight.current) {
      console.debug(
        "[AdminServices] Skipping fetch (already in-flight). reason=",
        reason
      );
      return;
    }

    console.debug(`[AdminServices] Fetching services — reason=${reason}`);
    lastFetchAt.current = now;

    const controller = new AbortController();
    inflight.current = controller;

    if (isMounted.current) setLoading(true);
    if (isMounted.current) setFetchError(null);

    const executeFetch = async (attempt = 0): Promise<void> => {
      try {
        const resp = await adminApi.getAllServices({
          signal: controller.signal,
        });
        if (!isMounted.current || controller.signal.aborted) return;
        setServices(resp.data.services || []);
        console.debug(
          "[AdminServices] Fetched",
          (resp.data.services || []).length,
          "services"
        );
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          console.debug("[AdminServices] Fetch aborted");
          return;
        }
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          return executeFetch(attempt + 1);
        }
        const friendly = getApiErrorMessage(
          err,
          "Unable to load services. Please verify your connection and retry."
        );
        if (isMounted.current) {
          setFetchError(friendly);
          showToast(friendly, "error");
          setServices([]);
        }
      } finally {
        if (isMounted.current) {
          inflight.current = null;
          setLoading(false);
        }
      }
    };

    await executeFetch();
  };

  // run once on mount
  useEffect(() => {
    refetchServices("mount").catch((e) =>
      console.error("refetchServices mount error:", e)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const term = search.toLowerCase();
    return services.filter((service) => {
      const providerName =
        typeof service.provider === "object"
          ? service.provider?.name?.toLowerCase()
          : "";
      return (
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        providerName?.includes(term)
      );
    });
  }, [search, services]);

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name ?? "",
      description: service.description ?? "",
      price: (service.price ?? "").toString(),
      emojiIcon: service.emojiIcon || "🛠️",
      category: service.category || "",
      rating: service.rating?.toString() || "",
      tags: service.tags?.join(", ") || "",
    });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const payload: Partial<Service & { tags?: string[]; price?: number }> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      emojiIcon: formData.emojiIcon || "🛠️",
      category: formData.category || selectedService.category,
      rating: formData.rating ? Number(formData.rating) : undefined,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };

    if (!payload.name || !payload.description || Number.isNaN(payload.price)) {
      showToast("Provide valid service details", "error");
      return;
    }

    try {
      await adminApi.updateService(selectedService._id, payload);
      showToast("Service updated successfully", "success");
      setSelectedService(null);

      // refresh list (use refetchServices to be defensive)
      refetchServices("after-update").catch((err) =>
        console.error("refetch after update failed:", err)
      );
    } catch (error) {
      console.error("Update service failed:", error);
      showToast(getApiErrorMessage(error, "Failed to update service"), "error");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await adminApi.deleteService(serviceId);
      showToast("Service deleted successfully", "success");
      // update local list immediately to avoid refetch storms
      if (isMounted.current)
        setServices((prev) => prev.filter((s) => s._id !== serviceId));
    } catch (error) {
      console.error("Delete service failed:", error);
      showToast(getApiErrorMessage(error, "Failed to delete service"), "error");
    }
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        {fetchError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </div>
        )}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Review Services
            </h1>
            <p className="text-gray-600">
              Audit, edit, or remove vendor services
            </p>
          </div>
          <div className="relative w-full sm:w-80 flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services or providers"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() =>
                refetchServices("manual-button").catch((e) => console.error(e))
              }
              className="ml-2 px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
              title="Refresh services"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading services...</p>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <SparklesPlaceholder />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service._id || `${service.name}-${service.createdAt}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition flex flex-col gap-4"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{service.emojiIcon || "🛠️"}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {service.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                        <DollarSign className="w-4 h-4" />${service.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-[0.4em]">
                      {service.category}
                    </p>
                    <p className="text-gray-600 mt-2 line-clamp-3">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    {service.rating?.toFixed(1) ?? "4.8"}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {typeof service.provider === "object"
                      ? service.provider.name
                      : "Provider"}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Created:{" "}
                    {service.createdAt
                      ? new Date(service.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs uppercase tracking-wide"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedService}
        onClose={() => {
          setSelectedService(null);
        }}
        title="Edit Service"
      >
        {selectedService && (
          <form onSubmit={handleUpdateService} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  min="0"
                  step="0.01"
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.emojiIcon}
                  onChange={(e) =>
                    setFormData({ ...formData, emojiIcon: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  );
}

function SparklesPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-4 text-gray-500">
      <span className="text-5xl">✨</span>
      <h3 className="text-xl font-bold text-gray-800">No services found</h3>
      <p>Try adjusting your search filters</p>
    </div>
  );
}
