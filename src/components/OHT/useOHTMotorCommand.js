import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	waterMachineState,
	getWaterMonitoringMachines,
} from '../../helpers/oht';

import {
	feedbackConfirmsOperation,
	MOTOR_FAILURE_DISPLAY_MS,
	MOTOR_OPERATION_MAX_MS,
	MOTOR_SUCCESS_DISPLAY_MS,
	operationFailureMessage,
	operationMessages,
} from './motorOperation';

// One instance per device, shared by all of its slave cards (including hidden
// search results). Query owns polling, cancellation and request deduplication.
export default function useOHTMotorCommand({
	deviceUid,
	machines,
	scope,
	listKey,
	failed,
}) {
	const client = useQueryClient();
	const [local, setLocal] = useState(null);
	const [error, setError] = useState('');
	const [refreshed, setRefreshed] = useState('');
	const [operation, setOperation] = useState(null);
	const [outcome, setOutcome] = useState(null);
	const activeOperation = useRef(null);
	const updateOperation = (next) => {
		activeOperation.current = next;
		setOperation(next);
	};
	function completeOperation(current, message, severity = 'error') {
		if (!mounted.current || activeOperation.current?.token !== current.token) {
			return;
		}
		updateOperation(null);
		setOutcome({ ...current, message, severity });
	}
	const posting = useRef(false);
	const mounted = useRef(true);
	const terminalRefresh = useRef('');
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			activeOperation.current = null;
		};
	}, []);
	const seed = newestCommand([
		...machines.map((machine) => machine.last_command),
		local?.command,
	]);
	const recovering =
		local?.recover && String(seed?.id ?? '') === String(local.seedId ?? '');
	const target = recovering ? `device-${local.generation}` : seed?.id ?? 'none';
	const tracking =
		Boolean(deviceUid) &&
		(local?.recover || isCommandPending(seed) || Boolean(local?.command));
	const status = useQuery({
		queryKey: ['water-monitor', scope, 'motor-command', deviceUid, target],
		queryFn: ({ signal }) =>
			getWaterMotorStatus({
				commandId: recovering ? undefined : seed?.id,
				deviceUid,
				signal,
			}),
		enabled: Boolean(tracking) && !local?.submitting,
		refetchInterval: commandPollInterval,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
		retry: false,
	});
	const observed = status.isSuccess || status.data !== undefined;
	const command = observed ? status.data : seed;
	const awaitingFeedback = Boolean(
		operation &&
			command?.status === 'ACKED' &&
			String(command.id) === String(operation.commandId)
	);
	const pollingFeedback = operation?.commandId !== undefined;
	// Same query key as the page: observers share one authenticated request and
	// update cards/summary together. No new telemetry endpoint or parameters.
	const feedback = useQuery({
		queryKey: listKey,
		queryFn: ({ signal }) => getWaterMonitoringMachines({ signal }),
		enabled: pollingFeedback,
		refetchInterval: pollingFeedback ? 2000 : false,
		refetchIntervalInBackground: false,
		retry: false,
	});
	useEffect(() => {
		if (!operation || operation.commandId === undefined) {
			return;
		}
		if (Date.now() - operation.startedAt >= MOTOR_OPERATION_MAX_MS) {
			completeOperation(operation, operationMessages.unconfirmed, 'warning');
			return;
		}
		if (status.isError) {
			return;
		}
		if (!command) {
			return;
		}
		if (String(command.id) !== String(operation.commandId)) {
			completeOperation(
				operation,
				'Motor status could not be confirmed. Please check the equipment.',
				'warning'
			);
			return;
		}
		if (command.status === 'FAILED' || command.status === 'TIMED_OUT') {
			if (command.status === 'TIMED_OUT') {
				completeOperation(operation, operationMessages.unconfirmed, 'warning');
			} else {
				completeOperation(operation, operationMessages.commandFailed);
			}
			return;
		}
		if (!awaitingFeedback) {
			return;
		}
		const machine = (feedback.data?.machines ?? machines).find(
			(item) => String(item.slave_id) === String(operation.slaveId)
		);
		if (
			!feedback.isError &&
			feedbackConfirmsOperation(machine, operation, command)
		) {
			completeOperation(
				operation,
				operation.action === 1
					? 'Motor Started Successfully'
					: 'Motor Stopped Successfully',
				'success'
			);
			client.invalidateQueries({ queryKey: listKey });
		}
	}, [
		operation,
		command,
		status.isError,
		feedback.data,
		feedback.isError,
		machines,
	]);
	// A separate frontend deadline covers stalled submission and acknowledgment.
	useEffect(() => {
		if (!operation) {
			return;
		}
		const timer = setTimeout(
			() => {
				completeOperation(operation, operationMessages.unconfirmed, 'warning');
			},
			Math.max(0, operation.startedAt + MOTOR_OPERATION_MAX_MS - Date.now())
		);
		return () => clearTimeout(timer);
	}, [operation?.token]);
	useEffect(() => {
		if (!outcome) {
			return;
		}
		const timer = setTimeout(
			dismissDialog,
			outcome.severity === 'success'
				? MOTOR_SUCCESS_DISPLAY_MS
				: MOTOR_FAILURE_DISPLAY_MS
		);
		return () => clearTimeout(timer);
	}, [outcome]);
	function dismissDialog() {
		setOutcome(null);
		if (outcome?.severity === 'warning') {
			client.invalidateQueries({ queryKey: listKey });
		}
	}
	const resolution =
		tracking && observed && (command === null || isCommandTerminal(command))
			? `${target}:${command?.id ?? 'none'}:${command?.status ?? 'none'}`
			: '';
	useEffect(() => {
		if (local?.recover && observed && command) {
			setLocal({ command });
		}
	}, [local?.recover, observed, command]);
	useEffect(() => {
		if (!resolution || terminalRefresh.current === resolution) {
			return;
		}
		terminalRefresh.current = resolution;
		setError((message) =>
			message ===
			'Another motor command is already in progress for this device.'
				? ''
				: message
		);
		client.invalidateQueries({ queryKey: listKey }).then(() => {
			if (mounted.current) {
				setRefreshed(resolution);
			}
		});
	}, [resolution, client, listKey]);
	const locked = Boolean(
		operation ||
			local?.submitting ||
			local?.prohibited ||
			status.isError ||
			(tracking && !observed) ||
			isCommandPending(command) ||
			(resolution && refreshed !== resolution)
	);
	const mutation = useMutation({
		mutationFn: postWaterMotorCommand,
		retry: false,
	});
	async function submit(machine, action) {
		const currentState = waterMachineState(machine);
		if (
			activeOperation.current ||
			outcome ||
			![0, 1].includes(action) ||
			action !== (currentState.motor === 'Running' ? 0 : 1) ||
			posting.current ||
			motorControlReason(machine, currentState, {
				locked,
				failed,
			})
		) {
			return;
		}
		posting.current = true;
		const startedAt = Date.now();
		const started = {
			token: `${startedAt}:${machine.slave_id}`,
			action,
			slaveId: machine.slave_id,
			deviceUid,
			name:
				machine.motor_name ||
				machine.slave_name ||
				machine.name ||
				`Machine ${machine.slave_id}`,
			baselineTs: Date.parse(machine.latest_ts),
			startedAt,
		};
		updateOperation(started);
		setError('');
		setLocal({ submitting: true });
		try {
			const created = await mutation.mutateAsync({
				device_uid: deviceUid,
				motor_id: motorIdFor(machine),
				command: action,
			});
			if (!created) {
				throw new Error(
					'Command response did not include a command ID. Checking device status.'
				);
			}
			if (mounted.current) {
				setLocal({ command: created });
				if (activeOperation.current?.token === started.token) {
					updateOperation({ ...started, commandId: created.id });
				}
			}
		} catch (failure) {
			if (mounted.current) {
				completeOperation(
					started,
					failure?.status === 403
						? waterApiError(failure, operationFailureMessage(failure))
						: operationFailureMessage(failure)
				);
				setError(
					failure?.status === 409
						? 'Another motor command is already in progress for this device.'
						: waterApiError(
								failure,
								failure?.status === 502
									? 'MQTT publish failed. Checking recorded command.'
									: 'Unable to confirm submission. Checking device command status.'
						  )
				);
				// Also reconcile transport failures: the POST may have been recorded.
				setLocal(
					failure?.status === 403
						? { prohibited: true }
						: {
								recover: true,
								seedId: seed?.id ?? null,
								generation: Date.now(),
						  }
				);
			}
		} finally {
			posting.current = false;
		}
	}
	return {
		dialog: operation ?? outcome,
		dismissDialog,
		refreshStatus: () =>
			Promise.all([
				client.fetchQuery({
					queryKey: listKey,
					queryFn: ({ signal }) => getWaterMonitoringMachines({ signal }),
				}),
				...(tracking && !local?.submitting
					? [status.refetch({ cancelRefetch: false, throwOnError: true })]
					: []),
			]),
		command,
		locked,
		busy: Boolean(
			operation ||
				local?.submitting ||
				isCommandPending(command) ||
				(tracking && !observed)
		),
		blockedReason: local?.prohibited
			? 'Remote motor control was denied by the backend for this device.'
			: '',
		submit,
		error:
			error ||
			(status.isError
				? waterApiError(
						status.error,
						'Unable to check command status. Retrying...'
				  )
				: ''),
	};
}

function commandResponse(response) {
	if (response?.success === false) {
		throw new Error('Unable to read motor command.');
	}
	const payload =
		response && Object.hasOwn(response, 'data') ? response.data : response;
	// Accept a command object or an explicitly wrapped command. A null latest
	// command is a valid response when reconciling an uncertain submission.
	const command =
		payload &&
		Object.hasOwn(payload, 'command') &&
		typeof payload.command === 'object'
			? payload.command
			: payload;
	if (command === null) {
		return null;
	}
	if (
		!command ||
		command.id === undefined ||
		command.id === null ||
		!['PENDING', 'PUBLISHED', 'ACKED', 'TIMED_OUT', 'FAILED'].includes(
			command.status
		)
	) {
		throw new Error('Invalid motor command response.');
	}
	return command;
}

async function postWaterMotorCommand(body) {
	if (
		!body.device_uid ||
		!Number.isInteger(Number(body.motor_id)) ||
		Number(body.motor_id) < 1 ||
		![0, 1].includes(body.command)
	) {
		throw new Error('Device UID and a valid backend motor ID are required.');
	}
	return commandResponse(
		await api.post(API_URLS.WATER_MONITORING_MOTOR_CONTROL, body)
	);
}

export async function postWaterControlType({
	deviceUid,
	motorId,
	controlType,
}) {
	return commandResponse(
		await api.post(API_URLS.WATER_MONITORING_CONTROL_TYPE_CONTROL, {
			device_uid: deviceUid,
			motor_id: motorId,
			control_type: controlType,
		})
	);
}

async function getWaterMotorStatus({ commandId, deviceUid, signal }) {
	const params = new URLSearchParams(
		commandId !== undefined && commandId !== null
			? { command_id: commandId }
			: { device_uid: deviceUid }
	);
	let response;
	try {
		response = await api.get(
			`${API_URLS.WATER_MONITORING_MOTOR_STATUS}?${params}`,
			{ signal }
		);
	} catch (error) {
		// Actual Django status endpoint returns 404, not data:null, when a
		// device has no command history. Only treat this specific latest-device
		// result as empty; a missing tracked command or authorization error is not.
		if (
			commandId === undefined &&
			deviceUid &&
			error?.status === 404 &&
			error?.data?.message === 'Command not found'
		) {
			return null;
		}
		throw error;
	}
	const command = commandResponse(response);
	if (
		(commandId !== undefined &&
			commandId !== null &&
			String(command?.id) !== String(commandId)) ||
		(deviceUid && command?.device_uid && command.device_uid !== deviceUid)
	) {
		throw new Error(
			'Motor command status does not match the requested device or command.'
		);
	}
	return command;
}

const isCommandPending = (command) =>
	['PENDING', 'PUBLISHED'].includes(command?.status);

const isCommandTerminal = (command) =>
	['ACKED', 'TIMED_OUT', 'FAILED'].includes(command?.status);

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

function newestCommand(commands) {
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

function commandPollInterval(query) {
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
	if (state.connection === 'Offline' || machine.status !== 'ONLINE') {
		return 'Motor control is unavailable while the device is offline.';
	}
	if (machine.control_type === 1) {
		return 'Level Control is active. The motor starts and stops automatically based on the tank’s water level, so the On/Off switch is disabled.';
	}
	if (state.controlMode === 'Manual') {
		return 'This motor is in Manual mode. Remote ON/OFF control is disabled.';
	}
	if (
		state.controlMode === 'Auto' &&
		machine.remote_control_eligible === false
	) {
		return 'This motor can’t be switched on or off remotely right now.';
	}
	if (machine.remote_control_eligible !== true) {
		return 'Remote ON/OFF control is unavailable for this motor.';
	}
	if (unavailable) {
		return 'Motor control is unavailable.';
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
	if (
		state.motor === 'Unknown' ||
		(state.controlMode !== 'Auto' &&
			[state.mode, state.controlType].includes('Unknown'))
	) {
		return 'Current motor telemetry is incomplete.';
	}
	if (failed) {
		return 'Refresh machine information before issuing a command.';
	}
	return '';
}
