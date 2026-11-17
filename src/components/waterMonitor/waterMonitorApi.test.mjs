import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Inject only the transport: exercise the production API functions without
// requiring Vite, browser authentication, or a live organization account.
const source = (
	await readFile(new URL('./waterMonitorApi.js', import.meta.url), 'utf8')
)
	.replace(
		"import { api } from '../../helpers/api';",
		'const api = globalThis.__waterMonitorTestApi;'
	)
	.replace('baseUrl = import.meta.env.VITE_API_BASE_URL', "baseUrl = '/api'");
let handler;
globalThis.__waterMonitorTestApi = {
	get: (...args) => handler(...args),
	post: (...args) => handler(...args),
};
const api = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitorTestApi;

test('dashboard path includes /api exactly once', () => {
	assert.equal(
		api.waterDashboardPath('https://example.test/api/'),
		'/applications/oht/dashboard/'
	);
	assert.equal(
		api.waterDashboardPath('https://example.test/'),
		'/api/applications/oht/dashboard/'
	);
});

test('machine list preserves backend summary, multiple slaves, offline feedback and nulls', async () => {
	const signal = new AbortController().signal;
	const summary = { total: 2, running: 1, stopped: 1 };
	handler = async (path, options) => {
		assert.equal(path, '/applications/oht/machine-list/');
		assert.equal(options.signal, signal);
		return {
			data: {
				summary,
				machines: [
					{
						slave_id: 12,
						slave_name: 'Tank A',
						device_uid: 'UID',
						status: 'OFFLINE',
						latest_ts: '2026-11-17T10:00:00Z',
						tank_level: 25,
						fill_percent: null,
						motor_run_state: 1,
						flowrate_change_pct: null,
						consumption: { today: 0, today_change_pct: null },
						last_command: null,
					},
					{
						slave_id: 13,
						slave_name: 'Tank B',
						device_uid: 'UID',
						status: 'ONLINE',
						latest_ts: null,
						tank_level: null,
						fill_percent: 0,
						motor_run_state: 0,
						consumption: null,
					},
				],
			},
		};
	};
	const result = await api.getWaterMachines({ signal });
	assert.deepEqual(result.summary, summary);
	assert.equal(result.machines.length, 2);
	assert.equal(result.machines[0].fill_percent, null);
	assert.equal(result.machines[0].latest.motorRunState, 1);
	assert.equal(result.machines[0].summary.today.value, 0);
	assert.equal(result.machines[0].summary.today.change_pct, null);
	assert.equal(result.machines[1].latest.TankLevel, null);
	assert.equal(result.machines[1].fill_percent, 0);
	handler = async () => ({ data: { machines: [] } });
	assert.deepEqual((await api.getWaterMachines()).machines, []);
	handler = async () => ({ data: {} });
	await assert.rejects(api.getWaterMachines(), /Invalid/);
});

test('trend reads nested points and outer metadata; parameter switching never fills null gaps', async () => {
	for (const parameter of ['tank_level', 'flowrate', 'totalizer']) {
		handler = async (path) => {
			assert.equal(
				path,
				`/applications/oht/machine-list-trend/?slave_id=12&parameter=${parameter}&hours=24`
			);
			return {
				data: {
					data: [
						{ timestamp: '2026-11-17T10:00:00Z', value: null },
						{ timestamp: '2026-11-17T11:00:00Z', value: 0 },
					],
				},
				meta: { unit: 'backend-unit', from: 'from', to: 'to' },
			};
		};
		const trend = await api.getWaterTrend({ slaveId: 12, parameter });
		assert.equal(trend.meta.unit, 'backend-unit');
		assert.deepEqual(
			trend.points.map((point) => point.value),
			[null, 0]
		);
		assert.equal(trend.points[0].timestamp, '2026-11-17T10:00:00Z');
	}
	handler = async () => ({ data: { data: [] }, meta: { unit: '%' } });
	assert.deepEqual(
		(await api.getWaterTrend({ slaveId: 12, parameter: 'tank_level' })).points,
		[]
	);
	await assert.rejects(
		api.getWaterTrend({ slaveId: 12, parameter: 'unsupported' }),
		/Unsupported/
	);
});

test('accepted motor command uses actual UID and explicit motor ID, then tracks by command ID', async () => {
	const body = { device_uid: 'VRT2026338', motor_id: 3, command: 1 };
	const command = { id: 51, ...body, status: 'PENDING' };
	handler = async (path, request) => {
		assert.equal(path, '/applications/oht/motor-control/');
		assert.deepEqual(request, body);
		return { data: command }; // shared client returns JSON for HTTP 202
	};
	assert.deepEqual(await api.postWaterMotorCommand(body), command);
	handler = async (path) => {
		assert.equal(path, '/applications/oht/motor-control/status/?command_id=51');
		return { data: { ...command, status: 'ACKED' } };
	};
	assert.equal(
		(
			await api.getWaterMotorStatus({
				commandId: 51,
				deviceUid: body.device_uid,
			})
		).status,
		'ACKED'
	);
	await assert.rejects(
		api.postWaterMotorCommand({ ...body, motor_id: null }),
		/motor ID/
	);
});

test('409 and 502 preserve API errors without POST retries; latest device status supports null', async () => {
	for (const status of [409, 502]) {
		let calls = 0;
		const error = {
			status,
			data: { detail: status === 502 ? 'MQTT publish failed' : 'Conflict' },
		};
		handler = async () => {
			calls++;
			throw error;
		};
		await assert.rejects(
			api.postWaterMotorCommand({ device_uid: 'UID', motor_id: 1, command: 0 }),
			(actual) => actual === error
		);
		assert.equal(calls, 1);
	}
	handler = async (path) => {
		assert.equal(
			path,
			'/applications/oht/motor-control/status/?device_uid=UID'
		);
		return { data: null };
	};
	assert.equal(await api.getWaterMotorStatus({ deviceUid: 'UID' }), null);
});

test('status responses for a different command/device cannot unlock controls', async () => {
	handler = async () => ({
		data: { id: 20, device_uid: 'OTHER', status: 'ACKED' },
	});
	await assert.rejects(
		api.getWaterMotorStatus({ commandId: 20, deviceUid: 'UID' }),
		/does not match/
	);
	handler = async () => ({
		data: { id: 21, device_uid: 'UID', status: 'ACKED' },
	});
	await assert.rejects(
		api.getWaterMotorStatus({ commandId: 20, deviceUid: 'UID' }),
		/does not match/
	);
	handler = async () => ({ data: null });
	await assert.rejects(
		api.getWaterMotorStatus({ commandId: 20, deviceUid: 'UID' }),
		/does not match/
	);
});

test('actual Django wrapped command payload and errors are preserved; latest-device 404 means no history', async () => {
	const body = { device_uid: 'UID', motor_id: 2, command: 0 };
	const command = { ...body, id: 42, status: 'PUBLISHED' };
	handler = async () => ({ success: true, data: { command } });
	assert.deepEqual(await api.postWaterMotorCommand(body), command);
	assert.deepEqual(
		await api.getWaterMotorStatus({ commandId: 42, deviceUid: 'UID' }),
		command
	);
	const missing = {
		status: 404,
		data: { success: false, message: 'Command not found' },
	};
	handler = async () => {
		throw missing;
	};
	assert.equal(await api.getWaterMotorStatus({ deviceUid: 'UID' }), null);
	await assert.rejects(
		api.getWaterMotorStatus({ commandId: 42, deviceUid: 'UID' }),
		(actual) => actual === missing
	);
	const forbidden = {
		status: 403,
		data: { message: 'Not authorized for this device' },
	};
	handler = async () => {
		throw forbidden;
	};
	await assert.rejects(
		api.getWaterMotorStatus({ deviceUid: 'UID' }),
		(actual) => actual === forbidden
	);
});
test('dashboard GET forwards cancellation and preserves the unmapped response', async () => {
	const signal = new AbortController().signal;
	const response = { success: true, data: { actual_backend_field: 42 } };
	handler = async (path, options) => {
		assert.equal(path, '/applications/oht/dashboard/');
		assert.equal(options.signal, signal);
		return response;
	};
	assert.equal(await api.getWaterDashboard({ signal }), response);
});
test('dashboard failure is surfaced without mock fallback', async () => {
	handler = async () => {
		throw new Error('Network unavailable');
	};
	await assert.rejects(api.getWaterDashboard(), /Network unavailable/);
	handler = async () => ({ success: false });
	await assert.rejects(api.getWaterDashboard(), /Unable to load/);
});
test('sample values retain precision and require explicit percentage configuration', () => {
	const machine = {
		latest: { TankLevel: '25', flowrate: '0.00', totalizer: '243.60' },
	};
	assert.equal(api.metricReading(machine, 'TankLevel', false).percentage, null);
	assert.equal(api.metricReading(machine, 'flowrate', false).value, '0.00');
	assert.equal(api.metricReading(machine, 'totalizer', false).value, '243.60');
	machine.metrics = { TankLevel: { unit: '%' } };
	assert.equal(api.metricReading(machine, 'TankLevel', false).percentage, 25);
});
test('user-confirmed metric units are defaults while explicit backend units take priority', () => {
	const machine = {
		latest: { flowrate: '5.00', totalizer: '243.60', TankLevel: '25' },
	};
	assert.equal(api.metricReading(machine, 'flowrate', false).unit, 'm³');
	assert.equal(api.metricReading(machine, 'totalizer', false).unit, 'KL');
	assert.equal(api.metricReading(machine, 'TankLevel', false).percentage, null);
	machine.metrics = { flowrate: { unit: 'L/min' }, totalizer: { unit: 'm³' } };
	assert.equal(api.metricReading(machine, 'flowrate', false).unit, 'L/min');
	assert.equal(api.metricReading(machine, 'totalizer', false).unit, 'm³');
});
