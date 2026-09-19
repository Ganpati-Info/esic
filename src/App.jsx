import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import HospitalHeader from "./components/HospitalHeader";

import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import CreateGrievance from "./pages/hospital/CreateGrievance";
import MyGrievances from "./pages/hospital/MyGrievances";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllGrievances from "./pages/admin/AllGrievances";

import Login from "./pages/Login";
import SessionExpiredModal from "./components/SessionExpiredModal";

import "./App.css";

/* =========================================================
    SESSION MANAGER
  ========================================================= */

function SessionManager() {
  const navigate = useNavigate();

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener("esic-session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("esic-session-expired", handleSessionExpired);
    };
  }, []);

  const handleLoginAgain = () => {
    sessionStorage.removeItem("esicToken");

    sessionStorage.removeItem("esicUser");

    setSessionExpired(false);

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <SessionExpiredModal open={sessionExpired} onLogin={handleLoginAgain} />
  );
}

/* =========================================================
   GET STORED USER
========================================================= */

function getStoredUser() {
  const storedUser = sessionStorage.getItem("esicUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem("esicUser");
    return null;
  }
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getStoredUser();

  /*
   * Not logged in
   */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Logged in but role is not allowed.
   *
   * IMPORTANT:
   * Do NOT redirect to another protected module.
   * Doing that can create an infinite redirect loop.
   */
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.error("Unauthorized route access:", {
      role: user.role,
      allowedRoles,
    });

    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   HOSPITAL LAYOUT
========================================================= */

function HospitalLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = getStoredUser();

  const hospitalName = currentUser?.name || "ESIC User";

  const activeItems = {
    "/hospital/dashboard": "Dashboard",

    "/hospital/grievances": "My Grievances",

    "/hospital/grievances/create": "Create Grievance",
  };

  const activeItem = activeItems[location.pathname] || "Dashboard";

  const handleNavigate = (item) => {
    const paths = {
      Dashboard: "/hospital/dashboard",

      "My Grievances": "/hospital/grievances",

      "Create Grievance": "/hospital/grievances/create",

      Logout: "/login",
    };

    if (item === "Logout") {
      sessionStorage.removeItem("esicUser");

      sessionStorage.removeItem("esicToken");
    }

    navigate(paths[item] || "/hospital/dashboard");
  };

  return (
    <div className="hospital-app">
      <Sidebar
        mode="hospital"
        activeItem={activeItem}
        onNavigate={handleNavigate}
        hospitalName={hospitalName}
      />

      <div className="hospital-content">
        <HospitalHeader hospitalName={hospitalName} userRole="Hospital User" />

        <main className="hospital-main">
          <Routes>
            <Route
              path="dashboard"
              element={<HospitalDashboard hospitalName={hospitalName} />}
            />

            <Route path="grievances" element={<MyGrievances />} />

            <Route path="grievances/create" element={<CreateGrievance />} />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN / DIRECTOR LAYOUT
========================================================= */

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = getStoredUser();

  const adminName = currentUser?.name || "Director";

  const activeItems = {
    "/admin/dashboard": "Dashboard",

    "/admin/grievances": "All Grievances",
  };

  const activeItem = activeItems[location.pathname] || "Dashboard";

  const handleNavigate = (item) => {
    const paths = {
      Dashboard: "/admin/dashboard",

      "All Grievances": "/admin/grievances",

      Logout: "/login",
    };

    if (item === "Logout") {
      sessionStorage.removeItem("esicUser");

      sessionStorage.removeItem("esicToken");
    }

    navigate(paths[item] || "/admin/dashboard");
  };

  return (
    <div className="hospital-app">
      <Sidebar
        mode="admin"
        activeItem={activeItem}
        onNavigate={handleNavigate}
      />

      <div className="hospital-content">
        <HospitalHeader hospitalName={adminName} userRole="Director" />

        <main className="hospital-main">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="grievances" element={<AllGrievances />} />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <>
      <Routes>
        {/* =================================================
          LOGIN
      ================================================= */}

        <Route
          path="/login"
          element={
            <div className="page">
              <Header />

              <Login />

              <Footer />
            </div>
          }
        />

        {/* =================================================
          HOSPITAL MODULE
      ================================================= */}

        <Route
          path="/hospital/*"
          element={
            <ProtectedRoute allowedRoles={["hospital_user"]}>
              <HospitalLayout />
            </ProtectedRoute>
          }
        />

        {/* =================================================
          DIRECTOR / ADMIN MODULE
      ================================================= */}

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["portal_super_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* =================================================
          FALLBACK
      ================================================= */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <SessionManager />
    </>
  );
}

export default App;
