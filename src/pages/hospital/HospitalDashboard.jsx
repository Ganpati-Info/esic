import { useState } from "react";

import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiX,
} from "react-icons/fi";

import grievances from "../../data/grievances.json";
import { Link } from "react-router-dom";

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

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "pending";

    case "In Progress":
      return "in-progress";

    case "Resolved":
      return "resolved";

    case "Rejected":
      return "rejected";

    case "Delegated to ESIC":
      return "delegated";

    default:
      return "";
  }
}

function HospitalDashboard({ hospitalName = "ESIC User" }) {
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const totalGrievances = grievances.length;

  const pendingCount = grievances.filter(
    (grievance) => grievance.status === "Pending",
  ).length;

  const resolvedCount = grievances.filter(
    (grievance) => grievance.status === "Resolved",
  ).length;

  const rejectedCount = grievances.filter(
    (grievance) => grievance.status === "Rejected",
  ).length;

  const delegatedCount = grievances.filter(
    (grievance) => grievance.status === "Delegated to ESIC",
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

        <Link to="/hospital/grievances/create" className="create-grievance-button">
          <FiPlus size={21} />

          <span>Create Grievance</span>
        </Link>
      </div>

      {/* STATISTICS */}

      <div className="hospital-stats">
        <StatCard
          icon={FiFileText}
          title="Total Grievances"
          value={totalGrievances}
          type="total"
        />

        <StatCard
          icon={FiClock}
          title="Pending"
          value={pendingCount}
          type="pending"
        />

        <StatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={resolvedCount}
          type="resolved"
        />

        <StatCard
          icon={FiXCircle}
          title="Rejected"
          value={rejectedCount}
          type="rejected"
        />

        <StatCard
          icon={FiUsers}
          title="Delegated to ESIC"
          value={delegatedCount}
          type="delegated"
        />
      </div>

      {/* RECENT GRIEVANCES */}

      <section className="grievances-card">
        <div className="section-header">
          <h2>Recent Grievances</h2>

          <button type="button" className="view-all">
            <span>View All</span>

            <FiArrowRight size={17} />
          </button>
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
              {grievances.slice(0, 5).map((grievance) => (
                <tr key={grievance.tokenNo}>
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
                    <button
                      type="button"
                      className="table-view"
                      onClick={() => setSelectedGrievance(grievance)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRIEVANCE MODAL */}

      {selectedGrievance && (
        <div className="grievance-modal-overlay" onClick={closeModal}>
          <div
            className="grievance-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="grievance-modal-header">
              <div>
                <div className="modal-eyebrow">GRIEVANCE DETAILS</div>

                <h2>{selectedGrievance.title}</h2>

                <div className="modal-token">{selectedGrievance.tokenNo}</div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <FiX size={21} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="grievance-modal-body">
              <div className="modal-status-row">
                <span className="modal-label">Status</span>

                <span
                  className={`status ${getStatusClass(
                    selectedGrievance.status,
                  )}`}
                >
                  {selectedGrievance.status}
                </span>
              </div>

              <div className="modal-details">
                <div className="modal-detail">
                  <span className="modal-label">Token Number</span>

                  <strong>{selectedGrievance.tokenNo}</strong>
                </div>

                <div className="modal-detail">
                  <span className="modal-label">Submitted On</span>

                  <strong>{selectedGrievance.submittedOn}</strong>
                </div>

                <div className="modal-detail">
                  <span className="modal-label">Last Updated</span>

                  <strong>{selectedGrievance.lastUpdated}</strong>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="modal-description">
                <span className="modal-label">Description</span>

                <p>{selectedGrievance.description}</p>
              </div>

              {/* IMAGE */}

              {selectedGrievance.image && (
                <div className="modal-evidence">
                  <span className="modal-label">Evidence</span>

                  <div className="modal-image-wrapper">
                    <img
                      src={selectedGrievance.image}
                      alt={selectedGrievance.title}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="grievance-modal-footer">
              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalDashboard;
