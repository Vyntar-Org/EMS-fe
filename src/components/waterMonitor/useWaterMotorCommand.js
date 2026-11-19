import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
	commandPollInterval,
	isCommandPending,
	isCommandTerminal,
	motorControlReason,
	motorIdFor,
	newestCommand,
	waterApiError,
} from './motorCommandState';
import {
	feedbackConfirmsOperation,
	MOTOR_FAILURE_DISPLAY_MS,
	MOTOR_OPERATION_MAX_MS,
	MOTOR_SUCCESS_DISPLAY_MS,
	operationFailureMessage,
	operationMessages,
} from './motorOperation';
import { waterMachineState } from './waterMachinePresentation';
import {
	getWaterMotorStatus,
	postWaterMotorCommand,
	getWaterMachines,
} from './waterMonitorApi';

// One instance per device, shared by all of its slave cards (including hidden
// search results). Query owns polling, cancellation and request deduplication.
export default function useWaterMotorCommand({
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
		queryFn: ({ signal }) => getWaterMachines({ signal }),
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
				completeOperation(started, operationFailureMessage(failure));
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
					queryFn: ({ signal }) => getWaterMachines({ signal }),
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
