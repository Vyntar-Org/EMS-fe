import {
	AccessTimeRounded,
	RefreshRounded,
	SearchRounded,
} from '@mui/icons-material';
import {
	Box,
	Button,
	Alert,
	CircularProgress,
	IconButton,
	InputAdornment,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';
import {
	getWaterMonitoringMachines,
	matchesWaterMachine,
	waterMachineState,
	waterMachineTitle,
} from '../../../helpers/oht';
import PremiumModal from '../../common/PremiumModal';
import { useWaterMonitoringMotorOperations } from '../../OHT/OHTMotorOperations';
import { useOHTConfig } from '../../OHT/useOHTConfig';
import {
	motorControlReason,
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

function DeviceMachineCards({
	machines,
	failed,
	search,
	onTrend,
	onMotorRequest,
}) {
	const { controls } = useWaterMonitoringMotorOperations();
	const control = controls[machines[0].device_uid];
	return machines
		.filter((machine) => matchesWaterMachine(machine, search))
		.map((machine) => (
			<OHTMachineCard
				key={machine.slave_id}
				machine={machine}
				failed={failed}
				commandControl={control}
				trendEnabled
				onTrend={() => onTrend(machine)}
				onMotorRequest={onMotorRequest}
			/>
		));
}

export default function OHTMachineList() {
	const { user } = useAuth();
	const config = useOHTConfig();
	const scope = String(
		user?.id ?? user?.username ?? user?.email ?? 'authenticated'
	);
	const listKey = ['water-monitor', scope, 'machine-list'];
	const [search, setSearch] = useState('');
	const [trendMachine, setTrendMachine] = useState(null);
	const [confirmation, setConfirmation] = useState(null);
	const dashboard = useQuery({
		queryKey: listKey,
		queryFn: ({ signal }) => getWaterMonitoringMachines({ signal }),
		retry: false,
		refetchOnWindowFocus: true,
		refetchInterval:
			Number.isFinite(config.poll_interval_seconds) &&
			config.poll_interval_seconds >= 5
				? config.poll_interval_seconds * 1000
				: 30000,
		refetchIntervalInBackground: false,
	});
	const { register, controls } = useWaterMonitoringMotorOperations();
	const pendingDialog = Object.values(controls).find(
		(control) => control.dialog
	);
	const operationToken = pendingDialog?.dialog.token;
	useEffect(() => {
		if (operationToken) {
			setConfirmation(null);
		}
	}, [operationToken]);
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
				listKey: ['water-monitor', scope, 'machine-list'],
				failed: dashboard.isError,
			};
			entries[uid].machines.push(machine);
		}
		register(entries);
	}, [register, scope, dashboard.data, dashboard.isError]);
	const allMachines = dashboard.data?.machines ?? [];
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
			const state = waterMachineState(target);
			confirmationReason = motorControlReason(target, state, {
				locked: targetControl.locked,
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
	const devices = new Map();
	for (const machine of allMachines) {
		const key = machine.device_uid || 'unmapped-' + machine.slave_id;
		if (!devices.has(key)) {
			devices.set(key, []);
		}
		devices.get(key).push(machine);
	}
	const summary = [
		{
			label: 'Total Machines',
			count: dashboard.data?.summary?.total ?? 'N/A',
			tone: 'total',
		},
		{
			label: 'Running',
			count: dashboard.data?.summary?.running ?? 'N/A',
			tone: 'running',
		},
		{
			label: 'Stopped',
			count: dashboard.data?.summary?.stopped ?? 'N/A',
			tone: 'stopped',
		},
	];
	const checked = dashboard.dataUpdatedAt
		? new Date(dashboard.dataUpdatedAt).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
		  })
		: null;
	return (
		<MachineListSurface>
			<Box data-water-ui="toolbar">
				<Box data-water-ui="page-tools">
					<TextField
						size="small"
						placeholder="Search machines or locations"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						inputProps={{ 'aria-label': 'Search units, devices or locations' }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchRounded />
								</InputAdornment>
							),
						}}
					/>

					<Box
						data-water-ui="counts"
						role="group"
						aria-label="Machine totals, before search filtering"
					>
						{summary.map(({ label, count, tone }) => (
							<Tooltip
								key={tone}
								title="Backend totals across all machines, before search filtering."
							>
								<Box data-water-ui={'count count-' + tone} tabIndex={0}>
									<span data-water-ui="count-dot" aria-hidden="true" />
									<Box data-water-ui="count-copy">
										<Typography component="span">{label}</Typography>
										<Typography component="strong">{count}</Typography>
									</Box>
								</Box>
							</Tooltip>
						))}
					</Box>
					<Typography data-water-ui="result-count" role="status">
						{machines.length} of {allMachines.length} machines
					</Typography>
					{search && (
						<Button
							size="small"
							onClick={() => {
								setSearch('');
							}}
						>
							Clear
						</Button>
					)}
					<Tooltip title="Refresh machines">
						<span>
							<IconButton
								aria-label="Refresh machines"
								disabled={dashboard.isFetching}
								onClick={() => dashboard.refetch({ cancelRefetch: false })}
							>
								{dashboard.isFetching ? (
									<CircularProgress size={22} />
								) : (
									<RefreshRounded />
								)}
							</IconButton>
						</span>
					</Tooltip>
					<Typography
						role="status"
						data-water-ui={`api-status ${dashboard.isError ? 'api-error' : ''}`}
					>
						<AccessTimeRounded />
						{dashboard.isFetching
							? 'Loading machines...'
							: dashboard.isError
							  ? 'API unavailable - retry refresh'
							  : checked
							    ? `Updated: ${checked}`
							    : 'No API update yet'}
					</Typography>
				</Box>
			</Box>
			{!dashboard.isPending && !dashboard.isError && !machines.length && (
				<Box data-water-ui="empty-state">
					<Typography>
						{allMachines.length
							? 'No matching units. Try a different name, device or location.'
							: 'No machines available.'}
					</Typography>
					<Button
						onClick={() => {
							setSearch('');
						}}
					>
						Clear filters
					</Button>
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
					{[...devices].map(([uid, deviceMachines]) => (
						<DeviceMachineCards
							key={scope + uid}
							machines={deviceMachines}
							scope={scope}
							listKey={listKey}
							failed={dashboard.isError}
							search={search}
							onTrend={setTrendMachine}
							onMotorRequest={(machine, action) =>
								setConfirmation({
									action,
									slaveId: machine.slave_id,
									deviceUid: machine.device_uid,
									name:
										machine.motor_name ||
										machine.slave_name ||
										machine.name ||
										`Machine ${machine.slave_id}`,
								})
							}
						/>
					))}
				</WaterMonitoringMachineGrid>
			)}
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
					onClose={
						pendingDialog?.dismissDialog ?? (() => setConfirmation(null))
					}
					onRefresh={pendingDialog?.refreshStatus}
				/>
			)}
		</MachineListSurface>
	);
}
