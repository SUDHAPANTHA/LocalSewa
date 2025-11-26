// src/pages/admin/AdminProviders.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { adminApi } from "../../api/admin";
import { ServiceProvider } from "../../types";
import { useToast } from "../../components/Toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

type ProviderFilter = "all" | "pending" | "approved";
type CvFilter = "all" | "pending" | "approved" | "rejected" | "not_provided";

const CV_STATUS_BADGES: Record<CvFilter, { label: string; className: string }> =
  {
    all: { label: "All CVs", className: "bg-slate-100 text-slate-600" },
    pending: {
      label: "Pending review",
      className: "bg-amber-100 text-amber-700",
    },
    approved: {
      label: "CV approved",
      className: "bg-emerald-100 text-emerald-700",
    },
    rejected: {
      label: "Needs revision",
      className: "bg-rose-100 text-rose-700",
    },
    not_provided: { label: "No CV", className: "bg-slate-200 text-slate-600" },
  };

export function AdminProviders() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const [cvFilter, setCvFilter] = useState<CvFilter>("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // Abort controller ref for cancelling inflight requests
  const abortRef = useRef<AbortController | null>(null);

  // Throttle / duplicate-mount guard (helps with StrictMode double mount)
  const lastFetchAt = useRef<number | null>(null);
  const MIN_FETCH_INTERVAL_MS = 1200;

  // Simple cache version token to avoid stale updates when component unmounts quickly
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // abort any inflight request on unmount
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const fetchProviders = useCallback(async () => {
    const now = Date.now();
    if (
      lastFetchAt.current &&
      now - lastFetchAt.current < MIN_FETCH_INTERVAL_MS
    ) {
      console.debug("[AdminProviders] fetchProviders: throttled");
      return;
    }
    lastFetchAt.current = now;

    // abort existing request first
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) {
        // ignore
      }
      abortRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(null);

    const queryParams = {
      cvStatus: cvFilter === "all" ? undefined : cvFilter,
      approved:
        filter === "all" ? undefined : filter === "approved" ? true : false,
    };

    // try with one retry on network-like errors
    const execute = async (attempt = 0): Promise<void> => {
      try {
        // Make sure adminApi.getAllProviders uses axios params and accepts signal:
        // e.g. api.get("/admin-get-providers", { params: queryParams, signal })
        const response = await adminApi.getAllProviders(queryParams, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        // response shape may vary: support both { data: { providers: [] } } and { data: [] }
        const loaded =
          response?.data?.providers ??
          response?.data ??
          (Array.isArray(response) ? response : []);
        if (!isMounted.current) return;
        setProviders(loaded as ServiceProvider[]);
      } catch (error: any) {
        if (controller.signal.aborted || error?.name === "AbortError") {
          console.debug("[AdminProviders] fetch aborted");
          return;
        }

        // Log full axios error for debugging
        try {
          // axios style error
          console.error(
            "[AdminProviders] fetch error:",
            error?.message,
            "status:",
            error?.response?.status,
            "data:",
            error?.response?.data ?? error
          );
        } catch (logErr) {
          console.error(
            "[AdminProviders] fetch error (logging failed):",
            error
          );
        }

        // only retry once for transient errors (network/timeouts)
        const isNetworkError =
          !error?.response || (error?.code && error.code === "ECONNABORTED");
        if (attempt < 1 && isNetworkError) {
          const backoff = 300 * (attempt + 1);
          console.debug(`[AdminProviders] retrying fetch in ${backoff}ms`);
          await new Promise((r) => setTimeout(r, backoff));
          return execute(attempt + 1);
        }

        const friendly = getApiErrorMessage(
          error,
          "Unable to load providers. Please check your connection and retry."
        );
        if (isMounted.current) {
          setFetchError(friendly);
          showToast(friendly, "error");
        }
      } finally {
        // only set loading false if still mounted and controller not aborted
        if (isMounted.current && !controller.signal.aborted) {
          setLoading(false);
        }
        // clear abortRef only if it's our controller
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    };

    return execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvFilter, filter, showToast]);

  // initial + filter change load
  useEffect(() => {
    // call and ignore returned promise to avoid unhandled rejection in strict scenarios
    fetchProviders().catch((e) => {
      // already handled inside fetchProviders; but log to console to be safe
      console.error("[AdminProviders] fetchProviders top-level catch:", e);
    });
    // cleanup handled by abortRef in outer effect
  }, [fetchProviders]);

  const handleApproveProvider = async (
    providerId: string,
    status: "approved" | "rejected"
  ) => {
    if (!providerId) {
      showToast("Provider id missing", "error");
      return;
    }
    try {
      await adminApi.approveProvider(providerId, {
        isApproved: status === "approved",
        cvStatus: status,
      });
      showToast(
        `Provider ${
          status === "approved" ? "approved" : "rejected"
        } successfully`,
        "success"
      );
      // re-fetch fresh data (throttled)
      fetchProviders().catch((e) => console.error(e));
    } catch (error: any) {
      console.error(
        "[AdminProviders] approve failed:",
        error?.response ?? error
      );
      showToast(getApiErrorMessage(error, "Action failed"), "error");
    }
  };

  const getFilteredProviders = useCallback(() => {
    if (filter === "pending") return providers.filter((p) => !p.isApproved);
    if (filter === "approved") return providers.filter((p) => p.isApproved);
    return providers;
  }, [filter, providers]);

  const filteredProviders = useMemo(
    () => getFilteredProviders(),
    [getFilteredProviders]
  );

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        {fetchError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Manage Providers
          </h1>
          <p className="text-gray-600">
            Approve or reject service provider registrations
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          {(["all", "pending", "approved"] as ProviderFilter[]).map((f) => (
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

        <div className="flex flex-wrap gap-3 mb-6">
          {(
            [
              "all",
              "pending",
              "approved",
              "rejected",
              "not_provided",
            ] as CvFilter[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setCvFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                cvFilter === status
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {CV_STATUS_BADGES[status].label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-600">Loading providers...</p>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No providers found
            </h3>
            <p className="text-gray-600">
              No providers match the selected filter
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProviders.map((provider, providerIndex) => {
              const status = (provider.cvStatus || "not_provided") as CvFilter;
              const cvBadge =
                CV_STATUS_BADGES[status] || CV_STATUS_BADGES.not_provided;
              return (
                <div
                  key={
                    provider._id ??
                    provider.email ??
                    `provider-${providerIndex}`
                  }
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition border border-slate-100"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        {provider.name}
                        {provider.smartScore && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Smart {(provider.smartScore * 100).toFixed(0)}
                          </span>
                        )}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {provider.email}
                        </p>
                        {provider.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {provider.phone}
                          </p>
                        )}
                        {provider.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {provider.address}
                          </p>
                        )}
                        <p>
                          <strong>Services:</strong>{" "}
                          {provider.services?.length || 0} services registered
                        </p>
                      </div>

                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${cvBadge.className}`}
                          >
                            {cvBadge.label}
                          </span>
                          {typeof provider.cvScore === "number" && (
                            <span className="text-xs font-semibold text-slate-600">
                              CV score {(provider.cvScore * 100).toFixed(0)}%
                            </span>
                          )}
                          {provider.cvFile?.url && (
                            <a
                              href={provider.cvFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 text-xs"
                            >
                              <FileText className="w-3 h-3" />
                              View CV
                            </a>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                          {provider.cvSummary || "No CV uploaded yet."}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                          {provider.skillTags?.slice(0, 5).map((tag, idx) => (
                            <span
                              key={`${tag ?? "tag"}-${idx}`}
                              className="px-2 py-1 rounded-full bg-white border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}

                          {provider.cvReviewerNote && (
                            <span className="text-rose-600">
                              Note: {provider.cvReviewerNote}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      {provider.isApproved ? (
                        <span className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
                          <CheckCircle className="w-5 h-5" />
                          Approved
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            <Clock className="w-5 h-5" />
                            Pending Approval
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleApproveProvider(
                                  provider._id ?? "",
                                  "approved"
                                )
                              }
                              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                              disabled={!provider._id}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                handleApproveProvider(
                                  provider._id ?? "",
                                  "rejected"
                                )
                              }
                              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                              disabled={!provider._id}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.services?.slice(0, 4).map((service, idx) => (
                      <span
                        key={
                          service._id ?? `${service.name ?? "service"}-${idx}`
                        }
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs capitalize"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminProviders;
