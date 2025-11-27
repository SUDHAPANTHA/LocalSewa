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
  // Check if session is fresh (new tab or browser restart)
  const getInitialPath = () => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // If no recent activity (new tab/session), go to homepage
    if (!lastActivity || (now - parseInt(lastActivity)) > fiveMinutes) {
      sessionStorage.setItem('lastActivity', now.toString());
      return '#/';
    }
    
    // Recent activity, keep current hash
    sessionStorage.setItem('lastActivity', now.toString());
    return window.location.hash || '#/';
  };

  const [currentPath, setCurrentPath] = useState(getInitialPath());

  useEffect(() => {
    // Update last activity on any interaction
    const updateActivity = () => {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
      sessionStorage.setItem('lastActivity', Date.now().toString());
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
