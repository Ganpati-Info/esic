import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import HospitalHeader from "./components/HospitalHeader";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import CreateGrievance from "./pages/hospital/CreateGrievance";
import MyGrievances from "./pages/hospital/MyGrievances";
import Login from "./pages/Login";

import "./App.css";

function ProtectedRoute({ children }) {
  const storedUser = sessionStorage.getItem("esicUser");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  let isInvalidUser = false;

  try {
    user = JSON.parse(storedUser);
  } catch {
    isInvalidUser = true;
  }

  if (isInvalidUser || !user || !user.userId || !user.role) {
    sessionStorage.removeItem("esicUser");
    return <Navigate to="/login" replace />;
  }

  return children;
}

function HospitalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("esicUser"));
  const hospitalName = currentUser.hospitalName || "ESIC User";

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
    }

    navigate(paths[item] || "/hospital/dashboard");
  };

  return (
    <div className="hospital-app">
      <Sidebar
        activeItem={activeItem}
        onNavigate={handleNavigate}
        hospitalName={hospitalName}
      />

      <div className="hospital-content">
        <HospitalHeader hospitalName={hospitalName} />

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

function App() {
  return (
    <Routes>
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
      <Route
        path="/hospital/*"
        element={
          <ProtectedRoute>
            <HospitalLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
