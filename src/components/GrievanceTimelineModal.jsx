import { useEffect, useState } from "react";

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiLoader,
  FiPaperclip,
  FiPlus,
  FiSend,
  FiUpload,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  addGrievanceProgressUpdate,
  createGrievanceSchedulePlan,
} from "../lib/grievances";

import { uploadMedia } from "../lib/media";

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

function formatBudget(value) {
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

function getMediaFileName(url) {
  if (!url) {
    return "Uploaded file";
  }

  try {
    const cleanUrl = url.split("?")[0];
    const fileName = cleanUrl.split("/").pop();

    return decodeURIComponent(fileName || "Uploaded file");
  } catch {
    return "Uploaded file";
  }
}

function isPdfMedia(mediaType, mediaUrl) {
  if (String(mediaType || "").toLowerCase() === "application/pdf") {
    return true;
  }

  return String(mediaUrl || "")
    .split("?")[0]
    .toLowerCase()
    .endsWith(".pdf");
}

function getEventIcon(eventType) {
  switch (eventType) {
    case "submitted":
      return FiFileText;

    case "sent_to_esic":
      return FiSend;

    case "schedule_plan":
      return FiCalendar;

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

    case "schedule_plan":
      return "schedule-plan";

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

function getHospitalName(grievance) {
  if (grievance?.hospital) {
    return grievance.hospital;
  }

  if (grievance?.hospitalName) {
    return grievance.hospitalName;
  }

  try {
    const storedUser = sessionStorage.getItem("esicUser");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      if (user?.name) {
        return user.name;
      }
    }
  } catch (error) {
    console.error("Unable to read hospital information:", error);
  }

  return "Unknown Hospital";
}

function GrievanceTimelineModal({
  grievance,
  onClose,
  canEdit = false,
  onGrievanceUpdated,
}) {
  const [timeline, setTimeline] = useState(grievance?.timeline || []);

  const [activeForm, setActiveForm] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [eta, setEta] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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
    setBudget("");
    setEta("");
    setSelectedFile(null);
    setError("");
    setSuccess("");
    setActiveForm(null);
  }, [grievance]);

  if (!grievance) {
    return null;
  }

  const hospitalName = getHospitalName(grievance);

  const currentStatus = String(grievance.status || "")
    .trim()
    .toLowerCase();

  const canCreateSchedulePlan = canEdit && currentStatus === "sent to esic";

  const canAddProgress = canEdit && currentStatus === "in progress";

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBudget("");
    setEta("");
    setSelectedFile(null);
    setError("");
    setActiveForm(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setSelectedFile(null);
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
      setSelectedFile(null);

      event.target.value = "";

      setError("Only JPG, PNG, WEBP, GIF images or PDF files are allowed.");

      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedFile(null);

      event.target.value = "";

      setError("The supporting file must be smaller than 10 MB.");

      return;
    }

    setSelectedFile(file);
  };

  const handleSchedulePlanSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Please enter a schedule plan title.");
      return;
    }

    if (!trimmedDescription) {
      setError("Please enter a schedule plan description.");
      return;
    }

    if (!eta) {
      setError("Please select a tentative completion date.");
      return;
    }

    if (budget !== "" && (Number.isNaN(Number(budget)) || Number(budget) < 0)) {
      setError("Please enter a valid budget.");
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

      let mediaId = null;

      if (selectedFile) {
        const uploadedMedia = await uploadMedia(token, selectedFile);

        mediaId = uploadedMedia?.id || null;

        if (!mediaId) {
          throw new Error("Supporting file upload failed.");
        }
      }

      const result = await createGrievanceSchedulePlan(token, {
        grievanceId: grievance.id,
        title: trimmedTitle,
        description: trimmedDescription,
        budget: budget !== "" ? Number(budget) : null,
        mediaId,
        eta,
      });

      const newEvent = result.timelineEvent;

      setTimeline((currentTimeline) => [...currentTimeline, newEvent]);

      const modified = new Date().toISOString();

      if (typeof onGrievanceUpdated === "function") {
        onGrievanceUpdated({
          grievanceId: grievance.id,
          status: "In Progress",
          timelineEvent: newEvent,
          modified,
        });
      }

      setTitle("");
      setDescription("");
      setBudget("");
      setEta("");
      setSelectedFile(null);
      setActiveForm(null);

      setSuccess(
        "Schedule plan created successfully. The grievance is now In Progress.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (submitError) {
      console.error("CREATE SCHEDULE PLAN ERROR:", submitError);

      setError(submitError?.message || "Unable to create schedule plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressSubmit = async (event) => {
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

      if (typeof onGrievanceUpdated === "function") {
        onGrievanceUpdated({
          grievanceId: grievance.id,
          status: grievance.status,
          timelineEvent: newEvent,
          modified: new Date().toISOString(),
        });
      }

      setTitle("");
      setDescription("");
      setEta("");
      setActiveForm(null);

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

  const openSchedulePlan = () => {
    setError("");
    setSuccess("");
    setTitle("");
    setDescription("");
    setBudget("");
    setEta("");
    setSelectedFile(null);
    setActiveForm("schedule");
  };

  const openProgressForm = () => {
    setError("");
    setSuccess("");
    setTitle("");
    setDescription("");
    setBudget("");
    setEta("");
    setSelectedFile(null);
    setActiveForm("progress");
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    resetForm();
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
            <div className="timeline-modal-eyebrow">COMPLAINT TIMELINE</div>

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

            <strong>{hospitalName}</strong>
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

                        {event.eventType === "schedule_plan" && (
                          <span className="timeline-event-badge">
                            Schedule Plan
                          </span>
                        )}

                        {event.eventType === "progress_update" && (
                          <span className="timeline-event-badge">
                            Progress Update
                          </span>
                        )}

                        {event.eventType === "sent_to_esic" && (
                          <span className="timeline-event-badge">
                            Sent to ESIC
                          </span>
                        )}

                        {event.eventType === "resolved" && (
                          <span className="timeline-event-badge">Resolved</span>
                        )}

                        {event.eventType === "rejected" && (
                          <span className="timeline-event-badge">Rejected</span>
                        )}
                      </div>

                      {event.description && (
                        <p className="timeline-event-description">
                          {event.description}
                        </p>
                      )}

                      {event.eventType === "schedule_plan" &&
                        event.budget !== null &&
                        event.budget !== undefined &&
                        event.budget !== "" && (
                          <div className="timeline-event-meta">
                            <span>Budget</span>

                            <strong>{formatBudget(event.budget)}</strong>
                          </div>
                        )}

                      {event.eta && (
                        <div className="timeline-event-eta">
                          <FiCalendar size={15} />

                          <span>
                            ETA: <strong>{formatEta(event.eta)}</strong>
                          </span>
                        </div>
                      )}

                      {event.mediaUrl && (
                        <div className="timeline-event-media">
                          {isPdfMedia(event.mediaType, event.mediaUrl) ? (
                            <div className="timeline-pdf-card">
                              <div className="timeline-pdf-icon">
                                <FiFileText size={22} />
                              </div>

                              <div className="timeline-pdf-info">
                                <span className="timeline-media-label">
                                  Supporting Document
                                </span>

                                <strong
                                  title={getMediaFileName(event.mediaUrl)}
                                >
                                  {getMediaFileName(event.mediaUrl)}
                                </strong>
                              </div>

                              <a
                                href={event.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="timeline-pdf-button"
                              >
                                Open PDF
                              </a>
                            </div>
                          ) : (
                            <div className="timeline-image-card">
                              <div className="timeline-image-card-header">
                                <div>
                                  <span className="timeline-media-label">
                                    Supporting Image
                                  </span>

                                  <strong
                                    title={getMediaFileName(event.mediaUrl)}
                                  >
                                    {getMediaFileName(event.mediaUrl)}
                                  </strong>
                                </div>

                                <a
                                  href={event.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="timeline-image-open"
                                >
                                  Open
                                </a>
                              </div>

                              <a
                                href={event.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="timeline-image-preview"
                              >
                                <img
                                  src={event.mediaUrl}
                                  alt={event.title || "Supporting evidence"}
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ESIC ACTIONS */}

          {canEdit && (
            <div className="timeline-progress-section">
              {!activeForm && canCreateSchedulePlan && (
                <button
                  type="button"
                  className="timeline-add-button"
                  onClick={openSchedulePlan}
                >
                  <FiCalendar size={17} />

                  <span>Create Schedule Plan</span>
                </button>
              )}

              {!activeForm && canAddProgress && (
                <button
                  type="button"
                  className="timeline-add-button"
                  onClick={openProgressForm}
                >
                  <FiPlus size={17} />

                  <span>Add Progress Update</span>
                </button>
              )}

              {/* SCHEDULE PLAN FORM */}

              {activeForm === "schedule" && (
                <form
                  className="timeline-progress-form"
                  onSubmit={handleSchedulePlanSubmit}
                >
                  <div className="timeline-form-header">
                    <div>
                      <h3>Create Schedule Plan</h3>

                      <p>
                        Define the planned work, budget and tentative completion
                        date.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="timeline-form-close"
                      onClick={closeForm}
                      disabled={isSaving}
                      aria-label="Close schedule plan form"
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
                    <label htmlFor="schedule-title">
                      Plan Title
                      <span>*</span>
                    </label>

                    <input
                      id="schedule-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Electrical Repair Work"
                      disabled={isSaving}
                      maxLength={255}
                    />
                  </div>

                  <div className="timeline-form-group">
                    <label htmlFor="schedule-description">
                      Description
                      <span>*</span>
                    </label>

                    <textarea
                      id="schedule-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe the planned work, activities and execution details..."
                      rows={5}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="timeline-form-row">
                    <div className="timeline-form-group">
                      <label htmlFor="schedule-budget">Budget</label>

                      <div className="timeline-input-prefix">
                        <span>₹</span>

                        <input
                          id="schedule-budget"
                          type="number"
                          min="0"
                          step="0.01"
                          value={budget}
                          onChange={(event) => setBudget(event.target.value)}
                          placeholder="0.00"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="timeline-form-group">
                      <label htmlFor="schedule-eta">
                        Tentative Completion Date
                        <span>*</span>
                      </label>

                      <input
                        id="schedule-eta"
                        type="date"
                        value={eta}
                        onChange={(event) => setEta(event.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="timeline-form-group">
                    <label htmlFor="schedule-file">
                      Supporting Image / PDF
                    </label>

                    <div className="timeline-file-upload">
                      <input
                        id="schedule-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                        disabled={isSaving}
                      />

                      <label
                        htmlFor="schedule-file"
                        className="timeline-file-label"
                      >
                        <FiUpload size={18} />

                        <span>
                          {selectedFile
                            ? selectedFile.name
                            : "Choose Image or PDF"}
                        </span>
                      </label>

                      {selectedFile && (
                        <button
                          type="button"
                          className="timeline-file-remove"
                          onClick={() => {
                            if (!isSaving) {
                              setSelectedFile(null);
                            }
                          }}
                          disabled={isSaving}
                          aria-label="Remove selected file"
                        >
                          <FiX size={15} />
                        </button>
                      )}
                    </div>

                    <small>JPG, PNG, WEBP, GIF or PDF. Maximum 10 MB.</small>
                  </div>

                  <div className="timeline-form-actions">
                    <button
                      type="button"
                      className="timeline-cancel-button"
                      onClick={closeForm}
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

                          <span>Creating Plan...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={16} />

                          <span>Create Schedule Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* PROGRESS UPDATE FORM */}

              {activeForm === "progress" && (
                <form
                  className="timeline-progress-form"
                  onSubmit={handleProgressSubmit}
                >
                  <div className="timeline-form-header">
                    <div>
                      <h3>Add Progress Update</h3>

                      <p>Record the latest work or inspection progress.</p>
                    </div>

                    <button
                      type="button"
                      className="timeline-form-close"
                      onClick={closeForm}
                      disabled={isSaving}
                      aria-label="Close progress form"
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
                      placeholder="e.g. Site Inspection Completed"
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
                      onClick={closeForm}
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
