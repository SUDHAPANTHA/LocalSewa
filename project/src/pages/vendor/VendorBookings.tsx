// src/pages/vendor/VendorBookings.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../api/bookings";
import { Booking } from "../../types";
import { useToast } from "../../components/Toast";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Flag,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/errors";

export function VendorBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  // concurrency / lifecycle guards
  const inflight = useRef<AbortController | null>(null);
  const lastFetchAt = useRef<number | null>(null);
  const isMounted = useRef(true);
  const MIN_FETCH_INTERVAL_MS = 700; // throttle window

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (inflight.current) {
        try {
          inflight.current.abort();
        } catch (e) {
          /* ignore */
        }
        inflight.current = null;
      }
    };
  }, []);

  const fetchBookings = useCallback(
    async (providerId?: string, reason = "manual") => {
      if (!providerId) return;

      const now = Date.now();
      if (
        lastFetchAt.current &&
        now - (lastFetchAt.current ?? 0) < MIN_FETCH_INTERVAL_MS
      ) {
        console.debug(
          `[VendorBookings] Skipping fetch (throttled). reason=${reason}`
        );
        return;
      }
      if (inflight.current) {
        console.debug(
          "[VendorBookings] Skipping fetch (already in-flight). reason=",
          reason
        );
        return;
      }

      lastFetchAt.current = now;
      const controller = new AbortController();
      inflight.current = controller;

      if (isMounted.current) setLoading(true);

      const execute = async (attempt = 0): Promise<void> => {
        try {
          // adjust signature if your API expects options differently
          const resp = await bookingsApi.getProviderBookings(providerId, {
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            console.debug("[VendorBookings] fetch aborted after response");
            return;
          }

          const loaded = resp?.data?.bookings ?? resp?.data ?? [];
          if (!isMounted.current) return;
          setBookings(Array.isArray(loaded) ? loaded : []);
          console.debug(
            "[VendorBookings] fetched",
            Array.isArray(loaded) ? loaded.length : 0,
            "bookings"
          );
        } catch (err: any) {
          const name = err?.name ?? err?.code ?? "";
          if (
            name === "AbortError" ||
            name === "CanceledError" ||
            name === "ERR_CANCELED"
          ) {
            console.debug("[VendorBookings] fetch canceled/aborted:", name);
            return;
          }

          // log full error for debugging
          try {
            console.error(
              "[VendorBookings] fetch error:",
              err?.message ?? err,
              "status:",
              err?.response?.status,
              "data:",
              err?.response?.data ?? err
            );
          } catch {
            console.error(
              "[VendorBookings] fetch error (logging failed):",
              err
            );
          }

          // retry once for network-like errors
          const isNetworkError = !err?.response || err?.code === "ECONNABORTED";
          if (attempt < 1 && isNetworkError) {
            const backoff = 300 * (attempt + 1);
            console.debug(`[VendorBookings] retrying fetch in ${backoff}ms`);
            await new Promise((r) => setTimeout(r, backoff));
            return execute(attempt + 1);
          }

          if (isMounted.current) {
            showToast(
              getApiErrorMessage(err, "Failed to fetch bookings"),
              "error"
            );
            setBookings([]);
          }
        } finally {
          // clear inflight only if it's our controller
          if (inflight.current === controller) inflight.current = null;
          if (isMounted.current) setLoading(false);
        }
      };

      return execute();
    },
    [showToast]
  );

  // load when provider id becomes available
  useEffect(() => {
    if (!user?.id) return;
    fetchBookings(user.id, "mount").catch((e) =>
      console.error("fetchBookings mount error:", e)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleApproveBooking = async (
    bookingId: string,
    isApproved: boolean
  ) => {
    try {
      await bookingsApi.providerApproveBooking(bookingId, isApproved);
      showToast(
        `Booking ${isApproved ? "approved" : "rejected"} successfully`,
        "success"
      );
      if (user?.id)
        fetchBookings(user.id, "after-approve").catch((e) => console.error(e));
    } catch (err) {
      console.error("[VendorBookings] approve failed:", err);
      showToast(getApiErrorMessage(err, "Action failed"), "error");
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
        actor: user?.id ?? "provider",
      });
      showToast(`Booking marked as ${status}`, "success");
      if (user?.id)
        fetchBookings(user.id, "after-status-change").catch((e) =>
          console.error(e)
        );
    } catch (err) {
      console.error("[VendorBookings] status change failed:", err);
      showToast(getApiErrorMessage(err, "Action failed"), "error");
    }
  };

  const getStatusBadge = (booking: Booking) => {
    const status = booking.status;
    if (status === "scheduled") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <Shield className="w-4 h-4" /> Ready to deliver
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Completed
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" /> Cancelled
        </span>
      );
    }

    const prov = booking.isProviderApproved;
    if (prov === true) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Approved by You
        </span>
      );
    }
    if (prov === false) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" /> Rejected
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" /> Awaiting Your Approval
      </span>
    );
  };

  const canApprove = (booking: Booking) =>
    !booking.status &&
    (booking.isProviderApproved === undefined ||
      booking.isProviderApproved === null);

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Booking Requests
          </h1>
          <p className="text-gray-600">Manage customer booking requests</p>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600">
              Bookings will appear here when customers book your services
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {typeof booking.service === "object"
                        ? booking.service.name
                        : "Service"}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Customer:</strong>{" "}
                        {typeof booking.user === "object"
                          ? booking.user.name
                          : "User"}{" "}
                        {typeof booking.user === "object" &&
                          booking.user.email &&
                          `(${booking.user.email})`}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Scheduled:</strong>{" "}
                        {booking.bookingDate && booking.bookingTime
                          ? new Date(
                              `${booking.bookingDate}T${
                                booking.bookingTime?.slice(0, 5) ?? "00:00"
                              }`
                            ).toLocaleString()
                          : booking.bookingDateTime
                          ? new Date(booking.bookingDateTime).toLocaleString()
                          : "Not scheduled"}
                      </p>
                      {typeof booking.service === "object" && (
                        <p>
                          <strong>Price:</strong> ${booking.service.price}
                        </p>
                      )}
                      <p>
                        <strong>Booked on:</strong>{" "}
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
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
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleApproveBooking(booking._id, false)
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    ) : booking.status === "scheduled" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              booking._id,
                              "completed",
                              "Marked complete by provider"
                            )
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark completed
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              booking._id,
                              "cancelled",
                              "Cancelled after scheduling"
                            )
                          }
                          className="flex items-center gap-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium"
                        >
                          <Flag className="w-4 h-4" /> Cancel
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

export default VendorBookings;
