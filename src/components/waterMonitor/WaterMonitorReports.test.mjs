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

test('Reports default to the current month/year while cached results remain hidden until Search', () => {
	const h = harness();
	const tree = h.render();
	assert.equal(
		findProps(tree, (props) => props.label === 'Select Month').value.format(
			'YYYY-MM'
		),
		dayjs(new Date()).format('YYYY-MM')
	);
	assert.equal(
		findProps(tree, (props) => props.label === 'Select Year').value.format(
			'YYYY'
		),
		dayjs(new Date()).format('YYYY')
	);
	assert.equal(h.options.enabled, false);
	assert.equal(tableProps(tree), undefined);
	assert.equal(
		findProps(tree, (props) => props.label === 'Download Excel or CSV')
			.disabled,
		true
	);
	assert.match(
		h.html(),
		/Select the required filters and click Search to view data/
	);
	assert.doesNotMatch(h.html(), /Pump &lt;North&gt;|Loading\.\.\./);
	fill(h);
	h.render();
	assert.equal(h.options.enabled, false);
	assert.equal(h.calls.length, 0);
});

test('all five report tabs stay idle until Search and submit only the selected API and required filters', async () => {
	const h = harness();
	findProps(h.render(), (props) => props.label === 'Select Month').onChange(
		null
	);
	findProps(h.render(), (props) => props.label === 'Select Year').onChange(
		null
	);
	search(h);
	assert.match(h.html(), /Please select a valid month and year/);
	assert.equal(h.options.enabled, false);
	for (const type of WATER_REPORT_TYPES) {
		findProps(
			h.render(),
			(props) => props['aria-label'] === 'Water Monitoring reports'
		).onChange(null, type.id);
		h.render();
		assert.equal(h.options.enabled, false);
		fill(h);
		h.render();
		assert.equal(h.options.enabled, false);
		search(h);
		assert.equal(h.options.enabled, true);
		await h.options.queryFn({});
		assert.equal(h.calls.at(-1)[0], type.id);
		assert.deepEqual(
			h.calls.at(-1)[1],
			type.daily ? { month: 11, year: 2026 } : { year: 2026 }
		);
	}
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
