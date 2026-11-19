import {
	AutorenewRounded,
	MemoryRounded,
	SensorsRounded,
	SettingsRounded,
	SpeedRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { memo } from 'react';

import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { metricReading } from '../../WaterMonitoring/waterMonitoringService';

import { tankLevelState } from './tankLevelState';
import {
	waterMachineState,
	waterMachineTitle,
} from './waterMonitoringMachinePresentation';
import WaterMonitoringMachineSummary from './WaterMonitoringMachineSummary';
import WaterMonitoringMetric from './WaterMonitoringMetric';
import WaterMonitoringMotorControl from './WaterMonitoringMotorControl';
import WaterMonitoringTankGraphic from './WaterMonitoringTankGraphic';

import './waterMonitoringMachineList.css';

const WaterMonitoringMachineCard = memo(function WaterMonitoringMachineCard({
	machine,
	now,
	staleAfter,
	failed,
	onTrend,
	trendEnabled,
	preview = false,
	commandControl,
	onMotorRequest,
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
	const title = waterMachineTitle(machine);
	const canViewTrend = preview || trendEnabled;
	const status = state.connection;
	const strategy = String(machine.control_strategy ?? '')
		.trim()
		.toUpperCase();
	const showStrategy =
		state.mode === 'Auto' && (strategy === 'LEVEL' || strategy === 'REMOTE');
	return (
		<Box
			component="article"
			aria-label={title}
			className="wm-reference-card"
			display="flex"
			minWidth={0}
		>
			<PremiumMachineCard
				app="WATER"
				title={title}
				status={status}
				statusLabel={status.toUpperCase()}
				statusColor={
					status === 'Online' || status === 'Offline' ? undefined : '#64748b'
				}
				lastUpdated={
					Number.isFinite(state.timestamp)
						? machine.latest_ts ?? machine.latest?.timestamp
						: undefined
				}
				onOpenTrend={onTrend}
				footer={canViewTrend ? undefined : null}
			>
				<Box
					className="wm-card-body"
					sx={{
						gap: MACHINE_CARD_DESIGN.cardGap,
						pt: 0,
						'& .wm-status-panel, & .wm-motor-control, & .wm-period-panel, & .wm-instruments .wm-metric-inline':
							{
								borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
								borderColor: 'divider',
								bgcolor: 'background.paper',
								backgroundImage: 'none',
							},
						'& .wm-instruments .wm-metric-copy h3, & .wm-status-label': {
							fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
							color: 'text.secondary',
						},
						'& .wm-metric-value': {
							fontSize: MACHINE_CARD_DESIGN.metricValueSize,
							color: 'text.primary',
							fontWeight: 900,
						},
					}}
				>
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
							<WaterMonitoringTankGraphic
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
							<WaterMonitoringMetric
								label="Flow Rate"
								changePct={
									state.unavailable ? null : machine.flowrate_change_pct ?? null
								}
								comparisonLabel="vs. one hour ago"
								labelIcon={<SpeedRounded />}
								previous={state.unavailable ? null : machine.previous?.flowrate}
								reading={flow}
							/>
							<WaterMonitoringMetric
								label="Totalizer"
								changePct={
									state.unavailable
										? null
										: machine.totalizer_change_pct ?? null
								}
								comparisonLabel="vs. one hour ago"
								labelIcon={<WaterDropRounded />}
								previous={
									state.unavailable ? null : machine.previous?.totalizer
								}
								reading={total}
							/>
						</Box>
					</Box>
					<WaterMonitoringMachineSummary
						machine={machine}
						unavailable={state.unavailable}
						preview={preview}
					/>
					<Box className="wm-status-panel">
						<Box className="wm-mode-section">
							<SettingsRounded className="wm-status-icon" />
							<Box>
								<Typography className="wm-status-label">
									Control Mode
								</Typography>
								<Box display="flex" flexWrap="wrap" gap={0.5}>
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
									{showStrategy && (
										<Chip
											size="small"
											label={strategy}
											icon={
												strategy === 'LEVEL' ? (
													<WaterDropRounded />
												) : (
													<SensorsRounded />
												)
											}
											aria-label={`Control strategy: ${strategy}`}
											title={`Control strategy: ${strategy}`}
											variant="outlined"
											sx={(theme) => {
												const color =
													strategy === 'REMOTE'
														? theme.palette.mode === 'dark'
															? theme.palette.primary.light
															: theme.palette.primary.main
														: theme.palette.text.primary;
												return {
													color,
													bgcolor: alpha(color, 0.05),
													borderColor: alpha(color, 0.24),
													'& .MuiChip-icon': { color: 'inherit' },
													'& .MuiChip-label': { fontWeight: 700 },
												};
											}}
										/>
									)}
								</Box>
							</Box>
						</Box>
						<Box className="wm-motor-section">
							<MemoryRounded className="wm-status-icon" />
							<Box>
								<Typography className="wm-status-label">
									Motor Status
								</Typography>
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
					<WaterMonitoringMotorControl
						machine={machine}
						state={state}
						title={title}
						preview={preview}
						control={commandControl}
						failed={failed}
						onRequest={onMotorRequest}
					/>
				</Box>
			</PremiumMachineCard>
		</Box>
	);
});
export default WaterMonitoringMachineCard;
