import assert from 'node:assert/strict';
import { resolveObjectURL } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import Papa from 'papaparse';

import {
	buildWaterReport,
	reportTypeFor,
} from './waterMonitoringReportModel.js';

const require = createRequire(import.meta.url);
let downloaded;
let pdf;
globalThis.__waterMonitoringReportExport = {
	trigger: (url, filename) => {
		downloaded = { blob: resolveObjectURL(url), filename };
	},
	pdf: (...args) => {
		pdf = args;
	},
};
let source = await readFile(
	new URL('./waterMonitoringReportExports.js', import.meta.url),
	'utf8'
);
source = source
	.replace(
		"import { triggerFileDownload } from '../../../helpers/common';",
		'const triggerFileDownload = globalThis.__waterMonitoringReportExport.trigger;'
	)
	.replace(
		"import { exportToPDF } from '../../../helpers/exports';",
		'const exportToPDF = globalThis.__waterMonitoringReportExport.pdf;'
	)
	.replace(
		"from 'papaparse'",
		`from '${pathToFileURL(require.resolve('papaparse')).href}'`
	)
	.replace(
		"from './waterMonitoringReportModel'",
		`from '${new URL('./waterMonitoringReportModel.js', import.meta.url).href}'`
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
const { downloadWaterReport } = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitoringReportExport;

test('CSV exports the complete dataset with selected period, raw numeric precision, zeros and dynamic headers', async () => {
	const type = reportTypeFor('daily-consumption');
	const model = buildWaterReport(
		{
			'Pump, North': Array.from({ length: 31 }, (_, index) => ({
				date: `2026-12-${String(index + 1).padStart(2, '0')}`,
				value: index === 0 ? 0 : 12.34567,
			})),
			'=Untrusted machine name': [],
		},
		type,
		{ unit: 'L' }
	);
	downloadWaterReport('csv', model, type, { year: 2026, month: 12 });
	assert.equal(downloaded.filename, 'OHT_Daily_Consumption_December_2026.csv');
	const rows = Papa.parse(await downloaded.blob.text()).data;
	assert.equal(rows.length, 6);
	assert.equal(rows[1][1], 'December 2026');
	assert.equal(rows[3][0], 'Device Name');
	assert.equal(rows[3][2], '01 Dec 2026');
	assert.equal(rows[4][0], 'Pump, North');
	assert.equal(rows[4][1], 'L');
	assert.equal(rows[4][2], '0');
	assert.equal(rows[4].at(-1), '12.34567');
	assert.equal(rows[5][2], '');
	assert.ok(rows[5][0].startsWith("'="));
});

test('Excel download uses XLSX content and period filename; PDF reuses the existing export utility with every row and machine', async () => {
	const type = reportTypeFor('monthly-running-hours');
	const model = buildWaterReport(
		{
			A: [
				{ month: 1, value: 0 },
				{ month: 12, value: 120.5 },
			],
			B: [],
		},
		type
	);
	downloadWaterReport('xlsx', model, type, { year: 2026 });
	assert.equal(downloaded.filename, 'OHT_Monthly_Running_Hours_2026.xlsx');
	assert.equal(
		downloaded.blob.type,
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	);
	assert.equal(
		String.fromCharCode(
			...new Uint8Array(await downloaded.blob.arrayBuffer()).slice(0, 2)
		),
		'PK'
	);
	downloadWaterReport('pdf', model, type, { year: 2026 });
	assert.equal(pdf[2], 'Monthly Motor Running Hours - 2026');
	assert.equal(pdf[0].length, 2);
	assert.equal(pdf[1].length, 4);
	assert.equal(pdf[0][0].p0, '0.00');
	assert.equal(pdf[0][0].p1, '120.50');
	assert.equal(pdf[1][1].header, 'Unit');
	assert.equal(pdf[1][0].meta.fixedExport, true);
});

test('exports include every matching device beyond the visible pagination slice', async () => {
	const type = reportTypeFor('daily-consumption');
	const model = buildWaterReport(
		Object.fromEntries(
			Array.from({ length: 75 }, (_, i) => [
				`Inlet ${i}`,
				[{ date: '2026-11-01', value: i }],
			])
		),
		type
	);
	downloadWaterReport('csv', model, type, { year: 2026, month: 11 }, 'inLET');
	const rows = Papa.parse(await downloaded.blob.text()).data;
	assert.equal(rows.length, 79);
	assert.equal(rows.at(-1)[0], 'Inlet 74');
	assert.equal(rows.at(-1)[1], '74');
	downloadWaterReport(
		'csv',
		model,
		type,
		{ year: 2026, month: 11 },
		'inlet 74'
	);
	assert.equal(Papa.parse(await downloaded.blob.text()).data.length, 5);
});
