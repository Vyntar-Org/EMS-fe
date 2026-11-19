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
	// The latest command is device-wide and may refer to another motor.
	const id = machine.motor_id ?? machine.slave_index;
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
	{ locked, failed, blockedReason, unavailable } = {}
) {
	const mode =
		typeof machine.control_mode === 'string'
			? machine.control_mode.trim().toLowerCase()
			: '';
	if (mode === 'manual') {
		return 'Motor control is disabled in Manual mode. Switch to Auto mode to enable remote control.';
	}
	if (mode !== 'auto') {
		return 'Motor control mode is unavailable.';
	}
	const eligible = machine.remote_control_eligible;
	if (eligible === false) {
		return 'This motor is operating in Level Mode. Manual ON/OFF control is unavailable.';
	}
	if (eligible !== true) {
		return 'Remote motor control is currently unavailable.';
	}
	if (unavailable) {
		return 'Motor control is unavailable.';
	}
	if (machine.status !== 'ONLINE') {
		return 'Motor control is unavailable while the device is offline.';
	}
	if (blockedReason) {
		return blockedReason;
	}
	if (locked) {
		return 'A motor operation is already in progress. Please wait.';
	}
	if (!machine.device_uid || motorIdFor(machine) === null) {
		return 'Motor configuration is incomplete.';
	}
	if (state.motor === 'Unknown') {
		return 'Current motor status is unavailable.';
	}
	if (failed) {
		return 'Refresh machine information before issuing a command.';
	}
	return '';
}
