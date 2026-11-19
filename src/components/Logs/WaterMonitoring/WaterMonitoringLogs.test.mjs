import assert from 'node:assert/strict';
import test from 'node:test';

import dayjs from 'dayjs';

import {
	compileSearchComponent,
	findProps,
	tableProps,
} from '../../WaterMonitoring/test/waterMonitoringSearchTestRuntime.mjs';

const createHarness = await compileSearchComponent(new URL('./WaterMonitoringLogs.jsx', import.meta.url));
const machines = [
	{ slave_id: 12, slave_name: 'Garden Outlet', device_uid: 'UID' },
	{ slave_id: 15, slave_name: 'Other machine', device_uid: 'B' },
];
function harness() {
	return createHarness({
		machines,
		data: {
			logs: [
				{
					timestamp: '2026-11-17T19:42:37+05:30',
					tank_level: 1450.123456,
					flowrate: 0,
					totalizer: null,
					control_mode: 'manual',
					control_strategy: 'LEVEL',
					motor_run_state: '0',
				},
			],
			meta: { count: 1, total: 800, limit: 50, offset: 0, has_more: true },
		},
	});
}
function fill(h) {
	let tree = h.render();
	findProps(tree, (props) => props.label === 'Select Devices').onChange({
		value: 12,
	});
	tree = h.render();
	findProps(tree, (props) => props.mode === 'datetimerangepicker').onChange([
		dayjs('2026-11-01T00:00:00'),
		dayjs('2026-11-17T23:59:59'),
	]);
}
function search(h) {
	findProps(
		h.render(),
		(props) => props['aria-label'] === 'View Logs'
	).onClick();
	h.render();
}

test('Logs default to month-to-date without selecting a machine or loading cached records', () => {
	const h = harness();
	const tree = h.render();
	assert.equal(h.options.enabled, false);
	assert.equal(
		findProps(tree, (props) => props.label === 'Select Devices').value,
		''
	);
	const [start, end] = findProps(
		tree,
		(props) => props.mode === 'datetimerangepicker'
	).value;
	assert.ok(start.isValid() && end.isValid());
	assert.equal(start.valueOf(), end.startOf('month').valueOf());
	assert.ok(end.valueOf() <= dayjs().valueOf());
	assert.deepEqual(
		findProps(tree, (props) => props.label === 'Select Parameters').value,
		[]
	);
	assert.equal(
		findProps(tree, (props) => props.label === 'Download Excel').disabled,
		true
	);
	assert.equal(tableProps(tree), undefined);
	assert.match(
		h.html(),
		/Select the required filters and click Search to view data/
	);
	assert.doesNotMatch(h.html(), /1450\.123456|Loading\.\.\./);
	fill(h);
	h.render();
	assert.equal(h.options.enabled, false);
	assert.equal(h.calls.length, 0);
});

test('Logs validate only on Search and submit the chosen machine/range without defaults', async () => {
	const h = harness();
	search(h);
	assert.equal(h.options.enabled, false);
	assert.match(h.html(), /Please select a machine/);
	fill(h);
	findProps(
		h.render(),
		(props) => props.mode === 'datetimerangepicker'
	).onChange([dayjs('2026-11-17'), dayjs('2026-11-01')]);
	search(h);
	assert.equal(h.options.enabled, false);
	assert.match(h.html(), /before the end/);
	fill(h);
	search(h);
	assert.equal(h.options.enabled, true);
	const signal = new AbortController().signal;
	await h.options.queryFn({ signal });
	assert.deepEqual(h.calls[0][0], {
		slave_id: 12,
		start_datetime: '2026-11-01T00:00:00',
		end_datetime: '2026-11-17T23:59:59',
		limit: 50,
		offset: 0,
	});
	assert.equal(h.calls[0][1].signal, signal);
	const download = findProps(h.render(), (props) => props.label === 'Download Excel');
	assert.equal(download.disabled, false);
	const exportRequest = download.onClick();
	assert.deepEqual(h.calls[1][0], { ...h.calls[0][0], limit: 500 });
	findProps(h.render(), (props) => props.children === 'Cancel export').onClick();
	await exportRequest;
	assert.equal(h.calls[1][1].signal.aborted, true);
});

test('submitted Logs filters drive pagination/Refresh; drafts hide old results until another Search', async () => {
	const h = harness();
	fill(h);
	search(h);
	tableProps(h.render()).onPageChange(null, 1);
	h.render();
	await h.options.queryFn({});
	assert.equal(h.calls.at(-1)[0].offset, 50);
	assert.equal(h.calls.at(-1)[0].slave_id, 12);
	h.query.data.meta.offset = 50;
	findProps(
		h.render(),
		(props) => props['aria-label'] === 'Refresh logs'
	).onClick();
	h.render();
	assert.equal(h.refreshes, 1);
	assert.equal(h.options.queryKey.at(-1).offset, 50);
	const previousKey = JSON.stringify(h.options.queryKey);
	findProps(h.render(), (props) => props.label === 'Select Devices').onChange({
		value: 15,
	});
	assert.equal(tableProps(h.render()), undefined);
	assert.equal(h.options.enabled, false);
	assert.notEqual(JSON.stringify(h.options.queryKey), previousKey);
	assert.equal(
		findProps(h.render(), (props) => props.label === 'Download Excel').disabled,
		true
	);
	assert.equal(
		findProps(h.render(), (props) => props['aria-label'] === 'Refresh logs')
			.disabled,
		true
	);
	search(h);
	await h.options.queryFn({});
	assert.equal(h.calls.at(-1)[0].offset, 0);
	assert.equal(h.calls.at(-1)[0].slave_id, 15);
});

test('searched Logs retain shared table/badges, has_more, loading, and empty/error states', () => {
	const h = harness();
	fill(h);
	search(h);
	const html = h.html();
	assert.match(html, /1450\.123456/);
	assert.match(html, />0<\/p>/);
	assert.match(html, /Manual|Stopped/);
	assert.match(html, /Control Mode[\s\S]*Control Strategy[\s\S]*Motor Status/);
	assert.match(html, />Level<\/p>/);
	assert.match(html, /MuiChip-colorWarning/);
	assert.match(html, /Rows per page/);
	assert.doesNotMatch(html, /role="switch"|Turn ON|Tank Level \(%\)/);
	h.query.data.meta.has_more = false;
	assert.equal(
		tableProps(h.render()).paginationProps.nextIconButtonProps.disabled,
		true
	);
	h.query.isFetching = true;
	assert.equal(
		findProps(h.render(), (props) => props['aria-label'] === 'View Logs')
			.disabled,
		true
	);
	assert.match(h.html(), /Loading\.\.\./);
	h.query.isFetching = false;
	h.query.data = { logs: [], meta: { total: 0 } };
	assert.match(h.html(), /No data found for the selected filters/);
	h.query.isError = true;
	h.query.error = { message: 'Request failed' };
	assert.match(h.html(), /Request failed/);
});
