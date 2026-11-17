import Papa from 'papaparse';

import { triggerFileDownload } from '../../helpers/common';
import { exportToPDF } from '../../helpers/exports';

import {
	formatReportValue,
	reportExportData,
	reportFilename,
	reportPeriod,
	waterReportTable,
} from './waterReportModel';
import { createWaterReportWorkbook } from './waterReportWorkbook';

export function downloadWaterReport(format, model, type, filters, search = '') {
	const filename = reportFilename(type, filters);
	if (format === 'pdf') {
		const { tableData, tableColumns: columns } = waterReportTable(
			model,
			search
		);
		const rows = tableData.map((row) =>
			Object.fromEntries(
				columns.map(({ accessorKey }) => {
					const value = row[accessorKey];
					return [
						accessorKey,
						typeof value === 'number' ? formatReportValue(value) : value ?? '-',
					];
				})
			)
		);
		exportToPDF(
			rows,
			columns,
			`${type.title} - ${reportPeriod(type, filters)}`
		);
		return;
	}
	const matrix = reportExportData(model, type, filters, search);
	const blob =
		format === 'xlsx'
			? new Blob([createWaterReportWorkbook(matrix)], {
					type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			  })
			: new Blob(['\uFEFF', Papa.unparse(matrix, { escapeFormulae: true })], {
					type: 'text/csv;charset=utf-8;',
			  });
	const url = URL.createObjectURL(blob);
	try {
		triggerFileDownload(url, `${filename}.${format}`);
	} finally {
		// Allow the browser to consume the download before releasing its URL.
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}
