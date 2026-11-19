import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';

import {
	commandMessages,
	commandPollInterval,
	isCommandPending,
	motorControlReason,
	motorIdFor,
	newestCommand,
} from './motorCommandState.js';
import { waterMachineState } from './waterMachinePresentation.js';

test('motor mapping follows verified device slave_index contract, never slave or device primary keys', () => {
	assert.equal(motorIdFor({ slave_id: 3, slave_index: 4, device_id: 5 }), 4);
	assert.equal(motorIdFor({ slave_id: 3, device_id: 5 }), null);
	assert.equal(
		motorIdFor({ slave_index: 4, last_command: { motor_id: 8 } }),
		4
	);
	assert.equal(motorIdFor({ last_command: { motor_id: 8 } }), null);
	assert.equal(motorIdFor({ motor_id: 2, last_command: { motor_id: 8 } }), 2);
	for (const motor_id of [null, '', -1, 0, 1.5, 'bad']) {
		assert.equal(motorIdFor({ motor_id }), null);
	}
});

test('motor control requires Auto mode and strict API permission regardless of strategy', () => {
	const machine = {
		device_uid: 'UID',
		slave_index: 2,
		status: 'ONLINE',
		latest_ts: null,
		motor_run_state: '1',
	};
	for (const [
		control_mode,
		control_strategy,
		remote_control_eligible,
		reason,
	] of [
		['auto', 'REMOTE', true, /^$/],
		['auto', 'LEVEL', true, /^$/],
		['auto', null, true, /^$/],
		['auto', undefined, true, /^$/],
		[' Auto ', ' remote ', true, /^$/],
		['manual', 'REMOTE', true, /Manual mode/],
		['manual', null, true, /Manual mode/],
		[' MANUAL ', null, false, /Manual mode/],
		['auto', 'REMOTE', false, /currently unavailable for this machine/],
		['auto', 'REMOTE', null, /currently unavailable for this machine/],
		['auto', 'REMOTE', undefined, /currently unavailable for this machine/],
		['auto', 'REMOTE', 'true', /currently unavailable for this machine/],
		['auto', 'REMOTE', 1, /currently unavailable for this machine/],
		[null, 'REMOTE', true, /mode is unavailable/],
		[undefined, 'REMOTE', true, /mode is unavailable/],
		['unexpected', 'REMOTE', true, /mode is unavailable/],
		[['auto'], 'REMOTE', true, /mode is unavailable/],
	]) {
		const current = {
			...machine,
			control_mode,
			control_strategy,
			remote_control_eligible,
		};
		const state = waterMachineState(current);
		assert.equal(state.motor, 'Running');
		assert.match(motorControlReason(current, state), reason);
	}
	const manual = { ...machine, control_mode: 'manual', status: 'OFFLINE' };
	assert.match(
		motorControlReason(manual, waterMachineState(manual), { locked: true }),
		/Manual mode/
	);
});

test('polling follows backend lifecycle, retries status failures, never invents timeouts', () => {
	for (const status of Object.keys(commandMessages)) {
		const command = { status, requested_at: '2000-01-01T00:00:00Z' };
		assert.equal(
			commandPollInterval({ state: { status: 'success', data: command } }),
			isCommandPending(command) ? 2000 : false
		);
	}
	assert.equal(commandPollInterval({ state: { status: 'error' } }), 2000);
	assert.equal(
		commandPollInterval({ state: { status: 'error', error: { status: 403 } } }),
		false
	);
	assert.equal(
		commandPollInterval({ state: { status: 'error', error: { status: 404 } } }),
		false
	);
	assert.equal(
		commandPollInterval({ state: { status: 'success', data: null } }),
		false
	);
});

test('device command lock applies to both motors; connectivity and feedback remain independent', () => {
	const machine = {
		device_uid: 'UID',
		latest_ts: '2000-01-01T00:00:00Z',
		status: 'ONLINE',
		control_mode: 'auto',
		remote_control_eligible: true,
		control_strategy: 'REMOTE',
		slave_index: 2,
		motor_run_state: 0,
		last_command: { motor_id: 9, status: 'ACKED', command: 1 },
	};
	const state = waterMachineState(machine);
	assert.equal(state.motor, 'Stopped');
	assert.equal(state.connection, 'Online');
	assert.equal(motorControlReason(machine, state), '');
	for (const motor_id of [1, 2]) {
		assert.match(
			motorControlReason({ ...machine, motor_id }, state, { locked: true }),
			/already in progress/
		);
	}
	const offline = { ...machine, status: 'OFFLINE', motor_run_state: 1 };
	assert.equal(waterMachineState(offline).motor, 'Running');
	assert.match(
		motorControlReason(offline, waterMachineState(offline), { locked: true }),
		/offline/
	);
	assert.match(
		motorControlReason({ ...machine, control_strategy: 'LEVEL' }, state, {
			locked: true,
		}),
		/already in progress/
	);
	assert.match(
		motorControlReason({ ...machine, slave_index: undefined }, state),
		/configuration is incomplete/
	);
	const invalid = { ...machine, motor_run_state: 'running' };
	assert.match(
		motorControlReason(invalid, waterMachineState(invalid)),
		/status is unavailable/
	);
});

test('most recent device command is reconciled across slave cards', () => {
	assert.equal(
		newestCommand([
			{ id: 2, requested_at: '2026-11-17T10:00:00Z' },
			null,
			{ id: 3, requested_at: '2026-11-17T11:00:00Z' },
		]).id,
		3
	);
});

test('query observers deduplicate overlapping status reads and cancel on unmount', async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});
	let calls = 0;
	let aborted = false;
	const options = {
		queryKey: ['command', 'UID'],
		queryFn: ({ signal }) => {
			calls++;
			return new Promise((_, reject) =>
				signal.addEventListener('abort', () => {
					aborted = true;
					reject(new Error('cancelled'));
				})
			);
		},
		refetchInterval: commandPollInterval,
	};
	const first = new QueryObserver(client, options);
	const second = new QueryObserver(client, options);
	const stopFirst = first.subscribe(() => {});
	const stopSecond = second.subscribe(() => {});
	assert.equal(calls, 1);
	stopFirst();
	assert.equal(aborted, false);
	stopSecond();
	assert.equal(aborted, true);
	client.clear();
});
