import { useEffect, useState } from "react";

import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiInbox,
  FiEye,
} from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";

import { Link } from "react-router-dom";
import { getGrievances } from "../../lib/grievances";
import GrievanceModal from "../../components/hospital/GrievanceModal";
import GrievanceTimelineModal from "../../components/GrievanceTimelineModal";

function StatCard({ icon: Icon, title, value, type }) {
  return (
    <div className={`hospital-stat-card ${type}`}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>

      <div className="stat-content">
        <div className="stat-title">{title}</div>

        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "pending":
    case "sent to director":
      return "Sent to Director";

    case "in progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    case "rejected":
      return "Rejected";

    case "sent to esic":
    case "delegated to esic":
      return "Sent to ESIC";

    default:
      return String(status || "").trim();
  }
}

function getStatusClass(status) {
  if (!status) {
    return "";
  }

  return normalizeStatus(status)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function formatDisplayDate(value) {
  if (!value || value === "N/A") return "N/A";

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

function HospitalDashboard({ hospitalName = "ESIC User" }) {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [selectedTimelineGrievance, setSelectedTimelineGrievance] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGrievances() {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("esicToken");

        if (!token) {
          throw new Error("Authentication session not found.");
        }

        const data = await getGrievances(token);

        const formattedGrievances = data.map((grievance) => {
          const details = grievance.grievanceDetails || {};

          return {
            id: grievance.databaseId,
            tokenNo: details.tokenNumber || "N/A",
            title: grievance.title || "Untitled Grievance",
            submittedOn: formatDisplayDate(grievance.date),
            lastUpdated: formatDisplayDate(grievance.modified),
            status: normalizeStatus(grievance.statusLabel || ""),
            description: details.description || "",
            image: grievance.currentImageUrl || null,
            generatedImageUrl: grievance.generatedImageUrl || null,
            rejectionRemark: grievance.rejectionRemark || "",
            timeline: grievance.timeline || [],
          };
        });

        setGrievances(formattedGrievances);
      } catch (err) {
        console.error("Failed to load grievances:", err);

        setError(err.message || "Unable to load grievances. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadGrievances();
  }, []);

  const totalGrievances = grievances.length;

  const pendingCount = grievances.filter(
    (grievance) => grievance.status === "Sent to Director",
  ).length;

  const resolvedCount = grievances.filter(
    (grievance) => grievance.status === "Resolved",
  ).length;

  const rejectedCount = grievances.filter(
    (grievance) => grievance.status === "Rejected",
  ).length;

  const inProgressCount = grievances.filter(
    (grievance) => grievance.status === "In Progress",
  ).length;

  const sentToEsicCount = grievances.filter(
    (grievance) => grievance.status === "Sent to ESIC",
  ).length;

  const closeModal = () => {
    setSelectedGrievance(null);
  };

  return (
    <div className="hospital-dashboard">
      {/* DASHBOARD HEADER */}

      <div className="dashboard-title">
        <div className="dashboard-title-content">
          <div className="dashboard-eyebrow">HOSPITAL MODULE</div>

          <h1>{hospitalName}</h1>

          <p>
            Manage and track hospital infrastructure and facility grievances.
          </p>
        </div>

        <Link
          to="/hospital/grievances/create"
          className="create-grievance-button"
        >
          <FiPlus size={21} />

          <span>Create Grievance</span>
        </Link>
      </div>

      {/* STATISTICS */}

      <div className="hospital-stats">
        <StatCard
          icon={FiFileText}
          title="Total Grievances"
          value={loading ? "—" : totalGrievances}
          type="total"
        />

        <StatCard
          icon={FiClock}
          title="Sent to Director"
          value={loading ? "—" : pendingCount}
          type="pending"
        />

        <StatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={loading ? "—" : resolvedCount}
          type="resolved"
        />

        <StatCard
          icon={FiXCircle}
          title="Rejected"
          value={loading ? "—" : rejectedCount}
          type="rejected"
        />

        <StatCard
          icon={FiUsers}
          title="In Progress"
          value={loading ? "—" : inProgressCount}
          type="in-progress"
        />

        <StatCard
                  icon={HiOutlineOfficeBuilding}
                  title="Sent to ESIC"
                  value={loading ? "—" : sentToEsicCount}
                  type="sent-to-esic"
                />
      </div>
      <div
        className="director-esic-summary"
        style={{
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <div>
          <strong>Sent to ESIC</strong>

          <span>Grievances sent to ESIC for further action</span>
        </div>

        <strong>{loading ? "—" : sentToEsicCount}</strong>
      </div>

      {/* RECENT GRIEVANCES */}

      <section className="grievances-card">
        <div className="section-header">
          <h2>Recent Grievances</h2>

          <Link to="/hospital/grievances" className="view-all">
            <span>View All</span>

            <FiArrowRight size={17} />
          </Link>
        </div>

        <div className="grievance-table-wrapper">
          <table className="grievance-table">
            <thead>
              <tr>
                <th>Token No.</th>
                <th>Title</th>
                <th>Submitted On</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-message">
                    Loading grievances...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="table-message error">
                    {error}
                  </td>
                </tr>
              ) : grievances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-message">
                    <div className="empty-grievances">
                      <div className="empty-grievances-icon">
                        <FiInbox size={25} />
                      </div>

                      <div className="empty-grievances-copy">
                        <strong>No grievances yet</strong>

                        <span>
                          Submit your first grievance to start tracking it here.
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                grievances.slice(0, 5).map((grievance) => (
                  <tr key={grievance.id}>
                    <td>{grievance.tokenNo}</td>

                    <td className="grievance-title-cell">{grievance.title}</td>

                    <td>{grievance.submittedOn}</td>

                    <td>{grievance.lastUpdated}</td>

                    <td>
                      <span
                        className={`status ${getStatusClass(grievance.status)}`}
                      >
                        {grievance.status}
                      </span>
                    </td>

                    <td>
                      <div className="grievance-action-buttons">
                        <button
                          type="button"
                          className="table-view"
                          onClick={() => setSelectedGrievance(grievance)}
                          title="View Grievance"
                        >
                          <FiEye size={15} />

                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          className="timeline-table-button"
                          onClick={() =>
                            setSelectedTimelineGrievance(grievance)
                          }
                          title="View Timeline"
                        >
                          <FiClock size={15} />

                          <span>Timeline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRIEVANCE MODAL */}

      <GrievanceModal grievance={selectedGrievance} onClose={closeModal} />

      <GrievanceTimelineModal
        grievance={selectedTimelineGrievance}
        onClose={() => setSelectedTimelineGrievance(null)}
        canEdit={false}
      />
    </div>
  );
}

export default HospitalDashboard;
