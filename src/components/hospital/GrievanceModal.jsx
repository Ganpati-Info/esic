import { useEffect, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import { updateGrievanceStatus } from "../../lib/grievances";

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  switch (value) {
    case "pending":
    case "sent to director":
      return "pending";

    case "in progress":
      return "in progress";

    case "resolved":
      return "resolved";

    case "rejected":
      return "rejected";

    case "sent to esic":
    case "delegated to esic":
      return "sent to esic";

    default:
      return value;
  }
}

function getStatusLabel(status, role) {
  const normalizedStatus = normalizeStatus(status);

  if (role === "portal_super_admin" && normalizedStatus === "pending") {
    return "Pending Approval";
  }

  switch (normalizedStatus) {
    case "pending":
      return "Sent to Director";

    case "in progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    case "rejected":
      return "Rejected";

    case "sent to esic":
      return "Sent to ESIC";

    default:
      return status || "Unknown";
  }
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "pending";

    case "in progress":
      return "in-progress";

    case "resolved":
      return "resolved";

    case "rejected":
      return "rejected";

    case "sent to esic":
      return "sent-to-esic";

    default:
      return "";
  }
}

function getCurrentUser() {
  const storedUser = sessionStorage.getItem("esicUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

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

function GrievanceModal({ grievance, onClose, onStatusUpdate }) {
  const currentUser = getCurrentUser();

  const [currentStatus, setCurrentStatus] = useState(
    normalizeStatus(grievance?.status),
  );

  const [currentStatusLabel, setCurrentStatusLabel] = useState(
    getStatusLabel(grievance?.status, currentUser?.role),
  );

  const [currentRejectionRemark, setCurrentRejectionRemark] = useState(
    grievance?.rejectionRemark || "",
  );

  const [currentLastUpdated, setCurrentLastUpdated] = useState(
    grievance?.lastUpdated || "N/A",
  );

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const [pendingRejectionRemark, setPendingRejectionRemark] = useState("");

  const [rejectionError, setRejectionError] = useState("");

  useEffect(() => {
    if (!grievance) {
      return;
    }

    setCurrentStatus(normalizeStatus(grievance.status));

    setCurrentStatusLabel(getStatusLabel(grievance.status, currentUser?.role));

    setCurrentRejectionRemark(grievance.rejectionRemark || "");

    setCurrentLastUpdated(grievance.lastUpdated || "N/A");

    setIsSaving(false);
    setError("");
    setIsRejectionModalOpen(false);
    setPendingRejectionRemark("");
    setRejectionError("");
  }, [grievance]);

  if (!grievance) {
    return null;
  }

  const role = currentUser?.role || "";

  const isSuperAdmin = role === "portal_super_admin";

  const isAdmin = role === "portal_super_admin" || role === "administrator";

  const isEsicOfficer = role === "esic_user";

  const canReject = isSuperAdmin && currentStatus === "pending";

  const canSendToEsic = isSuperAdmin && currentStatus === "pending";

  const canMarkInProgress = isEsicOfficer && currentStatus === "sent to esic";

  const canResolve = isEsicOfficer && currentStatus === "in progress";

  const handleOpenRejectionModal = () => {
    setPendingRejectionRemark(currentRejectionRemark || "");

    setRejectionError("");
    setError("");
    setIsRejectionModalOpen(true);
  };

  const handleCancelRejection = () => {
    setPendingRejectionRemark("");
    setRejectionError("");
    setIsRejectionModalOpen(false);
  };

  const handleConfirmRejection = async () => {
    const remark = pendingRejectionRemark.trim();

    if (!remark) {
      setRejectionError(
        "Please provide a reason for rejecting this grievance.",
      );
      return;
    }

    await performStatusUpdate("rejected", remark);
  };

  async function performStatusUpdate(nextStatus, rejectionRemark = "") {
    setError("");
    setRejectionError("");

    try {
      setIsSaving(true);

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const updatedGrievance = await updateGrievanceStatus(token, {
        grievanceId: grievance.id,
        status: nextStatus,
        rejectionRemark,
      });

      const updatedStatus = normalizeStatus(
        updatedGrievance?.statusLabel ||
          updatedGrievance?.grievanceDetails?.status?.[0] ||
          nextStatus,
      );

      const updatedStatusLabel = getStatusLabel(
        updatedGrievance?.statusLabel || updatedStatus,
        currentUser?.role,
      );

      setCurrentStatus(updatedStatus);

      setCurrentStatusLabel(updatedStatusLabel);

      setCurrentRejectionRemark(
        updatedGrievance?.rejectionRemark || rejectionRemark || "",
      );

      if (updatedGrievance?.modified) {
        setCurrentLastUpdated(formatDisplayDate(updatedGrievance.modified));
      }

      setIsRejectionModalOpen(false);
      setPendingRejectionRemark("");
      setRejectionError("");

      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          status: updatedStatus,
          statusLabel: updatedStatusLabel,
          rejectionRemark:
            updatedGrievance?.rejectionRemark || rejectionRemark || "",
          modified: updatedGrievance?.modified || null,
        });
      }
    } catch (updateError) {
      console.error("STATUS UPDATE ERROR:", updateError);

      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to update grievance status.";

      if (nextStatus === "rejected") {
        setRejectionError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="grievance-modal-overlay" onClick={onClose}>
        <div
          className="grievance-modal"
          onClick={(event) => event.stopPropagation()}
        >
          {/* HEADER */}

          <div className="grievance-modal-header">
            <div>
              <div className="modal-eyebrow">GRIEVANCE DETAILS</div>

              <h2>{grievance.title}</h2>

              <div className="modal-token">{grievance.tokenNo}</div>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={21} />
            </button>
          </div>

          {/* BODY */}

          <div className="grievance-modal-body">
            {/* STATUS */}

            <div className="modal-status-section">
              <div className="modal-status-row">
                <span className="modal-label">Status</span>

                <div className="modal-status-display">
                  <span className={`status ${getStatusClass(currentStatus)}`}>
                    {currentStatusLabel}
                  </span>
                </div>
              </div>

              {/* WORKFLOW ACTIONS */}

              {/* {hasWorkflowActions && (
                <div className="modal-workflow-section">
                  <span className="modal-label">Available Action</span>

                  <div className="modal-workflow-actions">
                    {canReject && (
                      <button
                        type="button"
                        className="modal-workflow-button reject"
                        onClick={handleOpenRejectionModal}
                        disabled={isSaving}
                      >
                        <FiXCircle size={16} />

                        <span>Reject</span>
                      </button>
                    )}

                    {canSendToEsic && (
                      <button
                        type="button"
                        className="modal-workflow-button send"
                        onClick={() => performStatusUpdate("sent to esic")}
                        disabled={isSaving}
                      >
                        <FiSend size={16} />

                        <span>Send to ESIC</span>
                      </button>
                    )}

                    {canMarkInProgress && (
                      <button
                        type="button"
                        className="modal-workflow-button progress"
                        onClick={() => performStatusUpdate("in progress")}
                        disabled={isSaving}
                      >
                        <FiEdit3 size={16} />

                        <span>Mark In Progress</span>
                      </button>
                    )}

                    {canResolve && (
                      <button
                        type="button"
                        className="modal-workflow-button resolve"
                        onClick={() => performStatusUpdate("resolved")}
                        disabled={isSaving}
                      >
                        <FiCheckCircle size={16} />

                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>

                  {isSaving && (
                    <div className="modal-status-saving">
                      Updating grievance status...
                    </div>
                  )}
                </div>
              )} */}

              {/* GENERAL ERROR */}

              {error && <div className="modal-status-error">{error}</div>}

              {/* REJECTION REMARK */}

              {currentStatus === "rejected" && currentRejectionRemark && (
                <div className="modal-rejection-display">
                  <span className="modal-label">Rejection Remark</span>

                  <p>{currentRejectionRemark}</p>
                </div>
              )}
            </div>

            {/* DETAILS */}

            <div className="modal-details">
              {isAdmin && (
                <div className="modal-detail">
                  <span className="modal-label">Hospital</span>

                  <strong>{grievance.hospital || "N/A"}</strong>
                </div>
              )}

              <div className="modal-detail">
                <span className="modal-label">Submitted On</span>

                <strong>{grievance.submittedOn}</strong>
              </div>

              <div className="modal-detail">
                <span className="modal-label">Last Updated</span>

                <strong>{currentLastUpdated}</strong>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="modal-description">
              <span className="modal-label">Description</span>

              <p>{grievance.description || "No description provided."}</p>
            </div>

            {/* IMAGES */}

            <div className="modal-evidence">
              <span className="modal-label">Images</span>

              <div className="modal-images-grid">
                {/* CURRENT CONDITION */}

                <div className="modal-image-card">
                  <div className="modal-image-card-header">
                    <span>Current Condition</span>
                  </div>

                  {grievance.image ? (
                    <div className="modal-image-wrapper">
                      <img
                        src={grievance.image}
                        alt={`Current condition of ${grievance.title}`}
                      />
                    </div>
                  ) : (
                    <div className="modal-image-empty">
                      <strong>No current image available</strong>

                      <span>
                        No evidence image has been uploaded for this grievance.
                      </span>
                    </div>
                  )}
                </div>

                {/* EXPECTED AFTER REPAIR */}

                <div className="modal-image-card">
                  <div className="modal-image-card-header">
                    <span>Expected After Repair</span>
                  </div>

                  {grievance.generatedImageUrl ? (
                    <div className="modal-image-wrapper">
                      <img
                        src={grievance.generatedImageUrl}
                        alt={`Expected repaired condition of ${grievance.title}`}
                      />
                    </div>
                  ) : (
                    <div className="modal-image-empty">
                      <strong>No generated image available</strong>

                      <span>
                        An expected repair image has not been generated yet.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="grievance-modal-footer">
            <div className="modal-footer-actions">
              {canReject && (
                <button
                  type="button"
                  className="modal-workflow-button reject"
                  onClick={handleOpenRejectionModal}
                  disabled={isSaving}
                >
                  <FiXCircle size={16} />
                  <span>Reject</span>
                </button>
              )}

              {/* instead of send to esic, it should be "send back to hospital" button */}

              {canSendToEsic && (
                <button
                  type="button"
                  className="modal-workflow-button send"
                  onClick={() => performStatusUpdate("sent to esic")}
                  disabled={isSaving}
                >
                  <FiSend size={16} />
                  <span>Send to ESIC</span>
                </button>
              )}

              {canMarkInProgress && (
                <button
                  type="button"
                  className="modal-workflow-button progress"
                  onClick={() => performStatusUpdate("in progress")}
                  disabled={isSaving}
                >
                  <FiEdit3 size={16} />
                  <span>Mark In Progress</span>
                </button>
              )}

              {canResolve && (
                <button
                  type="button"
                  className="modal-workflow-button resolve"
                  onClick={() => performStatusUpdate("resolved")}
                  disabled={isSaving}
                >
                  <FiCheckCircle size={16} />
                  <span>Mark Resolved</span>
                </button>
              )}

              {isSaving && (
                <span className="modal-status-saving">Updating...</span>
              )}

              <button
                type="button"
                className="modal-close-button"
                onClick={onClose}
                disabled={isSaving}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION MODAL */}

      {isRejectionModalOpen && (
        <div
          className="rejection-modal-overlay"
          onClick={handleCancelRejection}
        >
          <div
            className="rejection-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rejection-modal-header">
              <div className="rejection-modal-title">
                <div className="rejection-icon">
                  <FiAlertCircle size={20} />
                </div>

                <div>
                  <h3>Reject Grievance</h3>

                  <p>Provide the reason for rejecting this grievance.</p>
                </div>
              </div>

              <button
                type="button"
                className="rejection-modal-close"
                onClick={handleCancelRejection}
                aria-label="Close rejection modal"
              >
                <FiX size={19} />
              </button>
            </div>

            <div className="rejection-modal-body">
              <div className="rejection-grievance-info">
                <span>Token Number</span>

                <strong>{grievance.tokenNo}</strong>
              </div>

              <label
                htmlFor="rejection-reason"
                className="rejection-modal-label"
              >
                Rejection Reason
                <span>*</span>
              </label>

              <textarea
                id="rejection-reason"
                value={pendingRejectionRemark}
                onChange={(event) => {
                  setPendingRejectionRemark(event.target.value);

                  setRejectionError("");
                }}
                placeholder="State clearly why this grievance is being rejected..."
                rows={6}
                maxLength={1000}
                autoFocus
              />

              <div className="rejection-modal-bottom">
                {rejectionError ? (
                  <span className="rejection-modal-error">
                    {rejectionError}
                  </span>
                ) : (
                  <span />
                )}

                <span className="rejection-character-count">
                  {pendingRejectionRemark.length}
                  /1000
                </span>
              </div>
            </div>

            <div className="rejection-modal-footer">
              <button
                type="button"
                className="rejection-cancel-button"
                onClick={handleCancelRejection}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rejection-confirm-button"
                onClick={handleConfirmRejection}
                disabled={isSaving}
              >
                {isSaving ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GrievanceModal;
