import { useEffect, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiPrinter,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { FiStar } from "react-icons/fi";

import {
  updateGrievanceStatus,
  updateGrievancePriority,
} from "../../lib/grievances";

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
  if (role === "esic_user" && normalizedStatus === "sent to esic") {
    return "Pending";
  }
  if (role === "esic_user" && normalizedStatus === "resolved") {
    return "Completed";
  }
  if (role === "hospital_user" && normalizedStatus === "resolved") {
    return "Completed";
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

  const [isPriority, setIsPriority] = useState(Boolean(grievance?.priority));

  const [isPrioritySaving, setIsPrioritySaving] = useState(false);

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

  const handlePriorityToggle = async () => {
    if (!isSuperAdmin || isPrioritySaving) {
      return;
    }

    const nextPriority = !isPriority;

    try {
      setIsPrioritySaving(true);
      setError("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      await updateGrievancePriority(token, grievance.id, nextPriority);

      // Use the value we just requested.
      // Do not depend on the mutation response for UI state.
      setIsPriority(nextPriority);

      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          priority: nextPriority,
        });
      }

      console.log("Priority update completed:", nextPriority);
    } catch (updateError) {
      console.error("Priority update failed:", updateError);

      setError(updateError?.message || "Unable to update priority.");
    } finally {
      setIsPrioritySaving(false);
    }
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

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      setError(
        "Unable to open the print window. Please allow pop-ups for this site.",
      );

      return;
    }

    const escapeHtml = (value) => {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    /*
     * Hospital users do not have hospital information
     * inside every grievance object because all grievances
     * already belong to the logged-in hospital.
     *
     * Use the logged-in user's name for the Hospital module.
     */
    const hospitalName =
      role === "hospital_user"
        ? currentUser?.name || "Hospital"
        : grievance.hospital || "N/A";

    const reportTitle =
      role === "hospital_user"
        ? `Hospital Complaint Report`
        : "ESIC Complaint Report";

    const today = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const timeline = Array.isArray(grievance.timeline)
      ? grievance.timeline
      : [];

    const timelineHtml =
      timeline.length > 0
        ? `
        <section class="section">
          <h2>Complaint Timeline</h2>

          <div class="timeline">
            ${timeline
              .map(
                (event) => `
                  <div class="timeline-item">

                    <div class="timeline-dot"></div>

                    <div class="timeline-content">

                      <div class="timeline-header">

                        <strong>
                          ${escapeHtml(
                            event.title || event.eventType || "Timeline Update",
                          )}
                        </strong>

                        <span>
                          ${escapeHtml(formatDisplayDate(event.createdAt))}
                        </span>

                      </div>

                      ${
                        event.description
                          ? `
                            <p>
                              ${escapeHtml(event.description)}
                            </p>
                          `
                          : ""
                      }

                      ${
                        event.createdByName || event.createdByUsername
                          ? `
                            <small>
                              Updated by:
                              ${escapeHtml(
                                event.createdByName || event.createdByUsername,
                              )}
                            </small>
                          `
                          : ""
                      }

                    </div>

                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `
        : "";

    const rejectionHtml =
      currentStatus === "rejected" && currentRejectionRemark
        ? `
        <section class="section">

          <h2>Rejection Remark</h2>

          <div class="remark">
            ${escapeHtml(currentRejectionRemark)}
          </div>

        </section>
      `
        : "";

    const currentImageHtml = grievance.image
      ? `
        <div class="image-card">

          <h3>Current Condition</h3>

          <img
            src="${escapeHtml(grievance.image)}"
            alt="Current condition"
          />

        </div>
      `
      : `
        <div class="image-card empty">

          <h3>Current Condition</h3>

          <p>
            No current image available.
          </p>

        </div>
      `;

    const generatedImageHtml = grievance.generatedImageUrl
      ? `
        <div class="image-card">

          <h3>Expected After Repair</h3>

          <img
            src="${escapeHtml(grievance.generatedImageUrl)}"
            alt="Expected after repair"
          />

        </div>
      `
      : `
        <div class="image-card empty">

          <h3>Expected After Repair</h3>

          <p>
            No generated image available.
          </p>

        </div>
      `;

    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <title>
          ${escapeHtml(grievance.tokenNo)} - Complaint Report
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #1e293b;
            background: #ffffff;
          }

          .report {
            max-width: 1000px;
            margin: 0 auto;
          }

          .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }

          .organization {
            font-size: 12px;
            font-weight: 700;
            color: #f47216;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }

          .report-title {
            margin: 0;
            font-size: 25px;
            line-height: 1.25;
            color: #172033;
          }

          .report-date {
            margin-top: 5px;
            font-size: 12px;
            color: #64748b;
          }

          .grievance-title {
            margin-top: 18px;
            font-size: 20px;
            font-weight: 700;
            color: #172033;
          }

          .token {
            margin-top: 5px;
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
          }

          .section {
            margin-top: 26px;
            page-break-inside: avoid;
          }

          .section h2 {
            margin: 0 0 14px;
            font-size: 16px;
            color: #172033;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
          }

          .details-grid {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            gap: 14px;
          }

          .detail {
            border: 1px solid #e5e7eb;
            padding: 13px;
            border-radius: 6px;
          }

          .label {
            display: block;
            font-size: 10px;
            color: #64748b;
            margin-bottom: 6px;
            text-transform: uppercase;
            font-weight: 700;
          }

          .value {
            font-size: 14px;
            color: #172033;
            font-weight: 600;
          }

          .status {
            display: inline-block;
            padding: 6px 10px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 700;
          }

          .description {
            font-size: 14px;
            line-height: 1.7;
            color: #475569;
            white-space: pre-wrap;
          }

          .images {
            display: grid;
            grid-template-columns:
              repeat(2, 1fr);
            gap: 18px;
          }

          .image-card {
            border: 1px solid #dfe3e8;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: avoid;
          }

          .image-card h3 {
            margin: 0;
            padding: 11px 13px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
          }

          .image-card img {
            display: block;
            width: 100%;
            max-height: 400px;
            object-fit: contain;
          }

          .image-card.empty {
            padding-bottom: 12px;
          }

          .image-card.empty p {
            padding: 0 13px;
            color: #64748b;
            font-size: 13px;
          }

          .remark {
            border: 1px solid #fecaca;
            padding: 14px;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.6;
          }

          .timeline-item {
            display: flex;
            gap: 12px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .timeline-dot {
            width: 10px;
            height: 10px;
            border: 2px solid #64748b;
            border-radius: 50%;
            margin-top: 5px;
            flex: 0 0 10px;
          }

          .timeline-content {
            flex: 1;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
          }

          .timeline-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            font-size: 13px;
          }

          .timeline-header span {
            color: #64748b;
            white-space: nowrap;
          }

          .timeline-content p {
            margin: 7px 0;
            font-size: 13px;
            line-height: 1.5;
            color: #475569;
          }

          .timeline-content small {
            color: #64748b;
          }

          .footer {
            margin-top: 35px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }

          @media print {

            body {
              padding: 15mm;
            }

            .section,
            .image-card,
            .timeline-item {
              page-break-inside: avoid;
            }

          }

        </style>

      </head>

      <body>

        <div class="report">

          <header class="header">

            <div class="organization">
              ESI(MB) Complaint Portal
            </div>

            <h1 class="report-title">
              ${escapeHtml(reportTitle)}
            </h1>

            <div class="report-date">
              ${escapeHtml(today)}
            </div>

            <div class="grievance-title">
              ${escapeHtml(grievance.title)}
            </div>

            <div class="token">
              Token No:
              ${escapeHtml(grievance.tokenNo)}
            </div>

          </header>


          <section class="section">

            <h2>
              Grievance Information
            </h2>

            <div class="details-grid">

              <div class="detail">

                <span class="label">
                  Hospital
                </span>

                <span class="value">
                  ${escapeHtml(hospitalName)}
                </span>

              </div>


              <div class="detail">

                <span class="label">
                  Submitted On
                </span>

                <span class="value">
                  ${escapeHtml(grievance.submittedOn || "N/A")}
                </span>

              </div>


              <div class="detail">

                <span class="label">
                  Last Updated
                </span>

                <span class="value">
                  ${escapeHtml(currentLastUpdated || "N/A")}
                </span>

              </div>


              <div class="detail">

                <span class="label">
                  Status
                </span>

                <span class="status">
                  ${escapeHtml(currentStatusLabel || "Unknown")}
                </span>

              </div>

            </div>

          </section>


          <section class="section">

            <h2>
              Description
            </h2>

            <div class="description">
              ${escapeHtml(grievance.description || "No description provided.")}
            </div>

          </section>


          <section class="section">

            <h2>
              Images
            </h2>

            <div class="images">

              ${currentImageHtml}

              ${generatedImageHtml}

            </div>

          </section>


          ${rejectionHtml}

          ${timelineHtml}


          <footer class="footer">

            <span>
              ESI(MB) Complaint Portal
            </span>

            <span>
              Printed on
              ${escapeHtml(
                new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date()),
              )}
            </span>

          </footer>

        </div>

      </body>

    </html>
  `);

    printWindow.document.close();

    const images = printWindow.document.images;

    const waitForImages = Array.from(images).map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = resolve;
          image.onerror = resolve;
        }),
    );

    Promise.all(waitForImages).then(() => {
      printWindow.focus();
      printWindow.print();
    });
  }

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
              <div className="modal-eyebrow">COMPLAINT DETAILS</div>

              <h2>{grievance.title}</h2>

              <div className="modal-token">{grievance.tokenNo}</div>

              {/* {isSuperAdmin && (
                <button
                  type="button"
                  className={`priority-star ${isPriority ? "active" : ""}`}
                  onClick={handlePriorityToggle}
                  disabled={isPrioritySaving}
                  title={isPriority ? "Remove priority" : "Mark as priority"}
                  aria-label={
                    isPriority ? "Remove priority" : "Mark as priority"
                  }
                >
                  <FiStar
                    size={20}
                    fill={isPriority ? "currentColor" : "none"}
                  />
                </button>
              )} */}
            </div>

            <button
              type="button"
              className="modal-print-button"
              onClick={handlePrint}
              disabled={isSaving}
            >
              <FiPrinter size={16} />
              <span>Print</span>
            </button>

            {/* <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={21} />
            </button> */}
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