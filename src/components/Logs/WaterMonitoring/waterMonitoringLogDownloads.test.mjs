import assert from 'node:assert/strict';
import { resolveObjectURL } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { strFromU8, unzipSync } from 'fflate';
import Papa from 'papaparse';

const require = createRequire(import.meta.url);
let downloaded;
let pdf;
globalThis.__waterMonitoringLogDownload = {
	download: (url, filename) => {
		downloaded = { blob: resolveObjectURL(url), filename };
	},
	pdf: (...args) => {
		pdf = args;
	},
};
const source = (
	await readFile(
		new URL('./waterMonitoringLogDownloads.js', import.meta.url),
		'utf8'
	)
)
	.replace(
		"import { triggerFileDownload } from '../../../helpers/common';",
		'const triggerFileDownload = globalThis.__waterMonitoringLogDownload.download;'
	)
	.replace(
		"import { exportToPDF } from '../../../helpers/exports';",
		'const exportToPDF = globalThis.__waterMonitoringLogDownload.pdf;'
	)
	.replace(
		"from 'papaparse'",
		`from '${pathToFileURL(require.resolve('papaparse')).href}'`
	)
	.replace(
		"from './waterMonitoringLogModel'",
		`from '${new URL('./waterMonitoringLogModel.js', import.meta.url).href}'`
	)
	.replace(
		"from '../../WaterMonitoring/waterMonitoringReportWorkbook'",
		`from '${
			new URL(
				'../../WaterMonitoring/waterMonitoringReportWorkbook.js',
				import.meta.url
			).href
		}'`
	);
const { downloadWaterMonitoringLogs } = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitoringLogDownload;
const filters = {
	slave_id: 12,
	start_datetime: '2026-11-01T00:00:00',
	end_datetime: '2026-11-17T23:59:59',
};
const machine = { slave_name: 'Garden Outlet' };
const rows = [
	{
		timestamp: '2026-11-17T19:42:37+05:30',
		tank_level: 1450.123456,
		flowrate: 0,
		totalizer: 15441.123456,
		control_mode: 'auto',
		control_strategy: 'LEVEL',
		motor_run_state: '1',
	},
	{ timestamp: '2026-11-17T19:32:37', control_strategy: 'REMOTE' },
	{ timestamp: '2026-11-17T19:22:37' },
];

test('CSV export contains the selected machine, complete range, ordered columns, raw precision, zero and historical state labels', async () => {
	downloadWaterMonitoringLogs('csv', rows, machine, filters, {
		tank_level: 'cm',
	});
	assert.equal(
		downloaded.filename,
		'OHT_Garden_Outlet_Logs_2026-11-01_to_2026-11-17.csv'
	);
	const matrix = Papa.parse(await downloaded.blob.text()).data;
	assert.deepEqual(matrix[3], [
		'Date & Time',
		'Tank Level (cm)',
		'Flow Rate (m³/h)',
		'Totalizer',
		'Control Mode',
		'Control Strategy',
		'Motor Status',
	]);
	assert.deepEqual(matrix[4], [
		'17 Nov 2026 19:42:37 +05:30',
		'1450.123456',
		'0',
		'15441.123456',
		'Auto',
		'Level',
		'Running',
	]);
	assert.equal(matrix[0][1], machine.slave_name);
	assert.equal(matrix[1][1], filters.start_datetime);
	assert.equal(matrix[5][5], 'Remote');
	assert.equal(matrix[6][5], '—');
});

test('Excel has numeric raw readings and PDF preserves precision rather than rounding via the shared formatter', async () => {
	downloadWaterMonitoringLogs('xlsx', rows, machine, filters, {});
	assert.match(downloaded.blob.type, /spreadsheetml/);
	const files = unzipSync(new Uint8Array(await downloaded.blob.arrayBuffer()));
	const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
	assert.match(sheet, /<c r="B5" s="1"><v>1450.123456<\/v>/);
	assert.match(sheet, /<c r="C5" s="1"><v>0<\/v>/);
	assert.match(sheet, /<c r="F5"[^>]*>.*?Level<\/t>/);
	downloadWaterMonitoringLogs('pdf', rows, machine, filters, {});
	assert.equal(pdf[0][0].tank_level, '1450.123456');
	assert.equal(pdf[0][0].flowrate, '0');
	assert.deepEqual(
		pdf[0].map((row) => row.control_strategy),
		['Level', 'Remote', '—']
	);
	assert.deepEqual(
		pdf[1].map((column) => column.header),
		[
			'Date & Time',
			'Tank Level',
			'Flow Rate (m³/h)',
			'Totalizer',
			'Control Mode',
			'Control Strategy',
			'Motor Status',
		]
	);
	assert.match(
		pdf[2],
		/Garden_Outlet.*2026-11-01T00:00:00.*2026-11-17T23:59:59/
	);
});
