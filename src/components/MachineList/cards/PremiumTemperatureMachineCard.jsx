import {
	BatteryChargingFullRounded,
	CheckCircleRounded,
	DeviceThermostatRounded,
	OpacityRounded,
	WarningAmberRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatNumber } from '../../../helpers/formatters';
import { getTemperatureAppStatus } from '../../../helpers/temperatureStatus';
import { MachineTemperatureGauge } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

const metricIcon = (label) => {
	if (/humid/i.test(label)) return OpacityRounded;
	if (/batter|volt/i.test(label)) return BatteryChargingFullRounded;
	return DeviceThermostatRounded;
};

const Metric = ({ metric, temperatureColor }) => {
	const Icon = metricIcon(metric.label);
	const color = /humid/i.test(metric.label)
		? '#7C3AED'
		: /batter|volt/i.test(metric.label)
		  ? '#16A34A'
		  : temperatureColor || '#F97316';
	return (
		<Box
			sx={{
				minWidth: 0,
				p: 0.8,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
				boxShadow: '0 4px 12px rgba(37,69,111,.06)',
			}}
		>
			<Stack direction="row" spacing={0.65} alignItems="center">
				<Box
					sx={{
						width: 28,
						height: 28,
						display: 'grid',
						placeItems: 'center',
						borderRadius: 1.2,
						color,
						bgcolor: alpha(color, 0.1),
						flexShrink: 0,
					}}
				>
					<Icon sx={{ fontSize: 17 }} />
				</Box>
				<Box minWidth={0}>
					<Typography
						noWrap
						sx={{
							fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
							color: 'text.secondary',
						}}
					>
						{metric.label}
					</Typography>
					<Typography
						noWrap
						sx={{
							fontSize: MACHINE_CARD_DESIGN.metricValueSize,
							fontWeight: 900,
							color,
						}}
					>
						{formatNumber(metric.value, 2, { fallback: '0' })}
						{metric.unit ? ` ${metric.unit}` : ''}
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

const PremiumTemperatureMachineCard = ({
	title,
	status,
	temperature,
	metrics = [],
	lastUpdated,
	onOpenTrend,
}) => {
	const tempStatus = getTemperatureAppStatus(temperature);
	const shownMetrics = metrics.slice(0, 3);
	return (
		<PremiumMachineCard
			app="TEMPERATURE"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			accentColor={tempStatus?.color}
			onOpenTrend={onOpenTrend}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: `repeat(${Math.max(
						shownMetrics.length,
						1
					)}, minmax(0,1fr))`,
					gap: 0.65,
				}}
			>
				{shownMetrics.map((metric) => (
					<Metric
						key={metric.label}
						metric={metric}
						temperatureColor={tempStatus?.color}
					/>
				))}
			</Box>
			<Box mt={0.8}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={0.5}
				>
					<Typography
						sx={{
							fontSize: MACHINE_CARD_DESIGN.helperSize,
							color: 'text.secondary',
							fontWeight: 700,
						}}
					>
						Temperature Range
					</Typography>
					<Typography
						sx={{
							fontSize: MACHINE_CARD_DESIGN.helperSize,
							color: tempStatus?.color,
							fontWeight: 900,
						}}
					>
						Current: {formatNumber(temperature, 1, { fallback: '0' })} °C
					</Typography>
				</Stack>
				<MachineTemperatureGauge
					value={temperature}
					statusColor={tempStatus?.color}
					statusLabel={
						tempStatus ? `${tempStatus.label} · ${tempStatus.range}` : ''
					}
				/>
				<Stack
					direction="row"
					justifyContent="space-between"
					mt={0.45}
					color="text.secondary"
				>
					{['20°', '23°', '25°', '30°'].map((mark) => (
						<Typography key={mark} sx={{ fontSize: '0.5rem' }}>
							{mark}
						</Typography>
					))}
				</Stack>
			</Box>
			<Box
				sx={{
					mt: 0.8,
					display: 'grid',
					gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
					overflow: 'hidden',
				}}
			>
				{[
					{
						icon: WarningAmberRounded,
						title: 'Below 23°C',
						state: 'ALERT',
						caption: 'Temperature too low',
						color: '#F59E0B',
					},
					{
						icon: CheckCircleRounded,
						title: '23°C–25°C',
						state: 'ONLINE',
						caption: 'Normal range',
						color: '#16A34A',
					},
					{
						icon: WarningAmberRounded,
						title: 'Above 25°C',
						state: 'OFFLINE',
						caption: 'Temperature too high',
						color: '#EF3340',
					},
				].map(
					({ icon: Icon, title: zoneTitle, state, caption, color }, index) => (
						<Box
							key={zoneTitle}
							sx={{
								p: 0.65,
								textAlign: 'center',
								borderLeft: index ? '1px solid' : 0,
								borderColor: 'divider',
								bgcolor: alpha(color, 0.045),
							}}
						>
							<Icon sx={{ fontSize: 16, color }} />
							<Typography
								noWrap
								sx={{ fontSize: '0.55rem', fontWeight: 800, color }}
							>
								{zoneTitle}
							</Typography>
							<Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color }}>
								{state}
							</Typography>
							<Typography
								noWrap
								sx={{ fontSize: '0.46rem', color: 'text.secondary' }}
							>
								{caption}
							</Typography>
						</Box>
					)
				)}
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumTemperatureMachineCard;
