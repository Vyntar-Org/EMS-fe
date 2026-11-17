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
	MOTOR_FEEDBACK_CONFIRM_MS,
	MOTOR_OPERATION_MAX_MS,
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
	notify,
}) {
	const client = useQueryClient();
	const [local, setLocal] = useState(null);
	const [error, setError] = useState('');
	const [refreshed, setRefreshed] = useState('');
	const [operation, setOperation] = useState(null);
	const activeOperation = useRef(null);
	const notices = useRef(notify);
	notices.current = notify;
	const toastId = `oht-motor:${scope}:${deviceUid}`;
	function updateOperation(next) {
		activeOperation.current = next;
		setOperation(next);
	}
	function completeOperation(current, message, severity) {
		if (!mounted.current || activeOperation.current?.token !== current.token) {
			return;
		}
		updateOperation(null);
		notices.current?.showToast(
			severity === 'success'
				? `${current.name} motor ${message}`
				: `${current.name} motor: ${message}`,
			severity,
			{
				id: toastId,
				duration: 4000,
			}
		);
	}
	const posting = useRef(false);
	const mounted = useRef(true);
	const terminalRefresh = useRef('');
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			if (activeOperation.current) {
				notices.current?.dismissToast(toastId);
			}
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
	// Same query key as the page: observers share one authenticated request and
	// update cards/summary together. No new telemetry endpoint or parameters.
	const feedback = useQuery({
		queryKey: listKey,
		queryFn: ({ signal }) => getWaterMachines({ signal }),
		enabled: awaitingFeedback,
		refetchInterval: awaitingFeedback ? 2000 : false,
		refetchIntervalInBackground: false,
		retry: false,
	});
	useEffect(() => {
		if (!operation || operation.commandId === undefined) {
			return;
		}
		if (status.isError) {
			completeOperation(operation, operationMessages.unconfirmed, 'warning');
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
			completeOperation(
				operation,
				command.status === 'TIMED_OUT'
					? operationMessages.timedOut
					: operationMessages.deliveryFailed,
				'error'
			);
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
					? 'turned ON successfully.'
					: 'turned OFF successfully.',
				'success'
			);
			client.invalidateQueries({ queryKey: listKey });
		} else if (!operation.acknowledgedAt) {
			updateOperation({ ...operation, acknowledgedAt: Date.now() });
		}
	}, [
		operation,
		command,
		status.isError,
		feedback.data,
		feedback.isError,
		machines,
	]);
	useEffect(() => {
		if (!awaitingFeedback || !operation?.acknowledgedAt) {
			return;
		}
		const timer = setTimeout(
			() =>
				completeOperation(operation, operationMessages.unconfirmed, 'warning'),
			Math.max(
				0,
				operation.acknowledgedAt + MOTOR_FEEDBACK_CONFIRM_MS - Date.now()
			)
		);
		return () => clearTimeout(timer);
	}, [awaitingFeedback, operation?.token, operation?.acknowledgedAt]);
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
			![0, 1].includes(action) ||
			action !== (currentState.motor === 'Running' ? 0 : 1) ||
			posting.current ||
			motorControlReason(machine, waterMachineState(machine), {
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
		notices.current?.showToast(
			action === 1
				? `Starting ${started.name} motor... Please wait.`
				: `Stopping ${started.name} motor... Please wait.`,
			'info',
			{ id: toastId, loading: true }
		);
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
					operationFailureMessage(failure?.status),
					failure?.status === 409 ? 'warning' : 'error'
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
