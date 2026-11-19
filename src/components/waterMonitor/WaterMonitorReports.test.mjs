import assert from 'node:assert/strict';
import test from 'node:test';

import dayjs from 'dayjs';

import {
	compileSearchComponent,
	findProps,
	tableProps,
} from './ohtSearchTestRuntime.mjs';
import {
	buildWaterReport,
	reportTypeFor,
	WATER_REPORT_TYPES,
} from './waterReportModel.js';

const createHarness = await compileSearchComponent('./WaterMonitorReports.jsx');
function harness() {
	return createHarness({
		data: buildWaterReport(
			{ 'Pump <North>': [{ date: '2026-11-01', value: 0 }], Empty: [] },
			reportTypeFor('daily-consumption')
		),
	});
}
const search = (h) => {
	findProps(h.render(), (props) => props.label === 'Search report').onClick();
	h.render();
};
function fill(h) {
	findProps(h.render(), (props) => props.label === 'Select Year').onChange(
		dayjs('2026-11-01')
	);
	findProps(h.render(), (props) => props.label === 'Select Month')?.onChange(
		dayjs('2026-11-01')
	);
}

test('Reports load and render the current month and year on first open', async () => {
	const h = harness();
	const now = dayjs();
	const tree = h.render();
	assert.equal(
		findProps(tree, (props) => props.label === 'Select Month').value.format(
			'YYYY-MM'
		),
		now.format('YYYY-MM')
	);
	assert.equal(
		findProps(tree, (props) => props.label === 'Select Year').value.format(
			'YYYY'
		),
		now.format('YYYY')
	);
	assert.equal(h.options.enabled, true);
	await h.options.queryFn({});
	assert.deepEqual(h.calls.at(-1).slice(0, 2), [
		'daily-consumption',
		{ month: now.month() + 1, year: now.year() },
	]);
	h.query.isFetching = true;
	assert.match(h.html(), /Loading\.\.\./);
	h.query.isFetching = false;
	assert.match(h.html(), /Pump &lt;North&gt;/);
});

test('all five tabs load the selected period with only the required filters', async () => {
	const h = harness();
	const selectTab = (id) =>
		findProps(
			h.render(),
			(props) => props['aria-label'] === 'Water Monitoring reports'
		).onChange(null, id);
	const now = dayjs();
	for (const type of WATER_REPORT_TYPES) {
		selectTab(type.id);
		h.render();
		assert.equal(h.options.enabled, true);
		await h.options.queryFn({});
		assert.equal(h.calls.at(-1)[0], type.id);
		assert.deepEqual(
			h.calls.at(-1)[1],
			type.daily
				? { month: now.month() + 1, year: now.year() }
				: { year: now.year() }
		);
	}
	selectTab('daily-consumption');
	findProps(h.render(), (props) => props.label === 'Select Month').onChange(
		null
	);
	search(h);
	assert.match(h.html(), /Please select a valid month and year/);
	assert.equal(h.options.enabled, false);
	selectTab('monthly-consumption');
	h.render();
	assert.equal(h.options.enabled, true);
});

test('Reports hide old results on filter changes; Search enables shared table and downloads', () => {
	const h = harness();
	fill(h);
	search(h);
	const html = h.html();
	assert.match(html, /Pump &lt;North&gt;/);
	assert.match(html, /Device Name/);
	assert.match(html, /01 Nov 2026/);
	assert.match(html, /Rows per page/);
	assert.equal(
		findProps(h.render(), (props) => props.label === 'Download Excel or CSV')
			.disabled,
		false
	);
	findProps(h.render(), (props) => props.label === 'Select Month').onChange(
		dayjs('2026-02-01')
	);
	assert.equal(tableProps(h.render()), undefined);
	assert.equal(h.options.enabled, false);
	assert.equal(
		findProps(h.render(), (props) => props.label === 'Download PDF').disabled,
		true
	);
	assert.doesNotMatch(h.html(), /Pump &lt;North&gt;/);
	search(h);
	assert.deepEqual(h.options.queryKey.at(-1).filters, { month: 2, year: 2026 });
	h.query.isFetching = true;
	assert.match(h.html(), /Loading\.\.\./);
	assert.equal(
		findProps(h.render(), (props) => props.label === 'Search report').disabled,
		true
	);
	h.query.isFetching = false;
	h.query.data = buildWaterReport({}, reportTypeFor('daily-consumption'));
	assert.match(h.html(), /No data found for the selected filters/);
	h.query.isError = true;
	h.query.error = { message: 'Reporting unavailable' };
	assert.match(h.html(), /Reporting unavailable/);
});

test('pagination stays on the submitted report; a draft device filter waits for another Search', () => {
	const h = harness();
	h.query.data = buildWaterReport(
		Object.fromEntries(
			Array.from({ length: 65 }, (_, i) => [
				`Pump ${i}`,
				[{ date: '2026-11-01', value: i }],
			])
		),
		reportTypeFor('daily-consumption')
	);
	fill(h);
	search(h);
	const key = JSON.stringify(h.options.queryKey);
	assert.equal(tableProps(h.render()).data.length, 50);
	tableProps(h.render()).onPageChange(null, 1);
	assert.equal(tableProps(h.render()).data.length, 15);
	assert.equal(JSON.stringify(h.options.queryKey), key);
	findProps(
		h.render(),
		(props) => props.label === 'Search Devices...'
	).onInputChange(null, 'PUMP 1', 'input');
	assert.equal(tableProps(h.render()), undefined);
	assert.equal(h.options.enabled, false);
	search(h);
	assert.equal(tableProps(h.render()).pageIndex, 0);
	assert.equal(tableProps(h.render()).totalRowCount, 11);
	assert.equal(h.options.queryKey.at(-1).deviceSearch, 'PUMP 1');
});
