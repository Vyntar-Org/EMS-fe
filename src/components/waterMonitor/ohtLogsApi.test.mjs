import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

let handler;
globalThis.__ohtLogsTransport = { get: (...args) => handler(...args) };
const source = (
	await readFile(new URL('./ohtLogsApi.js', import.meta.url), 'utf8')
)
	.replace(
		"import { api } from '../../helpers/api';",
		'const api = globalThis.__ohtLogsTransport;'
	)
	.replace(
		"from './ohtLogModel'",
		`from '${new URL('./ohtLogModel.js', import.meta.url).href}'`
	)
	.replace(
		"import { getWaterMachines, waterEndpoint } from './waterMonitorApi';",
		"const getWaterMachines = () => {}; const waterEndpoint = endpoint => '/applications/oht/' + endpoint;"
	);
const service = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__ohtLogsTransport;
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
	const result = await service.getOHTLogs(filters, { signal });
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
	await assert.rejects(service.getOHTLogs({ ...filters, slave_id: '' }));
	await assert.rejects(service.getOHTLogs({ ...filters, limit: -1 }));
	assert.equal(calls, 0);
	assert.deepEqual((await service.getOHTLogs(filters)).logs, []);
	handler = async () => ({ success: false, message: 'Request failed' });
	await assert.rejects(service.getOHTLogs(filters));
	handler = async () => ({ success: true, data: { logs: [] }, meta: {} });
	await assert.rejects(service.getOHTLogs(filters), /response is invalid/);
});

test('HTTP errors preserve shared authentication behavior and surface friendly messages', async () => {
	for (const status of [400, 401, 403, 404, 500]) {
		const failure = { status, data: { message: 'Internal details' } };
		handler = async () => {
			throw failure;
		};
		await assert.rejects(
			service.getOHTLogs(filters),
			(error) => error === failure
		);
		assert.notEqual(service.ohtLogsError(failure), 'Internal details');
	}
	assert.match(service.ohtLogsError({ status: 403 }), /permission/);
	assert.equal(
		service.ohtLogsError(new TypeError('Failed to fetch')),
		'Unable to load logs. Please try again.'
	);
});
