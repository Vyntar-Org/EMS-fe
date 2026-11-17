import {
	AutorenewRounded,
	CalendarMonthOutlined,
	ChevronRightRounded,
	MemoryRounded,
	SettingsRounded,
	SpeedRounded,
	TrendingUpRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';

import { formatTimestamp } from '../../helpers/common';

import { tankLevelState } from './tankLevelState';
import { waterMachineState } from './waterMachinePresentation';
import WaterMachineSummary from './WaterMachineSummary';
import WaterMetric from './WaterMetric';
import { metricReading } from './waterMonitorApi';
import WaterMotorControl from './WaterMotorControl';
import WaterTankGraphic from './WaterTankGraphic';

import './waterMonitor.css';

const WaterMachineCard = memo(function WaterMachineCard({
	machine,
	now,
	staleAfter,
	failed,
	onTrend,
	trendEnabled,
	preview = false,
	commandControl,
}) {
	const state = waterMachineState(machine, {
		now,
		staleAfter,
		failed,
		preview,
	});
	const tank = metricReading(machine, 'TankLevel', state.unavailable);
	const tankFill = tankLevelState({
		level: machine.latest?.TankLevel,
		fillPercent: machine.fill_percent,
		capacity: machine.capacity,
		unit: tank.unit,
		// OHTTankConfig.capacity declares the same unit as tank_level.
		capacityUnitMatchesLevel: Object.hasOwn(machine, 'latest_ts'),
		unavailable: state.unavailable,
	});
	tank.percentage = tankFill.percentage;
	const flow = metricReading(machine, 'flowrate', state.unavailable);
	const total = metricReading(machine, 'totalizer', state.unavailable);
	const title =
		machine.name || machine.slave_name || `Slave ${machine.slave_id}`;
	return (
		<Box
			component="article"
			className={`wm-machine-card wm-card-${state.connection.toLowerCase()}`}
			aria-label={title}
			sx={(theme) => ({
				'--wm-card-surface': theme.palette.background.paper,
				'--wm-card-text': theme.palette.text.primary,
				'--wm-card-muted': theme.palette.text.secondary,
				'--wm-status-fill':
					state.connection === 'Online'
						? theme.palette.mode === 'dark'
							? '#16352a'
							: '#ecfdf5'
						: state.connection === 'Offline'
						  ? theme.palette.mode === 'dark'
								? '#3d2026'
								: '#fff1f2'
						  : theme.palette.action.hover,
			})}
		>
			<Box component="header" className="wm-card-header">
				<span className="wm-water-avatar">
					<WaterDropRounded />
				</span>
				<Box className="wm-machine-identity">
					<Typography component="h2">{title}</Typography>
					<Typography className="wm-reading-time">
						<CalendarMonthOutlined />
						{Number.isFinite(state.timestamp)
							? formatTimestamp(machine.latest.timestamp)
							: 'Timestamp unavailable'}
					</Typography>
				</Box>
				<Tooltip
					title={
						preview
							? 'Static data does not confirm device connectivity'
							: 'Device connectivity'
					}
				>
					<span
						className={`wm-connection wm-connection-${state.connection.toLowerCase()}`}
					>
						<i />
						{state.connection}
					</span>
				</Tooltip>
			</Box>
			<Box className="wm-card-body">
				{!preview && (failed || state.stale) && (
					<Typography className="wm-data-warning" role="status">
						{failed ? 'Refresh failed.' : 'Stale telemetry.'} Readings
						unavailable.
					</Typography>
				)}
				<Box className="wm-instruments">
					<Box className="wm-tank-panel">
						<Box className="wm-tank-heading">
							<Typography>
								Tank Level
								{tank.percentage === null && tank.unit !== 'Unit unverified'
									? ` (${tank.unit})`
									: ''}
							</Typography>
						</Box>
						<WaterTankGraphic
							percentage={tank.percentage}
							rawValue={tank.value}
							unavailable={
								state.unavailable ||
								(tank.number === null && tank.percentage === null)
							}
							unit={tank.unit === 'Unit unverified' ? '' : tank.unit}
						/>
					</Box>
					<Box className="wm-measurements">
						<WaterMetric
							label="Flow Rate"
							changePct={
								state.unavailable ? null : machine.flowrate_change_pct ?? null
							}
							comparisonLabel="vs. one hour ago"
							labelIcon={<SpeedRounded />}
							previous={state.unavailable ? null : machine.previous?.flowrate}
							reading={flow}
						/>
						<WaterMetric
							label="Totalizer"
							changePct={
								state.unavailable ? null : machine.totalizer_change_pct ?? null
							}
							comparisonLabel="vs. one hour ago"
							labelIcon={<WaterDropRounded />}
							previous={state.unavailable ? null : machine.previous?.totalizer}
							reading={total}
						/>
					</Box>
				</Box>
				<WaterMachineSummary
					machine={machine}
					unavailable={state.unavailable}
					preview={preview}
				/>
				<Box className="wm-status-panel">
					<Box className="wm-mode-section">
						<SettingsRounded className="wm-status-icon" />
						<Box>
							<Typography className="wm-status-label">Control Mode</Typography>
							<Chip
								size="small"
								label={state.mode}
								icon={<SettingsRounded />}
								color={
									state.mode === 'Auto'
										? 'success'
										: state.mode === 'Manual'
										  ? 'warning'
										  : 'default'
								}
								variant="outlined"
							/>
						</Box>
					</Box>
					<Box className="wm-motor-section">
						<MemoryRounded className="wm-status-icon" />
						<Box>
							<Typography className="wm-status-label">Motor Status</Typography>
							<span
								className={`wm-motor-status wm-motor-${state.motor.toLowerCase()}${
									preview ? ' wm-motor-preview' : ''
								}`}
							>
								<AutorenewRounded />
								{state.motor}
								{preview && state.motor === 'Running' && (
									<span className="wm-status-demo">Demo</span>
								)}
							</span>
						</Box>
					</Box>
				</Box>
				{state.connection === 'Offline' && (
					<Typography variant="caption">
						Offline — showing last reported readings and motor feedback.
					</Typography>
				)}
				{machine.alerts?.map((alert) => (
					<Chip
						key={alert}
						label={alert.replaceAll('_', ' ')}
						color="warning"
						variant="outlined"
						size="small"
					/>
				))}
				<WaterMotorControl
					machine={machine}
					state={state}
					title={title}
					preview={preview}
					control={commandControl}
					failed={failed}
				/>
				{(preview || trendEnabled) && (
					<Tooltip
						title={
							preview
								? 'View information about connecting historical readings'
								: 'Open machine trend'
						}
					>
						<Button
							className="wm-trend-button"
							onClick={onTrend}
							variant="contained"
							fullWidth
							startIcon={<TrendingUpRounded />}
							endIcon={<ChevronRightRounded />}
						>
							VIEW TREND
						</Button>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
});
export default WaterMachineCard;
