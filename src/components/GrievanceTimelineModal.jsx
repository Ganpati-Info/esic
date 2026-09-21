import { useEffect, useState } from "react";

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiLoader,
  FiPlus,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import { addGrievanceProgressUpdate } from "../lib/grievances";

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

function formatEta(value) {
  if (!value) {
    return "";
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
  }).format(date);
}

function getEventIcon(eventType) {
  switch (eventType) {
    case "submitted":
      return FiFileText;

    case "sent_to_esic":
      return FiSend;

    case "in_progress":
      return FiClock;

    case "progress_update":
      return FiEdit3;

    case "resolved":
      return FiCheckCircle;

    case "rejected":
      return FiXCircle;

    default:
      return FiClock;
  }
}

function getEventClass(eventType) {
  switch (eventType) {
    case "submitted":
      return "submitted";

    case "sent_to_esic":
      return "sent-to-esic";

    case "in_progress":
      return "in-progress";

    case "progress_update":
      return "progress-update";

    case "resolved":
      return "resolved";

    case "rejected":
      return "rejected";

    default:
      return "default";
  }
}

function GrievanceTimelineModal({ grievance, onClose, canEdit = false }) {
  const [timeline, setTimeline] = useState(grievance?.timeline || []);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [eta, setEta] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    setTimeline(grievance?.timeline || []);
  }, [grievance]);

  useEffect(() => {
    if (!grievance) {
      return;
    }

    setTitle("");
    setDescription("");
    setEta("");
    setError("");
    setSuccess("");
    setIsAddFormOpen(false);
  }, [grievance]);

  if (!grievance) {
    return null;
  }

  const currentStatus = String(grievance.status || "")
    .trim()
    .toLowerCase();

  /*
   * Only ESIC can edit the timeline.
   *
   * The parent component controls canEdit:
   *
   * Hospital     -> false
   * Super Admin  -> false
   * ESIC Officer -> true
   *
   * Even ESIC can only add a progress update while
   * the grievance is In Progress.
   */
  const canAddProgress = canEdit && currentStatus === "in progress";

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Please enter a progress update title.");
      return;
    }

    if (!trimmedDescription) {
      setError("Please enter a progress update description.");
      return;
    }

    try {
      setIsSaving(true);

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      const newEvent = await addGrievanceProgressUpdate(token, {
        grievanceId: grievance.id,
        title: trimmedTitle,
        description: trimmedDescription,
        eta: eta || null,
      });

      setTimeline((currentTimeline) => [...currentTimeline, newEvent]);

      setTitle("");
      setDescription("");
      setEta("");

      setIsAddFormOpen(false);

      setSuccess("Progress update added successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (submitError) {
      console.error("ADD PROGRESS UPDATE ERROR:", submitError);

      setError(submitError?.message || "Unable to add progress update.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="timeline-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          handleClose();
        }
      }}
    >
      <div className="timeline-modal">
        {/* HEADER */}

        <div className="timeline-modal-header">
          <div>
            <div className="timeline-modal-eyebrow">GRIEVANCE TIMELINE</div>

            <h2>{grievance.tokenNo || "Grievance"}</h2>

            <p>{grievance.title || "Grievance processing history"}</p>
          </div>

          <button
            type="button"
            className="timeline-modal-close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close timeline"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* SUMMARY */}

        <div className="timeline-summary">
          <div className="timeline-summary-item">
            <span>Hospital</span>

            <strong>{grievance.hospital || "Unknown Hospital"}</strong>
          </div>

          <div className="timeline-summary-item">
            <span>Status</span>

            <strong>{grievance.status || "Unknown"}</strong>
          </div>

          <div className="timeline-summary-item">
            <span>Last Updated</span>

            <strong>{grievance.lastUpdated || "N/A"}</strong>
          </div>
        </div>

        {/* BODY */}

        <div className="timeline-modal-body">
          {success && (
            <div className="timeline-success">
              <FiCheckCircle size={17} />

              <span>{success}</span>
            </div>
          )}

          {/* TIMELINE */}

          <div className="grievance-timeline">
            {timeline.length === 0 ? (
              <div className="timeline-empty">
                <FiClock size={26} />

                <p>No timeline events available.</p>
              </div>
            ) : (
              timeline.map((event, index) => {
                const Icon = getEventIcon(event.eventType);

                const eventClass = getEventClass(event.eventType);

                const isLast = index === timeline.length - 1;

                return (
                  <div
                    className={`timeline-event ${eventClass}`}
                    key={event.id || `${event.eventType}-${index}`}
                  >
                    <div className="timeline-event-marker">
                      <Icon size={16} />
                    </div>

                    {!isLast && <div className="timeline-event-line" />}

                    <div className="timeline-event-content">
                      <div className="timeline-event-top">
                        <div>
                          <h3>{event.title}</h3>

                          <span className="timeline-event-date">
                            {formatTimelineDate(event.createdAt)}
                          </span>
                        </div>

                        {event.eventType === "progress_update" && (
                          <span className="timeline-event-badge">
                            Progress Update
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="timeline-event-description">
                          {event.description}
                        </p>
                      )}

                      {event.eta && (
                        <div className="timeline-event-eta">
                          <FiCalendar size={15} />

                          <span>
                            ETA: <strong>{formatEta(event.eta)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ADD PROGRESS UPDATE */}

          {canAddProgress && (
            <div className="timeline-progress-section">
              {!isAddFormOpen ? (
                <button
                  type="button"
                  className="timeline-add-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setIsAddFormOpen(true);
                  }}
                >
                  <FiPlus size={17} />

                  <span>Add Progress Update</span>
                </button>
              ) : (
                <form
                  className="timeline-progress-form"
                  onSubmit={handleSubmit}
                >
                  <div className="timeline-form-header">
                    <div>
                      <h3>Add Progress Update</h3>

                      <p>Record the latest work or inspection progress.</p>
                    </div>

                    <button
                      type="button"
                      className="timeline-form-close"
                      onClick={() => {
                        if (!isSaving) {
                          setIsAddFormOpen(false);
                          setError("");
                        }
                      }}
                      disabled={isSaving}
                    >
                      <FiX size={17} />
                    </button>
                  </div>

                  {error && (
                    <div className="timeline-error">
                      <FiXCircle size={17} />

                      <span>{error}</span>
                    </div>
                  )}

                  <div className="timeline-form-group">
                    <label htmlFor="progress-title">
                      Progress Title
                      <span>*</span>
                    </label>

                    <input
                      id="progress-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Site Inspection Scheduled"
                      disabled={isSaving}
                      maxLength={255}
                    />
                  </div>

                  <div className="timeline-form-group">
                    <label htmlFor="progress-description">
                      Description
                      <span>*</span>
                    </label>

                    <textarea
                      id="progress-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe the latest progress..."
                      rows={4}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="timeline-form-group">
                    <label htmlFor="progress-eta">
                      Tentative Completion Date
                    </label>

                    <input
                      id="progress-eta"
                      type="date"
                      value={eta}
                      onChange={(event) => setEta(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="timeline-form-actions">
                    <button
                      type="button"
                      className="timeline-cancel-button"
                      onClick={() => {
                        if (!isSaving) {
                          setIsAddFormOpen(false);
                          setError("");
                        }
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="timeline-save-button"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <FiLoader size={16} className="timeline-spinner" />

                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={16} />

                          <span>Add Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="timeline-modal-footer">
          <button
            type="button"
            className="timeline-close-button"
            onClick={handleClose}
            disabled={isSaving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default GrievanceTimelineModal;
