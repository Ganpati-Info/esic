import { useEffect, useMemo, useState } from "react";

import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiInbox,
  FiArrowUp,
  FiArrowDown,
  FiClock,
  FiChevronDown as FiChevronsUpDown,
  FiRefreshCw,
} from "react-icons/fi";

import { getGrievances } from "../../lib/grievances";
import GrievanceModal from "../../components/hospital/GrievanceModal";
import GrievanceTimelineModal from "../../components/GrievanceTimelineModal";

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

function getSuperAdminStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Sent to Director") {
    return "Pending Approval";
  }

  if (normalized === "Resolved") {
    return "Completed";
  }

  return normalized;
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

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <FiChevronsUpDown size={14} />;
  }

  return sortConfig.direction === "asc" ? (
    <FiArrowUp size={14} />
  ) : (
    <FiArrowDown size={14} />
  );
}

function AllGrievances() {
  const [grievances, setGrievances] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedHospital, setSelectedHospital] = useState("all");

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [sortConfig, setSortConfig] = useState({
    key: "submittedOn",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  /*
   * Normal grievance detail modal.
   */
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  /*
   * Separate timeline modal.
   *
   * Admin can only view the timeline.
   */
  const [selectedTimelineGrievance, setSelectedTimelineGrievance] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  /* =========================================================
     STATUS UPDATE
  ========================================================= */

  const handleStatusUpdate = ({
    grievanceId,
    statusLabel,
    rejectionRemark,
    modified,
  }) => {
    setGrievances((currentGrievances) =>
      currentGrievances.map((grievance) => {
        if (grievance.id !== grievanceId) {
          return grievance;
        }

        return {
          ...grievance,

          status: statusLabel || grievance.status,

          rejectionRemark: rejectionRemark || grievance.rejectionRemark || "",

          lastUpdated: modified
            ? formatDisplayDate(modified)
            : grievance.lastUpdated,
        };
      }),
    );

    /*
     * Keep the normal detail modal
     * synchronized.
     */

    setSelectedGrievance((currentGrievance) => {
      if (!currentGrievance) {
        return currentGrievance;
      }

      if (currentGrievance.id !== grievanceId) {
        return currentGrievance;
      }

      return {
        ...currentGrievance,

        status: statusLabel || currentGrievance.status,

        rejectionRemark:
          rejectionRemark || currentGrievance.rejectionRemark || "",

        lastUpdated: modified
          ? formatDisplayDate(modified)
          : currentGrievance.lastUpdated,
      };
    });

    /*
     * Keep timeline modal synchronized
     * if it happens to be open.
     */

    setSelectedTimelineGrievance((currentGrievance) => {
      if (!currentGrievance) {
        return currentGrievance;
      }

      if (currentGrievance.id !== grievanceId) {
        return currentGrievance;
      }

      return {
        ...currentGrievance,

        status: statusLabel || currentGrievance.status,

        rejectionRemark:
          rejectionRemark || currentGrievance.rejectionRemark || "",

        lastUpdated: modified
          ? formatDisplayDate(modified)
          : currentGrievance.lastUpdated,
      };
    });
  };

  /* =========================================================
     LOAD ALL GRIEVANCES
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadGrievances() {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("esicToken");

        if (!token) {
          throw new Error("Authentication session not found.");
        }

        const data = await getGrievances(token);

        console.log("ADMIN ALL GRIEVANCES:", data);

        if (!mounted) {
          return;
        }

        const formatted = data.map((grievance) => {
          const details = grievance.grievanceDetails || {};

          return {
            id: grievance.databaseId,

            tokenNo: details.tokenNumber || "N/A",

            title: grievance.title || "Untitled Grievance",

            hospital: grievance.creator?.name || "Unknown Hospital",

            hospitalUsername: grievance.creator?.username || "",

            submittedOn: formatDisplayDate(grievance.date),

            lastUpdated: formatDisplayDate(grievance.modified),

            status: normalizeStatus(grievance.statusLabel || ""),

            description: details.description || "",

            image: grievance.currentImageUrl || null,

            generatedImageUrl: grievance.generatedImageUrl || null,

            rejectionRemark: grievance.rejectionRemark || "",

            hospitalName: grievance.creator?.username || "N/A",

            /*
             * Timeline events returned
             * directly by GraphQL.
             */
            timeline: grievance.timeline || [],
          };
        });

        setGrievances(formatted);
      } catch (err) {
        console.error("Failed to load all grievances:", err);

        if (!mounted) {
          return;
        }

        setError(
          err?.message || "Unable to load grievances. Please try again.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGrievances();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  /* =========================================================
     HOSPITAL OPTIONS
  ========================================================= */

  const hospitals = useMemo(() => {
    const uniqueHospitals = new Set();

    grievances.forEach((grievance) => {
      if (grievance.hospital) {
        uniqueHospitals.add(grievance.hospital);
      }
    });

    return Array.from(uniqueHospitals).sort((a, b) => a.localeCompare(b));
  }, [grievances]);

  /* =========================================================
     STATUS OPTIONS
  ========================================================= */

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set();

    grievances.forEach((grievance) => {
      if (grievance.status) {
        uniqueStatuses.add(grievance.status);
      }
    });

    return Array.from(uniqueStatuses).sort((a, b) => a.localeCompare(b));
  }, [grievances]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredGrievances = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = grievances.filter((grievance) => {
      const matchesSearch =
        !search ||
        String(grievance.tokenNo).toLowerCase().includes(search) ||
        String(grievance.title).toLowerCase().includes(search);

      const matchesHospital =
        selectedHospital === "all" || grievance.hospital === selectedHospital;

      const matchesStatus =
        selectedStatus === "all" || grievance.status === selectedStatus;

      return matchesSearch && matchesHospital && matchesStatus;
    });

    filtered.sort((first, second) => {
      let firstValue = first[sortConfig.key];

      let secondValue = second[sortConfig.key];

      if (
        sortConfig.key === "submittedOn" ||
        sortConfig.key === "lastUpdated"
      ) {
        firstValue = new Date(firstValue);

        secondValue = new Date(secondValue);

        if (Number.isNaN(firstValue.getTime())) {
          firstValue = new Date(0);
        }

        if (Number.isNaN(secondValue.getTime())) {
          secondValue = new Date(0);
        }
      } else {
        firstValue = String(firstValue ?? "").toLowerCase();

        secondValue = String(secondValue ?? "").toLowerCase();
      }

      if (firstValue < secondValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return filtered;
  }, [grievances, searchTerm, selectedHospital, selectedStatus, sortConfig]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGrievances.length / rowsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const visibleGrievances = filteredGrievances.slice(startIndex, endIndex);

  /* =========================================================
     SORT
  ========================================================= */

  const handleSort = (key) => {
    setCurrentPage(1);

    setSortConfig((current) => ({
      key,

      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedHospital("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="hospital-dashboard">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="dashboard-title">
        <div className="dashboard-title-content">
          <div className="dashboard-eyebrow">DIRECTOR MODULE</div>

          <h1>All Grievances</h1>

          <p>View and manage grievances submitted by all hospitals.</p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          <FiRefreshCw
            size={16}
            className={loading ? "refresh-spinning" : ""}
          />

          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <section className="grievances-card admin-all-grievances-card">
        {/* ===================================================
            FILTER BAR
        =================================================== */}

        <div className="admin-filter-bar">
          {/* SEARCH */}

          <div className="admin-search-box">
            <FiSearch size={19} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);

                setCurrentPage(1);
              }}
              placeholder="Search by token or title..."
            />
          </div>

          <div className="admin-filter">
            {/* HOSPITAL */}

            <div className="admin-filter-select">
              <select
                value={selectedHospital}
                onChange={(event) => {
                  setSelectedHospital(event.target.value);

                  setCurrentPage(1);
                }}
              >
                <option value="all">All Hospitals</option>

                {hospitals.map((hospital) => (
                  <option key={hospital} value={hospital}>
                    {hospital}
                  </option>
                ))}
              </select>

              <FiChevronDown size={17} />
            </div>

            {/* STATUS */}

            <div className="admin-filter-select">
              <select
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);

                  setCurrentPage(1);
                }}
              >
                <option value="all">All Statuses</option>

                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {getSuperAdminStatusLabel(status)}
                  </option>
                ))}
              </select>

              <FiChevronDown size={17} />
            </div>
          </div>
        </div>

        {/* ===================================================
            RESULT COUNT
        =================================================== */}

        <div className="admin-results-bar">
          <span>
            {loading
              ? "Loading complaints, please wait..."
              : filteredGrievances.length === 0
                ? "No grievances found"
                : `Showing ${startIndex + 1}-${Math.min(
                    endIndex,
                    filteredGrievances.length,
                  )} of ${filteredGrievances.length} grievances`}
          </span>

          {!loading &&
            (searchTerm ||
              selectedHospital !== "all" ||
              selectedStatus !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="admin-clear-filters"
              >
                Clear filters
              </button>
            )}
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="grievance-table-wrapper">
          <table className="grievance-table admin-grievance-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("tokenNo")}
                    className="sort-button"
                  >
                    Token No.
                    <SortIcon column="tokenNo" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("hospital")}
                    className="sort-button"
                  >
                    Hospital
                    <SortIcon column="hospital" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="sort-button"
                  >
                    Grievance Title
                    <SortIcon column="title" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("submittedOn")}
                    className="sort-button"
                  >
                    Submitted On
                    <SortIcon column="submittedOn" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("lastUpdated")}
                    className="sort-button"
                  >
                    Last Updated
                    <SortIcon column="lastUpdated" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="sort-button"
                  >
                    Status
                    <SortIcon column="status" sortConfig={sortConfig} />
                  </button>
                </th>

                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    Loading complaints, please wait...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="table-message error">
                    {error}
                  </td>
                </tr>
              ) : visibleGrievances.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    <div className="empty-grievances">
                      <div className="empty-grievances-icon">
                        <FiInbox size={25} />
                      </div>

                      <div className="empty-grievances-copy">
                        <strong>No grievances found</strong>

                        <span>Try changing your search or filters.</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleGrievances.map((grievance) => (
                  <tr key={grievance.id}>
                    {/* TOKEN */}

                    <td>{grievance.tokenNo}</td>

                    {/* HOSPITAL */}

                    <td>
                      <span className="admin-hospital-name">
                        {grievance.hospital}
                      </span>
                    </td>

                    {/* TITLE */}

                    <td className="grievance-title-cell">{grievance.title}</td>

                    {/* SUBMITTED */}

                    <td>{grievance.submittedOn}</td>

                    {/* UPDATED */}

                    <td>{grievance.lastUpdated}</td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`status ${getStatusClass(grievance.status)}`}
                      >
                        {getSuperAdminStatusLabel(grievance.status)}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>
                      <div className="grievance-action-buttons">
                        {/* NORMAL DETAIL */}

                        <button
                          type="button"
                          className="table-view"
                          onClick={() => setSelectedGrievance(grievance)}
                          title="View Grievance"
                        >
                          <FiEye size={15} />

                          <span>View</span>
                        </button>

                        {/* TIMELINE */}

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

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading && !error && filteredGrievances.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-rows-per-page">
              <span>Rows per page</span>

              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));

                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>

                <option value="10">10</option>

                <option value="20">20</option>

                <option value="50">50</option>
              </select>

              <FiChevronDown size={15} />
            </div>

            <div className="admin-page-controls">
              <span>
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <FiChevronLeft size={18} />
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                aria-label="Next page"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          NORMAL GRIEVANCE DETAIL MODAL
      ===================================================== */}

      <GrievanceModal
        grievance={selectedGrievance}
        onClose={() => setSelectedGrievance(null)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* =====================================================
          TIMELINE MODAL
          ADMIN = VIEW ONLY
      ===================================================== */}

      <GrievanceTimelineModal
        grievance={selectedTimelineGrievance}
        onClose={() => setSelectedTimelineGrievance(null)}
        canEdit={false}
      />
    </div>
  );
}

export default AllGrievances;
