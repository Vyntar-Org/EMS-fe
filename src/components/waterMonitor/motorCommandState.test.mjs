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
	assert.equal(motorIdFor({ last_command: { motor_id: 8 } }), 8);
	assert.equal(motorIdFor({ motor_id: 2, last_command: { motor_id: 8 } }), 2);
	for (const motor_id of [null, '', -1, 0, 1.5, 'bad']) {
		assert.equal(motorIdFor({ motor_id }), null);
	}
});

test('only normalized AUTO mode allows control; Manual and unknown modes stay disabled', () => {
	const machine = {
		device_uid: 'UID',
		slave_index: 2,
		status: 'ONLINE',
		latest_ts: null,
		motor_run_state: false,
	};
	for (const control_mode of ['auto', 'AUTO', ' Auto ']) {
		const current = { ...machine, control_mode };
		assert.equal(motorControlReason(current, waterMachineState(current)), '');
	}
	for (const control_mode of [
		'manual',
		'MANUAL',
		' Manual ',
		null,
		undefined,
		'',
		'unknown',
		1,
	]) {
		const current = { ...machine, control_mode };
		assert.match(
			motorControlReason(current, waterMachineState(current)),
			/Manual mode|Auto mode/
		);
	}
	const offline = { ...machine, control_mode: 'auto', status: 'OFFLINE' };
	assert.match(
		motorControlReason(offline, waterMachineState(offline)),
		/offline/
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
		control_mode: 'AUTO',
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
	const offline = waterMachineState({
		...machine,
		status: 'OFFLINE',
		motor_run_state: 1,
	});
	assert.equal(offline.motor, 'Running');
	assert.match(motorControlReason(machine, offline), /offline/);
	assert.match(motorControlReason({ device_uid: 'UID' }, state), /mapping/);
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
