import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Chatbot } from "./components/Chatbot";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UserDashboard } from "./pages/user/UserDashboard";
import { Services } from "./pages/user/Services";
import { ProviderDetail } from "./pages/user/ProviderDetail";
import { UserBookings } from "./pages/user/UserBookings";
import { VendorDashboard } from "./pages/vendor/VendorDashboard";
import { VendorServices } from "./pages/vendor/VendorServices";
import { VendorBookings } from "./pages/vendor/VendorBookings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProviders } from "./pages/admin/AdminProviders";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminServices } from "./pages/admin/AdminServices";
import { AdminComplaints } from "./pages/admin/AdminComplaints";
import { UserComplaints } from "./pages/user/UserComplaints";
import { VendorComplaints } from "./pages/vendor/VendorComplaints";
import { Chat } from "./pages/Chat";

function App() {
  const getInitialPath = () => {
    const storedUser = localStorage.getItem("user");
    const currentHash = window.location.hash || "#/";

    // If NOT logged in, always start at homepage
    if (!storedUser) {
      // Clear any hash and go to homepage
      if (currentHash !== "#/" && currentHash !== "#/login" && currentHash !== "#/register") {
        window.location.hash = "/";
        return "#/";
      }
      return currentHash;
    }

    // If logged in and on homepage/login/register, redirect to dashboard
    if (currentHash === "#/" || currentHash === "#/login" || currentHash === "#/register") {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "admin") return "#/admin/dashboard";
        if (user.role === "service_provider") return "#/vendor/dashboard";
        if (user.role === "user") return "#/user/dashboard";
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem("user");
        window.location.hash = "/";
        return "#/";
      }
    }

    // Logged in, use current hash
    return currentHash;
  };

  const [currentPath, setCurrentPath] = useState(getInitialPath());

  // On mount, ensure we're on the correct page
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const currentHash = window.location.hash || "#/";

    // If not logged in and on a protected route, go to homepage
    if (!storedUser) {
      const protectedRoutes = ['/user/', '/vendor/', '/admin/'];
      const isProtected = protectedRoutes.some(route => currentHash.includes(route));
      
      if (isProtected) {
        window.location.hash = "/";
        setCurrentPath("#/");
      }
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderPage = () => {
    const path = currentPath.replace("#", "");

    switch (path) {
      case "/":
        return <Home />;
      case "/login":
        return <Login />;
      case "/register":
        return <Register />;
      case "/user/dashboard":
        return (
          <ProtectedRoute allowedRoles={["user"]}>
            <UserDashboard />
          </ProtectedRoute>
        );
      case "/user/services":
        return (
          <ProtectedRoute allowedRoles={["user"]}>
            <Services />
          </ProtectedRoute>
        );
      case "/user/bookings":
        return (
          <ProtectedRoute allowedRoles={["user"]}>
            <UserBookings />
          </ProtectedRoute>
        );
      case "/user/complaints":
        return (
          <ProtectedRoute allowedRoles={["user"]}>
            <UserComplaints />
          </ProtectedRoute>
        );
      case "/user/chat":
      case "/vendor/chat":
        return (
          <ProtectedRoute allowedRoles={["user", "service_provider"]}>
            <Chat />
          </ProtectedRoute>
        );
      case "/vendor/dashboard":
        return (
          <ProtectedRoute allowedRoles={["service_provider"]}>
            <VendorDashboard />
          </ProtectedRoute>
        );
      case "/vendor/services":
        return (
          <ProtectedRoute allowedRoles={["service_provider"]}>
            <VendorServices />
          </ProtectedRoute>
        );
      case "/vendor/bookings":
        return (
          <ProtectedRoute allowedRoles={["service_provider"]}>
            <VendorBookings />
          </ProtectedRoute>
        );
      case "/vendor/complaints":
        return (
          <ProtectedRoute allowedRoles={["service_provider"]}>
            <VendorComplaints />
          </ProtectedRoute>
        );
      case "/admin/dashboard":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        );
      case "/admin/providers":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProviders />
          </ProtectedRoute>
        );
      case "/admin/bookings":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminBookings />
          </ProtectedRoute>
        );
      case "/admin/users":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        );
      case "/admin/services":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminServices />
          </ProtectedRoute>
        );
      case "/admin/complaints":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminComplaints />
          </ProtectedRoute>
        );
      default:
        if (path.startsWith("/user/provider/")) {
          return (
            <ProtectedRoute allowedRoles={["user"]}>
              <ProviderDetail />
            </ProtectedRoute>
          );
        }
        return <Home />;
    }
  };

  return (
    <AuthProvider>
      {renderPage()}
      <Chatbot />
    </AuthProvider>
  );
}

export default App;
