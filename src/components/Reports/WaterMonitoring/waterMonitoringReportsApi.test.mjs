import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const modelUrl = new URL('./waterMonitoringReportModel.js', import.meta.url)
	.href;
const source = (
	await readFile(
		new URL('./waterMonitoringReportsApi.js', import.meta.url),
		'utf8'
	)
)
	.replace(
		"import { api } from '../../../helpers/api';",
		'const api = globalThis.__waterMonitoringReportsTransport;'
	)
	.replace(
		"import { waterMonitoringEndpoint } from '../../WaterMonitoring/waterMonitoringService';",
		"const waterMonitoringEndpoint = endpoint => '/applications/oht/' + endpoint;"
	)
	.replace("from './waterMonitoringReportModel'", `from '${modelUrl}'`);
let handler;
globalThis.__waterMonitoringReportsTransport = {
	get: (...args) => handler(...args),
};
const api = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitoringReportsTransport;

test('each report service uses the existing authenticated GET transport and correct OHT endpoint', async () => {
	const signal = new AbortController().signal;
	const cases = [
		['getDailyConsumptionReport', 'daily-consumption-reports/', true],
		['getMonthlyConsumptionReport', 'monthly-consumption-reports/', false],
		['getDailyMeterReadingReport', 'daily-reading-reports/', true],
		['getDailyRunningHoursReport', 'daily-running-hours-reports/', true],
		['getMonthlyRunningHoursReport', 'monthly-running-hours-reports/', false],
	];
	for (const [method, endpoint, daily] of cases) {
		let calls = 0;
		handler = async (path, options) => {
			calls++;
			const url = new URL(path, 'https://example.test');
			assert.equal(url.pathname, `/applications/oht/${endpoint}`);
			assert.equal(url.searchParams.get('year'), '2026');
			assert.equal(url.searchParams.get('month'), daily ? '11' : null);
			assert.equal(options.signal, signal);
			return {
				success: true,
				data: {
					Pump: [
						daily ? { date: '2026-11-01', value: 0 } : { month: 1, value: 0 },
					],
				},
				meta: {},
			};
		};
		const result = await api[method]({ year: 2026, month: 11 }, { signal });
		assert.equal(calls, 1);
		assert.equal(result.rows[0].values[0], 0);
		assert.deepEqual(
			result.machines.map(({ name }) => name),
			['Pump']
		);
	}
});

test('unsuccessful envelopes and HTTP errors are surfaced; shift configuration has an actionable message', async () => {
	handler = async () => ({
		success: false,
		message: 'Shift config not found',
		data: null,
	});
	await assert.rejects(
		api.getDailyConsumptionReport({ year: 2026, month: 11 }),
		(error) => {
			assert.match(
				api.waterReportError(error),
				/shift settings.*administrator/
			);
			return true;
		}
	);
	for (const status of [400, 401, 403, 404, 500]) {
		const failure = { status, data: { message: 'Backend failure' } };
		handler = async () => {
			throw failure;
		};
		await assert.rejects(
			api.getMonthlyConsumptionReport({ year: 2026 }),
			(error) => error === failure
		);
		assert.notEqual(api.waterReportError(failure), 'Backend failure');
	}
});

test('invalid filters never call transport and a malformed success is not mistaken for an empty report', async () => {
	let calls = 0;
	handler = async () => {
		calls++;
		return { success: true, data: null };
	};
	await assert.rejects(api.getDailyConsumptionReport({ year: 2026, month: 0 }));
	assert.equal(calls, 0);
	await assert.rejects(
		api.getMonthlyConsumptionReport({ year: 2026 }),
		/invalid/
	);
	assert.equal(calls, 1);
	handler = async () => ({ success: true, data: {} });
	assert.deepEqual(
		(await api.getMonthlyConsumptionReport({ year: 2026 })).rows,
		[]
	);
});
