// src/pages/admin/AdminUsers.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import { adminApi } from "../../api/admin";
import { User } from "../../types";
import { useToast } from "../../components/Toast";
import {
  Users as UsersIcon,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();
  const { user: currentUser } = useAuth();

  // concurrency / lifecycle guards
  const isMounted = useRef(true);
  const inflight = useRef<AbortController | null>(null);
  const lastFetchAt = useRef<number | null>(null);
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

  // centralized fetch (abort + throttle + logging + one retry)
  const refetchUsers = async (reason: string = "manual") => {
    const now = Date.now();
    if (
      lastFetchAt.current &&
      now - (lastFetchAt.current ?? 0) < MIN_FETCH_INTERVAL_MS
    ) {
      console.debug(
        `[AdminUsers] Skipping fetch (throttled). reason=${reason} elapsed=${
          now - (lastFetchAt.current ?? 0)
        }ms`
      );
      return;
    }
    if (inflight.current) {
      console.debug(
        "[AdminUsers] Skipping fetch (already in-flight). reason=",
        reason
      );
      return;
    }

    console.debug(`[AdminUsers] Fetching users — reason=${reason}`);
    lastFetchAt.current = now;

    const controller = new AbortController();
    inflight.current = controller;

    if (isMounted.current) setLoading(true);
    if (isMounted.current) setFetchError(null);

    const executeFetch = async (attempt = 0): Promise<void> => {
      try {
        // Ensure adminApi.getAllUsers supports a signal option:
        // adminApi.getAllUsers({ signal: controller.signal })
        const resp = await adminApi.getAllUsers({
          signal: controller.signal,
        });

        if (!isMounted.current || controller.signal.aborted) return;

        const loaded = resp?.data?.users ?? resp?.data ?? [];
        setUsers(Array.isArray(loaded) ? loaded : []);
        console.debug(
          "[AdminUsers] Fetched",
          (Array.isArray(loaded) && loaded.length) || 0,
          "users"
        );
        return;
      } catch (err: any) {
        const name = err?.name ?? err?.code ?? "";
        // treat abort/cancel as normal (no user-facing toast)
        if (
          name === "AbortError" ||
          name === "CanceledError" ||
          name === "ERR_CANCELED"
        ) {
          console.debug("[AdminUsers] Fetch canceled/aborted:", name);
          return;
        }

        // log full error for debugging
        try {
          console.error(
            "[AdminUsers] Fetch error:",
            err?.message ?? err,
            "status:",
            err?.response?.status,
            "data:",
            err?.response?.data ?? err
          );
        } catch (logErr) {
          console.error("[AdminUsers] Fetch error (logging failed):", err);
        }

        // retry once for network-like errors
        const isNetworkError = !err?.response || err?.code === "ECONNABORTED";
        if (attempt < 1 && isNetworkError) {
          const backoff = 250 * (attempt + 1);
          console.debug(`[AdminUsers] retrying fetch in ${backoff}ms`);
          await new Promise((r) => setTimeout(r, backoff));
          return executeFetch(attempt + 1);
        }

        const friendly = getApiErrorMessage(
          err,
          "Unable to load users right now. Please check your connection and try again."
        );
        if (isMounted.current) {
          setFetchError(friendly);
          showToast(friendly, "error");
        }
      } finally {
        if (isMounted.current) {
          // only clear inflight if it's our controller
          if (inflight.current === controller) inflight.current = null;
          setLoading(false);
        }
      }
    };

    await executeFetch();
  };

  // initial load once
  useEffect(() => {
    refetchUsers("mount").catch((e) =>
      console.error("refetchUsers mount error:", e)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteUser = async (userId?: string) => {
    if (!userId) {
      showToast("User id missing", "error");
      return;
    }
    if (currentUser?.id === userId) {
      showToast("You can't delete your own admin account", "error");
      return;
    }

    if (!confirm("Delete this user and all their bookings?")) return;

    try {
      await adminApi.deleteUser(userId);
      showToast("User deleted successfully", "success");
      // update local list to avoid immediate refetch storms
      if (isMounted.current) {
        setUsers((prev) =>
          prev.filter((u) => (u.id || (u as any)._id) !== userId)
        );
      }
    } catch (error: any) {
      console.error("Delete user failed:", error);
      showToast(getApiErrorMessage(error, "Failed to delete user"), "error");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.name?.toLowerCase() || "").includes(term) ||
        (u.email?.toLowerCase() || "").includes(term) ||
        (u.role?.toLowerCase() || "").includes(term)
    );
  }, [users, search]);

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
            <h1 className="text-4xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600">
              View, search, and remove platform users
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() =>
                refetchUsers("manual-button").catch((e) => console.error(e))
              }
              className="ml-3 px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
              title="Refresh users"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((u, index) => {
              const userKey =
                u.id || (u as any)._id || u.email || `user-${index}`;
              return (
                <div
                  key={userKey}
                  className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:shadow-2xl transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-semibold">
                      {(u.name && u.name.charAt(0).toUpperCase()) ||
                        (u.email && u.email.charAt(0).toUpperCase()) ||
                        "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {u.name || "Unnamed User"}
                        </h3>
                        {u.role === "admin" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Role: {u.role}
                      </p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {u.email}
                        </p>
                        {u.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {u.phone}
                          </p>
                        )}
                        {u.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {u.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(u.id || (u as any)._id)}
                    disabled={
                      currentUser?.id === u.id ||
                      currentUser?.id === (u as any)._id
                    }
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg border transition ${
                      currentUser?.id === u.id ||
                      currentUser?.id === (u as any)._id
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminUsers;
