import assert from 'node:assert/strict';
import test from 'node:test';

import { strFromU8, unzipSync } from 'fflate';

import {
	buildWaterReport,
	reportExportData,
	reportTypeFor,
} from './waterReportModel.js';
import { createWaterReportWorkbook } from './waterReportWorkbook.js';

test('Excel export is a real XLSX archive with complete numeric readings, Unicode names, metadata and safe literal text', () => {
	const type = reportTypeFor('daily-reading');
	const model = buildWaterReport(
		{
			'கிணறு & <Inlet>': [
				{ date: '2026-11-01', value: 0 },
				{ date: '2026-11-02', value: 243.67891 },
			],
			'=HYPERLINK("test")': [],
		},
		type
	);
	const bytes = createWaterReportWorkbook(
		reportExportData(model, type, { year: 2026, month: 11 })
	);
	assert.equal(String.fromCharCode(...bytes.slice(0, 2)), 'PK');
	const files = unzipSync(bytes);
	for (const name of [
		'[Content_Types].xml',
		'_rels/.rels',
		'xl/workbook.xml',
		'xl/_rels/workbook.xml.rels',
		'xl/styles.xml',
		'xl/worksheets/sheet1.xml',
	]) {
		assert.ok(files[name], name);
	}
	const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
	assert.match(sheet, /Daily Meter Reading \(Totalizer\)/);
	assert.match(sheet, /November 2026/);
	assert.match(sheet, /கிணறு &amp; &lt;Inlet&gt;/);
	assert.match(sheet, /<c r="B5" s="1"><v>0<\/v><\/c>/);
	assert.match(sheet, /<c r="C5" s="1"><v>243.67891<\/v><\/c>/);
	assert.match(sheet, /<c r="C6"\/>/);
	assert.match(sheet, /=HYPERLINK\(&quot;test&quot;\)/);
	assert.doesNotMatch(sheet, /<f[ >]/);
});

test('Excel export includes all machine rows and Jan–Dec columns in the same orientation as Water Reports', () => {
	const grouped = Object.fromEntries(
		Array.from({ length: 30 }, (_, i) => [
			`Pump ${i}`,
			Array.from({ length: 12 }, (_, m) => ({
				month: m + 1,
				value: i + m / 10,
			})),
		])
	);
	const type = reportTypeFor('monthly-running-hours');
	const matrix = reportExportData(buildWaterReport(grouped, type), type, {
		year: 2026,
	});
	const files = unzipSync(createWaterReportWorkbook(matrix));
	const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
	assert.match(sheet, /ref="A1:N34"/);
	assert.match(sheet, /Pump 29/);
	assert.match(sheet, /<t xml:space="preserve">Dec<\/t>/);
	assert.match(sheet, /<c r="N34" s="1"><v>30.1<\/v>/);
});
