export const MOTOR_FEEDBACK_CONFIRM_MS = 30000;
// Independent of backend command acknowledgment timeout.
export const MOTOR_OPERATION_MAX_MS = 120000;

export const operationMessages = {
	requestFailed: 'Unable to send the motor request. Please try again.',
	conflict:
		'Another motor operation is in progress. Please try again after it finishes.',
	deliveryFailed:
		'Motor request could not be delivered. Please check the connection.',
	timedOut:
		'Motor response was not received. Please verify the motor status before trying again.',
	unconfirmed:
		'The requested motor state is not yet confirmed. Please check its status.',
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
	const raw = machine.motor_run_state;
	const actual =
		raw === true || raw === 1 || raw === '1'
			? 1
			: raw === false || raw === 0 || raw === '0'
			  ? 0
			  : null;
	return (
		actual === operation.action &&
		Number.isFinite(timestamp) &&
		timestamp >= threshold &&
		(!Number.isFinite(operation.baselineTs) || timestamp > operation.baselineTs)
	);
}

export function operationFailureMessage(status) {
	return status === 409
		? operationMessages.conflict
		: status === 502
		  ? operationMessages.deliveryFailed
		  : operationMessages.requestFailed;
}
