import { memo } from 'react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import {
	AutorenewRounded,
	CalendarMonthOutlined,
	ChevronRightRounded,
	LocationOnOutlined,
	MemoryRounded,
	SettingsRounded,
	SpeedRounded,
	TrendingUpRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import { formatTimestamp } from '../../helpers/common';
import { metricReading } from './waterMonitorApi';
import { waterMachineState } from './waterMachinePresentation';
import WaterTankGraphic from './WaterTankGraphic';
import WaterMotorControl from './WaterMotorControl';
import WaterMetric from './WaterMetric';
import WaterMachineSummary from './WaterMachineSummary';

import './waterMonitor.css';

const WaterMachineCard = memo(function WaterMachineCard({
	machine,
	now,
	staleAfter,
	failed,
	onTrend,
	trendEnabled,
	preview = false,
}) {
	const state = waterMachineState(machine, {
		now,
		staleAfter,
		failed,
		preview,
	});
	const tank = metricReading(machine, 'TankLevel', state.unavailable);
	const flow = metricReading(machine, 'flowrate', state.unavailable);
	const total = metricReading(machine, 'totalizer', state.unavailable);
	const title =
		machine.name || machine.slave_name || `Slave ${machine.slave_id}`;
	return (
		<Box
			component="article"
			className={`wm-machine-card wm-card-${state.connection.toLowerCase()}`}
			aria-label={title}
		>
			<Box component="header" className="wm-card-header">
				<span className="wm-water-avatar">
					<WaterDropRounded />
				</span>
				<Box className="wm-machine-identity">
					<Typography component="h2">{title}</Typography>
					<Typography className="wm-location">
						<LocationOnOutlined />
						{machine.details?.location ||
							machine.device_code ||
							`Slave ${machine.slave_id}`}
					</Typography>
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
							unavailable={tank.number === null}
						/>
					</Box>
					<Box className="wm-measurements">
						<WaterMetric
							label="Flow Rate"
							labelIcon={<SpeedRounded />}
							comparisonLabel={machine.previous?.comparison_label}
							previous={state.unavailable ? null : machine.previous?.flowrate}
							reading={flow}
							flow
						/>
						<WaterMetric
							label="Totalizer"
							labelIcon={<WaterDropRounded />}
							comparisonLabel={machine.previous?.comparison_label}
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
				<WaterMotorControl state={state} title={title} preview={preview} />
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
