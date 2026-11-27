import {
	TouchAppRounded,
	ArrowDownwardRounded,
	ArrowUpwardRounded,
	InfoOutlined,
	MemoryRounded,
	WarningRounded,
	WaterDropRounded,
	WifiOffRounded,
	EngineeringRounded,
	SettingsRounded,
	SpeedRounded,
	WavesRounded,
} from '@mui/icons-material';
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo } from 'react';

import {
	metricReading,
	waterMachineState,
	waterMachineTitle,
} from '../../../helpers/oht';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import OHTTankIcon from '../../OHT/OHTTankIcon';

import InlineControlStatus from './InlineControlStatus';
import OHTMachineSummary from './OHTMachineSummary';
import OHTMetric from './OHTMetric';
import OHTMotorControl from './OHTMotorControl';
import OHTTankGraphic from './OHTTankGraphic';
import { LevelControlIcon, TotalizerIcon } from './WaterControlIcons';

const OHTMachineCard = memo(function OHTMachineCard({
	machine,
	scope,
	now,
	staleAfter,
	failed,
	onTrend,
	trendEnabled,
	preview = false,
	commandControl,
	controlTypePending,
	controlTypeInline,
	motorInline,
	controlTypeBlocked,
	onControlTypeChange,
	onMotorRequest,
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
	const title = waterMachineTitle(machine);
	let controlTypeReason = '';
	if (state.connection !== 'Online') {
		controlTypeReason = 'Control type changes require an online device.';
	} else if (state.mode === 'Manual') {
		controlTypeReason =
			'The motor is controlled locally in Manual mode. Set its operation mode to Remote at the local panel to change the control type from this app.';
	} else if (state.mode !== 'Remote') {
		controlTypeReason = 'Control type changes require Remote mode.';
	} else if (machine.control_type_switchable !== true || preview) {
		controlTypeReason = 'You can’t change the control type for this motor.';
	} else if (failed) {
		controlTypeReason = 'Refresh the machine list to try again.';
	} else if (controlTypePending) {
		controlTypeReason = 'Sending the control type change…';
	} else if (controlTypeInline) {
		controlTypeReason = 'Updating control type...';
	} else if (commandControl?.blockedReason) {
		controlTypeReason =
			'The server has blocked remote control for this device.';
	} else if (commandControl?.locked || motorInline) {
		controlTypeReason =
			'You can change the control type once the previous motor command is resolved.';
	} else if (
		controlTypeBlocked ||
		!machine.device_uid ||
		!onControlTypeChange
	) {
		controlTypeReason = 'You can’t change the control type right now.';
	}
	const controlTypeDisabled = Boolean(controlTypeReason);
	const controlTypeUnknown = state.controlType === 'Unknown';
	const canViewTrend = preview || trendEnabled;
	const status = state.connection;
	const theme = useTheme();
	return (
		<Box
			component="article"
			aria-label={title}
			data-water-ui="reference-card"
			display="flex"
			minWidth={0}
		>
			<PremiumMachineCard
				compact
				app="WATER"
				headerIcon={<OHTTankIcon color="info" sx={{ fontSize: 26 }} />}
				title={title}
				status={status}
				statusLabel={status.toUpperCase()}
				statusColor={
					status === 'Online'
						? theme.palette.mode === 'dark'
							? theme.palette.success.main
							: undefined
						: status === 'Offline'
						  ? theme.palette.mode === 'dark'
								? theme.palette.error.main
								: undefined
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
				<Box data-water-ui="card-body">
					{!preview && failed && (
						<Typography data-water-ui="data-warning" role="status">
							Refresh failed. Readings unavailable.
						</Typography>
					)}
					<Box data-water-ui="instruments">
						<Box data-water-ui="tank-panel">
							<OHTTankGraphic
								percentage={tank.percentage}
								rawValue={tank.value}
								unavailable={tank.number === null}
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
								labelIcon={<TotalizerIcon />}
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
						<Box>
							<Typography data-water-ui="status-label">
								Operation Mode
								<Tooltip
									title="Remote mode allows control from the app. Manual mode uses local control."
									describeChild
								>
									<Box
										component="span"
										data-water-ui="status-info"
										tabIndex={0}
										aria-label="About Operation Mode"
									>
										<InfoOutlined />
									</Box>
								</Tooltip>
							</Typography>
							<Box data-water-ui="mode-badge" data-mode={state.mode}>
								{state.mode === 'Manual' ? (
									<TouchAppRounded />
								) : (
									<SettingsRounded />
								)}
								{state.mode}
							</Box>
						</Box>
						<Box data-water-ui="control-type">
							<Typography data-water-ui="status-label">
								<InlineControlStatus
									loading={controlTypeInline?.loading}
									message="Updating control type..."
								>
									Control Type
								</InlineControlStatus>
								<Tooltip
									title="User Control switches the motor manually. Level Control runs it based on water level."
									describeChild
								>
									<Box
										component="span"
										data-water-ui="status-info"
										tabIndex={0}
										aria-label="About Control Type"
									>
										<InfoOutlined />
									</Box>
								</Tooltip>
							</Typography>
							<Tooltip title={controlTypeReason} describeChild>
								<Box
									data-water-ui="segments"
									data-control-type-disabled={controlTypeDisabled || undefined}
									data-control-type-unknown={controlTypeUnknown || undefined}
									role="group"
									aria-label={`Control type: ${state.controlType}`}
									tabIndex={controlTypeDisabled ? 0 : undefined}
								>
									{controlTypeUnknown && (
										<Box data-water-ui="control-type-status">
											<InfoOutlined aria-hidden="true" />
											Control type unknown
										</Box>
									)}
									{[
										[0, 'User', EngineeringRounded],
										[1, 'Level', LevelControlIcon],
									].map(([value, label, Icon]) => (
										<ButtonBase
											key={value}
											data-water-ui="control-type-option"
											data-active={machine.control_type === value}
											aria-pressed={machine.control_type === value}
											disabled={controlTypeDisabled}
											onClick={() => {
												if (machine.control_type !== value) {
													onControlTypeChange(machine, value);
												}
											}}
										>
											<Icon aria-hidden="true" />
											<span>
												{label}
												<br />
												Control
											</span>
										</ButtonBase>
									))}
								</Box>
							</Tooltip>
						</Box>
					</Box>
					<OHTMotorControl
						scope={scope}
						machine={machine}
						state={state}
						title={title}
						preview={preview}
						control={commandControl}
						controlTypePending={controlTypePending}
						inline={motorInline}
						failed={failed}
						onRequest={onMotorRequest}
					/>
					{status === 'Offline' && (
						<Box data-water-ui="offline-note">
							<Box data-water-ui="offline-icon">
								<WifiOffRounded />
							</Box>
							<Box data-water-ui="notice-copy">
								<Typography data-water-ui="notice-title">
									Device offline &mdash; showing last reported readings
								</Typography>
								<Typography data-water-ui="notice-detail">
									<MemoryRounded /> Motor feedback:{' '}
									{state.motor === 'Unknown'
										? 'Unavailable'
										: `${
												state.motor === 'Stopped' ? 'Stop' : state.motor
										  } (last reported)`}
								</Typography>
							</Box>
						</Box>
					)}
					{machine.alerts?.map((alert) => {
						const label = alert.replaceAll('_', ' ');
						const levelLabel = label.trim().toLowerCase();
						const lowLevel = ['low level', 'low water level'].includes(
							levelLabel
						);
						const highLevel = ['high level', 'high water level'].includes(
							levelLabel
						);
						if (status === 'Offline' && lowLevel) {
							return null;
						}
						return (
							<Box
								key={alert}
								data-water-ui={
									highLevel ? 'tank-alert high-level-alert' : 'tank-alert'
								}
							>
								{highLevel ? (
									<Box data-water-ui="high-level-icon" aria-hidden="true">
										<WaterDropRounded />
									</Box>
								) : (
									<WarningRounded data-water-ui="alert-icon" />
								)}
								<Box data-water-ui="notice-copy">
									<Typography data-water-ui="notice-title">
										{highLevel
											? 'High Water Level'
											: lowLevel
											  ? 'Low Water Level'
											  : label}
									</Typography>
									{lowLevel && (
										<Typography data-water-ui="notice-detail">
											Tank level is critically low
										</Typography>
									)}
									{highLevel && (
										<Typography data-water-ui="notice-detail">
											Tank level is above the high-level threshold
										</Typography>
									)}
								</Box>
								{(lowLevel || highLevel) && (
									<Box data-water-ui="level-symbol" aria-hidden="true">
										{highLevel ? (
											<ArrowUpwardRounded />
										) : (
											<ArrowDownwardRounded />
										)}
										<WavesRounded />
									</Box>
								)}
							</Box>
						);
					})}
				</Box>
			</PremiumMachineCard>
		</Box>
	);
});
export default OHTMachineCard;
