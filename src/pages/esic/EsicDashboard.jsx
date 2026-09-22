import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiRefreshCw,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import { getGrievances } from "../../lib/grievances";
import GrievanceModal from "../../components/hospital/GrievanceModal";

/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  switch (value) {
    case "pending":
    case "sent to director":
      return "Sent to Director";

    case "sent to esic":
    case "delegated to esic":
      return "Sent to ESIC";

    case "in progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    case "rejected":
      return "Rejected";

    default:
      return String(status || "").trim() || "Unknown";
  }
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDisplayDate(value) {
  if (!value || value === "N/A") {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
  return normalizeStatus(status)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

/* =========================================================
   ESIC DASHBOARD
========================================================= */

function EsicDashboard() {
  const [grievances, setGrievances] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedGrievance, setSelectedGrievance] = useState(null);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const data = await getGrievances(token);

      /*
       * ESIC MUST NOT SEE:
       *
       * - Sent to Director
       * - Rejected
       *
       * ESIC can only work with:
       *
       * - Sent to ESIC
       * - In Progress
       * - Resolved
       */

      const esicGrievances = data
        .map((grievance) => {
          const details = grievance.grievanceDetails || {};

          return {
            id: grievance.databaseId,

            tokenNo: details.tokenNumber || "N/A",

            title: grievance.title || "Untitled Grievance",

            hospital: grievance.creator?.name || "Unknown Hospital",

            hospitalUsername: grievance.creator?.username || "",

            submittedOn: formatDisplayDate(grievance.date),

            lastUpdated: formatDisplayDate(grievance.modified),

            status: normalizeStatus(grievance.statusLabel || ""),

            description: details.description || "",

            image: grievance.currentImageUrl || null,

            generatedImageUrl: grievance.generatedImageUrl || null,

            rejectionRemark: grievance.rejectionRemark || "",
          };
        })
        .filter((grievance) => {
          return (
            grievance.status === "Sent to ESIC" ||
            grievance.status === "In Progress" ||
            grievance.status === "Resolved"
          );
        });

      setGrievances(esicGrievances);
    } catch (err) {
      console.error("Failed to load ESIC dashboard:", err);

      setError(
        err?.message || "Unable to load the ESIC dashboard. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const counts = useMemo(() => {
    return {
      total: grievances.length,

      sentToEsic: grievances.filter(
        (grievance) => grievance.status === "Sent to ESIC",
      ).length,

      inProgress: grievances.filter(
        (grievance) => grievance.status === "In Progress",
      ).length,

      resolved: grievances.filter(
        (grievance) => grievance.status === "Resolved",
      ).length,
    };
  }, [grievances]);

  /* =========================================================
     RECENT GRIEVANCES
  ========================================================= */

  const recentGrievances = useMemo(() => {
    return [...grievances]
      .sort((first, second) => {
        const firstDate = new Date(first.lastUpdated);
        const secondDate = new Date(second.lastUpdated);

        if (Number.isNaN(firstDate.getTime())) {
          return 1;
        }

        if (Number.isNaN(secondDate.getTime())) {
          return -1;
        }

        return secondDate - firstDate;
      })
      .slice(0, 5);
  }, [grievances]);

  /* =========================================================
     STATUS UPDATE FROM MODAL
  ========================================================= */

  const handleStatusUpdate = async () => {
    setSelectedGrievance(null);

    await loadDashboard();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="hospital-dashboard esic-dashboard">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="dashboard-title">
        <div className="dashboard-title-content">
          <div className="dashboard-eyebrow">ESIC MODULE</div>

          <h1>ESIC Dashboard</h1>

          <p>
            Manage grievances delegated to ESIC and monitor their resolution
            status.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <FiRefreshCw
            size={16}
            className={loading ? "refresh-spinning" : ""}
          />

          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="dashboard-error" role="alert">
          <FiAlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section className="dashboard-stats-grid">
        {/* TOTAL */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <FiFileText size={22} />
          </div>

          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Total Assigned</span>

            <strong>{loading ? "—" : counts.total}</strong>
          </div>
        </div>

        {/* SENT TO ESIC */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <FiArrowRight size={22} />
          </div>

          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Sent to ESIC</span>

            <strong>{loading ? "—" : counts.sentToEsic}</strong>
          </div>
        </div>

        {/* IN PROGRESS */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <FiClock size={22} />
          </div>

          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">In Progress</span>

            <strong>{loading ? "—" : counts.inProgress}</strong>
          </div>
        </div>

        {/* RESOLVED */}

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <FiCheckCircle size={22} />
          </div>

          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Resolved</span>

            <strong>{loading ? "—" : counts.resolved}</strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT GRIEVANCES
      ===================================================== */}

      <section className="dashboard-card esic-recent-card">
        <div className="dashboard-card-header">
          <div className="section-header">
            <h2>Recent Grievances</h2>

            <Link to="/esic/grievances" className="view-all">
              <span>View All</span>

              <FiArrowRight size={17} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty-state">
            <span>Loading complaints, please wait...</span>
          </div>
        ) : recentGrievances.length === 0 ? (
          <div className="dashboard-empty-state">
            <FiFileText size={28} />

            <strong>No grievances assigned</strong>

            <span>Grievances sent to ESIC will appear here.</span>
          </div>
        ) : (
          <div className="esic-recent-table-wrapper">
            <table className="esic-recent-table">
              <thead>
                <tr>
                  <th>Token No.</th>
                  <th>Hospital</th>
                  <th>Grievance Title</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {recentGrievances.map((grievance) => (
                  <tr key={grievance.id}>
                    {/* TOKEN */}

                    <td>{grievance.tokenNo}</td>

                    {/* HOSPITAL */}

                    <td>{grievance.hospital}</td>

                    {/* TITLE */}

                    <td className="esic-recent-title">{grievance.title}</td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`status ${getStatusClass(grievance.status)}`}
                      >
                        {grievance.status}
                      </span>
                    </td>

                    {/* LAST UPDATED */}

                    <td>{grievance.lastUpdated}</td>

                    {/* ACTION */}

                    <td>
                      <button
                        type="button"
                        className="esic-view-button"
                        onClick={() => setSelectedGrievance(grievance)}
                      >
                        <FiEye size={15} />

                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          GRIEVANCE MODAL
      ===================================================== */}

      <GrievanceModal
        grievance={selectedGrievance}
        onClose={() => setSelectedGrievance(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}

export default EsicDashboard;
