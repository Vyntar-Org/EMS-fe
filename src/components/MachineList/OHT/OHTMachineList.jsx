import {
	DownloadForOffline,
	RefreshRounded,
	ScheduleRounded,
	SearchRounded,
} from '@mui/icons-material';
import {
	Box,
	Button,
	Alert,
	CircularProgress,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';
import { formatTimestamp } from '../../../helpers/common';
import { exportToCSV } from '../../../helpers/exports';
import {
	getWaterMonitoringMachines,
	matchesWaterMachine,
	numericReading,
	waterMachineState,
	waterMachineTitle,
} from '../../../helpers/oht';
import PremiumModal from '../../common/PremiumModal';
import {
	commandErrorMessage,
	COMMAND_TIMEOUT_MS,
	INLINE_CONTROL_LOADING_MS,
} from '../../OHT/motorOperation';
import { useWaterMonitoringMotorOperations } from '../../OHT/OHTMotorOperations';
import {
	commandPollInterval,
	motorControlReason,
	motorIdFor,
	postWaterControlType,
	observeWaterCommand,
	waterCommandFailure,
	waterApiError,
} from '../../OHT/useOHTMotorCommand';
import OHTMachineListSkeleton from '../../skeletonLoaders/OHTMachineListSkeleton';

import {
	MachineListSurface,
	WaterMonitoringMachineGrid,
} from './machineListStyles';
import MotorOperationDialog from './MotorOperationDialog';
import OHTMachineCard from './OHTMachineCard';
import OHTMachineTrend from './OHTMachineTrend';

const controlTypeUnconfirmed =
	'The final control type change result could not be confirmed within 60 seconds. Please check the current control setting.';

const MOTOR_FEEDBACK_PENDING = { loading: true };

const inlineControlKey = (deviceUid, slaveId, kind) =>
	JSON.stringify([deviceUid, String(slaveId), kind]);

const reportColumns = [
	{ accessorKey: 'deviceUid', header: 'Device UID' },
	{ accessorKey: 'slaveId', header: 'Slave ID' },
	{ accessorKey: 'name', header: 'Device Name' },
	{ accessorKey: 'status', header: 'Status' },
	{ accessorKey: 'tankLevel', header: 'Tank Level (%)' },
	{ accessorKey: 'today', header: 'Today Consumption (m?)' },
	{ accessorKey: 'mtd', header: 'MTD (m?)' },
	{ accessorKey: 'flow', header: 'Rate of Flow (m?/hr)' },
	{ accessorKey: 'totalizer', header: 'Totalizer (m?)' },
	{ accessorKey: 'timestamp', header: 'Latest Timestamp' },
];

function downloadReport(machines) {
	const rows = machines.map((machine) => ({
		deviceUid: machine.device_uid || 'N/A',
		slaveId: machine.slave_id,
		name: waterMachineTitle(machine),
		status: waterMachineState(machine).connection,
		tankLevel: numericReading(machine.latest?.TankLevel) ?? 'N/A',
		today: numericReading(machine.summary?.today?.value) ?? 'N/A',
		mtd: numericReading(machine.summary?.mtd?.value) ?? 'N/A',
		flow: numericReading(machine.latest?.flowrate) ?? 'N/A',
		totalizer: numericReading(machine.latest?.totalizer) ?? 'N/A',
		timestamp:
			(machine.latest_ts && formatTimestamp(machine.latest_ts)) || 'N/A',
	}));
	exportToCSV(rows, reportColumns, 'OHT_machine_list', {
		escapeFormulae: true,
		formatNumbers: false,
	});
}

export default function OHTMachineList() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const scope = String(
		user?.id ?? user?.username ?? user?.email ?? 'authenticated'
	);
	const listKey = ['water-monitor', scope, 'machine-list-live'];
	const [search, setSearch] = useState('');
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);
	const [trendMachine, setTrendMachine] = useState(null);
	const [confirmation, setConfirmation] = useState(null);
	const [controlTypeConfirmation, setControlTypeConfirmation] = useState(null);
	const [controlTypeOperation, setControlTypeOperation] = useState(null);
	const [controlTypeOutcome, setControlTypeOutcome] = useState(null);
	const expiredControlTypeDeadline = useRef(null);
	const dashboard = useQuery({
		queryKey: listKey,
		queryFn: ({ signal }) => getWaterMonitoringMachines({ signal, live: true }),
		retry: false,
		refetchOnWindowFocus: true,
		refetchInterval: 60_000,
		refetchIntervalInBackground: false,
	});
	const [inlineControls, setInlineControls] = useState({});
	const inlineTimers = useRef(new Map());
	useEffect(() => {
		const timers = inlineTimers.current;
		return () => {
			for (const { timer } of timers.values()) {
				clearTimeout(timer);
			}
			timers.clear();
		};
	}, []);

	function startInlineLoading(outcome, kind) {
		if (outcome?.severity !== 'success') {
			return;
		}
		const key = inlineControlKey(outcome.deviceUid, outcome.slaveId, kind);
		const timers = inlineTimers.current;
		const existing = timers.get(key);
		if (existing?.commandId === outcome.commandId) {
			return;
		}
		clearTimeout(existing?.timer);
		setInlineControls((current) => ({
			...current,
			[key]: {
				commandId: outcome.commandId,
				action: outcome.action,
				loading: true,
			},
		}));
		const timer = setTimeout(async () => {
			setInlineControls((current) => ({
				...current,
				[key]: { ...current[key], loading: false },
			}));
			await dashboard.refetch();
			if (timers.get(key)?.timer !== timer) {
				return;
			}
			timers.delete(key);
			setInlineControls((current) => {
				const next = { ...current };
				delete next[key];
				return next;
			});
		}, INLINE_CONTROL_LOADING_MS);
		timers.set(key, { timer, commandId: outcome.commandId });
	}

	function inlineControlFor(machine, kind) {
		const { device_uid: deviceUid, slave_id: slaveId } = machine;
		const inline = inlineControls[inlineControlKey(deviceUid, slaveId, kind)];
		if (!inline) {
			return undefined;
		}
		const statusCommand =
			kind === 'motor' ? controls[deviceUid]?.command : null;
		const failure = waterCommandFailure(
			{ ...inline, deviceUid, slaveId },
			statusCommand,
			[machine]
		);
		return failure ? undefined : inline;
	}

	const { register, controls } = useWaterMonitoringMotorOperations();
	const controlTypeChange = useMutation({
		mutationFn: ({ machine, controlType }) => {
			const current = queryClient
				.getQueryData(listKey)
				?.machines?.find(
					(candidate) =>
						candidate.device_uid === machine.device_uid &&
						candidate.slave_id === machine.slave_id
				);
			if (!current || waterMachineState(current).connection !== 'Online') {
				throw new Error('Control type changes require an online device.');
			}
			return postWaterControlType({
				deviceUid: machine.device_uid,
				motorId: motorIdFor(machine),
				controlType,
			});
		},
		retry: false,
	});
	const watchedControlType = controlTypeOperation ?? controlTypeOutcome;
	const controlTypeStatus = useQuery({
		queryKey: [
			'water-monitor',
			scope,
			'control-type-command',
			watchedControlType?.deviceUid,
			watchedControlType?.commandId,
		],
		queryFn: ({ queryKey, signal }) =>
			observeWaterCommand({
				client: queryClient,
				listKey,
				queryKey,
				commandId: watchedControlType.commandId,
				deviceUid: watchedControlType.deviceUid,
				operation: watchedControlType,
				signal,
			}),
		enabled: watchedControlType?.commandId !== undefined,
		refetchInterval: (query) => commandPollInterval(query, watchedControlType),
		refetchIntervalInBackground: false,
		retry: false,
	});
	const controlTypeCommand = controlTypeStatus.data;
	const controlTypePending = Boolean(controlTypeOperation);

	function motorUpdateFor(machine) {
		const motorInline = inlineControlFor(machine, 'motor');
		const controlTypeInline = inlineControlFor(machine, 'control-type');
		const switchingToUserControl =
			controlTypeOperation?.action === 0 &&
			!controlTypeOperation.foregroundExpired &&
			controlTypeOperation.deviceUid === machine.device_uid &&
			controlTypeOperation.slaveId === machine.slave_id;

		if (switchingToUserControl) {
			return MOTOR_FEEDBACK_PENDING;
		}
		return (
			motorInline ??
			(controlTypeInline?.action === 0 ? controlTypeInline : undefined)
		);
	}

	function finishControlType(operation, outcome) {
		setControlTypeOperation(null);
		if (
			!operation.foregroundExpired &&
			performance.now() < operation.deadline
		) {
			setControlTypeOutcome({ ...operation, ...outcome });
		} else if (!operation.foregroundExpired) {
			setControlTypeOutcome({
				...operation,
				severity: 'warning',
				message: controlTypeUnconfirmed,
			});
		}
	}

	const controlTypeFailure = waterCommandFailure(
		watchedControlType,
		controlTypeCommand,
		dashboard.data?.machines
	);
	const failedControlType = controlTypeFailure && {
		...watchedControlType,
		severity: 'error',
		message:
			'The controller could not process your control type change request.',
		reason:
			commandErrorMessage(controlTypeFailure) ||
			controlTypeOutcome?.reason ||
			'',
	};
	const controlTypeResult =
		controlTypeOutcome?.severity === 'success' && failedControlType
			? failedControlType
			: controlTypeOutcome;
	useEffect(() => {
		if (
			controlTypeFailure &&
			!commandErrorMessage(controlTypeFailure) &&
			controlTypeCommand?.status !== 'FAILED'
		) {
			controlTypeStatus.refetch({ cancelRefetch: false });
		}
		if (
			controlTypeOutcome &&
			failedControlType &&
			(controlTypeOutcome.severity === 'success' ||
				(controlTypeOutcome.severity === 'error' &&
					controlTypeOutcome.reason !== failedControlType.reason))
		) {
			setControlTypeOutcome(failedControlType);
		}
		if (!controlTypeOperation) {
			return;
		}
		const operation = controlTypeOperation;
		if (failedControlType) {
			finishControlType(operation, failedControlType);
			return;
		}
		if (
			!controlTypeCommand ||
			String(controlTypeCommand.id) !== String(operation.commandId)
		) {
			return;
		}
		if (controlTypeCommand.status === 'TIMED_OUT') {
			finishControlType(operation, {
				severity: 'warning',
				message:
					'The controller did not acknowledge your control type change before the backend timed out. Please check the current control setting before trying again.',
			});
		} else if (controlTypeCommand.status === 'ACKED') {
			if (operation.foregroundExpired) {
				setControlTypeOperation(null);
			} else if (controlTypeCommand.acknowledgmentVerified) {
				finishControlType(operation, { severity: 'success' });
			}
		}
	}, [
		controlTypeOperation,
		controlTypeOutcome,
		controlTypeCommand,
		controlTypeFailure,
		failedControlType?.reason,
	]);

	useEffect(() => {
		if (!controlTypeOperation) {
			return;
		}
		const timer = setTimeout(
			() => {
				expiredControlTypeDeadline.current = controlTypeOperation.deadline;
				setControlTypeOutcome({
					...controlTypeOperation,
					severity: 'warning',
					message: controlTypeUnconfirmed,
				});
				setControlTypeOperation(
					(current) => current && { ...current, foregroundExpired: true }
				);
			},
			Math.max(0, controlTypeOperation.deadline - performance.now())
		);
		return () => clearTimeout(timer);
	}, [controlTypeOperation?.deadline]);

	function dismissControlTypeOutcome() {
		startInlineLoading(controlTypeResult, 'control-type');
		setControlTypeOutcome(null);
		dashboard.refetch();
	}

	async function submitControlType(machine, confirmation) {
		const operation = {
			...confirmation,
			deadline: performance.now() + COMMAND_TIMEOUT_MS,
		};
		setControlTypeConfirmation(null);
		setControlTypeOperation(operation);
		try {
			const command = await controlTypeChange.mutateAsync({
				machine,
				controlType: operation.action,
			});
			if (!command) {
				throw new Error('The control type response did not include a command.');
			}
			setControlTypeOperation(
				(current) => current && { ...current, commandId: command.id }
			);
		} catch (error) {
			setControlTypeOperation(null);
			if (performance.now() < operation.deadline) {
				setControlTypeOutcome({
					...operation,
					severity: 'error',
					message:
						'The controller could not process your control type change request.',
					reason: waterApiError(error, '').trim(),
				});
			} else if (expiredControlTypeDeadline.current !== operation.deadline) {
				setControlTypeOutcome({
					...operation,
					severity: 'warning',
					message: controlTypeUnconfirmed,
				});
			}
		}
	}
	function canChangeControlType(machine, controlType) {
		if (!machine) {
			return false;
		}
		const control = controls[machine.device_uid];
		return !(
			waterMachineState(machine).connection !== 'Online' ||
			machine.operation_mode !== 1 ||
			machine.control_type_switchable !== true ||
			![0, 1].includes(controlType) ||
			controlType === machine.control_type ||
			inlineControlFor(machine, 'control-type') ||
			!machine.device_uid ||
			motorIdFor(machine) === null ||
			dashboard.isError ||
			controlTypePending ||
			controlTypeOutcome ||
			confirmation ||
			control?.locked ||
			control?.blockedReason
		);
	}
	const pendingDialog = Object.values(controls).find(
		(control) => control.dialog
	);
	const operationToken = pendingDialog?.dialog.token;
	useEffect(() => {
		if (operationToken) {
			setConfirmation(null);
		}
	}, [operationToken]);
	const controlTypeDevice = (controlTypeOperation ?? controlTypeOutcome)
		?.deviceUid;
	useEffect(() => {
		const entries = {};
		for (const machine of dashboard.data?.machines ?? []) {
			if (!machine.device_uid) {
				continue;
			}
			const uid = machine.device_uid;
			entries[uid] ??= {
				deviceUid: uid,
				machines: [],
				scope,
				listKey: ['water-monitor', scope, 'machine-list-live'],
				failed: dashboard.isError,
				deferListRefresh: uid === controlTypeDevice,
			};
			entries[uid].machines.push(machine);
		}
		register(entries);
	}, [register, scope, dashboard.data, dashboard.isError, controlTypeDevice]);
	const allMachines = dashboard.data?.machines ?? [];
	const controlTypeTarget =
		controlTypeConfirmation &&
		allMachines.find(
			(machine) =>
				machine.device_uid === controlTypeConfirmation.deviceUid &&
				machine.slave_id === controlTypeConfirmation.slaveId
		);
	const canConfirmControlType = canChangeControlType(
		controlTypeTarget,
		controlTypeConfirmation?.action
	);
	const target =
		confirmation &&
		allMachines.find(
			(machine) =>
				machine.slave_id === confirmation.slaveId &&
				machine.device_uid === confirmation.deviceUid
		);
	const targetControl = target && controls[target.device_uid];
	let confirmationReason = '';
	if (confirmation) {
		if (!target || !targetControl) {
			confirmationReason = 'Motor control is unavailable.';
		} else {
			const state = waterMachineState(target, { now });
			confirmationReason = motorControlReason(target, state, {
				locked:
					targetControl.locked ||
					controlTypePending ||
					Boolean(motorUpdateFor(target)),
				failed: dashboard.isError,
				blockedReason: targetControl.blockedReason,
			});
			if (
				!confirmationReason &&
				confirmation.action !== (state.motor === 'Running' ? 0 : 1)
			) {
				confirmationReason =
					'Motor status changed. Review its current status before trying again.';
			}
		}
	}
	const machines = allMachines.filter((machine) =>
		matchesWaterMachine(machine, search)
	);
	return (
		<MachineListSurface>
			<Box sx={{ pb: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
				<Box
					sx={{
						display: 'grid',
						alignItems: 'center',
						columnGap: 1.5,
						rowGap: 0.5,
						gridTemplateColumns: {
							xs: 'minmax(0, 1fr) auto',
							sm: 'minmax(0, 300px) minmax(0, 1fr) auto',
						},
						gridTemplateAreas: {
							xs: '"search actions" "updated updated"',
							sm: '"search updated actions"',
						},
					}}
				>
					<Box sx={{ gridArea: 'search', minWidth: 0 }}>
						<TextField
							fullWidth
							size="small"
							placeholder="Search Device"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							inputProps={{ 'aria-label': 'Search Device' }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchRounded fontSize="small" />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									height: 40,
									borderRadius: 2,
									color: 'text.primary',
									backgroundColor: 'surface.muted',
									transition: '0.3s',
									'&:hover': { backgroundColor: 'background.paper' },
								},
								'& input::placeholder': { color: 'text.secondary', opacity: 1 },
							}}
						/>
					</Box>
					<Stack
						direction="row"
						alignItems="center"
						spacing={1}
						sx={{
							gridArea: 'updated',
							width: 'fit-content',
							maxWidth: '100%',
							minHeight: 44,
							pl: 1,
							pr: 0.5,
							py: 0.375,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: 999,
							bgcolor: 'background.paper',
							boxShadow: 1,
						}}
					>
						<ScheduleRounded
							fontSize="small"
							color="primary"
							aria-hidden="true"
						/>
						<Typography
							variant="caption"
							fontWeight={600}
							lineHeight={1.3}
							sx={{ minWidth: 0, fontVariantNumeric: 'tabular-nums' }}
						>
							<Box component="span" fontWeight={800} mr={0.75}>
								Last Updated:
							</Box>
							{dashboard.dataUpdatedAt ? (
								<time
									dateTime={new Date(dashboard.dataUpdatedAt).toISOString()}
								>
									{formatTimestamp(dashboard.dataUpdatedAt)}
								</time>
							) : (
								'?'
							)}
						</Typography>
						<Box
							sx={{
								flexShrink: 0,
								borderInlineStart: '1px solid',
								borderColor: 'divider',
								pl: 1,
							}}
						>
							<Tooltip title="Refresh machines">
								<span>
									<IconButton
										aria-label="Refresh machines"
										disabled={dashboard.isFetching}
										onClick={() => dashboard.refetch({ cancelRefetch: false })}
										sx={{
											width: 36,
											height: 36,
											color: 'primary.contrastText',
											bgcolor: 'primary.main',
											'&:hover': { bgcolor: 'primary.dark' },
											'&.Mui-disabled': {
												color: 'primary.contrastText',
												bgcolor: 'primary.main',
											},
										}}
									>
										{dashboard.isFetching ? (
											<CircularProgress
												size={19}
												color="inherit"
												aria-label="Refreshing machines"
											/>
										) : (
											<RefreshRounded />
										)}
									</IconButton>
								</span>
							</Tooltip>
						</Box>
					</Stack>
					<Stack
						direction="row"
						spacing={0.75}
						alignItems="center"
						sx={{ gridArea: 'actions' }}
					>
						<Tooltip title="Download Report">
							<span>
								<IconButton
									aria-label="Download Report"
									size="large"
									color="primary"
									disabled={
										dashboard.isPending || dashboard.isError || !machines.length
									}
									onClick={() => downloadReport(machines)}
									sx={{ width: 36, height: 36 }}
								>
									<DownloadForOffline sx={{ width: 36, height: 36 }} />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				</Box>
			</Box>
			<Box sx={{ minHeight: 0, flex: 1, overflow: 'auto', pt: 1 }}>
				{!dashboard.isPending && !dashboard.isError && !machines.length && (
					<Box data-water-ui="empty-state">
						<Typography>
							{allMachines.length
								? 'No matching units. Try a different name, device or location.'
								: 'No machines available.'}
						</Typography>
						{search && (
							<Button onClick={() => setSearch('')}>Clear filters</Button>
						)}
					</Box>
				)}
				{dashboard.isError && (
					<Alert
						severity="error"
						action={<Button onClick={() => dashboard.refetch()}>Retry</Button>}
					>
						{waterApiError(dashboard.error, 'Unable to load machines.')}
					</Alert>
				)}
				{dashboard.isPending && dashboard.isFetching ? (
					<OHTMachineListSkeleton />
				) : (
					<WaterMonitoringMachineGrid>
						{machines.map((machine) => (
							<OHTMachineCard
								key={JSON.stringify([scope, machine.slave_id])}
								machine={machine}
								scope={scope}
								now={now}
								failed={dashboard.isError}
								commandControl={controls[machine.device_uid]}
								motorInline={motorUpdateFor(machine)}
								controlTypeInline={inlineControlFor(machine, 'control-type')}
								controlTypePending={controlTypePending}
								controlTypeBlocked={
									Boolean(confirmation) || motorIdFor(machine) === null
								}
								onControlTypeChange={(targetMachine, controlType) => {
									if (canChangeControlType(targetMachine, controlType)) {
										controlTypeChange.reset();
										setControlTypeConfirmation({
											deviceUid: targetMachine.device_uid,
											slaveId: targetMachine.slave_id,
											name: waterMachineTitle(targetMachine),
											action: controlType,
										});
									}
								}}
								trendEnabled
								onTrend={() => setTrendMachine(machine)}
								onMotorRequest={(targetMachine, action) =>
									setConfirmation({
										action,
										slaveId: targetMachine.slave_id,
										deviceUid: targetMachine.device_uid,
										name:
											targetMachine.motor_name ||
											targetMachine.slave_name ||
											targetMachine.name ||
											`Machine ${targetMachine.slave_id}`,
									})
								}
							/>
						))}
					</WaterMonitoringMachineGrid>
				)}
			</Box>
			<PremiumModal
				open={Boolean(trendMachine)}
				onClose={() => setTrendMachine(null)}
				title={trendMachine ? `${waterMachineTitle(trendMachine)} - Trend` : ''}
				confirmText={null}
				cancelText={null}
				type="chart"
			>
				{trendMachine && (
					<OHTMachineTrend
						key={scope + trendMachine.slave_id}
						machine={trendMachine}
						scope={scope}
					/>
				)}
			</PremiumModal>
			{(pendingDialog || confirmation) && (
				<MotorOperationDialog
					operation={pendingDialog?.dialog}
					confirmation={confirmation}
					confirmationReason={confirmationReason}
					onConfirm={() => {
						if (!confirmationReason) {
							targetControl.submit(target, confirmation.action);
						}
					}}
					onClose={() => {
						if (pendingDialog) {
							startInlineLoading(pendingDialog.dialog, 'motor');
							pendingDialog.dismissDialog();
						} else {
							setConfirmation(null);
						}
					}}
				/>
			)}
			{(controlTypeConfirmation ||
				controlTypeOutcome ||
				(controlTypeOperation && !controlTypeOperation.foregroundExpired)) &&
				!pendingDialog && (
					<MotorOperationDialog
						controlType
						confirmation={controlTypeConfirmation}
						operation={controlTypeResult ?? controlTypeOperation}
						confirmationReason={
							canConfirmControlType
								? ''
								: 'You can’t change the control type right now.'
						}
						onConfirm={() => {
							if (
								canChangeControlType(
									controlTypeTarget,
									controlTypeConfirmation.action
								)
							) {
								submitControlType(controlTypeTarget, controlTypeConfirmation);
							}
						}}
						onClose={() => {
							controlTypeChange.reset();
							setControlTypeConfirmation(null);
							if (controlTypeOutcome) {
								dismissControlTypeOutcome();
							}
						}}
					/>
				)}
		</MachineListSurface>
	);
}
