import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth";
import { Layout } from "../components/Layout";
import { useToast } from "../components/Toast";
import { LogIn, User, Briefcase, Shield } from "lucide-react";
import { getApiErrorMessage } from "../utils/errors";

type Role = "user" | "service_provider" | "admin";

export function Login() {
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (role === "user")
        response = await authApi.userLogin({ email, password });
      else if (role === "service_provider")
        response = await authApi.providerLogin({ email, password });
      else response = await authApi.adminLogin({ email, password });

      login(response.data.data);
      showToast("Login successful!", "success");

      setTimeout(() => {
        let dashboardPath = "/user/dashboard";
        if (role === "admin") dashboardPath = "/admin/dashboard";
        else if (role === "service_provider")
          dashboardPath = "/vendor/dashboard";

        window.location.replace(window.location.origin + "/#" + dashboardPath);
      }, 120);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Login failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "user", label: "User", icon: User },
    { value: "service_provider", label: "Service Provider", icon: Briefcase },
    { value: "admin", label: "Admin", icon: Shield },
  ] as const;

  return (
    <Layout>
      {ToastComponent}

      {/* SIMPLE CLEAN BACKGROUND */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
        {/* CLEAN CARD */}
        <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8 border border-gray-200">
          {/* LOCAL SEWA BRANDING */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              LocalSewa Login
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Access your LocalSewa dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* SIMPLE ROLE SELECTOR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>

              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = role === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-sm transition ${
                        selected
                          ? "border-[#6C4CE6] bg-[#f4f1ff]"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 mb-1 ${
                          selected ? "text-[#6C4CE6]" : "text-gray-500"
                        }`}
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INPUTS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#6C4CE6] focus:border-[#6C4CE6] outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#6C4CE6] focus:border-[#6C4CE6] outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {/* LOCAL SEWA BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-[#5c3dd8] transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-gray-600 mt-6 text-sm">
            Don’t have an account?{" "}
            <a
              href="#/register"
              className="text-purple-600 font-medium hover:underline"
            >
              Register here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
