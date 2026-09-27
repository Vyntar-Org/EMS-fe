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
			p: 0.65,
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
		<Stack direction="row" alignItems="center" spacing={0.6}>
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: '50%',
					display: 'grid',
					placeItems: 'center',
					color,
					bgcolor: alpha(color, 0.11),
					flexShrink: 0,
				}}
			>
				<Icon sx={{ fontSize: 19 }} />
			</Box>
			<Box minWidth={0} flex={1}>
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
			<Box sx={{ pl: 0.55, borderLeft: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
				<Typography sx={{ color: 'text.secondary', fontSize: '0.43rem', letterSpacing: '0.08em' }}>STATUS</Typography>
				<Stack direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.15, px: 0.5, py: 0.2, borderRadius: 99, color, bgcolor: alpha(color, 0.09) }}>
					<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
					<Typography sx={{ fontSize: '0.48rem', fontWeight: 900 }}>NORMAL</Typography>
				</Stack>
			</Box>
		</Stack>
	</Box>
);

const MiniBars = ({ color, today, mtd }) => {
	const seed = Math.max(1, Number(today) || Number(mtd) || 1);
	const bars = [0.24, 0.39, 0.34, 0.55, 0.38, 0.43, 0.51, 0.7, 0.46, 0.42, 0.58, 0.82];
	return (
		<Stack direction="row" alignItems="flex-end" spacing={0.25} sx={{ position: 'absolute', left: 7, right: 7, bottom: 4, height: 20 }} aria-hidden="true">
			{bars.map((factor, index) => (
				<Box key={index} sx={{ flex: 1, height: `${Math.min(100, factor * 100 + (seed % 7))}%`, minWidth: 2, borderRadius: '3px 3px 0 0', bgcolor: alpha(color, 0.72) }} />
			))}
		</Stack>
	);
};

const FuelMovementTile = ({ label, today, mtd, color, icon: Icon }) => (
	<Box
		sx={{
			p: 0.65,
			minHeight: 70,
			position: 'relative',
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: '12px',
			background: (theme) =>
				`linear-gradient(145deg, ${alpha(color, 0.08)}, ${
					theme.palette.background.paper
				} 65%)`,
		}}
	>
		<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5} mb={0.45}>
			<Stack direction="row" alignItems="center" spacing={0.4}>
			<Icon sx={{ fontSize: 17, color }} />
			<Typography fontSize="11px" fontWeight={800}>
				{label}
			</Typography>
			</Stack>
			<Typography sx={{ color: 'text.secondary', fontSize: '0.42rem', letterSpacing: '0.08em' }}>{label === 'Consumed' ? 'FUEL CONSUMPTION' : 'FUEL REFILL HISTORY'}</Typography>
		</Stack>
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
				pb: 2.25,
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
						px: 0.55,
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
				</Box>
			))}
		</Box>
		<MiniBars color={color} today={today} mtd={mtd} />
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
					mb: 0.55,
					p: 0.75,
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
						<LocalGasStationRounded sx={{ fontSize: 20, color: levelColor }} />
						<Box>
							<Typography fontSize="11px" fontWeight={800}>Fuel level</Typography>
							<Typography sx={{ color: 'text.secondary', fontSize: '0.43rem', letterSpacing: '0.1em' }}>TANK CAPACITY {formatNumber(fuelCapacity, 1, { fallback: '0' })} L</Typography>
						</Box>
					</Stack>
					<Box textAlign="right"><Typography fontSize="17px" lineHeight={1} fontWeight={900} color={levelColor}>{formatNumber(level, 1, { fallback: '0' })}%</Typography><Typography sx={{ color: 'text.secondary', fontSize: '0.43rem', letterSpacing: '0.08em' }}>REMAINING {formatNumber(fuelVolume, 1, { fallback: '0' })} L</Typography></Box>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={level}
					sx={{
						mt: 0.55,
						height: 7,
						borderRadius: 99,
						bgcolor: alpha(levelColor, 0.14),
						'& .MuiLinearProgress-bar': {
							borderRadius: 99,
							backgroundColor: levelColor,
						},
					}}
				/>
				<Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.35}>
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
