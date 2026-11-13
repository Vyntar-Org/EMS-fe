import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AccessTimeRounded,
	RefreshRounded,
	SearchRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { getWaterDashboard } from './waterMonitorApi';
import { waterMonitorMockMachines } from './waterMonitorMockData';
import {
	matchesWaterMachine,
	waterMachineState,
} from './waterMachinePresentation';

import WaterMachineCard from './WaterMachineCard';
import WaterMonitorMachineListSkeleton from './WaterMonitorMachineListSkeleton';
import './waterMonitor.css';

export default function WaterMonitorMachineList() {
	const [search, setSearch] = useState('');
	const [trendMachine, setTrendMachine] = useState(null);
	const dashboard = useQuery({
		queryKey: ['water-monitor', 'dashboard-preview-check'],
		queryFn: ({ signal }) => getWaterDashboard({ signal }),
		retry: false,
		refetchOnWindowFocus: false,
	});
	const machines = waterMonitorMockMachines.filter((machine) =>
		matchesWaterMachine(machine, search)
	);
	const motorStates = waterMonitorMockMachines.map(
		(machine) => waterMachineState(machine, { preview: true }).motor
	);
	const summary = [
		{
			label: 'Total Machines',
			count: waterMonitorMockMachines.length,
			tone: 'total',
		},
		{
			label: 'Running',
			count: motorStates.filter((motor) => motor === 'Running').length,
			tone: 'running',
		},
		{
			label: 'Stopped',
			count: motorStates.filter((motor) => motor === 'Stopped').length,
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
		<Box className="wm-list">
			<Box className="wm-toolbar">
				<Box className="wm-page-tools">
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
						className="wm-counts"
						role="group"
						aria-label="Demo machine totals, before search filtering"
					>
						{summary.map(({ label, count, tone }) => (
							<Tooltip
								key={tone}
								title="Demo totals across all machines, before search filtering. These are simulated motor states, not live telemetry."
							>
								<Box className={'wm-count wm-count-' + tone} tabIndex={0}>
									<span className="wm-count-dot" aria-hidden="true" />
									<Box className="wm-count-copy">
										<Typography component="span">{label}</Typography>
										<Typography component="strong">{count}</Typography>
									</Box>
								</Box>
							</Tooltip>
						))}
					</Box>
					<Tooltip title="Demo values: Totalizer in KL and Flow Rate in m³. Tank percentage units apply to demo data only; connectivity remains unverified.">
						<Chip size="small" label="Demo" variant="outlined" tabIndex={0} />
					</Tooltip>
					<Typography className="wm-result-count" role="status">
						{machines.length} of {waterMonitorMockMachines.length} machines
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
					<Tooltip title="Refresh dashboard API; cards retain static values">
						<span>
							<IconButton
								aria-label="Refresh dashboard API"
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
						className={`wm-api-status ${
							dashboard.isError ? 'wm-api-error' : ''
						}`}
					>
						<AccessTimeRounded />
						{dashboard.isFetching
							? 'Checking dashboard...'
							: dashboard.isError
							  ? 'API unavailable - retry refresh'
							  : checked
							    ? `API checked: ${checked}`
							    : 'No API update yet'}
					</Typography>
				</Box>
			</Box>
			{!machines.length && (
				<Box className="wm-empty-state">
					<Typography>
						{waterMonitorMockMachines.length
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
			{dashboard.isPending && dashboard.isFetching ? (
				<WaterMonitorMachineListSkeleton />
			) : (
				<Box className="wm-machine-grid">
					{machines.map((machine) => (
						<WaterMachineCard
							key={machine.slave_id}
							machine={machine}
							preview
							trendEnabled={false}
							onTrend={() => setTrendMachine(machine)}
						/>
					))}
				</Box>
			)}
			<Dialog
				open={Boolean(trendMachine)}
				onClose={() => setTrendMachine(null)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>{trendMachine?.name} - Trend</DialogTitle>
				<DialogContent>
					<Typography>
						No historical readings are connected for this static preview. Actual
						machine history will appear here after the backend history
						integration is configured.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setTrendMachine(null)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
