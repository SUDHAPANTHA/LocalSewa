import { useEffect, useMemo, useState } from "react";
import { Layout } from "../../components/Layout";
import { adminApi } from "../../api/admin";
import { Service } from "../../types";
import { useToast } from "../../components/Toast";
import { CheckCircle, XCircle, User, Search, Star, Tag, Clock } from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

type ServiceFilter = "all" | "pending" | "approved" | "rejected";

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ServiceFilter>("all");
  const { showToast, ToastComponent } = useToast();

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await adminApi.getAllServices();
      const servicesList = response?.data?.services || [];
      setServices(servicesList);
    } catch (error: any) {
      console.error("[AdminServices] Error:", error);
      showToast("Failed to load services", "error");
      setServices([]);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredServices = useMemo(() => {
    let filtered = services;
    
    // Apply status filter
    if (filter === "pending") {
      filtered = filtered.filter((s) => s.isApproved === undefined || s.isApproved === null);
    } else if (filter === "approved") {
      filtered = filtered.filter((s) => s.isApproved === true);
    } else if (filter === "rejected") {
      filtered = filtered.filter((s) => s.isApproved === false);
    }
    
    // Apply search filter
    if (!search.trim()) return filtered;
    const term = search.toLowerCase();
    return filtered.filter((service) => {
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
  }, [search, services, filter]);

  const handleApproveService = async (serviceId: string, status: "approved" | "rejected") => {
    if (!serviceId) {
      showToast("Service ID missing", "error");
      return;
    }
    
    try {
      await adminApi.approveService(serviceId, { isApproved: status === "approved" });
      showToast(
        `Service ${status === "approved" ? "approved" : "rejected"} successfully`,
        "success"
      );
      fetchServices();
    } catch (error) {
      console.error("Approve service failed:", error);
      showToast(getApiErrorMessage(error, "Failed to update service status"), "error");
    }
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Services</h1>
            <p className="text-gray-600">
              Edit, delete, approve or reject vendor services
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
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {(["all", "pending", "approved", "rejected"] as ServiceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No services found
            </h3>
            <p className="text-gray-600">
              {services.length === 0 
                ? "No services in database yet" 
                : "No services match the selected filter"}
            </p>
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
                        NPR {service.price}
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  {service.isApproved === true ? (
                    <span className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Approved
                    </span>
                  ) : service.isApproved === false ? (
                    <span className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium">
                      <XCircle className="w-5 h-5" />
                      Rejected
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        <Clock className="w-5 h-5" />
                        Pending Review
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveService(service._id, "approved")}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveService(service._id, "rejected")}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
