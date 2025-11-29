import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Home, User, Briefcase, Shield } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    // AuthContext handles redirect
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "#/admin/dashboard";
    if (user.role === "service_provider") return "#/vendor/dashboard";
    return "#/user/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-purple-50 shadow-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-700 hover:text-purple-600" />
            <span className="text-2xl font-bold text-purple-800">
              LocalSewa
            </span>
          </a>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <a
                  href="#/"
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </a>
                <a
                  href={getDashboardLink()}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition"
                >
                  {user?.role === "admin" && <Shield className="w-5 h-5" />}
                  {user?.role === "service_provider" && (
                    <Briefcase className="w-5 h-5" />
                  )}
                  {user?.role === "user" && <User className="w-5 h-5" />}
                  <span>Dashboard</span>
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {user?.name}{" "}
                    <span className="text-purple-600 font-medium">
                      ({user?.role})
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <a
                  href="#/login"
                  className="text-gray-700 hover:text-purple-600 transition font-medium"
                >
                  Login
                </a>
                <a
                  href="#/register"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto">{children}</main>
    </div>
  );
}
