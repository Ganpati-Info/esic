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
  mode = "hospital",
}) {
  const isAdmin = mode === "admin";
  const isEsic = mode === "esic";
  const isHospital = mode === "hospital";

  return (
    <aside className="hospital-sidebar">
      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/emblem-of-india.png" alt="ESIC" />
        </div>

        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">ESI(MB)</div>

          <div className="sidebar-brand-subtitle">Complaint Portal</div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="sidebar-navigation">
        {/* ===================================================
            DASHBOARD
        =================================================== */}

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

        {/* ===================================================
            GRIEVANCES
        =================================================== */}

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            Complaints
            <FiChevronDown size={17} />
          </div>

          {/* =================================================
              ADMIN / DIRECTOR
          ================================================= */}

          {isAdmin && (
            <button
              type="button"
              className={
                activeItem === "All Grievances"
                  ? "sidebar-subitem active"
                  : "sidebar-subitem"
              }
              onClick={() => onNavigate?.("All Grievances")}
            >
              <FiFileText size={19} />

              <span>All Complaints</span>
            </button>
          )}

          {/* =================================================
              ESIC OFFICER
          ================================================= */}

          {isEsic && (
            <button
              type="button"
              className={
                activeItem === "All Grievances"
                  ? "sidebar-subitem active"
                  : "sidebar-subitem"
              }
              onClick={() => onNavigate?.("All Grievances")}
            >
              <FiFileText size={19} />

              <span>All Grievances</span>
            </button>
          )}

          {/* =================================================
              HOSPITAL
          ================================================= */}

          {isHospital && (
            <>
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
            </>
          )}
        </div>
      </nav>

      {/* =====================================================
          BOTTOM USER CARD
      ===================================================== */}

      <div className="sidebar-bottom">
        <div className="hospital-info-card">
          <div className="hospital-info-icon">
            <FaBuilding size={26} />
          </div>

          <div className="hospital-info">
            {/* ADMIN */}

            {isAdmin && (
              <>
                <div className="hospital-name">Director</div>

                <div className="hospital-location">ESIC (MB)</div>
              </>
            )}

            {/* ESIC */}

            {isEsic && (
              <>
                <div className="hospital-name">ESIC Officer</div>

                <div className="hospital-location">ESIC (MB)</div>
              </>
            )}

            {/* HOSPITAL */}

            {isHospital && (
              <>
                <div className="hospital-name">{hospitalName}</div>

                <div className="hospital-location">Kolkata, West Bengal</div>
              </>
            )}
          </div>
        </div>

        {/* ===================================================
            LOGOUT
        =================================================== */}

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
