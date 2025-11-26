// src/pages/admin/AdminBookings.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { bookingsApi } from "../../api/bookings";
import { Booking } from "../../types";
import { useToast } from "../../components/Toast";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Briefcase,
  Shield,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

type BookingFilter = "all" | "pending" | "approved" | "rejected";

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const { showToast, ToastComponent } = useToast();

  // refs to control fetch frequency / concurrency
  const isMounted = useRef(true);
  const inflight = useRef<AbortController | null>(null);
  const lastFetchAt = useRef<number | null>(null);
  const MIN_FETCH_INTERVAL_MS = 700; // throttle: ignore fetches fired within this ms

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // cancel any inflight request on unmount
      if (inflight.current) {
        try {
          inflight.current.abort();
        } catch (e) {
          // ignore
        }
        inflight.current = null;
      }
    };
  }, []);

  // centralized fetch function with abort + throttle + logging + one retry
  const refetchBookings = useCallback(
    async (reason: string = "manual") => {
      const now = Date.now();
      // throttle quick consecutive calls
      if (
        lastFetchAt.current &&
        now - (lastFetchAt.current ?? 0) < MIN_FETCH_INTERVAL_MS
      ) {
        console.debug(
          `[AdminBookings] Skipping fetch (throttled). reason=${reason} elapsed=${
            now - (lastFetchAt.current ?? 0)
          }ms`
        );
        return;
      }

      // avoid launching if a request already in flight
      if (inflight.current) {
        console.debug(
          "[AdminBookings] Skipping fetch (already in-flight). reason=",
          reason
        );
        return;
      }

      console.debug(`[AdminBookings] Fetching bookings — reason=${reason}`);
      lastFetchAt.current = now;

      const controller = new AbortController();
      inflight.current = controller;

      // set loading only if component still mounted
      if (isMounted.current) setLoading(true);

      const execute = async (attempt = 0): Promise<void> => {
        try {
          // adjust this call if your bookingsApi signature is different
          const resp = await bookingsApi.adminGetAllBookings({
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            console.debug("[AdminBookings] request aborted after response");
            return;
          }

          // normalize response
          const loaded = resp?.data?.bookings ?? resp?.data ?? [];
          if (!isMounted.current) return;
          setBookings(Array.isArray(loaded) ? loaded : []);
          console.debug(
            "[AdminBookings] Fetched",
            (loaded && Array.isArray(loaded) && loaded.length) || 0,
            "bookings"
          );
        } catch (err: any) {
          // treat aborts/cancel as normal termination (do not show toast)
          const name = err?.name ?? err?.code ?? "";
          if (
            name === "AbortError" ||
            name === "CanceledError" ||
            name === "ERR_CANCELED"
          ) {
            console.debug("[AdminBookings] Fetch canceled/aborted:", name);
            return;
          }

          // log full error for diagnostics
          try {
            console.error(
              "[AdminBookings] Fetch error:",
              err?.message ?? err,
              "status:",
              err?.response?.status,
              "data:",
              err?.response?.data ?? err
            );
          } catch (logErr) {
            console.error("[AdminBookings] Fetch error (logging failed):", err);
          }

          // retry once for network-like errors (no response or ECONNABORTED)
          const isNetworkError = !err?.response || err?.code === "ECONNABORTED";
          if (attempt < 1 && isNetworkError) {
            const backoff = 300 * (attempt + 1);
            console.debug(`[AdminBookings] retrying fetch in ${backoff}ms`);
            await new Promise((r) => setTimeout(r, backoff));
            return execute(attempt + 1);
          }

          const friendly = getApiErrorMessage(err, "Failed to fetch bookings");
          if (isMounted.current) {
            showToast(friendly, "error");
          }
        } finally {
          // only clear inflight if it is still our controller
          if (inflight.current === controller) inflight.current = null;
          if (isMounted.current) setLoading(false);
        }
      };

      return execute();
    },
    [showToast]
  );

  // initial load
  useEffect(() => {
    refetchBookings("mount").catch((e) => {
      console.error("refetchBookings mount error:", e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  const handleApproveBooking = async (
    bookingId: string,
    isApproved: boolean
  ) => {
    try {
      await bookingsApi.adminApproveBooking(bookingId, isApproved);
      showToast(
        `Booking ${isApproved ? "approved" : "rejected"} successfully`,
        "success"
      );
      // request a refetch but pass a reason to log
      refetchBookings("after-approve").catch((e) => console.error(e));
    } catch (error) {
      console.error("Approve/Reject failed:", error);
      showToast(getApiErrorMessage(error, "Action failed"), "error");
    }
  };

  const handleStatusChange = async (
    bookingId: string,
    status: "completed" | "cancelled",
    note: string
  ) => {
    try {
      await bookingsApi.updateBookingStatus(bookingId, {
        status,
        note,
        actor: "admin",
      });
      showToast(`Booking marked as ${status}`, "success");
      refetchBookings("after-status-change").catch((e) => console.error(e));
    } catch (error) {
      console.error("Status update failed:", error);
      showToast(getApiErrorMessage(error, "Status update failed"), "error");
    }
  };

  const filteredBookings = useMemo(() => {
    switch (filter) {
      case "pending":
        return bookings.filter((b) => b.status === "pending");
      case "approved":
        return bookings.filter((b) => b.status === "scheduled");
      case "rejected":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return bookings;
    }
  }, [bookings, filter]);

  const getStatusBadge = (booking: Booking) => {
    switch (booking.status) {
      case "scheduled":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" /> Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" /> Cancelled
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Awaiting Admin Decision
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" /> Pending Provider Approval
          </span>
        );
    }
  };

  const formatSchedule = (booking: Booking) => {
    if (booking.bookingDate && booking.bookingTime) {
      return new Date(
        `${booking.bookingDate}T${booking.bookingTime.slice(0, 5)}`
      ).toLocaleString();
    }
    if (booking.bookingDateTime) {
      return new Date(booking.bookingDateTime).toLocaleString();
    }
    return "Not scheduled";
  };

  const formatPrice = (booking: Booking) => {
    if (booking.totalAmount !== undefined && booking.totalAmount !== null) {
      return `$${booking.totalAmount.toFixed(2)}`;
    }
    if (
      typeof booking.service === "object" &&
      booking.service?.price !== undefined
    ) {
      return `$${booking.service.price}`;
    }
    return "—";
  };

  const canApprove = (booking: Booking) =>
    booking.status === "confirmed" || booking.status === "pending";

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Manage Bookings
          </h1>
          <p className="text-gray-600">
            Review and manage all platform bookings
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          {(["all", "pending", "approved", "rejected"] as BookingFilter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  console.debug("[AdminBookings] Filter changed ->", f);
                }}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
          <button
            onClick={() =>
              refetchBookings("manual-button").catch((e) => console.error(e))
            }
            className="ml-auto px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
            title="Force refresh"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">
              No bookings match the selected filter
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                      {typeof booking.service === "object"
                        ? booking.service.name
                        : "Service"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <strong>Customer:</strong>
                        </p>
                        <p className="ml-6">
                          {typeof booking.user === "object"
                            ? booking.user.name
                            : "User"}
                          {typeof booking.user === "object" &&
                            booking.user.email && (
                              <span className="block text-xs text-gray-500">
                                {booking.user.email}
                              </span>
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4" />
                          <strong>Provider:</strong>
                        </p>
                        <p className="ml-6">
                          {typeof booking.provider === "object"
                            ? booking.provider.name
                            : "Provider"}
                          {typeof booking.provider === "object" &&
                            booking.provider.email && (
                              <span className="block text-xs text-gray-500">
                                {booking.provider.email}
                              </span>
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <strong>Scheduled:</strong>
                        </p>
                        <p className="ml-6">{formatSchedule(booking)}</p>
                      </div>
                      <div>
                        <p>
                          <strong>Price:</strong> {formatPrice(booking)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Booked:{" "}
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(booking)}
                    <p className="text-xs text-gray-400">
                      {booking.confirmationCode
                        ? `Code ${booking.confirmationCode}`
                        : ""}
                    </p>
                    {canApprove(booking) ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleApproveBooking(booking._id, true)
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleApproveBooking(booking._id, false)
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    ) : booking.status === "scheduled" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              booking._id,
                              "completed",
                              "Completed after provider delivery"
                            )
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark completed
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              booking._id,
                              "cancelled",
                              "Cancelled by admin"
                            )
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminBookings;
