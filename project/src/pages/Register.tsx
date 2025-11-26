import { useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { Layout } from "../components/Layout";
import { useToast } from "../components/Toast";
import { UserPlus, User, Briefcase } from "lucide-react";
import { getApiErrorMessage } from "../utils/errors";
import { areasApi } from "../api/areas";
import { KathmanduArea } from "../types";

export function Register() {
  const [role, setRole] = useState<"user" | "service_provider">("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [localAreaSlug, setLocalAreaSlug] = useState("");
  const [areas, setAreas] = useState<KathmanduArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === "user") {
        await authApi.userRegister(formData);
      } else {
        if (!localAreaSlug) {
          showToast("Pick your Kathmandu local area", "error");
          return;
        }
        await authApi.providerRegister({
          ...formData,
          localAreaSlug,
        });
      }

      showToast("Registration successful! Please login.", "success");
      setTimeout(() => {
        window.location.hash = "/login";
      }, 1500);
      setLocalAreaSlug("");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Registration failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadAreas = async () => {
      try {
        setAreasLoading(true);
        const response = await areasApi.getAll();
        if (cancelled) return;
        setAreas(response.data.areas || []);
      } catch (error) {
        if (!cancelled) {
          showToast(
            getApiErrorMessage(error, "Unable to load Kathmandu areas"),
            "error"
          );
        }
      } finally {
        if (!cancelled) setAreasLoading(false);
      }
    };
    loadAreas();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <a href="/home">
              {" "}
              <UserPlus className="w-16 h-16 text-purple-600 mx-auto mb-4" />{" "}
            </a>
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 mt-2">Join LocalSewa today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "user"
                      ? "border-purple-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <User
                    className={`w-8 h-8 mx-auto mb-2 ${
                      role === "user" ? "text-purple-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      role === "user" ? "text-purple-600" : "text-gray-600"
                    }`}
                  >
                    User
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Book services</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("service_provider")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "service_provider"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Briefcase
                    className={`w-8 h-8 mx-auto mb-2 ${
                      role === "service_provider"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      role === "service_provider"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    Service Provider
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Offer services</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Your address"
                rows={2}
              />
            </div>

            {role === "service_provider" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local area inside Kathmandu
                </label>
                <select
                  value={localAreaSlug}
                  onChange={(e) => setLocalAreaSlug(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                >
                  <option value="">
                    {areasLoading ? "Loading areas..." : "Select your area"}
                  </option>
                  {areas.map((area) => (
                    <option key={area.slug} value={area.slug}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  We use this to suggest you to nearby users when their first
                  choice is unavailable.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <a
              href="#/login"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
