import { useMemo, useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiChevronDown as FiChevronsUpDown,
  FiFileText,
} from "react-icons/fi";

import grievances from "../../data/grievances.json";

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "pending";

    case "In Progress":
      return "in-progress";

    case "Resolved":
      return "resolved";

    case "Rejected":
      return "rejected";

    case "Delegated to ESIC":
      return "delegated";

    default:
      return "";
  }
}

function MyGrievances() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sortConfig, setSortConfig] = useState({
    key: "submittedOn",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedGrievance, setSelectedGrievance] = useState(null);

  /*
   * FILTER + SEARCH + SORT
   */

  const filteredGrievances = useMemo(() => {
    let result = [...grievances];

    // SEARCH

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();

      result = result.filter(
        (grievance) =>
          grievance.tokenNo.toLowerCase().includes(searchValue) ||
          grievance.title.toLowerCase().includes(searchValue),
      );
    }

    // STATUS FILTER

    if (statusFilter !== "All") {
      result = result.filter((grievance) => grievance.status === statusFilter);
    }

    // SORT

    result.sort((a, b) => {
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];

      if (
        sortConfig.key === "submittedOn" ||
        sortConfig.key === "lastUpdated"
      ) {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else {
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
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
  }, [search, statusFilter, sortConfig]);

  /*
   * PAGINATION
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
   * SORT HANDLER
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
   * SEARCH HANDLER
   */

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  /*
   * FILTER HANDLER
   */

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  /*
   * ROWS PER PAGE
   */

  const handleRowsPerPage = (event) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  /*
   * SORT ICON
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
   * PAGINATION NUMBERS
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
      {/* PAGE HEADER */}

      <div className="my-grievances-header">
        <div>
          <div className="my-grievances-eyebrow">HOSPITAL MODULE</div>

          <h1>My Grievances</h1>

          <p>View, search and track grievances submitted by your hospital.</p>
        </div>
      </div>

      {/* TABLE CARD */}

      <section className="my-grievances-card">
        {/* TOOLBAR */}

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

          {/* STATUS FILTER */}

          <div className="status-filter">
            <select value={statusFilter} onChange={handleStatusFilter}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Delegated to ESIC">Delegated to ESIC</option>
            </select>

            <FiChevronDown size={16} />
          </div>
        </div>

        {/* RESULT SUMMARY */}

        <div className="grievance-result-summary">
          <span>
            Showing{" "}
            <strong>
              {filteredGrievances.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredGrievances.length)}
            </strong>{" "}
            of <strong>{filteredGrievances.length}</strong> grievances
          </span>
        </div>

        {/* TABLE */}

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
                    Grievance Title
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
              {paginatedGrievances.length > 0 ? (
                paginatedGrievances.map((grievance) => (
                  <tr key={grievance.tokenNo}>
                    <td className="token-cell">{grievance.tokenNo}</td>

                    <td className="title-cell">{grievance.title}</td>

                    <td>{grievance.submittedOn}</td>

                    <td>{grievance.lastUpdated}</td>

                    <td>
                      <span
                        className={`status ${getStatusClass(grievance.status)}`}
                      >
                        {grievance.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="grievance-view-button"
                        onClick={() => setSelectedGrievance(grievance)}
                      >
                        <FiEye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-grievances">
                    <div className="empty-icon">
                      <FiFileText size={24} />
                    </div>

                    <h3>No grievances found</h3>

                    <p>Try changing your search or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="grievances-pagination">
          <div className="rows-per-page">
            <span>Rows per page</span>

            <div className="rows-select">
              <select value={rowsPerPage} onChange={handleRowsPerPage}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
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

      {/* VIEW MODAL */}

      {selectedGrievance && (
        <div
          className="grievance-modal-overlay"
          onClick={() => setSelectedGrievance(null)}
        >
          <div
            className="grievance-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grievance-modal-header">
              <div>
                <div className="modal-eyebrow">GRIEVANCE DETAILS</div>

                <h2>{selectedGrievance.title}</h2>

                <div className="modal-token">{selectedGrievance.tokenNo}</div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedGrievance(null)}
              >
                <FiX size={21} />
              </button>
            </div>

            <div className="grievance-modal-body">
              <div className="modal-status-row">
                <span className="modal-label">Status</span>

                <span
                  className={`status ${getStatusClass(
                    selectedGrievance.status,
                  )}`}
                >
                  {selectedGrievance.status}
                </span>
              </div>

              <div className="modal-details">
                <div className="modal-detail">
                  <span className="modal-label">Token Number</span>

                  <strong>{selectedGrievance.tokenNo}</strong>
                </div>

                <div className="modal-detail">
                  <span className="modal-label">Submitted On</span>

                  <strong>{selectedGrievance.submittedOn}</strong>
                </div>

                <div className="modal-detail">
                  <span className="modal-label">Last Updated</span>

                  <strong>{selectedGrievance.lastUpdated}</strong>
                </div>
              </div>

              <div className="modal-description">
                <span className="modal-label">Description</span>

                <p>{selectedGrievance.description}</p>
              </div>

              {selectedGrievance.image && (
                <div className="modal-evidence">
                  <span className="modal-label">Evidence</span>

                  <div className="modal-image-wrapper">
                    <img
                      src={selectedGrievance.image}
                      alt={selectedGrievance.title}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grievance-modal-footer">
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedGrievance(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyGrievances;
