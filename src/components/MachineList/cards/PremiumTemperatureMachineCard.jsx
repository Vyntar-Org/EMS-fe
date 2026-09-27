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
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const metricIcon = (label) => {
	if (/humid/i.test(label)) {
		return OpacityRounded;
	}
	if (/batter|volt/i.test(label)) {
		return BatteryChargingFullRounded;
	}
	return DeviceThermostatRounded;
};

const Metric = ({ metric, temperatureColor }) => {
	const Icon = metricIcon(metric.label);
	const isHumidity = /humid/i.test(metric.label);
	const isBattery = /batter|volt/i.test(metric.label);
	const color = isHumidity
		? '#7C3AED'
		: isBattery
		  ? '#16A34A'
		  : temperatureColor || '#F97316';
	const numericValue = Number(metric.value);
	const temperatureNormal = numericValue >= 23 && numericValue <= 25;
	const humidityNormal = numericValue >= 30 && numericValue <= 70;
	const batteryPercent = Math.max(0, Math.min(100, (numericValue / 4) * 100));
	const healthy = isBattery
		? numericValue >= 2.8
		: isHumidity
		  ? humidityNormal
		  : temperatureNormal;
	return (
		<Box
			sx={{
				minWidth: 0,
				minHeight: 76,
				p: 0.6,
				border: '1px solid',
				borderColor: alpha(color, 0.2),
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
				boxShadow: '0 4px 12px rgba(37,69,111,.06)',
				background: (theme) =>
					`linear-gradient(145deg, ${alpha(color, 0.06)}, ${
						theme.palette.background.paper
					} 70%)`,
				borderLeft: `3px solid ${color}`,
			}}
		>
			<Stack direction="row" spacing={0.5} alignItems="center">
				<Box
					sx={{
						width: 31,
						height: 31,
						display: 'grid',
						placeItems: 'center',
						borderRadius: 1.2,
						color,
						bgcolor: alpha(color, 0.1),
						flexShrink: 0,
					}}
				>
					<Icon sx={{ fontSize: 19 }} />
				</Box>
				<Box minWidth={0}>
					<Typography
						noWrap
						sx={{
							fontSize: '0.56rem',
							color: 'text.secondary',
						}}
					>
						{metric.label}
					</Typography>
					<Typography
						noWrap
						sx={{
							fontSize: '0.82rem',
							fontWeight: 900,
							color,
						}}
					>
						{formatNumber(metric.value, 2, { fallback: '0' })}
						{metric.unit ? ` ${metric.unit}` : ''}
					</Typography>
				</Box>
			</Stack>
			{isBattery ? (
				<>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.3}
						sx={{
							mt: 0.35,
							color: GREEN,
							width: 'fit-content',
							px: 0.45,
							py: 0.1,
							borderRadius: 99,
							bgcolor: alpha(GREEN, 0.09),
						}}
					>
						<CheckCircleRounded sx={{ fontSize: 11 }} />
						<Typography sx={{ fontSize: '0.5rem', fontWeight: 900 }}>
							{healthy ? 'Good' : 'Low'}
						</Typography>
					</Stack>
					<Stack direction="row" alignItems="center" spacing={0.35} mt={0.4}>
						<Box
							sx={{
								flex: 1,
								height: 5,
								borderRadius: 99,
								bgcolor: alpha(GREEN, 0.12),
								overflow: 'hidden',
							}}
						>
							<Box
								sx={{
									width: `${batteryPercent}%`,
									height: '100%',
									borderRadius: 99,
									bgcolor: GREEN,
								}}
							/>
						</Box>
						<Typography sx={{ fontSize: '0.48rem', fontWeight: 900 }}>
							{formatNumber(batteryPercent, 0)}%
						</Typography>
					</Stack>
				</>
			) : (
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.35}
					sx={{
						mt: 0.45,
						px: 0.45,
						py: 0.25,
						borderRadius: 1,
						color: healthy ? GREEN : color,
						bgcolor: alpha(healthy ? GREEN : color, 0.08),
					}}
				>
					{healthy ? (
						<CheckCircleRounded sx={{ fontSize: 13 }} />
					) : (
						<WarningAmberRounded sx={{ fontSize: 13 }} />
					)}
					<Box minWidth={0}>
						<Typography noWrap sx={{ fontSize: '0.5rem', fontWeight: 900 }}>
							{healthy ? 'Normal' : 'ALERT'}
						</Typography>
						<Typography
							noWrap
							sx={{ color: 'text.secondary', fontSize: '0.42rem' }}
						>
							{isHumidity
								? '(30 - 70 RH)'
								: healthy
								  ? 'Normal range'
								  : numericValue < 23
								    ? 'Below normal range'
								    : 'Above normal range'}
						</Typography>
					</Box>
				</Stack>
			)}
		</Box>
	);
};

const GREEN = '#16A34A';

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
	const temperaturePercent = Math.max(
		0,
		Math.min(100, ((Number(temperature) - 20) / 10) * 100)
	);
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
			<Box mt={0.65}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={0.35}
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
				<Box
					sx={{
						position: 'relative',
						height: 7,
						borderRadius: 99,
						background:
							'linear-gradient(90deg,#F5A524 0%,#F5A524 30%,#16A34A 30%,#16A34A 50%,#EF1745 50%,#EF1745 100%)',
					}}
				>
					<Box
						sx={{
							position: 'absolute',
							left: `${temperaturePercent}%`,
							top: '50%',
							width: 15,
							height: 15,
							borderRadius: '50%',
							bgcolor: 'background.paper',
							border: '3px solid',
							borderColor: tempStatus?.color || '#F97316',
							boxShadow: '0 2px 5px rgba(0,0,0,.25)',
							transform: 'translate(-50%,-50%)',
						}}
					/>
				</Box>
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
					mt: 0.65,
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
				].map(({ title: zoneTitle, state, caption, color }, index) => (
					<Box
						key={zoneTitle}
						sx={{
							p: 0.5,
							textAlign: 'center',
							borderLeft: index ? '1px solid' : 0,
							borderColor: 'divider',
							bgcolor: alpha(color, 0.045),
						}}
					>
						<Box
							sx={{
								width: 24,
								height: 24,
								mx: 'auto',
								display: 'grid',
								placeItems: 'center',
								borderRadius: 1,
								color,
								bgcolor: alpha(color, 0.09),
							}}
						>
							<DeviceThermostatRounded sx={{ fontSize: 15 }} />
						</Box>
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
				))}
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumTemperatureMachineCard;
