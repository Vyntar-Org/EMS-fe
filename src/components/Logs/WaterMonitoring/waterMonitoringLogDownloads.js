import Papa from 'papaparse';

import { triggerFileDownload } from '../../../helpers/common';
import { exportToPDF } from '../../../helpers/exports';
import { createWaterReportWorkbook } from '../../WaterMonitoring/waterMonitoringReportWorkbook';

import {
	WATER_MONITORING_LOG_FIELDS,
	waterMonitoringLogHeaders,
	waterMonitoringLogsFilename,
	waterMonitoringLogValue,
} from './waterMonitoringLogModel';

export function downloadWaterMonitoringLogs(
	format,
	rows,
	machine,
	filters,
	units,
	fields = WATER_MONITORING_LOG_FIELDS
) {
	const headers = waterMonitoringLogHeaders(units);
	const columns = fields.map((field) => ({
		accessorKey: field.key,
		header: headers[WATER_MONITORING_LOG_FIELDS.indexOf(field)],
		meta: field.key === 'timestamp' ? { fixedExport: true } : undefined,
	}));
	const filename = waterMonitoringLogsFilename(machine, filters);
	if (format === 'pdf') {
		const formatted = rows.map((row) =>
			Object.fromEntries(
				fields.map(({ key }) => {
					const value = waterMonitoringLogValue(row, key);
					return [key, value === null ? '-' : String(value)];
				})
			)
		);
		exportToPDF(
			formatted,
			columns,
			`${filename} - ${filters.start_datetime} to ${filters.end_datetime}`
		);
		return;
	}
	const matrix = [
		[
			'Water Monitoring Logs',
			machine.slave_name || `Machine ${filters.slave_id}`,
		],
		['Start', filters.start_datetime, 'End', filters.end_datetime],
		[
			'Scope',
			'All readings in the selected range; newest first. Timestamp zones are preserved.',
		],
		columns.map((column) => column.header),
		...rows.map((row) =>
			fields.map(({ key }) => waterMonitoringLogValue(row, key))
		),
	];
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
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}
