import { useEffect, useRef, useState } from 'react';

import { commandBlock, commandOutcome } from './dashboardModel';
import { errorMessage } from './dashboardService';

export default function useMotorCommands({
	service,
	branchId,
	records,
	staleAfter,
	pathsReady,
	onNotice,
	onRefresh,
}) {
	const [commands, setCommands] = useState({});
	const active = useRef({}),
		latest = useRef({ records, pathsReady });
	latest.current = { records, pathsReady };
	const scope = useRef(branchId);
	scope.current = branchId;
	useEffect(() => {
		active.current = {};
		setCommands({});
	}, [branchId, service]);
	const update = (key, value) => {
		active.current = { ...active.current, [key]: value };
		setCommands(active.current);
	};
	const check = async (key) => {
		const command = active.current[key];
		if (
			!command?.id ||
			command.checking ||
			command.phase === 'confirmed' ||
			['failed', 'rejected', 'cancelled'].includes(command.phase)
		) {
			return;
		}
		const branch = branchId;
		update(key, { ...command, checking: true });
		try {
			const status = await service.getMotorCommandStatus(command.id, branch);
			if (scope.current !== branch) {
				return;
			}
			const outcome = commandOutcome(
				command,
				status,
				latest.current.records[key],
				{ preview: service.preview, staleAfter }
			);
			if (outcome) {
				update(key, {
					...command,
					phase: outcome,
					checking: false,
					message:
						outcome === 'confirmed'
							? 'Actual motor feedback confirmed the requested state.'
							: 'The backend resolved this command without success.',
				});
				onNotice(
					outcome === 'confirmed'
						? 'Motor feedback confirmed.'
						: `Motor command ${outcome}.`,
					outcome === 'confirmed' ? 'success' : 'warning'
				);
				onRefresh();
			} else {
				const expired = Date.now() - command.startedAt > 30000;
				update(key, {
					...command,
					phase: expired
						? 'unknown'
						: status.status === 'acknowledged'
						  ? 'acknowledged'
						  : 'pending',
					checking: false,
					message: expired
						? 'Outcome unknown. Additional commands remain blocked; check server status.'
						: status.status === 'acknowledged'
						  ? 'Gateway acknowledged; waiting for physical motor feedback.'
						  : 'Awaiting independent motor feedback.',
				});
				onRefresh();
			}
		} catch (error) {
			if (scope.current !== branch) {
				return;
			}
			update(key, {
				...command,
				phase: 'unknown',
				checking: false,
				message: errorMessage(error),
			});
		}
	};
	useEffect(() => {
		const timer = setInterval(() => {
			Object.keys(active.current).forEach((key) => {
				if (
					!['unknown', 'confirmed', 'failed', 'rejected', 'cancelled'].includes(
						active.current[key].phase
					)
				) {
					check(key);
				}
			});
		}, 2000);
		return () => clearInterval(timer);
	}, [branchId, service]);
	const request = async (assetId, action) => {
		const key = String(assetId),
			prior = active.current[key],
			pending =
				prior &&
				!['confirmed', 'failed', 'rejected', 'cancelled'].includes(prior.phase);
		const block = commandBlock(latest.current.records[key], {
			preview: service.preview,
			pending,
			pathsReady: latest.current.pathsReady,
			staleAfter,
			action,
		});
		if (block) {
			throw new Error(block);
		}
		const branch = branchId,
			startedAt = Date.now();
		update(key, {
			phase: 'sending',
			action,
			startedAt,
			message: 'Sending authenticated request. Motor feedback is unchanged.',
		});
		try {
			const response = await service.requestMotorCommand(
				assetId,
				action,
				branch
			);
			if (scope.current !== branch) {
				return;
			}
			update(key, {
				id: response.command_id,
				phase: 'pending',
				action,
				startedAt,
				message: 'Command accepted; physical state has not been confirmed.',
			});
			onRefresh();
		} catch (error) {
			if (scope.current !== branch) {
				return;
			}
			update(key, {
				phase: 'unknown',
				action,
				startedAt,
				message: `Outcome unknown. ${errorMessage(
					error
				)} Reconcile server/device status before further operation.`,
			});
			throw error;
		}
	};
	const unresolved = Object.fromEntries(
		Object.entries(commands).filter(
			([, value]) =>
				!['confirmed', 'failed', 'rejected', 'cancelled'].includes(value.phase)
		)
	);
	return { commands, unresolved, request, check };
}
