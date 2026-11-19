import assert from 'node:assert/strict';
import test from 'node:test';

import {
	buildWaterReport,
	formatReportValue,
	reportDateLabel,
	reportExportData,
	reportFilename,
	reportParams,
	reportTypeFor,
	WATER_REPORT_TYPES,
} from './waterMonitoringReportModel.js';

test('daily report aligns a union of literal shift dates across arbitrary machines, preserving zeros and gaps', () => {
	const input = {
		'Inlet & North': [
			{ date: '2026-11-02', value: 12.3456 },
			{ date: '2026-11-01', value: 0 },
		],
		'Empty machine': [],
		Outlet: [
			{ date: '2026-11-03', value: 4 },
			{ date: '2026-11-01', value: null },
		],
	};
	const before = JSON.stringify(input);
	const model = buildWaterReport(input, reportTypeFor('daily-consumption'));
	assert.deepEqual(
		model.machines.map((machine) => machine.name),
		Object.keys(input)
	);
	assert.deepEqual(
		model.rows.map((row) => row.period),
		['2026-11-01', '2026-11-02', '2026-11-03']
	);
	assert.deepEqual(
		model.rows.map((row) => row.values),
		[
			[0, null, null],
			[12.3456, null, null],
			[null, null, 4],
		]
	);
	assert.equal(model.rows[0].label, '01 Nov 2026');
	assert.equal(JSON.stringify(input), before);
	assert.equal(formatReportValue(0), '0.00');
	assert.equal(formatReportValue(12.3456), '12.35');
	assert.equal(formatReportValue(null), '—');
});

test('monthly reports sort only returned periods, collapse duplicates, and never fabricate missing months', () => {
	const model = buildWaterReport(
		{
			Pump: [
				{ month: 12, value: 0 },
				{ month: 1, value: 6 },
				{ month: 1, value: 7 },
			],
			Other: [{ month: 3, value: 4 }],
		},
		reportTypeFor('monthly-running-hours')
	);
	assert.deepEqual(
		model.rows.map((row) => row.period),
		[1, 3, 12]
	);
	assert.deepEqual(
		model.rows.map((row) => row.label),
		['Jan', 'Mar', 'Dec']
	);
	assert.deepEqual(model.rows[0].values, [7, null]);
	assert.ok(model.machines.every(({ unit }) => unit === 'h'));
	assert.equal(reportDateLabel('2026-11-01', true), '01 Nov 2026');
});

test('all five reports send only their applicable filters and reject invalid inputs', () => {
	assert.equal(WATER_REPORT_TYPES.length, 5);
	for (const type of WATER_REPORT_TYPES) {
		assert.deepEqual(
			reportParams(type, { year: '2026', month: '11' }),
			type.daily ? { year: 2026, month: 11 } : { year: 2026 }
		);
		assert.throws(() => reportParams(type, { year: '', month: 11 }));
		assert.throws(() => reportParams(type, { year: 2026.5, month: 11 }));
		assert.throws(() => reportParams(type, { year: 9999, month: 11 }));
		if (type.daily) {
			assert.throws(() => reportParams(type, { year: 2026, month: 13 }));
		} else {
			assert.deepEqual(reportParams(type, { year: 2026 }), { year: 2026 });
		}
	}
});

test('units come only from response metadata; Totalizer exports retain readings without totals', () => {
	const type = reportTypeFor('daily-reading');
	const input = {
		Main: [
			{ date: '2026-11-01', value: 243.6 },
			{ date: '2026-11-02', value: 250.12345 },
		],
	};
	assert.equal(buildWaterReport(input, type).machines[0].unit, '');
	const model = buildWaterReport(input, type, { unit: 'L' });
	assert.equal(model.machines[0].unit, 'L');
	const exported = reportExportData(model, type, { year: 2026, month: 11 });
	assert.deepEqual(exported[3], [
		'Device Name',
		'Unit',
		'01 Nov 2026',
		'02 Nov 2026',
	]);
	assert.deepEqual(exported.slice(4), [['Main', 'L', 243.6, 250.12345]]);
	assert.match(exported[2][1], /cumulative readings are not consumption/);
	assert.equal(
		reportFilename(type, { year: 2026, month: 11 }),
		'OHT_Daily_Meter_Reading_November_2026'
	);
});

test('empty arrays are valid; malformed grouped payloads fail visibly instead of creating static data', () => {
	const type = reportTypeFor('daily-consumption');
	assert.deepEqual(buildWaterReport({}, type).rows, []);
	assert.deepEqual(buildWaterReport({ Empty: [] }, type).rows, []);
	for (const bad of [null, [], 'invalid', { Pump: {} }]) {
		assert.throws(() => buildWaterReport(bad, type), /invalid/);
	}
});
