import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { waterMachineState } from '../../helpers/oht';

import {
	COMMAND_TIMEOUT_MS,
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
	deferListRefresh,
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
	const watchedOperation = operation ?? outcome;
	const trackedId = watchedOperation?.commandId ?? seed?.id;
	const target = recovering
		? `device-${local.generation}`
		: trackedId ?? 'none';
	const tracking =
		Boolean(deviceUid) &&
		(local?.recover || isCommandPending(seed) || Boolean(local?.command));
	const status = useQuery({
		queryKey: ['water-monitor', scope, 'motor-command', deviceUid, target],
		queryFn: ({ signal }) =>
			getWaterMotorStatus({
				commandId: recovering ? undefined : trackedId,
				deviceUid,
				signal,
			}),
		enabled: Boolean(tracking) && !local?.submitting,
		refetchInterval: commandPollInterval,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: (query) => !isCommandTerminal(query.state.data),
		refetchOnMount: (query) => !isCommandTerminal(query.state.data),
		retry: false,
	});
	const observed = status.isSuccess || status.data !== undefined;
	const command = observed
		? status.data
		: operation?.commandId !== undefined
		  ? local?.command
		  : seed;
	useEffect(() => {
		if (!operation || operation.commandId === undefined) {
			return;
		}
		if (performance.now() >= operation.deadline) {
			completeOperation(operation, operationMessages.unconfirmed, 'warning');
			return;
		}
		const command = status.data;
		if (!matchesCommandId(command, operation.commandId)) {
			return;
		}
		if (command.status === 'ACKED') {
			completeOperation(operation, '', 'success');
		} else if (command.status === 'FAILED') {
			completeOperation(operation, operationMessages.requestFailed);
		} else if (command.status === 'TIMED_OUT') {
			completeOperation(
				operation,
				'The controller did not acknowledge your motor command before the backend timed out. Please check the latest motor status before trying again.',
				'warning'
			);
		}
	}, [operation, status.data]);
	// A separate frontend deadline covers stalled submission and acknowledgment.
	useEffect(() => {
		if (!operation) {
			return;
		}
		const timer = setTimeout(
			() =>
				completeOperation(operation, operationMessages.unconfirmed, 'warning'),
			Math.max(0, operation.deadline - performance.now())
		);
		return () => clearTimeout(timer);
	}, [operation?.token]);
	function dismissDialog() {
		setOutcome(null);
		if (outcome?.severity === 'success') {
			// The Machine List now owns the refresh and the card's loading state.
			terminalRefresh.current = resolution;
			setRefreshed(resolution);
			return;
		}
		refreshMachineList(resolution);
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
		if (
			!resolution ||
			terminalRefresh.current === resolution ||
			operation ||
			outcome ||
			deferListRefresh
		) {
			return;
		}
		refreshMachineList(resolution, false);
	}, [
		resolution,
		client,
		listKey,
		operation,
		outcome,
		deferListRefresh,
		status.dataUpdatedAt,
	]);

	function refreshMachineList(resolvedCommand, force = true) {
		if (resolvedCommand) {
			terminalRefresh.current = resolvedCommand;
			setError((message) =>
				message ===
				'Another motor command is already in progress for this device.'
					? ''
					: message
			);
		}
		// The Control Type OK handler may already have refreshed this list.
		if (
			!force &&
			client.getQueryState(listKey)?.dataUpdatedAt > status.dataUpdatedAt
		) {
			setRefreshed(resolvedCommand);
			return;
		}
		client
			.refetchQueries(
				{ queryKey: listKey, exact: true, type: 'active' },
				{ cancelRefetch: false }
			)
			.then(() => {
				if (mounted.current && resolvedCommand) {
					setRefreshed(resolvedCommand);
				}
			});
	}
	const locked = Boolean(
		operation ||
			outcome ||
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
			deadline: performance.now() + COMMAND_TIMEOUT_MS,
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
				if (performance.now() >= started.deadline) {
					completeOperation(started, operationMessages.unconfirmed, 'warning');
				} else {
					completeOperation(started, operationFailureMessage(failure));
				}
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

function matchesCommandId(command, commandId) {
	const id = command?.id ?? command?.command_id;
	return (
		id !== undefined &&
		id !== null &&
		commandId !== undefined &&
		commandId !== null &&
		String(id) === String(commandId)
	);
}

function commandResponse(response, { submission = false } = {}) {
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
	const id = command?.id ?? command?.command_id;
	if (
		!command ||
		id === undefined ||
		id === null ||
		(!(submission && command.status === undefined) &&
			![
				'PENDING',
				'PROCESSING',
				'PUBLISHED',
				'SENT',
				'ACKED',
				'TIMED_OUT',
				'FAILED',
			].includes(command.status))
	) {
		throw new Error('Invalid motor command response.');
	}
	return { ...command, id };
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
		await api.post(API_URLS.WATER_MONITORING_MOTOR_CONTROL, body),
		{ submission: true }
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
		}),
		{ submission: true }
	);
}

export async function getWaterMotorStatus({ commandId, deviceUid, signal }) {
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
	['PENDING', 'PROCESSING', 'PUBLISHED', 'SENT'].includes(command?.status);

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

export function commandPollInterval(query) {
	// Network failures do not resolve a command and never trigger a POST retry.
	if (
		isCommandTerminal(query.state.data) ||
		[403, 404].includes(query.state.error?.status)
	) {
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
