import {
	DeviceThermostatRounded,
	SpeedRounded,
	WarningAmberRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import { MachineTemperatureGauge } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

/**
 * Dedicated premium card for the Solar (solar water heater) machine list:
 * sun icon, title + status pill, timestamp, a metric panel for
 * flow/temperature/pressure readings, an outlet-temperature scale gauge,
 * and the TREND action last.
 */
const PremiumSolarMachineCard = ({
	title,
	status,
	lastUpdated,
	inletTemperature,
	outletTemperature,
	flowTemperature,
	instantFlow,
	pressure,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const outletStatus = getTemperatureStatus(outletTemperature);
	const metrics = [
		['Instant Flow', instantFlow, 'm³/hr', SpeedRounded, '#2589D8'],
		[
			'Flow Temperature',
			flowTemperature,
			'°C',
			DeviceThermostatRounded,
			'#7C3AED',
		],
		['Pressure', pressure, '', SpeedRounded, '#16A34A'],
		[
			'Inlet Temperature',
			inletTemperature,
			'°C',
			DeviceThermostatRounded,
			'#2589D8',
		],
		[
			'Outlet Temperature',
			outletTemperature,
			'°C',
			DeviceThermostatRounded,
			'#EF3340',
		],
	];

	return (
		<PremiumMachineCard
			app="SOLAR"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			trend={slaveId ? { url: trendUrl } : null}
			onOpenTrend={onOpenTrend}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(6,minmax(0,1fr))',
					gap: 0.6,
				}}
			>
				{metrics.map(([label, value, unit, Icon, color], index) => (
					<Box
						key={label}
						sx={{
							gridColumn:
								index < 3 ? 'span 2' : index === 3 ? 'span 3' : 'span 3',
							minWidth: 0,
							p: 0.7,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
						}}
					>
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<Box
								sx={{
									width: 24,
									height: 24,
									display: 'grid',
									placeItems: 'center',
									borderRadius: 1,
									color,
									bgcolor: alpha(color, 0.1),
									flexShrink: 0,
								}}
							>
								<Icon sx={{ fontSize: 15 }} />
							</Box>
							<Box minWidth={0}>
								<Typography
									noWrap
									sx={{ fontSize: '0.55rem', color: 'text.secondary' }}
								>
									{label}
								</Typography>
								<Typography
									noWrap
									sx={{ fontSize: '0.78rem', fontWeight: 900 }}
								>
									{formatNumber(value, 2, { fallback: '0' })} {unit}
								</Typography>
							</Box>
						</Stack>
					</Box>
				))}
			</Box>
			{outletStatus && (
				<Box mt={0.75}>
					<Stack direction="row" justifyContent="space-between" mb={0.5}>
						<Typography
							sx={{ fontSize: MACHINE_CARD_DESIGN.helperSize, fontWeight: 800 }}
						>
							System Heat / Operating Range
						</Typography>
						<Typography
							sx={{
								fontSize: '0.55rem',
								fontWeight: 900,
								color: outletStatus.color,
							}}
						>
							{outletStatus.label}
						</Typography>
					</Stack>
					<MachineTemperatureGauge
						value={outletTemperature}
						statusColor={outletStatus.color}
						statusLabel={`Outlet ${outletStatus.label} · ${outletStatus.range}`}
					/>
				</Box>
			)}
			<Box
				sx={{
					mt: 0.75,
					display: 'grid',
					gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
					overflow: 'hidden',
				}}
			>
				{[
					[
						'Temp Delta',
						`${formatNumber(
							Number(outletTemperature) - Number(inletTemperature),
							2,
							{ fallback: '0' }
						)} °C`,
						DeviceThermostatRounded,
						'#EF3340',
					],
					[
						'Avg Temp',
						`${formatNumber(
							(Number(outletTemperature) + Number(inletTemperature)) / 2,
							2,
							{ fallback: '0' }
						)} °C`,
						SpeedRounded,
						'#365B8C',
					],
					[
						'Status',
						status?.toLowerCase() === 'online' ? 'Stable' : 'Needs Attention',
						WarningAmberRounded,
						status?.toLowerCase() === 'online' ? '#16A34A' : '#EF3340',
					],
				].map(([label, value, Icon, color], index) => (
					<Box
						key={label}
						sx={{
							p: 0.65,
							textAlign: 'center',
							borderLeft: index ? '1px solid' : 0,
							borderColor: 'divider',
						}}
					>
						<Icon sx={{ fontSize: 16, color }} />
						<Typography sx={{ fontSize: '0.52rem', color: 'text.secondary' }}>
							{label}
						</Typography>
						<Typography
							noWrap
							sx={{ fontSize: '0.68rem', fontWeight: 900, color }}
						>
							{value}
						</Typography>
					</Box>
				))}
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumSolarMachineCard;
