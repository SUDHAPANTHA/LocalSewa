import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../api/bookings";
import { reviewsApi } from "../../api/reviews";
import { Booking, Review } from "../../types";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { getApiErrorMessage } from "../../utils/errors";
import { formatNpr } from "../../utils/currency";

import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  CircleSlash,
  Shield,
  Star,
} from "lucide-react";

/**
 * Full UserBookings component — fixed infinite re-fetch issue.
 * Fetch logic moved inside useEffect and guarded with `mounted` flag.
 */

export function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [userReviews, setUserReviews] = useState<Record<string, Review>>({});
  const [reviewModal, setReviewModal] = useState<{
    booking: Booking;
    review?: Review;
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);

  const fetchUserReviews = useCallback(
    async (list: Booking[]) => {
      console.log("fetchUserReviews called with list:", list);
      if (!user?.id || list.length === 0) {
        console.log("Skipping review fetch - no user or empty list");
        setUserReviews({});
        return;
      }
      const serviceIds = Array.from(
        new Set(
          list
            .map((booking) =>
              typeof booking.service === "object"
                ? booking.service._id
                : booking.service
            )
            .filter(Boolean)
        )
      );
      console.log("Fetching reviews for service IDs:", serviceIds);
      try {
        const results = await Promise.all(
          serviceIds.map(async (serviceId) => {
            if (!serviceId) return null;
            const response = await reviewsApi.list(serviceId, {
              limit: 1,
              userId: user.id,
            });
            return response.data.reviews[0]
              ? { serviceId, review: response.data.reviews[0] }
              : null;
          })
        );
        const mapped: Record<string, Review> = {};
        results.forEach((entry) => {
          if (entry?.serviceId && entry.review) {
            mapped[entry.serviceId] = entry.review;
          }
        });
        console.log("Reviews fetched successfully:", mapped);
        setUserReviews(mapped);
      } catch (error) {
        console.error("Failed to load user reviews", error);
        // Don't let review fetch failure block bookings display
        setUserReviews({});
      }
    },
    [user?.id]
  );

  const { showToast, ToastComponent } = useToast();

  // Fetch bookings when user.id changes. Local function inside useEffect avoids
  // dependency identity loops from unstable callbacks.
  useEffect(() => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetch = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        console.log("Fetching bookings for user:", user.id);
        const response = await bookingsApi.getUserBookings(user.id);
        console.log("Bookings API response:", response);
        console.log("Response data:", response.data);
        console.log("=== STARTING BOOKING EXTRACTION ===");

        if (!mounted) return;

        // Handle both response formats
        let list = [];
        console.log(
          "Checking response.data.data?.bookings:",
          response.data.data?.bookings
        );
        if (response.data.data?.bookings) {
          // New format: { success: true, data: { bookings: [...] } }
          list = response.data.data.bookings;
          console.log("Using format 1 - response.data.data.bookings");
        } else if (response.data.bookings) {
          // Alternative format: { bookings: [...] }
          list = response.data.bookings;
          console.log("Using format 2 - response.data.bookings");
        } else if (Array.isArray(response.data)) {
          // Direct array format
          list = response.data;
          console.log("Using format 3 - direct array");
        } else {
          console.error("UNKNOWN RESPONSE FORMAT!", response.data);
        }

        console.log("=== EXTRACTED BOOKINGS LIST ===", list);
        console.log("List length:", list.length);
        console.log("List is array?", Array.isArray(list));

        setBookings(list);
        console.log("=== BOOKINGS STATE SET ===");

        await fetchUserReviews(list);
        console.log("=== REVIEWS FETCH COMPLETED ===");
      } catch (error) {
        if (!mounted) return;
        console.error("Bookings fetch error:", error);
        console.error("Error response:", (error as any)?.response?.data);
        showToast(
          getApiErrorMessage(error, "Failed to fetch bookings"),
          "error"
        );
        setBookings([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetch();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Removed showToast and fetchUserReviews to prevent re-render loops

  const handleUpdateBooking = async () => {
    if (!selectedBooking || !newDate) return;
    setUpdateLoading(true);
    try {
      await bookingsApi.updateBooking(selectedBooking._id, { date: newDate });
      showToast("Booking updated successfully", "success");
      setSelectedBooking(null);
      setNewDate("");
      if (user?.id) {
        // refetch
        try {
          const resp = await bookingsApi.getUserBookings(user.id);
          const list = resp.data.data?.bookings || [];
          setBookings(list);
          fetchUserReviews(list);
        } catch (err) {
          // swallow here since toast already shown on failure below if needed
        }
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "Update failed"), "error");
    } finally {
      setUpdateLoading(false);
    }
  };

  const openCancelModal = (bookingId: string) => {
    setCancelBookingId(bookingId);
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingId) return;
    setCancelLoading(true);
    try {
      await bookingsApi.cancelBooking(cancelBookingId);
      showToast("Booking cancelled successfully", "success");
      if (user?.id) {
        try {
          const resp = await bookingsApi.getUserBookings(user.id);
          const list = resp.data.data?.bookings || [];
          setBookings(list);
          fetchUserReviews(list);
        } catch (err) {
          // ignore here
        }
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "Cancellation failed"), "error");
    } finally {
      setCancelLoading(false);
      setCancelBookingId(null);
    }
  };

  const canReviewBooking = (booking: Booking) => booking.status === "completed";

  const openReviewModal = (booking: Booking) => {
    const serviceId =
      typeof booking.service === "object"
        ? booking.service._id
        : booking.service;
    const existing = serviceId ? userReviews[serviceId] : undefined;
    setReviewForm({
      rating: existing?.rating || 5,
      title: existing?.title || "",
      comment: existing?.comment || "",
    });
    setReviewModal({ booking, review: existing });
  };

  const handleReviewSave = async () => {
    if (!reviewModal || !user) return;
    const serviceId =
      typeof reviewModal.booking.service === "object"
        ? reviewModal.booking.service._id
        : reviewModal.booking.service;
    if (!serviceId) return;

    setReviewSaving(true);
    try {
      if (reviewModal.review) {
        await reviewsApi.update(reviewModal.review._id, {
          userId: user.id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        });
      } else {
        await reviewsApi.create(serviceId, {
          userId: user.id,
          bookingId: reviewModal.booking._id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        });
      }
      await fetchUserReviews(bookings);
      showToast("Review saved", "success");
      setReviewModal(null);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to save review"), "error");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleReviewDelete = async (review?: Review) => {
    if (!user) return;
    const targetReview = review ?? reviewModal?.review;
    if (!targetReview) return;
    setReviewDeleting(true);
    try {
      await reviewsApi.remove(targetReview._id, user.id);
      await fetchUserReviews(bookings);
      showToast("Review deleted", "success");
      setReviewModal(null);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to delete review"), "error");
    } finally {
      setReviewDeleting(false);
    }
  };

  const formatDate = (
    date?: string | null,
    time?: string | null,
    rawDateTime?: string | null
  ) => {
    const source =
      date && time
        ? `${date}T${time.slice(0, 5)}`
        : rawDateTime
        ? rawDateTime
        : null;
    if (!source) return "Date not set";
    const full = new Date(source);
    if (isNaN(full.getTime())) return "Invalid date";
    return full.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      ),
    [bookings]
  );

  const statusBadgeConfig = {
    pending: {
      label: "Awaiting review",
      className: "bg-yellow-50 text-yellow-800 border border-yellow-100",
      icon: Clock,
    },
    confirmed: {
      label: "Provider confirmed",
      className: "bg-blue-50 text-blue-700 border border-blue-100",
      icon: CheckCircle,
    },
    scheduled: {
      label: "Fully scheduled",
      className: "bg-green-50 text-green-800 border border-green-100",
      icon: Shield,
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-800 border border-emerald-100",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 border border-rose-100",
      icon: CircleSlash,
    },
  } as const;

  const canModifyBooking = (booking: Booking) => {
    const lockedStatuses = ["confirmed", "scheduled", "completed", "cancelled"];
    if (booking.status && lockedStatuses.includes(booking.status)) return false;
    return (
      booking.isProviderApproved === undefined ||
      booking.isProviderApproved === null
    );
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.status && statusBadgeConfig[booking.status]) {
      const config = statusBadgeConfig[booking.status];
      const Icon = config.icon;
      return (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${config.className}`}
        >
          <Icon className="w-4 h-4" />
          {config.label}
        </div>
      );
    }

    const prov = booking.isProviderApproved;
    const adm = booking.isAdminApproved;

    if (prov === false || adm === false) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-sm font-semibold shadow-sm">
          <CircleSlash className="w-4 h-4" />
          Rejected
        </div>
      );
    }

    if (prov === true && adm === true) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-100 text-sm font-semibold shadow-sm">
          <CheckCircle className="w-4 h-4" />
          Approved
        </div>
      );
    }

    if (prov === true) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm font-semibold shadow-sm">
          <CheckCircle className="w-4 h-4" />
          Awaiting Admin Review
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100 text-sm font-semibold shadow-sm">
        <Clock className="w-4 h-4" />
        Pending Provider Approval
      </div>
    );
  };

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2">
          My Bookings
        </h1>
        <p className="text-slate-500 mb-6">
          Manage your active and past bookings
        </p>

        {loading ? (
          <p className="text-slate-600">Loading bookings...</p>
        ) : sortedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              No bookings yet
            </h3>
            <p className="text-slate-500 mb-6">
              Start by browsing available services
            </p>
            <a
              href="#/user/services"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-700 transition"
            >
              Browse Services
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedBookings.map((booking) => {
              const modifiable = canModifyBooking(booking);
              const statusBadge = getStatusBadge(booking);
              const latestStatus =
                booking.statusTimeline && booking.statusTimeline.length > 0
                  ? booking.statusTimeline[booking.statusTimeline.length - 1]
                  : null;
              const scheduledDisplay = formatDate(
                booking.bookingDate,
                booking.bookingTime,
                booking.bookingDateTime
              );
              const defaultDateTimeValue =
                booking.bookingDate && booking.bookingTime
                  ? `${booking.bookingDate}T${booking.bookingTime.slice(0, 5)}`
                  : booking.bookingDateTime
                  ? new Date(booking.bookingDateTime).toISOString().slice(0, 16)
                  : "";
              const serviceId =
                typeof booking.service === "object"
                  ? booking.service._id
                  : booking.service;
              const userReview = serviceId ? userReviews[serviceId] : undefined;
              const reviewEligible = canReviewBooking(booking);

              return (
                <article
                  key={booking._id}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:gap-6 hover:shadow-xl transition"
                >
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                      <Tag className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
                          {typeof booking.service === "object"
                            ? booking.service.name
                            : "Service"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Provider:{" "}
                          <span className="text-slate-800 font-medium">
                            {typeof booking.provider === "object"
                              ? booking.provider.name
                              : "Provider"}
                          </span>
                        </p>
                      </div>
                      <div>{statusBadge}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-slate-700 font-medium">
                            {scheduledDisplay}
                          </div>
                          <div className="text-xs text-slate-400">
                            Scheduled
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                          Confirmation
                        </p>
                        <p className="font-semibold text-slate-800">
                          {booking.confirmationCode || "Pending"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-slate-400">Price</div>
                        <div className="ml-2 font-semibold text-slate-800">
                          {booking.totalAmount != null
                            ? formatNpr(booking.totalAmount)
                            : typeof booking.service === "object"
                            ? booking.service.priceLabel ||
                              formatNpr(booking.service.price)
                            : "—"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-slate-400">Booked on</div>
                        <div className="ml-2 text-slate-800">
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </div>
                    {userReview ? (
                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold">
                            {userReview.rating.toFixed(1)} / 5
                          </span>
                          <span className="text-xs text-slate-500">
                            {userReview.updatedAt
                              ? new Date(
                                  userReview.updatedAt
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        {userReview.comment && (
                          <p className="text-slate-600">{userReview.comment}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openReviewModal(booking)}
                            className="text-xs px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          >
                            Edit review
                          </button>
                          <button
                            onClick={() => handleReviewDelete(userReview)}
                            disabled={reviewDeleting}
                            className="text-xs px-3 py-1 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {reviewDeleting ? "Removing..." : "Delete review"}
                          </button>
                        </div>
                      </div>
                    ) : reviewEligible ? (
                      <div className="mt-4">
                        <button
                          onClick={() => openReviewModal(booking)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                        >
                          Rate this service
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 mt-4 sm:mt-0">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setNewDate(defaultDateTimeValue);
                        }}
                        title={
                          modifiable
                            ? "Edit booking"
                            : "Cannot edit after provider review"
                        }
                        disabled={!modifiable}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition ${
                          modifiable
                            ? "bg-white border border-slate-200 text-sky-600 hover:shadow-md hover:-translate-y-0.5"
                            : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => openCancelModal(booking._id)}
                        title={
                          modifiable
                            ? "Cancel booking"
                            : "Cannot cancel after provider approval"
                        }
                        disabled={!modifiable}
                        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                          modifiable
                            ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">
                      {latestStatus ? (
                        <>
                          {latestStatus.note || latestStatus.status} ·{" "}
                          {latestStatus.changedAt
                            ? new Date(latestStatus.changedAt).toLocaleString()
                            : ""}
                        </>
                      ) : modifiable ? (
                        "You can edit or cancel until the provider reviews it."
                      ) : (
                        "Already reviewed by the provider; editing disabled."
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => {
          setSelectedBooking(null);
          setNewDate("");
        }}
        title="Update Booking"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {typeof selectedBooking.service === "object"
                  ? selectedBooking.service.name
                  : "Service"}
              </h3>
              <p className="text-slate-600 mt-1">
                Provider:{" "}
                <span className="font-medium text-slate-800">
                  {typeof selectedBooking.provider === "object"
                    ? selectedBooking.provider.name
                    : "Provider"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                New Date & Time
              </label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                required
              />
            </div>

            <button
              onClick={handleUpdateBooking}
              disabled={updateLoading || !newDate}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-lg font-medium hover:from-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? "Updating..." : "Update Booking"}
            </button>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        title="Cancel Booking?"
      >
        <p className="text-slate-700 mb-4">
          Are you sure you want to cancel this booking? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={confirmCancelBooking}
            disabled={cancelLoading}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
          </button>
          <button
            onClick={() => setCancelBookingId(null)}
            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition"
          >
            No, Keep
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={reviewModal?.review ? "Edit your review" : "Rate this service"}
      >
        {reviewModal && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {typeof reviewModal.booking.service === "object"
                  ? reviewModal.booking.service.name
                  : "Service"}
              </h3>
              <p className="text-sm text-slate-500">
                Booking ID: {reviewModal.booking.confirmationCode}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rating
              </label>
              <select
                value={reviewForm.rating}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} Star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comment
              </label>
              <textarea
                rows={4}
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReviewSave}
                disabled={reviewSaving}
                className="flex-1 min-w-[140px] px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {reviewSaving ? "Saving..." : "Save review"}
              </button>
              {reviewModal.review && (
                <button
                  onClick={() => handleReviewDelete()}
                  disabled={reviewDeleting}
                  className="flex-1 min-w-[140px] px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  {reviewDeleting ? "Removing..." : "Delete review"}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
