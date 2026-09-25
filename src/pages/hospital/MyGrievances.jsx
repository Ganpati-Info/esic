import { useEffect, useMemo, useState } from "react";

import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiClock,
  FiChevronDown as FiChevronsUpDown,
  FiFileText,
} from "react-icons/fi";

import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";

import { exportGrievances } from "../../lib/export";

import { getGrievances, sendGrievanceToEsic } from "../../lib/grievances";
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

    case "returned to hospital":
      return "Returned to Hospital";

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

function MyGrievances() {
  const [grievances, setGrievances] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sortConfig, setSortConfig] = useState({
    key: "submittedOn",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  /*
   * Normal grievance detail modal
   */
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  /*
   * Separate timeline modal
   *
   * Hospital is VIEW ONLY.
   */
  const [selectedTimelineGrievance, setSelectedTimelineGrievance] =
    useState(null);

    const [isSendingToEsic, setIsSendingToEsic] = useState(false);

    const [sendingGrievanceId, setSendingGrievanceId] = useState(null);

    const [sendToEsicError, setSendToEsicError] = useState("");

    const [sendToEsicSuccess, setSendToEsicSuccess] = useState("");

    async function handleSendToEsic(grievance) {
      const confirmed = window.confirm(
        `Send "${grievance.title}" to ESIC for further processing?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setIsSendingToEsic(true);
        setSendingGrievanceId(grievance.id);
        setSendToEsicError("");
        setSendToEsicSuccess("");

        const token = sessionStorage.getItem("esicToken");

        if (!token) {
          throw new Error(
            "Authentication session not found. Please log in again.",
          );
        }

        const result = await sendGrievanceToEsic(token, {
          grievanceId: grievance.id,
        });

        const updatedStatus = normalizeStatus(result.status);

        setGrievances((current) =>
          current.map((item) => {
            if (item.id !== grievance.id) {
              return item;
            }

            return {
              ...item,

              status: updatedStatus,

              lastUpdated: formatDisplayDate(new Date().toISOString()),

              timeline: result.timelineEvent
                ? [...(item.timeline || []), result.timelineEvent]
                : item.timeline || [],
            };
          }),
        );

        setSendToEsicSuccess("Complaint has been sent to ESIC successfully.");

        setTimeout(() => {
          setSendToEsicSuccess("");
        }, 3500);
      } catch (err) {
        console.error("SEND TO ESIC ERROR:", err);

        setSendToEsicError(err?.message || "Unable to send complaint to ESIC.");
      } finally {
        setIsSendingToEsic(false);
        setSendingGrievanceId(null);
      }
    }

  async function handleExport(format) {
    try {
      const storedUser = sessionStorage.getItem("esicUser");

      let hospitalName = "";

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          hospitalName = user.name || user.hospitalName || "";
        } catch (error) {
          console.error("Unable to read hospital information:", error);
        }
      }

      if (!hospitalName) {
        throw new Error("Hospital information is not available.");
      }

      await exportGrievances(
        filteredGrievances,
        format,
        "Hospital-Complaints",
        hospitalName,
      );
    } catch (err) {
      console.error("Hospital grievance export complaint:", err);

      setError(err.message || "Unable to export complaint.");
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

  /*
   * =========================================================
   * LOAD GRIEVANCES
   * =========================================================
   */

  useEffect(() => {
    async function loadGrievances() {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("esicToken");

        if (!token) {
          throw new Error("Authentication session not found.");
        }

        const data = await getGrievances(token);

        const formattedGrievances = data.map((grievance) => {
          const details = grievance.grievanceDetails || {};

          return {
            id: grievance.databaseId,

            tokenNo: details.tokenNumber || "N/A",

            title: grievance.title || "Untitled Complaint",

            priority: Boolean(grievance.priority),

            submittedOn: formatDisplayDate(grievance.date),

            lastUpdated: formatDisplayDate(grievance.modified),

            status: normalizeStatus(grievance.statusLabel || ""),

            description: details.description || "",

            image: grievance.currentImageUrl || null,

            generatedImageUrl: grievance.generatedImageUrl || null,

            rejectionRemark: grievance.rejectionRemark || "",

            hospitalName: grievance.creator?.username || "N/A",

            /*
             * Timeline events from GraphQL
             */
            timeline: grievance.timeline || [],
          };
        });

        setGrievances(formattedGrievances);
      } catch (err) {
        console.error("Failed to load grievances:", err);

        setError(
          err?.message || "Unable to load grievances. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadGrievances();
  }, []);

  /*
   * =========================================================
   * FILTER + SEARCH + SORT
   * =========================================================
   */

  const filteredGrievances = useMemo(() => {
    let result = [...grievances];

    /*
     * SEARCH
     */

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();

      result = result.filter(
        (grievance) =>
          String(grievance.tokenNo).toLowerCase().includes(searchValue) ||
          String(grievance.title).toLowerCase().includes(searchValue),
      );
    }

    /*
     * STATUS FILTER
     */

    if (statusFilter !== "All") {
      result = result.filter((grievance) => grievance.status === statusFilter);
    }

    /*
     * SORT
     */

    result.sort((a, b) => {
      let valueA = a[sortConfig.key];

      let valueB = b[sortConfig.key];

      if (
        sortConfig.key === "submittedOn" ||
        sortConfig.key === "lastUpdated"
      ) {
        valueA = new Date(valueA);
        valueB = new Date(valueB);

        if (Number.isNaN(valueA.getTime())) {
          valueA = new Date(0);
        }

        if (Number.isNaN(valueB.getTime())) {
          valueB = new Date(0);
        }
      } else {
        valueA = String(valueA ?? "").toLowerCase();

        valueB = String(valueB ?? "").toLowerCase();
      }

      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [grievances, search, statusFilter, sortConfig]);

  /*
   * =========================================================
   * PAGINATION
   * =========================================================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGrievances.length / rowsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedGrievances = filteredGrievances.slice(startIndex, endIndex);

  /*
   * =========================================================
   * SORT HANDLER
   * =========================================================
   */

  const handleSort = (key) => {
    setCurrentPage(1);

    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  /*
   * =========================================================
   * SEARCH HANDLER
   * =========================================================
   */

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  /*
   * =========================================================
   * FILTER HANDLER
   * =========================================================
   */

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);

    setCurrentPage(1);
  };

  /*
   * =========================================================
   * ROWS PER PAGE
   * =========================================================
   */

  const handleRowsPerPage = (event) => {
    setRowsPerPage(Number(event.target.value));

    setCurrentPage(1);
  };

  /*
   * =========================================================
   * SORT ICON
   * =========================================================
   */

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <FiChevronsUpDown size={14} />;
    }

    if (sortConfig.direction === "asc") {
      return <FiArrowUp size={14} />;
    }

    return <FiArrowDown size={14} />;
  };

  /*
   * =========================================================
   * PAGINATION NUMBERS
   * =========================================================
   */

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, safeCurrentPage - 1);

    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="my-grievances-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="my-grievances-header">
        <div>
          <div className="my-grievances-eyebrow">HOSPITAL MODULE</div>

          <h1>My Complaints</h1>

          <p>View, search and track complaints submitted by your hospital.</p>
        </div>
      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      {sendToEsicSuccess && (
        <div className="send-esic-success">
          <FiArrowUp size={17} />

          <span>{sendToEsicSuccess}</span>
        </div>
      )}

      {sendToEsicError && (
        <div className="send-esic-error">
          <FiX size={17} />

          <span>{sendToEsicError}</span>

          <button
            type="button"
            onClick={() => setSendToEsicError("")}
            aria-label="Close error"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      <section className="my-grievances-card">
        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="grievances-toolbar">
          {/* SEARCH */}

          <div className="grievance-search">
            <FiSearch size={18} />

            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by token or title..."
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
              >
                <FiX size={15} />
              </button>
            )}
          </div>

          <div className="export-actions">
            <span className="export-label">Export as:</span>

            <button
              type="button"
              className="export-button"
              onClick={() => handleExport("pdf")}
              title="Export as PDF"
            >
              <FaRegFilePdf />

              <span>PDF</span>
            </button>

            <button
              type="button"
              className="export-button"
              onClick={() => handleExport("excel")}
              title="Export as Excel"
            >
              <FaRegFileExcel />

              <span>Excel</span>
            </button>
          </div>

          {/* STATUS FILTER */}

          <div className="status-filter">
            <select value={statusFilter} onChange={handleStatusFilter}>
              <option value="All">All Statuses</option>

              <option value="Sent to Director">Sent to Director</option>

              <option value="Returned to Hospital">Returned to Hospital</option>

              <option value="In Progress">In Progress</option>

              <option value="Resolved">Completed</option>

              <option value="Rejected">Rejected</option>

              <option value="Sent to ESIC">Sent to ESIC</option>
            </select>

            <FiChevronDown size={16} />
          </div>
        </div>

        {/* ===================================================
            RESULT SUMMARY
        =================================================== */}

        <div className="grievance-result-summary">
          <span>
            Showing{" "}
            <strong>
              {filteredGrievances.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredGrievances.length)}
            </strong>{" "}
            of <strong>{filteredGrievances.length}</strong> complaints
          </span>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="my-grievances-table-wrapper">
          <table className="my-grievances-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("tokenNo")}
                    className="sort-button"
                  >
                    Token No.
                    <SortIcon column="tokenNo" />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="sort-button"
                  >
                    Complaint Title
                    <SortIcon column="title" />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("submittedOn")}
                    className="sort-button"
                  >
                    Submitted On
                    <SortIcon column="submittedOn" />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("lastUpdated")}
                    className="sort-button"
                  >
                    Last Updated
                    <SortIcon column="lastUpdated" />
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="sort-button"
                  >
                    Status
                    <SortIcon column="status" />
                  </button>
                </th>

                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-grievances-cell">
                    <div className="empty-grievances">
                      <div className="empty-icon">
                        <FiFileText size={24} />
                      </div>

                      <h3>Loading complaints, please wait...</h3>

                      <p>Fetching the latest complaint records.</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="empty-grievances-cell">
                    <div className="empty-grievances">
                      <div className="empty-icon">
                        <FiFileText size={24} />
                      </div>

                      <h3>Unable to load complaints</h3>

                      <p>{error}</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedGrievances.length > 0 ? (
                paginatedGrievances.map((grievance) => (
                  <tr key={grievance.id}>
                    <td className="token-cell">{grievance.tokenNo}</td>

                    <td className="title-cell">{grievance.title}</td>

                    <td>{grievance.submittedOn}</td>

                    <td>{grievance.lastUpdated}</td>

                    <td>
                      <span
                        className={`status ${getStatusClass(grievance.status)}`}
                      >
                        {getSuperAdminStatusLabel(grievance.status)}
                      </span>
                    </td>

                    <td>
                      <div className="grievance-action-buttons">
                        {/* NORMAL VIEW */}

                        <button
                          type="button"
                          className="grievance-view-button"
                          onClick={() => setSelectedGrievance(grievance)}
                          title="View Grievance"
                        >
                          <FiEye size={15} />

                          <span>View</span>
                        </button>

                        {/* TIMELINE VIEW */}

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

                        {grievance.status === "Returned to Hospital" && (
                          <button
                            type="button"
                            className="send-to-esic-button"
                            onClick={() => handleSendToEsic(grievance)}
                            disabled={
                              isSendingToEsic &&
                              sendingGrievanceId === grievance.id
                            }
                            title="Send complaint to ESIC"
                          >
                            {isSendingToEsic &&
                            sendingGrievanceId === grievance.id ? (
                              <>
                                <span className="send-esic-spinner" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <FiArrowUp size={15} />
                                <span>Send to ESIC</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-grievances-cell">
                    <div className="empty-grievances">
                      <div className="empty-icon">
                        <FiFileText size={24} />
                      </div>

                      <h3>No complaints found</h3>

                      <p>Try changing your search or filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div className="grievances-pagination">
          <div className="rows-per-page">
            <span>Rows per page</span>

            <div className="rows-select">
              <select value={rowsPerPage} onChange={handleRowsPerPage}>
                <option value={5}>5</option>

                <option value={10}>10</option>

                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <FiChevronDown size={14} />
            </div>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-arrow"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <FiChevronLeft size={17} />
            </button>

            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={`dots-${index}`} className="pagination-dots">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={safeCurrentPage === page ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className="pagination-arrow"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <FiChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          NORMAL GRIEVANCE MODAL
      ===================================================== */}

      <GrievanceModal
        grievance={selectedGrievance}
        onClose={() => setSelectedGrievance(null)}
      />

      {/* =====================================================
          TIMELINE MODAL
          HOSPITAL = VIEW ONLY
      ===================================================== */}

      <GrievanceTimelineModal
        grievance={selectedTimelineGrievance}
        onClose={() => setSelectedTimelineGrievance(null)}
        canEdit={false}
      />
    </div>
  );
}

export default MyGrievances;
