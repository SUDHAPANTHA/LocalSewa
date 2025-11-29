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
      if (role === "user") {
        response = await authApi.userLogin({ email, password });
      } else if (role === "service_provider") {
        response = await authApi.providerLogin({ email, password });
      } else {
        response = await authApi.adminLogin({ email, password });
      }

      login(response.data.data);
      showToast("Login successful!", "success");

      // Small delay to ensure localStorage is updated
      setTimeout(() => {
        // Default dashboard based on role
        let dashboardPath = "/user/dashboard";
        if (role === "admin") {
          dashboardPath = "/admin/dashboard";
        } else if (role === "service_provider") {
          dashboardPath = "/vendor/dashboard";
        }
        
        // Force redirect to dashboard without adding to history
        window.location.replace(window.location.origin + "/#" + dashboardPath);
      }, 100);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Login failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: {
    value: Role;
    label: string;
    icon: typeof User;
    color: string;
  }[] = [
    { value: "user", label: "User", icon: User, color: "blue" },
    {
      value: "service_provider",
      label: "Service Provider",
      icon: Briefcase,
      color: "green",
    },
    { value: "admin", label: "Admin", icon: Shield, color: "red" },
  ];

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <a href="/home">
              {" "}
              <LogIn className="w-16 h-16 text-purple-600 mx-auto mb-4" />{" "}
            </a>
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Login to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        role === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          role === option.value
                            ? `text-${option.color}-600`
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          role === option.value
                            ? `text-${option.color}-600`
                            : "text-gray-600"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{" "}
            <a
              href="#/register"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Register here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
