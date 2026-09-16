import {
  FiHome,
  FiFileText,
  FiPlusCircle,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";

function Sidebar({
  activeItem = "Dashboard",
  onNavigate,
  hospitalName = "ESIC User",
}) {
  return (
    <aside className="hospital-sidebar">
      {/* BRAND */}

      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/esic-logo.png" alt="ESIC" />
        </div>

        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">ESIC</div>

          <div className="sidebar-brand-subtitle">Grievance Portal</div>

          <div className="sidebar-brand-org">
            Employees' State Insurance
            <br />
            Corporation
          </div>
        </div>
      </div>

      {/* NAVIGATION */}

      <nav className="sidebar-navigation">
        <button
          type="button"
          className={
            activeItem === "Dashboard" ? "sidebar-item active" : "sidebar-item"
          }
          onClick={() => onNavigate?.("Dashboard")}
        >
          <FiHome size={21} />

          <span>Dashboard</span>
        </button>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            Grievances
            <FiChevronDown size={17} />
          </div>

          <button
            type="button"
            className={
              activeItem === "Create Grievance"
                ? "sidebar-subitem active"
                : "sidebar-subitem"
            }
            onClick={() => onNavigate?.("Create Grievance")}
          >
            <FiPlusCircle size={19} />

            <span>Create Grievance</span>
          </button>

          <button
            type="button"
            className={
              activeItem === "My Grievances"
                ? "sidebar-subitem active"
                : "sidebar-subitem"
            }
            onClick={() => onNavigate?.("My Grievances")}
          >
            <FiFileText size={19} />

            <span>My Grievances</span>
          </button>
        </div>
      </nav>

      {/* HOSPITAL CARD */}

      <div className="sidebar-bottom">
        <div className="hospital-info-card">
          <div className="hospital-info-icon">
            <FaBuilding size={26} />
          </div>

          <div className="hospital-info">
            <div className="hospital-name">{hospitalName}</div>

            <div className="hospital-location">Kolkata, West Bengal</div>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="sidebar-logout"
          onClick={() => onNavigate?.("Logout")}
        >
          <FiLogOut size={21} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
