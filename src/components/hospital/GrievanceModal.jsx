import { useEffect, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiUpload,
  FiPrinter,
  FiSend,
  FiStar,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  updateGrievanceStatus,
  updateGrievancePriority,
  resolveGrievance,
  sendGrievanceToEsic,
  updateReturnedGrievance,
} from "../../lib/grievances";

import { uploadMedia } from "../../lib/media";

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

    case "returned to hospital":
      return "returned to hospital";

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

    case "returned to hospital":
      return "Returned to Hospital";

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

    case "returned to hospital":
      return "returned-to-hospital";

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

function formatTimelineDate(value) {
  if (!value) {
    return "N/A";
  }

  const normalizedValue = String(value).replace(" ", "T");
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimelineBudget(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function getTimelineEventLabel(eventType) {
  switch (eventType) {
    case "submitted":
      return "Complaint Submitted";

    case "sent_to_esic":
      return "Complaint Sent to ESIC";

    case "schedule_plan":
      return "Schedule Plan";

    case "in_progress":
      return "In Progress";

    case "progress_update":
      return "Progress Update";

    case "resolved":
      return "Complaint Resolved";

    case "rejected":
      return "Complaint Rejected";

    default:
      return "Timeline Update";
  }
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

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [pendingReturnRemark, setPendingReturnRemark] = useState("");

  const [returnError, setReturnError] = useState("");

  const [isReturning, setIsReturning] = useState(false);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const [resolutionRemark, setResolutionRemark] = useState("");

  const [resolutionFile, setResolutionFile] = useState(null);

  const [resolutionError, setResolutionError] = useState("");

  const [isResolving, setIsResolving] = useState(false);

  const [isEditingReturned, setIsEditingReturned] = useState(false);

  const [editTitle, setEditTitle] = useState("");

  const [editDescription, setEditDescription] = useState("");

  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const [editError, setEditError] = useState("");

  const [isSendingToEsic, setIsSendingToEsic] = useState(false);

  const [sendToEsicError, setSendToEsicError] = useState("");

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
    setIsEditingReturned(false);

    setEditTitle(grievance.title || "");

    setEditDescription(grievance.description || "");

    setIsEditingSaving(false);

    setEditError("");

    setIsSendingToEsic(false);

    setSendToEsicError("");
  }, [grievance]);

  if (!grievance) {
    return null;
  }

  const role = currentUser?.role || "";

  const isSuperAdmin = role === "portal_super_admin";

  const isAdmin = role === "portal_super_admin" || role === "administrator";

  const isEsicOfficer = role === "esic_user";

  const isHospitalUser = role === "hospital_user";

  const canEditReturned =
    isHospitalUser && currentStatus === "returned to hospital";

  const canSendToEsic =
    isHospitalUser && currentStatus === "returned to hospital";

  const canReject = isSuperAdmin && currentStatus === "pending";

  const canReturnToHospital = isSuperAdmin && currentStatus === "pending";

  // const canMarkInProgress = isEsicOfficer && currentStatus === "sent to esic";

  const canResolve = isEsicOfficer && currentStatus === "in progress";

  const handleOpenRejectionModal = () => {
    setPendingRejectionRemark(currentRejectionRemark || "");

    setRejectionError("");
    setError("");
    setIsRejectionModalOpen(true);
  };

  const handleStartReturnedEdit = () => {
    setEditTitle(grievance.title || "");
    setEditDescription(grievance.description || "");
    setEditError("");
    setSendToEsicError("");
    setIsEditingReturned(true);
  };

  const handleCancelReturnedEdit = () => {
    if (isEditingSaving) {
      return;
    }

    setEditTitle(grievance.title || "");
    setEditDescription(grievance.description || "");
    setEditError("");
    setIsEditingReturned(false);
  };

  const handleSaveReturnedEdit = async () => {
    const title = editTitle.trim();
    const description = editDescription.trim();

    if (!title) {
      setEditError("Complaint title is required.");
      return;
    }

    if (!description) {
      setEditError("Complaint description is required.");
      return;
    }

    try {
      setIsEditingSaving(true);
      setEditError("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const result = await updateReturnedGrievance(token, {
        grievanceId: grievance.id,
        title,
        description,
      });

      setEditTitle(result.title);
      setEditDescription(result.description);

      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          title: result.title,
          description: result.description,
          lastUpdated: result.modified,
        });
      }

      setIsEditingReturned(false);
    } catch (updateError) {
      console.error("Returned grievance update failed:", updateError);

      setEditError(updateError?.message || "Unable to update complaint.");
    } finally {
      setIsEditingSaving(false);
    }
  };

  const handleSendToEsic = async () => {
    const confirmed = window.confirm(
      "Send this complaint to ESIC for further processing?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsSendingToEsic(true);
      setSendToEsicError("");
      setError("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const result = await sendGrievanceToEsic(token, {
        grievanceId: grievance.id,
      });

      setCurrentStatus(normalizeStatus(result.status));

      setCurrentStatusLabel(getStatusLabel(result.status, role));

      setCurrentLastUpdated(formatDisplayDate(new Date().toISOString()));

      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          status: result.status,
          timelineEvent: result.timelineEvent,
        });
      }
    } catch (sendError) {
      console.error("Send to ESIC failed:", sendError);

      setSendToEsicError(
        sendError?.message || "Unable to send complaint to ESIC.",
      );
    } finally {
      setIsSendingToEsic(false);
    }
  };

  // const handlePriorityToggle = async () => {
  //   if (!isSuperAdmin || isPrioritySaving) {
  //     return;
  //   }

  //   const nextPriority = !isPriority;

  //   try {
  //     setIsPrioritySaving(true);
  //     setError("");

  //     const token = sessionStorage.getItem("esicToken");

  //     if (!token) {
  //       throw new Error(
  //         "Authentication session not found. Please log in again.",
  //       );
  //     }

  //     await updateGrievancePriority(token, grievance.id, nextPriority);

  //     // Use the value we just requested.
  //     // Do not depend on the mutation response for UI state.
  //     setIsPriority(nextPriority);

  //     if (typeof onStatusUpdate === "function") {
  //       await onStatusUpdate({
  //         grievanceId: grievance.id,
  //         priority: nextPriority,
  //       });
  //     }

  //     console.log("Priority update completed:", nextPriority);
  //   } catch (updateError) {
  //     console.error("Priority update failed:", updateError);

  //     setError(updateError?.message || "Unable to update priority.");
  //   } finally {
  //     setIsPrioritySaving(false);
  //   }
  // };

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

  const handleOpenReturnModal = () => {
    setPendingReturnRemark("");
    setReturnError("");
    setError("");
    setIsReturnModalOpen(true);
  };

  const handleCancelReturn = () => {
    if (isReturning) {
      return;
    }

    setPendingReturnRemark("");
    setReturnError("");
    setIsReturnModalOpen(false);
  };

  const handleConfirmReturn = async () => {
    const remark = pendingReturnRemark.trim();

    setReturnError("");

    if (!remark) {
      setReturnError(
        "Please provide a reason for returning this grievance to the hospital.",
      );

      return;
    }

    try {
      setIsReturning(true);
      setError("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const result = await returnGrievanceToHospital(token, {
        grievanceId: grievance.id,
        remark,
      });

      const timelineEvent = result.timelineEvent;

      const updatedStatus = normalizeStatus(result.status);

      const updatedStatusLabel = getStatusLabel(
        result.status,
        currentUser?.role,
      );

      setCurrentStatus(updatedStatus);

      setCurrentStatusLabel(updatedStatusLabel);

      setCurrentLastUpdated(formatDisplayDate(new Date().toISOString()));

      setIsReturnModalOpen(false);
      setPendingReturnRemark("");
      setReturnError("");

      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          status: updatedStatus,
          statusLabel: updatedStatusLabel,
          modified: new Date().toISOString(),
          timelineEvent,
        });
      }
    } catch (returnErrorValue) {
      console.error("RETURN GRIEVANCE ERROR:", returnErrorValue);

      setReturnError(
        returnErrorValue?.message || "Unable to return grievance to hospital.",
      );
    } finally {
      setIsReturning(false);
    }
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

        <h2>
          Complaint Timeline
        </h2>

        <div class="timeline">

          ${timeline
            .map((event) => {
              const eventLabel = getTimelineEventLabel(event.eventType);

              const mediaUrl = event.mediaUrl || "";

              const mediaType = event.mediaType || "";

              const isPdf =
                mediaType === "application/pdf" ||
                /\.pdf(\?|$)/i.test(mediaUrl);

              const isImage =
                mediaType.startsWith("image/") ||
                /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(mediaUrl);

              const mediaHtml = mediaUrl
                ? isPdf
                  ? `
                    <div class="timeline-attachment">

                      <div class="attachment-label">
                        Supporting Document
                      </div>

                      <a
                        href="${escapeHtml(mediaUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="pdf-link"
                      >
                        View Supporting PDF
                      </a>

                    </div>
                  `
                  : isImage
                    ? `
                      <div class="timeline-attachment">

                        <div class="attachment-label">
                          Supporting Image
                        </div>

                        <a
                          href="${escapeHtml(mediaUrl)}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src="${escapeHtml(mediaUrl)}"
                            alt="Supporting evidence"
                            class="timeline-evidence-image"
                          />
                        </a>

                      </div>
                    `
                    : `
                      <div class="timeline-attachment">

                        <div class="attachment-label">
                          Supporting File
                        </div>

                        <a
                          href="${escapeHtml(mediaUrl)}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="pdf-link"
                        >
                          Open Supporting File
                        </a>

                      </div>
                    `
                : "";

              const budgetHtml =
                event.eventType === "schedule_plan" &&
                event.budget !== null &&
                event.budget !== undefined &&
                event.budget !== ""
                  ? `
                    <div class="timeline-detail">

                      <span class="timeline-detail-label">
                        Budget
                      </span>

                      <strong>
                        ${escapeHtml(formatTimelineBudget(event.budget))}
                      </strong>

                    </div>
                  `
                  : "";

              const etaHtml = event.eta
                ? `
                  <div class="timeline-detail">

                    <span class="timeline-detail-label">
                      ETA / Tentative Completion
                    </span>

                    <strong>
                      ${escapeHtml(formatTimelineDate(event.eta))}
                    </strong>

                  </div>
                `
                : "";

              return `
                <div class="timeline-item">

                  <div class="timeline-dot"></div>

                  <div class="timeline-content">

                    <div class="timeline-header">

                      <div>

                        <strong>
                          ${escapeHtml(event.title || eventLabel)}
                        </strong>

                        <div class="timeline-event-type">
                          ${escapeHtml(eventLabel)}
                        </div>

                      </div>

                      <span>
                        ${escapeHtml(formatTimelineDate(event.createdAt))}
                      </span>

                    </div>

                    ${
                      event.description
                        ? `
                          <p class="timeline-description">
                            ${escapeHtml(event.description)}
                          </p>
                        `
                        : ""
                    }

                    ${budgetHtml ? budgetHtml : ""}

                    ${etaHtml ? etaHtml : ""}

                    ${
                      event.createdByName || event.createdByUsername
                        ? `
                          <div class="timeline-updated-by">

                            Updated by:
                            <strong>
                              ${escapeHtml(
                                event.createdByName || event.createdByUsername,
                              )}
                            </strong>

                          </div>
                        `
                        : ""
                    }

                    ${mediaHtml}

                  </div>

                </div>
              `;
            })
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

          .timeline-event-type {
            margin-top: 4px;

            font-size: 10px;
            font-weight: 700;

            color: #f47216;

            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .timeline-description {
            margin: 8px 0;

            font-size: 13px;
            line-height: 1.6;

            color: #475569;

            white-space: pre-wrap;
          }

          .timeline-detail {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 20px;

            margin-top: 9px;
            padding: 8px 10px;

            border: 1px solid #e5e7eb;
            border-radius: 5px;

            background: #f8fafc;
          }

          .timeline-detail-label {
            color: #64748b;

            font-size: 11px;
            font-weight: 600;
          }

          .timeline-detail strong {
            color: #172033;

            font-size: 12px;
          }

          .timeline-updated-by {
            margin-top: 9px;

            color: #64748b;

            font-size: 11px;
          }

          .timeline-updated-by strong {
            color: #374151;
          }

          .timeline-attachment {
            margin-top: 12px;

            padding: 10px;

            border: 1px solid #dbe1e8;
            border-radius: 6px;

            background: #ffffff;
          }

          .attachment-label {
            margin-bottom: 8px;

            color: #64748b;

            font-size: 10px;
            font-weight: 700;

            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .timeline-evidence-image {
            display: block;

            width: 100%;
            max-width: 520px;
            max-height: 350px;

            object-fit: contain;

            border: 1px solid #e5e7eb;
            border-radius: 5px;
          }

          .pdf-link {
            display: inline-block;

            padding: 7px 10px;

            border: 1px solid #cbd5e1;
            border-radius: 5px;

            color: #1d4ed8;

            font-size: 12px;
            font-weight: 600;

            text-decoration: underline;
          }

          .pdf-link:hover {
            color: #1e40af;
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
              Complaint Information
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

  function handleOpenResolveModal() {
    setResolutionRemark("");
    setResolutionFile(null);
    setResolutionError("");
    setError("");
    setIsResolveModalOpen(true);
  }

  function handleCancelResolve() {
    if (isResolving) {
      return;
    }

    setResolutionRemark("");
    setResolutionFile(null);
    setResolutionError("");
    setIsResolveModalOpen(false);
  }

  function handleResolutionFileChange(event) {
    const file = event.target.files?.[0] || null;

    setResolutionError("");

    if (!file) {
      setResolutionFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setResolutionFile(null);

      setResolutionError(
        "Only JPG, PNG, WEBP, GIF images or PDF files are allowed.",
      );

      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      event.target.value = "";
      setResolutionFile(null);

      setResolutionError("The resolution evidence must be smaller than 10 MB.");

      return;
    }

    setResolutionFile(file);
  }

  async function handleConfirmResolve() {
    const trimmedRemark = resolutionRemark.trim();

    setResolutionError("");

    if (!trimmedRemark) {
      setResolutionError("Please describe how this grievance was resolved.");
      return;
    }

    if (!resolutionFile) {
      setResolutionError("Please upload resolution evidence.");
      return;
    }

    try {
      setIsResolving(true);

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      /*
       * Upload the resolution evidence first.
       */
      const uploadedMedia = await uploadMedia(token, resolutionFile);

      const mediaId = uploadedMedia?.id;

      if (!mediaId) {
        throw new Error("Resolution evidence upload failed.");
      }

      /*
       * Resolve the grievance through the
       * dedicated backend mutation.
       */
      const result = await resolveGrievance(token, {
        grievanceId: grievance.id,
        resolutionRemark: trimmedRemark,
        mediaId,
      });

      const timelineEvent = result.timelineEvent;

      setCurrentStatus("resolved");

      setCurrentStatusLabel(getStatusLabel("resolved", currentUser?.role));

      setCurrentLastUpdated(formatDisplayDate(new Date().toISOString()));

      setIsResolveModalOpen(false);
      setResolutionRemark("");
      setResolutionFile(null);
      setResolutionError("");

      /*
       * Tell the parent about the status and
       * the new resolution timeline event.
       */
      if (typeof onStatusUpdate === "function") {
        await onStatusUpdate({
          grievanceId: grievance.id,
          statusLabel: getStatusLabel("resolved", currentUser?.role),
          modified: new Date().toISOString(),
          timelineEvent,
        });
      }
    } catch (resolveError) {
      console.error("RESOLVE GRIEVANCE ERROR:", resolveError);

      setResolutionError(
        resolveError?.message || "Unable to resolve grievance.",
      );
    } finally {
      setIsResolving(false);
    }
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

              {canEditReturned && isEditingReturned ? (
                <div className="returned-edit-field">
                  <label>Complaint Title</label>

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={200}
                    placeholder="Enter complaint title"
                  />
                </div>
              ) : (
                <h2>{editTitle || grievance.title}</h2>
              )}

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

              {canEditReturned && isEditingReturned ? (
                <textarea
                  className="returned-description-input"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={6}
                  placeholder="Enter complaint description"
                />
              ) : (
                <p>
                  {editDescription ||
                    grievance.description ||
                    "No description provided."}
                </p>
              )}
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

          {canEditReturned && isEditingReturned && editError && (
            <div className="returned-edit-error">
              <FiAlertCircle size={16} />

              <span>{editError}</span>
            </div>
          )}

          {canSendToEsic && sendToEsicError && (
            <div className="returned-edit-error">
              <FiAlertCircle size={16} />

              <span>{sendToEsicError}</span>
            </div>
          )}

          {/* FOOTER */}

          <div className="grievance-modal-footer">
            <div className="modal-footer-actions">
              {canEditReturned && !isEditingReturned && (
                <button
                  type="button"
                  className="modal-workflow-button edit"
                  onClick={handleStartReturnedEdit}
                  disabled={isSaving}
                >
                  <FiEdit3 size={16} />
                  <span>Edit Complaint</span>
                </button>
              )}

              {canEditReturned && isEditingReturned && (
                <>
                  <button
                    type="button"
                    className="modal-workflow-button cancel"
                    onClick={handleCancelReturnedEdit}
                    disabled={isEditingSaving}
                  >
                    <FiX size={16} />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    className="modal-workflow-button send"
                    onClick={handleSaveReturnedEdit}
                    disabled={isEditingSaving}
                  >
                    <FiCheckCircle size={16} />

                    <span>
                      {isEditingSaving ? "Saving..." : "Save Changes"}
                    </span>
                  </button>
                </>
              )}
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

              {canSendToEsic && !isEditingReturned && (
                <button
                  type="button"
                  className="modal-workflow-button send"
                  onClick={handleSendToEsic}
                  disabled={isSendingToEsic || isSaving}
                >
                  <FiSend size={16} />

                  <span>{isSendingToEsic ? "Sending..." : "Send to ESIC"}</span>
                </button>
              )}

              {/* {canMarkInProgress && (
                <button
                  type="button"
                  className="modal-workflow-button progress"
                  onClick={() => performStatusUpdate("in progress")}
                  disabled={isSaving}
                >
                  <FiEdit3 size={16} />
                  <span>Mark In Progress</span>
                </button>
              )} */}

              {canResolve && (
                <button
                  type="button"
                  className="modal-workflow-button resolve"
                  onClick={handleOpenResolveModal}
                  disabled={isSaving || isResolving}
                >
                  <FiCheckCircle size={16} />
                  <span>Resolve Complaint</span>
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

      {isReturnModalOpen && (
        <div className="return-modal-overlay" onClick={handleCancelReturn}>
          <div
            className="return-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="return-modal-header">
              <div className="return-modal-title">
                <div className="return-icon">
                  <FiSend size={20} />
                </div>

                <div>
                  <h3>Send Back to Hospital</h3>

                  <p>
                    Return this complaint to the hospital for review and further
                    action.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="return-modal-close"
                onClick={handleCancelReturn}
                disabled={isReturning}
                aria-label="Close return modal"
              >
                <FiX size={19} />
              </button>
            </div>

            <div className="return-modal-body">
              <div className="return-grievance-info">
                <span>Token Number</span>

                <strong>{grievance.tokenNo}</strong>
              </div>

              <div className="return-grievance-info">
                <span>Complaint</span>

                <strong>{grievance.title}</strong>
              </div>

              <label htmlFor="return-remark" className="return-modal-label">
                Return Remark
                <span>*</span>
              </label>

              <textarea
                id="return-remark"
                value={pendingReturnRemark}
                onChange={(event) => {
                  setPendingReturnRemark(event.target.value);

                  setReturnError("");
                }}
                placeholder="Explain what needs to be reviewed, corrected or addressed by the hospital..."
                rows={6}
                maxLength={1000}
                disabled={isReturning}
                autoFocus
              />

              <div className="return-modal-bottom">
                {returnError ? (
                  <span className="return-modal-error">{returnError}</span>
                ) : (
                  <span>
                    The hospital will receive this complaint for further action.
                  </span>
                )}

                <span className="return-character-count">
                  {pendingReturnRemark.length}/1000
                </span>
              </div>
            </div>

            <div className="return-modal-footer">
              <button
                type="button"
                className="return-cancel-button"
                onClick={handleCancelReturn}
                disabled={isReturning}
              >
                Cancel
              </button>

              <button
                type="button"
                className="return-confirm-button"
                onClick={handleConfirmReturn}
                disabled={isReturning}
              >
                {isReturning ? (
                  "Sending..."
                ) : (
                  <>
                    <FiSend size={16} />
                    <span>Send Back to Hospital</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isResolveModalOpen && (
        <div className="resolve-modal-overlay" onClick={handleCancelResolve}>
          <div
            className="resolve-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="resolve-modal-header">
              <div>
                <div className="resolve-modal-eyebrow">RESOLUTION</div>

                <h3>Resolve Complaint</h3>

                <p>
                  Provide the resolution details and upload evidence showing
                  that the issue has been fixed.
                </p>
              </div>

              <button
                type="button"
                className="resolve-modal-close"
                onClick={handleCancelResolve}
                disabled={isResolving}
                aria-label="Close resolve modal"
              >
                <FiX size={19} />
              </button>
            </div>

            <div className="resolve-modal-body">
              <div className="resolve-grievance-summary">
                <span>COMPLAINT</span>

                <strong>{grievance.title}</strong>

                <small>{grievance.tokenNo}</small>
              </div>

              {resolutionError && (
                <div className="resolve-modal-error">
                  <FiAlertCircle size={17} />

                  <span>{resolutionError}</span>
                </div>
              )}

              <div className="resolve-form-group">
                <label htmlFor="resolution-remark">
                  Resolution Remark
                  <span>*</span>
                </label>

                <textarea
                  id="resolution-remark"
                  value={resolutionRemark}
                  onChange={(event) => setResolutionRemark(event.target.value)}
                  placeholder="Describe what was repaired, replaced or completed and how the grievance was resolved..."
                  rows={5}
                  disabled={isResolving}
                />

                <small>
                  Explain the actual work completed and why the grievance can
                  now be considered resolved.
                </small>
              </div>

              <div className="resolve-form-group">
                <label htmlFor="resolution-evidence">
                  Resolution Evidence
                  <span>*</span>
                </label>

                <div className="resolve-file-upload">
                  <input
                    id="resolution-evidence"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    onChange={handleResolutionFileChange}
                    disabled={isResolving}
                  />

                  <label
                    htmlFor="resolution-evidence"
                    className="resolve-file-label"
                  >
                    <FiUpload size={18} />

                    <span>
                      {resolutionFile
                        ? resolutionFile.name
                        : "Choose repair evidence"}
                    </span>
                  </label>

                  {resolutionFile && (
                    <button
                      type="button"
                      className="resolve-file-remove"
                      onClick={() => {
                        if (!isResolving) {
                          setResolutionFile(null);
                        }
                      }}
                      disabled={isResolving}
                      aria-label="Remove evidence"
                    >
                      <FiX size={15} />
                    </button>
                  )}
                </div>

                <small>
                  Upload a photo showing the completed repair or a PDF
                  completion report. Maximum 10 MB.
                </small>
              </div>
            </div>

            <div className="resolve-modal-footer">
              <button
                type="button"
                className="resolve-cancel-button"
                onClick={handleCancelResolve}
                disabled={isResolving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="resolve-confirm-button"
                onClick={handleConfirmResolve}
                disabled={isResolving}
              >
                {isResolving ? (
                  <>
                    <span className="resolve-spinner" />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    <span>Resolve Complaint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GrievanceModal;
