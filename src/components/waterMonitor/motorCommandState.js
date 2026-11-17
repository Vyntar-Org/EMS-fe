export const isCommandPending = (command) =>
	['PENDING', 'PUBLISHED'].includes(command?.status);

export const isCommandTerminal = (command) =>
	['ACKED', 'TIMED_OUT', 'FAILED'].includes(command?.status);

export const commandMessages = {
	PENDING: 'Command pending',
	PUBLISHED: 'Command sent, awaiting acknowledgment',
	ACKED: 'Device acknowledged command',
	TIMED_OUT: 'Device acknowledgment timed out',
	FAILED: 'Command failed',
};

export function motorIdFor(machine) {
	// Verified backend mapping, not a slave primary-key guess:
	// apps/applications/oht/apis/motor_control.py resolves
	// Slave.objects.filter(device=device, slave_index=motor_id).
	// Use the current device channel before historical command information.
	const id =
		machine.motor_id ?? machine.slave_index ?? machine.last_command?.motor_id;
	return (typeof id === 'number' ||
		(typeof id === 'string' && id.trim() !== '')) &&
		Number.isInteger(Number(id)) &&
		Number(id) > 0
		? Number(id)
		: null;
}

export function newestCommand(commands) {
	return commands.filter(Boolean).reduce((latest, command) => {
		if (!latest) {
			return command;
		}
		const time = Date.parse(command.requested_at);
		const previous = Date.parse(latest.requested_at);
		if (
			Number.isFinite(time) &&
			Number.isFinite(previous) &&
			time !== previous
		) {
			return time > previous ? command : latest;
		}
		return Number(command.id) > Number(latest.id) ? command : latest;
	}, null);
}

export function waterApiError(
	error,
	fallback = 'Request failed. Please retry.'
) {
	const payload = error?.data;
	const message =
		payload?.error_message ??
		payload?.errors?.detail ??
		payload?.data?.error_message ??
		payload?.detail ??
		payload?.message ??
		payload?.error ??
		error?.message;
	return typeof message === 'string' ? message : fallback;
}

export function commandPollInterval(query) {
	// Network failures do not resolve a command and never trigger a POST retry.
	if ([403, 404].includes(query.state.error?.status)) {
		return false;
	}
	return query.state.status === 'error' || isCommandPending(query.state.data)
		? 2000
		: false;
}

export function motorControlReason(
	machine,
	state,
	{ locked, failed, blockedReason } = {}
) {
	if (state.mode === 'Manual') {
		return 'Motor control is disabled in Manual mode. Switch to Auto mode.';
	}
	if (state.mode !== 'Auto') {
		return 'Motor control requires confirmed Auto mode.';
	}
	if (blockedReason) {
		return blockedReason;
	}
	if (locked) {
		return 'Another motor command is already in progress for this device, or its status is being checked.';
	}
	if (failed) {
		return 'Refresh machine information before issuing a command.';
	}
	if (!machine.device_uid) {
		return 'Device UID is unavailable.';
	}
	if (motorIdFor(machine) === null) {
		return 'Motor ID mapping is unavailable for this machine.';
	}
	if (state.connection !== 'Online') {
		return 'Motor control is unavailable while the device is offline.';
	}
	if (state.motor === 'Unknown') {
		return 'Motor feedback is unavailable.';
	}
	return '';
}
