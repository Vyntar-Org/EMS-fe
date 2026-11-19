import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (
	await readFile(new URL('./waterMonitoringLogExportPages.js', import.meta.url), 'utf8')
).replace(
	"from './waterMonitoringLogModel'",
	`from '${new URL('./waterMonitoringLogModel.js', import.meta.url).href}'`
);
const { collectWaterMonitoringLogPages } = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

function page(offset, count, total, hasMore) {
	return {
		logs: Array.from({ length: count }, (_, i) => ({
			timestamp: `record-${offset + i}`,
			flowrate: i === 0 ? 0 : i,
		})),
		meta: { count, total, offset, limit: 500, has_more: hasMore },
	};
}

test('full exports follow has_more through every page, retain order and zeroes, and report progress', async () => {
	const offsets = [];
	const updates = [];
	const filters = { slave_id: 12 };
	const result = await collectWaterMonitoringLogPages(
		async (params) => {
			offsets.push(params.offset);
			assert.equal(params.slave_id, 12);
			return params.offset === 0
				? page(0, 500, 650, true)
				: page(500, 150, 650, false);
		},
		filters,
		{ onProgress: (update) => updates.push(update.count) }
	);
	assert.deepEqual(offsets, [0, 500]);
	assert.deepEqual(updates, [500, 650]);
	assert.equal(result.rows.length, 650);
	assert.equal(result.rows[500].timestamp, 'record-500');
	assert.equal(result.rows[500].flowrate, 0);
});

test('cancellation stops after the current request and never continues to the next page', async () => {
	const controller = new AbortController();
	let calls = 0;
	await assert.rejects(
		collectWaterMonitoringLogPages(
			async (_params, options) => {
				calls++;
				assert.equal(options.signal, controller.signal);
				controller.abort();
				return page(0, 500, 650, true);
			},
			{},
			{ signal: controller.signal }
		),
		{ name: 'AbortError' }
	);
	assert.equal(calls, 1);
});

test('size limits, changing totals, stalled pages and incomplete coverage never return a silently partial export', async () => {
	await assert.rejects(
		collectWaterMonitoringLogPages(async () => page(0, 1, 10001, true), {}),
		/Narrow the date range.*backend export/
	);
	await assert.rejects(
		collectWaterMonitoringLogPages(async () => page(0, 1, 10, false), {}),
		/complete log dataset/
	);
	await assert.rejects(
		collectWaterMonitoringLogPages(async () => page(0, 0, 10, true), {}),
		/did not advance/
	);
	await assert.rejects(
		collectWaterMonitoringLogPages(
			async ({ offset }) =>
				offset ? page(500, 1, 501, false) : page(0, 500, 650, true),
			{}
		),
		/dataset changed/
	);
});
