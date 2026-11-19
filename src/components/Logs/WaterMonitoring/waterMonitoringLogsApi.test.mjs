import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

let handler;
globalThis.__waterMonitoringLogsTransport = {
	get: (...args) => handler(...args),
};
const source = (
	await readFile(
		new URL('./waterMonitoringLogsApi.js', import.meta.url),
		'utf8'
	)
)
	.replace(
		"import { api } from '../../../helpers/api';",
		'const api = globalThis.__waterMonitoringLogsTransport;'
	)
	.replace(
		"from './waterMonitoringLogModel'",
		`from '${new URL('./waterMonitoringLogModel.js', import.meta.url).href}'`
	)
	.replace(
		"import { waterMonitoringEndpoint } from '../../WaterMonitoring/waterMonitoringService';",
		"const waterMonitoringEndpoint = endpoint => '/applications/oht/' + endpoint;"
	);
const service = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitoringLogsTransport;
const filters = {
	slave_id: 12,
	start_datetime: '2026-11-01T00:00:00',
	end_datetime: '2026-11-17T23:59:59',
	limit: 50,
	offset: 100,
};

test('authenticated OHT GET carries only documented filters, correct offset and cancellation signal', async () => {
	const signal = new AbortController().signal;
	const records = [
		{
			timestamp: '2026-11-17T19:42:00',
			flowrate: 0,
			totalizer: 15441.1234,
			control_mode: 'manual',
			motor_run_state: false,
		},
	];
	const meta = {
		count: 1,
		total: 101,
		limit: 50,
		offset: 100,
		has_more: false,
	};
	handler = async (path, options) => {
		const url = new URL(path, 'https://example.test');
		assert.equal(url.pathname, '/applications/oht/logs/');
		assert.deepEqual(
			Object.fromEntries(url.searchParams),
			Object.fromEntries(
				Object.entries(filters).map(([key, value]) => [key, String(value)])
			)
		);
		assert.equal(options.signal, signal);
		return { success: true, data: { logs: records }, meta };
	};
	const result = await service.getWaterMonitoringLogs(filters, { signal });
	assert.equal(result.logs, records);
	assert.equal(result.meta, meta);
});

test('invalid filters make no request; malformed envelopes and pagination are errors rather than empty live data', async () => {
	let calls = 0;
	handler = async () => {
		calls++;
		return {
			success: true,
			data: { logs: [] },
			meta: { count: 0, total: 0, limit: 50, offset: 100, has_more: false },
		};
	};
	await assert.rejects(
		service.getWaterMonitoringLogs({ ...filters, slave_id: '' })
	);
	await assert.rejects(
		service.getWaterMonitoringLogs({ ...filters, limit: -1 })
	);
	assert.equal(calls, 0);
	assert.deepEqual((await service.getWaterMonitoringLogs(filters)).logs, []);
	handler = async () => ({ success: false, message: 'Request failed' });
	await assert.rejects(service.getWaterMonitoringLogs(filters));
	handler = async () => ({ success: true, data: { logs: [] }, meta: {} });
	await assert.rejects(
		service.getWaterMonitoringLogs(filters),
		/response is invalid/
	);
});

test('HTTP errors preserve shared authentication behavior and surface friendly messages', async () => {
	for (const status of [400, 401, 403, 404, 500]) {
		const failure = { status, data: { message: 'Internal details' } };
		handler = async () => {
			throw failure;
		};
		await assert.rejects(
			service.getWaterMonitoringLogs(filters),
			(error) => error === failure
		);
		assert.notEqual(
			service.waterMonitoringLogsError(failure),
			'Internal details'
		);
	}
	assert.match(service.waterMonitoringLogsError({ status: 403 }), /permission/);
	assert.equal(
		service.waterMonitoringLogsError(new TypeError('Failed to fetch')),
		'Unable to load logs. Please try again.'
	);
});
