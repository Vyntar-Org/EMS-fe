import {
	AutorenewRounded,
	MemoryRounded,
	SensorsRounded,
	SettingsRounded,
	SpeedRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { memo } from 'react';

import {
	metricReading,
	waterMachineState,
	waterMachineTitle,
} from '../../../helpers/oht';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

import OHTMachineSummary from './OHTMachineSummary';
import OHTMetric from './OHTMetric';
import OHTMotorControl from './OHTMotorControl';
import OHTTankGraphic from './OHTTankGraphic';

const OHTMachineCard = memo(function OHTMachineCard({
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
	const theme = useTheme();
	const strategy = String(machine.control_strategy ?? '')
		.trim()
		.toUpperCase();
	const showStrategy =
		state.mode === 'Auto' && (strategy === 'LEVEL' || strategy === 'REMOTE');
	return (
		<Box
			component="article"
			aria-label={title}
			data-water-ui="reference-card"
			display="flex"
			minWidth={0}
		>
			<PremiumMachineCard
				app="WATER"
				title={title}
				status={status}
				statusLabel={status.toUpperCase()}
				statusColor={
					status === 'Online' || status === 'Offline'
						? undefined
						: theme.palette.text.secondary
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
					data-water-ui="card-body"
					sx={{
						gap: MACHINE_CARD_DESIGN.cardGap,
						pt: 0,
						'& [data-water-ui~="status-panel"], & [data-water-ui~="motor-control"], & [data-water-ui~="period-panel"], & [data-water-ui~="instruments"] [data-water-ui~="metric-inline"]':
							{
								borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
								borderColor: 'divider',
								bgcolor: 'background.paper',
								backgroundImage: 'none',
							},
						'& [data-water-ui~="instruments"] [data-water-ui~="metric-copy"] h3, & [data-water-ui~="status-label"]':
							{
								fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
								color: 'text.secondary',
							},
						'& [data-water-ui~="metric-value"]': {
							fontSize: MACHINE_CARD_DESIGN.metricValueSize,
							color: 'text.primary',
							fontWeight: 900,
						},
					}}
				>
					{!preview && (failed || state.stale) && (
						<Typography data-water-ui="data-warning" role="status">
							{failed ? 'Refresh failed.' : 'Stale telemetry.'} Readings
							unavailable.
						</Typography>
					)}
					<Box data-water-ui="instruments">
						<Box data-water-ui="tank-panel">
							<Box data-water-ui="tank-heading">
								<Typography>
									Tank Level
									{tank.percentage === null && tank.unit !== 'Unit unverified'
										? ` (${tank.unit})`
										: ''}
								</Typography>
							</Box>
							<OHTTankGraphic
								percentage={tank.percentage}
								rawValue={tank.value}
								unavailable={
									state.unavailable ||
									(tank.number === null && tank.percentage === null)
								}
								unit={tank.unit === 'Unit unverified' ? '' : tank.unit}
							/>
						</Box>
						<Box data-water-ui="measurements">
							<OHTMetric
								label="Flow Rate"
								changePct={
									state.unavailable ? null : machine.flowrate_change_pct ?? null
								}
								comparisonLabel="vs. one hour ago"
								labelIcon={<SpeedRounded />}
								previous={state.unavailable ? null : machine.previous?.flowrate}
								reading={flow}
							/>
							<OHTMetric
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
					<OHTMachineSummary
						machine={machine}
						unavailable={state.unavailable}
						preview={preview}
					/>
					<Box data-water-ui="status-panel">
						<Box data-water-ui="mode-section">
							<SettingsRounded data-water-ui="status-icon" />
							<Box>
								<Typography data-water-ui="status-label">
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
						<Box data-water-ui="motor-section">
							<MemoryRounded data-water-ui="status-icon" />
							<Box>
								<Typography data-water-ui="status-label">
									Motor Status
								</Typography>
								<span
									data-water-ui={`motor-status motor-${state.motor.toLowerCase()}${
										preview ? ' motor-preview' : ''
									}`}
								>
									<AutorenewRounded />
									{state.motor}
									{preview && state.motor === 'Running' && (
										<span data-water-ui="status-demo">Demo</span>
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
					<OHTMotorControl
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
export default OHTMachineCard;

const numeric = (value) =>
	(typeof value === 'number' ||
		(typeof value === 'string' && value.trim() !== '')) &&
	Number.isFinite(Number(value))
		? Number(value)
		: null;

// OHTTankConfig.capacity is documented in the backend as the same unit as
// tank_level. Other callers must explicitly confirm that relationship.
function tankLevelState({
	level,
	fillPercent,
	capacity,
	unit,
	capacityUnitMatchesLevel = false,
	unavailable = false,
}) {
	const raw = numeric(level);
	const fill = numeric(fillPercent);
	const full = numeric(capacity);
	let percentage = null;
	let source = null;
	if (!unavailable) {
		if (fill !== null) {
			percentage = fill;
			source = 'fill_percent';
		} else if (
			raw !== null &&
			full !== null &&
			full > 0 &&
			capacityUnitMatchesLevel
		) {
			percentage = (raw / full) * 100;
			source = 'capacity';
		} else if (raw !== null && unit === '%') {
			// Only an explicitly verified percentage unit permits this fallback.
			percentage = raw;
			source = 'level_percent';
		}
	}
	return {
		percentage:
			percentage !== null && Number.isFinite(percentage)
				? Math.min(100, Math.max(0, percentage))
				: null,
		source,
		capacityMissing: full === null || full <= 0,
	};
}
