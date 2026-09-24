import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ==========================================================
 * DOWNLOAD BLOB
 * ========================================================== */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* ==========================================================
 * NORMALIZE ROWS
 * ========================================================== */

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};

    Object.entries(row).forEach(([key, value]) => {
      normalized[key] =
        value === null || value === undefined ? "" : String(value);
    });

    return normalized;
  });
}

/* ==========================================================
 * EXPORT CSV
 * ========================================================== */

export function exportToCSV(rows, filename = "export.csv") {
  if (!rows || !rows.length) {
    throw new Error("No data available to export.");
  }

  const normalizedRows = normalizeRows(rows);

  const columns = Object.keys(normalizedRows[0]);

  const escapeCSV = (value) => {
    const stringValue = String(value ?? "");

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const header = columns.map(escapeCSV).join(",");

  const body = normalizedRows.map((row) =>
    columns.map((column) => escapeCSV(row[column])).join(","),
  );

  const csv = [header, ...body].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, filename);
}

/* ==========================================================
 * EXPORT EXCEL
 * ========================================================== */

export async function exportToExcel(
  rows,
  filename = "export.xlsx",
  sheetName = "Data",
) {
  if (!rows || !rows.length) {
    throw new Error("No data available to export.");
  }

  const normalizedRows = normalizeRows(rows);

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(sheetName);

  const columns = Object.keys(normalizedRows[0]);

  worksheet.columns = columns.map((column) => ({
    header: column,
    key: column,
    width: Math.max(15, Math.min(35, column.length + 5)),
  }));

  normalizedRows.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = {
    bold: true,
  };

  worksheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + columns.length)}1`,
  };

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, filename);
}

/* ==========================================================
 * EXPORT PDF
 * ========================================================== */

export function exportToPDF(
  rows,
  filename = "export.pdf",
  title = "Export",
  reportDate = "",
) {
  if (!rows || !rows.length) {
    throw new Error("No data available to export.");
  }

  const normalizedRows = normalizeRows(rows);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(16);

  doc.text(title, 14, 15);

  if (reportDate) {
    doc.setFontSize(9);

    doc.text(reportDate, 14, 21);
  }

  const columns = Object.keys(normalizedRows[0]);

  const headers = columns.map((column) => column);

  const body = normalizedRows.map((row) =>
    columns.map((column) => row[column]),
  );

  autoTable(doc, {
    head: [headers],

    body,

    startY: reportDate ? 28 : 22,

    theme: "grid",

    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: 0,
      lineColor: 150,
      lineWidth: 0.1,
    },

    headStyles: {
      fontStyle: "bold",
      textColor: 0,
      fillColor: 255,
      lineColor: 100,
      lineWidth: 0.1,
    },

    bodyStyles: {
      textColor: 0,
    },

    margin: {
      left: 10,
      right: 10,
    },

    didDrawPage: () => {
      const pageNumber = doc.internal.getNumberOfPages();

      doc.setFontSize(8);

      doc.text(`Page ${pageNumber}`, 14, doc.internal.pageSize.height - 8);
    },
  });

  doc.save(filename);
}

/* ==========================================================
 * HOSPITAL EXPORT
 * ========================================================== */

export async function exportHospitals(hospitals, grievances = [], format) {
  if (!hospitals || !hospitals.length) {
    throw new Error("No hospitals available to export.");
  }

  if (!Array.isArray(grievances)) {
    throw new Error("Grievance data is not available for export.");
  }

  const getStatus = (grievance) => {
    const status = String(
      grievance.statusLabel ||
        grievance.grievanceDetails?.status?.[0] ||
        grievance.status ||
        "",
    )
      .trim()
      .toLowerCase();

    if (status === "sent to director" || status === "pending") {
      return "pending";
    }

    if (status === "sent to esic" || status === "delegated to esic") {
      return "sentToEsic";
    }

    if (status === "in progress") {
      return "inProgress";
    }

    if (status === "resolved") {
      return "resolved";
    }

    if (status === "rejected") {
      return "rejected";
    }

    return null;
  };

  const rows = hospitals.map((hospital) => {
    const hospitalUsername = String(hospital.username || "")
      .trim()
      .toLowerCase();

    const hospitalGrievances = grievances.filter((grievance) => {
      const grievanceUsername = String(
        grievance.creator?.username || grievance.hospitalUsername || "",
      )
        .trim()
        .toLowerCase();

      return grievanceUsername === hospitalUsername;
    });

    let pending = 0;
    let sentToEsic = 0;
    let inProgress = 0;
    let resolved = 0;
    let rejected = 0;

    hospitalGrievances.forEach((grievance) => {
      const status = getStatus(grievance);

      if (status === "pending") {
        pending++;
      }

      if (status === "sentToEsic") {
        sentToEsic++;
      }

      if (status === "inProgress") {
        inProgress++;
      }

      if (status === "resolved") {
        resolved++;
      }

      if (status === "rejected") {
        rejected++;
      }
    });

    return {
      "Hospital Name": hospital.name ?? "",
      Username: hospital.username ?? "",
      Email: hospital.email ?? "",
      "Total Grievances": hospitalGrievances.length,
      "Pending / Sent to Director": pending,
      "Sent to ESIC": sentToEsic,
      "In Progress": inProgress,
      Resolved: resolved,
      Rejected: rejected,
    };
  });

  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    exportToCSV(rows, `ESIC-Hospitals-${date}.csv`);

    return;
  }

  if (format === "excel") {
    await exportToExcel(rows, `ESIC-Hospitals-${date}.xlsx`, "Hospitals");

    return;
  }

  if (format === "pdf") {
    exportToPDF(rows, `ESIC-Hospitals-${date}.pdf`, "ESIC Hospital Directory");

    return;
  }

  throw new Error("Unsupported export format.");
}

/* ==========================================================
 * EXPORT GRIEVANCES
 * ========================================================== */

export async function exportGrievances(
  grievances,
  format,
  filenamePrefix = "ESIC-Grievances",
  hospitalName = "",
) {
  if (!Array.isArray(grievances) || !grievances.length) {
    throw new Error("No grievances available to export.");
  }

  const isHospitalReport = Boolean(hospitalName?.trim());

  const rows = grievances.map((grievance) => {
    const row = {
      "Token No.": grievance.tokenNo || "N/A",
      "Complaint Title": grievance.title || "N/A",
      "Submitted On": grievance.submittedOn || "N/A",
      "Last Updated": grievance.lastUpdated || "N/A",
      Status: grievance.status || "N/A",
    };

    /*
     * ESIC report contains Hospital because
     * it contains grievances from multiple hospitals.
     *
     * Hospital report does not contain Hospital
     * because the hospital is already in the title.
     */
    if (!isHospitalReport) {
      return {
        "Token No.": grievance.tokenNo || "N/A",

        Hospital: grievance.hospital || "N/A",

        "Complaint Title": grievance.title || "N/A",

        "Submitted On": grievance.submittedOn || "N/A",

        "Last Updated": grievance.lastUpdated || "N/A",

        Status: grievance.status || "N/A",
      };
    }

    return row;
  });

  const now = new Date();

  const date = now.toISOString().slice(0, 10);

  const displayDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);

  const reportTitle = isHospitalReport
    ? `${hospitalName} Complaint Report`
    : "ESIC Complaint Report";

  if (format === "pdf") {
    exportToPDF(
      rows,
      `${filenamePrefix}-${date}.pdf`,
      reportTitle,
      displayDate,
    );

    return;
  }

  if (format === "excel") {
    await exportToExcel(rows, `${filenamePrefix}-${date}.xlsx`, "Complaints");

    return;
  }

  if (format === "csv") {
    exportToCSV(rows, `${filenamePrefix}-${date}.csv`);

    return;
  }

  throw new Error("Unsupported export format.");
}