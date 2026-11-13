import assert from 'node:assert/strict';
import test from 'node:test';
import {
	matchesWaterMachine,
	waterMachineState,
	waterMachineTitle,
} from './waterMachinePresentation.js';

test('sample readings cannot claim online connectivity', () => {
	const state = waterMachineState(
		{ status: 'online', latest: { controlMode: 'auto', motorRunState: '1' } },
		{ preview: true }
	);
	assert.equal(state.connection, 'Unverified');
	assert.equal(state.motor, 'Running');
	assert.equal(state.mode, 'Auto');
	assert.equal(state.unavailable, false);
});
test('live states require current telemetry and actual motor feedback', () => {
	const machine = {
		status: 'online',
		latest: {
			timestamp: '2026-11-12T10:00:00Z',
			motorRunState: '0',
			controlMode: 'manual',
		},
		command_acknowledged: true,
	};
	const options = { now: Date.parse('2026-11-12T10:00:30Z'), staleAfter: 60 };
	assert.equal(waterMachineState(machine, options).motor, 'Stopped');
	assert.equal(
		waterMachineState(machine, { ...options, now: options.now + 60000 }).motor,
		'Unknown'
	);
	assert.equal(
		waterMachineState(machine, { ...options, failed: true }).unavailable,
		true
	);
	assert.equal(
		waterMachineState({ ...machine, is_device_connected: false }, options)
			.connection,
		'Offline'
	);
	assert.equal(
		waterMachineState({ status: 'online', latest: {} }, options).unavailable,
		true
	);
});
test('search includes names, device identifiers, gateway and distribution zone', () => {
	const machine = {
		name: 'Pump North',
		slave_id: 42,
		device_code: 'CODE-A',
		details: { location: 'Zone South', gateway: 'GW-09' },
	};
	for (const search of ['pump', '42', 'code-a', 'south', 'gw-09', '  NORTH  '])
		assert.equal(matchesWaterMachine(machine, search), true);
	assert.equal(matchesWaterMachine(machine, 'absent'), false);
	assert.equal(
		waterMachineTitle({ name: 'Water Monitoring Unit - Sample4' }, true),
		'Water Monitoring Unit 4'
	);
	assert.equal(
		waterMachineTitle({ name: 'Real Sample Plant' }, false),
		'Real Sample Plant'
	);
});
