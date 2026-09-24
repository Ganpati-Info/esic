import { FiLock } from "react-icons/fi";

function SessionExpiredModal({ open, onLogin }) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="session-expired-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="session-expired-modal">
        <div className="session-expired-icon">
          <FiLock size={25} />
        </div>

        <div className="session-expired-content">
          <h2 id="session-expired-title">Session Expired</h2>

          <p>
            Your login session has expired. Please login again to continue using
            the ESIC Complaint Redressal Portal.
          </p>
        </div>

        <button
          type="button"
          className="session-expired-button"
          onClick={onLogin}
        >
          Login Again
        </button>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
