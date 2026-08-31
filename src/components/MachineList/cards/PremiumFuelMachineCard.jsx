import {
	BatteryChargingFullRounded,
	CalendarMonthRounded,
	DeviceThermostatRounded,
	LocalGasStationRounded,
	OilBarrelRounded,
} from '@mui/icons-material';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatNumber } from '../../../helpers/formatters';
import { MiniSparkline } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const FUEL_COLOR = '#EA580C';

const getFuelLevelColor = (level) => {
	if (level < 30) {
		return FUEL_COLOR;
	}
	if (level <= 90) {
		return '#16A34A';
	}
	return '#DC2626';
};

const getTemperatureColor = (temperature) => {
	const value = Number(temperature);
	if (value <= 10) {
		return '#2563EB';
	}
	if (value <= 35) {
		return '#16A34A';
	}
	if (value <= 40) {
		return '#D97706';
	}
	return '#DC2626';
};

const MetricTile = ({ icon: Icon, label, value, color, tinted = false }) => (
	<Box
		sx={{
			minWidth: 0,
			p: 0.9,
			border: '1px solid',
			borderColor: tinted ? alpha(color, 0.3) : 'divider',
			borderRadius: '12px',
			background: (theme) =>
				tinted
					? `linear-gradient(135deg, ${alpha(color, 0.16)}, ${alpha(
							color,
							theme.palette.mode === 'dark' ? 0.08 : 0.035
					  )})`
					: theme.palette.background.paper,
			boxShadow: '0 5px 14px rgba(37,69,111,.06)',
		}}
	>
		<Stack direction="row" alignItems="center" spacing={0.7}>
			<Box
				sx={{
					width: 27,
					height: 27,
					borderRadius: '8px',
					display: 'grid',
					placeItems: 'center',
					color,
					bgcolor: alpha(color, 0.11),
					flexShrink: 0,
				}}
			>
				<Icon sx={{ fontSize: 17 }} />
			</Box>
			<Box minWidth={0}>
				<Typography fontSize="9.5px" color="text.secondary" lineHeight={1.1}>
					{label}
				</Typography>
				<Typography
					fontSize="13px"
					fontWeight={800}
					color={tinted ? color : 'text.primary'}
					noWrap
				>
					{value}
				</Typography>
			</Box>
		</Stack>
	</Box>
);

const FuelMovementTile = ({ label, today, mtd, color, icon: Icon }) => (
	<Box
		sx={{
			p: 0.9,
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: '12px',
			background: (theme) =>
				`linear-gradient(145deg, ${alpha(color, 0.08)}, ${
					theme.palette.background.paper
				} 65%)`,
		}}
	>
		<Stack direction="row" alignItems="center" spacing={0.6} mb={0.7}>
			<Icon sx={{ fontSize: 17, color }} />
			<Typography fontSize="11px" fontWeight={800}>
				{label}
			</Typography>
		</Stack>
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: '9px',
				overflow: 'hidden',
			}}
		>
			{[
				['Today', today],
				['MTD', mtd],
			].map(([period, amount], index) => (
				<Box
					key={period}
					minWidth={0}
					sx={{
						p: 0.55,
						borderLeft: index ? '1px solid' : 0,
						borderColor: 'divider',
					}}
				>
					<Stack direction="row" alignItems="center" spacing={0.35}>
						<CalendarMonthRounded sx={{ fontSize: 11, color }} />
						<Typography fontSize="8.5px" color="text.secondary">
							{period}
						</Typography>
					</Stack>
					<Typography fontSize="11.5px" fontWeight={800} noWrap>
						{formatNumber(amount, 1, { fallback: '0' })} L
					</Typography>
					<Box height={16} mt={0.2} aria-hidden="true">
						<MiniSparkline
							data={
								index === 0
									? [32, 40, 36, 47, 42, 51, 45, 58]
									: [29, 37, 33, 43, 39, 48, 44, 56]
							}
							color={color}
							width="100%"
							height={16}
						/>
					</Box>
				</Box>
			))}
		</Box>
	</Box>
);

/** Fuel-specific card body populated from the Fuel machine-list API. */
const PremiumFuelMachineCard = ({
	title,
	status,
	lastUpdated,
	fuelLevel,
	fuelVolume,
	fuelCapacity,
	temperature,
	battery,
	consumedToday,
	consumedMtd,
	refilledToday,
	refilledMtd,
	onOpenTrend,
}) => {
	const level = Math.max(0, Math.min(100, Number(fuelLevel) || 0));
	const levelColor = getFuelLevelColor(level);
	const temperatureColor = getTemperatureColor(temperature);

	return (
		<PremiumMachineCard
			app="FUEL"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			onOpenTrend={onOpenTrend}
		>
			<Box
				sx={{
					mb: 0.6,
					p: 1,
					borderRadius: '13px',
					// border: '1px solid',
					// borderColor: alpha(FUEL_COLOR, 0.2),
					bgcolor: alpha(levelColor, 0.045),
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Stack direction="row" alignItems="center" spacing={0.6}>
						<LocalGasStationRounded sx={{ fontSize: 18, color: levelColor }} />
						<Typography fontSize="11px" fontWeight={700}>
							Fuel level
						</Typography>
					</Stack>
					<Typography fontSize="16px" fontWeight={900} color={levelColor}>
						{formatNumber(level, 1, { fallback: '0' })}%
					</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={level}
					sx={{
						mt: 0.8,
						height: 9,
						borderRadius: 99,
						bgcolor: alpha(levelColor, 0.14),
						'& .MuiLinearProgress-bar': {
							borderRadius: 99,
							backgroundColor: levelColor,
						},
					}}
				/>
				<Stack direction="row" justifyContent="space-between" mt={0.45}>
					<Typography fontSize="9px" color="text.secondary">
						0%
					</Typography>
					<Typography
						fontSize="11px"
						fontWeight={900}
						color={levelColor}
						sx={{
							px: 0.8,
							py: 0.25,
							borderRadius: '7px',
							bgcolor: alpha(levelColor, 0.12),
							border: `1px solid ${alpha(levelColor, 0.22)}`,
						}}
					>
						{formatNumber(fuelVolume, 1, { fallback: '0' })} /{' '}
						{formatNumber(fuelCapacity, 1, { fallback: '0' })} L
					</Typography>
					<Typography fontSize="9px" color="text.secondary">
						100%
					</Typography>
				</Stack>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.6 }}>
				<MetricTile
					icon={DeviceThermostatRounded}
					label="Temperature"
					value={`${formatNumber(temperature, 1, { fallback: '0' })} °C`}
					color={temperatureColor}
					tinted
				/>
				<MetricTile
					icon={BatteryChargingFullRounded}
					label="Battery"
					value={`${formatNumber(battery, 1, { fallback: '0' })} V`}
					color="#16A34A"
				/>
				<FuelMovementTile
					icon={LocalGasStationRounded}
					label="Consumed"
					today={consumedToday}
					mtd={consumedMtd}
					color="#16A34A"
				/>
				<FuelMovementTile
					icon={OilBarrelRounded}
					label="Refilled"
					today={refilledToday}
					mtd={refilledMtd}
					color="#DC2626"
				/>
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumFuelMachineCard;
