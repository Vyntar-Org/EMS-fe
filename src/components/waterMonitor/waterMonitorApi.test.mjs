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
globalThis.__waterMonitorTestApi = { get: (...args) => handler(...args) };
const api = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
delete globalThis.__waterMonitorTestApi;

test('dashboard path includes /api exactly once', () => {
	assert.equal(
		api.waterDashboardPath('https://example.test/api/'),
		'/applications/water-monitoring/dashboard/'
	);
	assert.equal(
		api.waterDashboardPath('https://example.test/'),
		'/api/applications/water-monitoring/dashboard/'
	);
});
test('dashboard GET forwards cancellation and preserves the unmapped response', async () => {
	const signal = new AbortController().signal;
	const response = { success: true, data: { actual_backend_field: 42 } };
	handler = async (path, options) => {
		assert.equal(path, '/applications/water-monitoring/dashboard/');
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
