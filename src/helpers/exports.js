import { triggerFileDownload } from "./common";
import dayjs from "dayjs";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (tableData, tableColumns, filename = "Report") => {
  if (!tableData?.length) return;

  const csvHeaders = tableColumns.map((col) => col.header);
  const csvRows = tableData.map((row) =>
    tableColumns.map((col) => {
      const val = row[col.accessorKey];
      return typeof val === "number" ? val.toFixed(2) : (val ?? "");
    }),
  );

  const csvString = Papa.unparse([csvHeaders, ...csvRows]);
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  triggerFileDownload(url, `${filename}_${dayjs().format("YYYY-MM-DD")}.csv`);
};

export const exportToPDF = (
  tableData,
  tableColumns,
  title = "Consumption Report",
) => {
  if (!tableData?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const fixedColumn = tableColumns[0];
  const timelineColumns = tableColumns.slice(1);

  const COLUMNS_PER_PAGE = 11;
  const totalTimelineCols = timelineColumns.length;
  const totalChunks = Math.ceil(totalTimelineCols / COLUMNS_PER_PAGE);

  for (let i = 0; i < totalChunks; i++) {
    const startIdx = i * COLUMNS_PER_PAGE;
    const endIdx = Math.min(startIdx + COLUMNS_PER_PAGE, totalTimelineCols);
    const activeTimelineChunk = timelineColumns.slice(startIdx, endIdx);

    // Combine the fixed 'Device' column with the active group of days
    const currentViewColumns = [fixedColumn, ...activeTimelineChunk];

    // 4. Build headers and body rows for the current chunk
    const pdfHeaders = [currentViewColumns.map((col) => col.header)];
    const pdfRows = tableData.map((row) =>
      currentViewColumns.map((col) => {
        const val = row[col.accessorKey];
        return typeof val === "number" ? val.toFixed(2) : (val ?? "");
      }),
    );

    // 5. Render Page Branding Header on every page
    doc.setFontSize(16);
    doc.text(`${title} (Part ${i + 1} of ${totalChunks})`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated on: ${dayjs().format("DD MMM YYYY, hh:mm A")}`, 40, 55);

    autoTable(doc, {
      head: pdfHeaders,
      body: pdfRows,
      startY: 70,
      theme: "grid",
      margin: { left: 40, right: 40 },
      tableWidth: "auto",

      styles: {
        fontSize: 9,
        cellPadding: 6,
        halign: "center",
        valign: "middle",
      },

      headStyles: {
        fillColor: [25, 118, 210],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          halign: "left",
          fontStyle: "bold",
          minCellWidth: 120,
          maxCellWidth: 120,
        },
      },
    });

    if (i < totalChunks - 1) {
      doc.addPage();
    }
  }

  doc.save(`${title.replace(/\s+/g, "_")}_${dayjs().format("YYYY-MM-DD")}.pdf`);
};
