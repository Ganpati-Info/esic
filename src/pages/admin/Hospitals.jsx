import { useEffect, useState } from "react";

import {
  FiRefreshCw,
  FiSearch,
  FiMapPin,
  FiMail,
  FiUser,
  FiEdit2,
  FiX,
  FiLock,
  FiCheck,
} from "react-icons/fi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";


import { exportHospitals } from "../../lib/export";

import { getHospitals, updateHospital } from "../../lib/hospitals";
import { getGrievances } from "../../lib/grievances";

function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingHospital, setEditingHospital] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

async function loadHospitals() {
  try {
    setLoading(true);
    setError("");

    const token = sessionStorage.getItem("esicToken");

    if (!token) {
      throw new Error("Authentication session not found.");
    }

    const [hospitalData, grievanceData] = await Promise.all([
      getHospitals(token),
      getGrievances(token),
    ]);

    setHospitals(hospitalData);
    setGrievances(grievanceData);
  } catch (err) {
    console.error("Failed to load hospital data:", err);

    setError(err.message || "Unable to load hospital data. Please try again.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadHospitals();
  }, []);

  function handleEdit(hospital) {
    setEditingHospital(hospital);

    setForm({
      name: hospital.name || "",
      email: hospital.email === "N/A" ? "" : hospital.email || "",
      password: "",
    });

    setSaveError("");
    setSaveSuccess("");
  }

  function handleCloseModal() {
    if (saving) {
      return;
    }

    setEditingHospital(null);
    setSaveError("");
    setSaveSuccess("");
    setForm({
      name: "",
      email: "",
      password: "",
    });
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave() {
    if (!editingHospital) {
      return;
    }

    if (!form.name.trim()) {
      setSaveError("Hospital name is required.");
      return;
    }

    if (!form.email.trim()) {
      setSaveError("Email address is required.");
      return;
    }

    if (form.password && form.password.length < 8) {
      setSaveError("New password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess("");

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error("Authentication session not found.");
      }

      const result = await updateHospital(token, editingHospital.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const updatedHospital = result?.hospital;

      if (!updatedHospital) {
        throw new Error(
          "Hospital was updated, but no updated data was returned.",
        );
      }

      setHospitals((current) =>
        current.map((hospital) => {
          if (hospital.id !== editingHospital.id) {
            return hospital;
          }

          return {
            ...hospital,
            name: updatedHospital.name || hospital.name,
            email: updatedHospital.email || hospital.email,
            code: updatedHospital.hospitalCode || hospital.code,
          };
        }),
      );

      setEditingHospital((current) => ({
        ...current,
        name: updatedHospital.name || current.name,
        email: updatedHospital.email || current.email,
        code: updatedHospital.hospitalCode || current.code,
      }));

      setForm((current) => ({
        ...current,
        password: "",
      }));

      setSaveSuccess("Hospital updated successfully.");

      setTimeout(() => {
        setEditingHospital(null);
        setSaveSuccess("");
      }, 900);
    } catch (err) {
      console.error("Failed to update hospital:", err);

      setSaveError(err.message || "Unable to update hospital.");
    } finally {
      setSaving(false);
    }
  }

  const filteredHospitals = hospitals.filter((hospital) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      hospital.code.toLowerCase().includes(value) ||
      hospital.name.toLowerCase().includes(value) ||
      hospital.username.toLowerCase().includes(value) ||
      hospital.email.toLowerCase().includes(value)
    );
  });

  return (
    <div className="hospitals-page">
      <div className="hospitals-page-header">
        <div>
          <h1>Hospitals</h1>

          <p>
            Manage and view all hospitals connected to the ESIC Grievance
            Portal.
          </p>
        </div>

        <button
          type="button"
          className="hospitals-refresh-button"
          onClick={loadHospitals}
          disabled={loading}
        >
          <FiRefreshCw size={16} className={loading ? "is-spinning" : ""} />
          Refresh
        </button>
      </div>

      <div className="hospitals-summary">
        <div className="hospital-summary-card">
          <div className="hospital-summary-icon">
            <FiMapPin size={20} />
          </div>

          <div>
            <span>Total Hospitals</span>

            <strong>{hospitals.length}</strong>
          </div>
        </div>
      </div>

      <section className="hospitals-card">
        <div className="hospitals-card-header">
          <div>
            <h2>Hospital Directory</h2>

            <p>
              Hospital information is loaded from the portal account records.
            </p>
          </div>

          <div className="export-actions">
            <span className="export-label">Export as:</span>

            <button
              type="button"
              className="export-button"
              onClick={() =>
  exportHospitals(
    hospitals,
    grievances,
    "pdf",
  )
}
              title="Export as PDF"
            >
              <FaRegFilePdf />
              <span>PDF</span>
            </button>

            <button
              type="button"
              className="export-button"
              onClick={() => exportHospitals(hospitals, "excel")}
              title="Export as Excel"
            >
              <FaRegFileExcel />
              <span>Excel</span>
            </button>

            {/* <button
              type="button"
              className="export-button"
              onClick={() => exportHospitals(hospitals, "csv")}
              title="Export as CSV"
            >
              <FiGrid />
              <span>CSV</span>
            </button> */}
          </div>

          <div className="hospitals-search">
            <FiSearch size={17} />

            <input
              type="text"
              placeholder="Search hospitals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="hospitals-error">
            <span>{error}</span>

            <button type="button" onClick={loadHospitals}>
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="hospitals-loading">
            <div className="hospital-loading-spinner" />

            <span>Loading hospitals...</span>
          </div>
        )}

        {!loading && !error && (
          <div className="hospitals-table-wrapper">
            <table className="hospitals-table">
              <thead>
                <tr>
                  <th>Hospital Code</th>
                  <th>Hospital Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((hospital) => (
                    <tr key={hospital.code}>
                      <td>
                        <span className="hospital-code">{hospital.code}</span>
                      </td>

                      <td>
                        <div className="hospital-name-cell">
                          <div className="hospital-avatar">
                            {hospital.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{hospital.name}</strong>

                            <span>Hospital</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="hospital-detail-cell">
                          <FiUser size={15} />

                          <span>{hospital.username}</span>
                        </div>
                      </td>

                      <td>
                        <div className="hospital-detail-cell">
                          <FiMail size={15} />

                          <span>{hospital.email}</span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="hospital-edit-button"
                          onClick={() => handleEdit(hospital)}
                        >
                          <FiEdit2 size={15} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="hospitals-empty">
                      {search
                        ? "No hospitals match your search."
                        : "No hospitals found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingHospital && (
        <div
          className="hospital-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="hospital-modal">
            <div className="hospital-modal-header">
              <div>
                <h2>Edit Hospital</h2>

                <p>Update the hospital account information.</p>
              </div>

              <button
                type="button"
                className="hospital-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="hospital-modal-body">
              <div className="hospital-form-group">
                <label>Hospital Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Enter hospital name"
                  disabled={saving}
                />
              </div>

              <div className="hospital-form-row">
                <div className="hospital-form-group">
                  <label>Hospital Code</label>

                  <input type="text" value={editingHospital.code} disabled />

                  <span className="hospital-form-help">
                    Hospital code cannot be changed.
                  </span>
                </div>

                <div className="hospital-form-group">
                  <label>Username</label>

                  <input
                    type="text"
                    value={editingHospital.username}
                    disabled
                  />

                  <span className="hospital-form-help">
                    Username cannot be changed.
                  </span>
                </div>
              </div>

              <div className="hospital-form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="hospital@example.com"
                  disabled={saving}
                />
              </div>

              <div className="hospital-form-group">
                <label>New Password</label>

                <div className="hospital-password-input">
                  <FiLock size={17} />

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="Leave blank to keep current password"
                    disabled={saving}
                  />
                </div>

                <span className="hospital-form-help">
                  Leave blank if the password should remain unchanged.
                </span>
              </div>

              {saveError && (
                <div className="hospital-form-error">{saveError}</div>
              )}

              {saveSuccess && (
                <div className="hospital-form-success">
                  <FiCheck size={17} />

                  <span>{saveSuccess}</span>
                </div>
              )}
            </div>

            <div className="hospital-modal-footer">
              <button
                type="button"
                className="hospital-modal-cancel"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="hospital-modal-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="hospital-button-spinner" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hospitals;
