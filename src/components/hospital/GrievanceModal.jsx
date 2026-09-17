import { FiX } from "react-icons/fi";

function getStatusClass(status) {
  if (!status) {
    return "";
  }

  return String(status).toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function GrievanceModal({ grievance, onClose }) {
  if (!grievance) {
    return null;
  }

  return (
    <div className="grievance-modal-overlay" onClick={onClose}>
      <div
        className="grievance-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* MODAL HEADER */}

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

        {/* MODAL BODY */}

        <div className="grievance-modal-body">
          {/* STATUS */}

          <div className="modal-status-row">
            <span className="modal-label">Status</span>

            <span className={`status ${getStatusClass(grievance.status)}`}>
              {grievance.status}
            </span>
          </div>

          {/* DETAILS */}

          <div className="modal-details">
            <div className="modal-detail">
              <span className="modal-label">Token Number</span>

              <strong>{grievance.tokenNo}</strong>
            </div>

            <div className="modal-detail">
              <span className="modal-label">Submitted On</span>

              <strong>{grievance.submittedOn}</strong>
            </div>

            <div className="modal-detail">
              <span className="modal-label">Last Updated</span>

              <strong>{grievance.lastUpdated}</strong>
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

        {/* MODAL FOOTER */}

        <div className="grievance-modal-footer">
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default GrievanceModal;
