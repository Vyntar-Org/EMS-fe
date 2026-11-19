import assert from 'node:assert/strict';
import test from 'node:test';

import { feedbackConfirmsOperation } from './motorOperation.js';

const operation = {
	commandId: 12,
	deviceUid: 'UID',
	slaveId: 3,
	action: 1,
	baselineTs: Date.parse('2026-11-17T10:00:00Z'),
	startedAt: Date.parse('2026-11-17T10:00:01Z'),
};
const command = {
	id: 12,
	status: 'ACKED',
	requested_at: '2026-11-17T10:00:02Z',
};
const machine = {
	slave_id: 3,
	device_uid: 'UID',
	status: 'ONLINE',
	latest_ts: '2026-11-17T10:00:03Z',
	motor_run_state: '1',
};

test('ACK alone, stale readings, other equipment and unknown feedback never prove motor success', () => {
	assert.equal(feedbackConfirmsOperation(machine, operation, command), true);
	for (const status of ['PENDING', 'PUBLISHED', 'FAILED', 'TIMED_OUT']) {
		assert.equal(
			feedbackConfirmsOperation(machine, operation, { ...command, status }),
			false
		);
	}
	for (const change of [
		{ latest_ts: '2026-11-17T10:00:00Z' },
		{ latest_ts: '2026-11-17T10:00:01Z' },
		{ latest_ts: null },
		{ motor_run_state: null },
		{ motor_run_state: 'unknown' },
		{ status: 'OFFLINE' },
		{ slave_id: 4 },
		{ device_uid: 'OTHER' },
	]) {
		assert.equal(
			feedbackConfirmsOperation({ ...machine, ...change }, operation, command),
			false
		);
	}
	assert.equal(
		feedbackConfirmsOperation(machine, operation, { ...command, id: 13 }),
		false
	);
});

test('both actual ON and actual OFF feedback must be newer than the pre-request reading', () => {
	for (const action of [0, 1]) {
		for (const raw of [action, String(action), Boolean(action)]) {
			assert.equal(
				feedbackConfirmsOperation(
					{ ...machine, motor_run_state: raw },
					{ ...operation, action },
					command
				),
				true
			);
		}
	}
	assert.equal(
		feedbackConfirmsOperation(
			machine,
			{ ...operation, baselineTs: Date.parse(machine.latest_ts) },
			command
		),
		false
	);
});
