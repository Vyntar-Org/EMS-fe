// Independent of backend command acknowledgment timeout.
export const COMMAND_TIMEOUT_MS = 60_000;
export const INLINE_CONTROL_LOADING_MS = 15_000;

export const operationMessages = {
	requestFailed: 'Unable to send the motor request. Please try again.',
	server: 'Internal server error. Please try again.',
	network: 'Unable to connect to the server. Please try again.',
	conflict: 'Another motor operation is in progress. Please wait.',
	deliveryFailed:
		'The motor request could not be sent. Please check the device connection.',
	unconfirmed:
		'The device response was received, but the final command result could not be confirmed. Please check the latest motor status.',
};

export function commandErrorMessage(command) {
	const error = typeof command?.error === 'string' ? command.error.trim() : '';
	return (
		error ||
		(typeof command?.error_message === 'string'
			? command.error_message.trim()
			: '')
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
