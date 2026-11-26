// Independent of backend command acknowledgment timeout.
export const MOTOR_OPERATION_MAX_MS = 15000;
export const MOTOR_SUCCESS_DISPLAY_MS = 1200;
export const MOTOR_FAILURE_DISPLAY_MS = 2500;

export const operationMessages = {
	requestFailed: 'Unable to send the motor request. Please try again.',
	server: 'Internal server error. Please try again.',
	network: 'Unable to connect to the server. Please try again.',
	conflict: 'Another motor operation is in progress. Please wait.',
	deliveryFailed:
		'The motor request could not be sent. Please check the device connection.',
	commandFailed: 'Motor operation failed. Please try again.',
	unconfirmed: 'Motor is not responding. Please try again.',
};

export function feedbackConfirmsOperation(machine, operation, command) {
	if (
		!machine ||
		!operation ||
		command?.status !== 'ACKED' ||
		String(command.id) !== String(operation.commandId)
	) {
		return false;
	}
	if (
		String(machine.slave_id) !== String(operation.slaveId) ||
		machine.device_uid !== operation.deviceUid ||
		String(machine.status ?? '')
			.trim()
			.toUpperCase() !== 'ONLINE'
	) {
		return false;
	}
	const timestamp = Date.parse(machine.latest_ts);
	const requestedAt = Date.parse(command.requested_at);
	const threshold = Number.isFinite(requestedAt)
		? requestedAt
		: operation.startedAt;
	const reading = machine.motor_runstate;
	const actual = typeof reading === 'boolean' ? Number(reading) : null;
	return (
		actual === operation.action &&
		Number.isFinite(timestamp) &&
		timestamp >= threshold &&
		(!Number.isFinite(operation.baselineTs) || timestamp > operation.baselineTs)
	);
}

export function operationFailureMessage(failure) {
	switch (failure?.status) {
		case 403:
			return 'Remote motor control was denied by the backend for this device.';
		case 409:
			return operationMessages.conflict;
		case 500:
			return operationMessages.server;
		case 502:
			return operationMessages.deliveryFailed;
		default:
			return failure instanceof TypeError
				? operationMessages.network
				: operationMessages.requestFailed;
	}
}
