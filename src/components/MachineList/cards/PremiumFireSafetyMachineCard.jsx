import {
	AccessTimeRounded,
	CheckCircleRounded,
	DeviceThermostatRounded,
	OpacityRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

/**
 * Dedicated premium card for the Fire Safety machine list: flame icon,
 * title + status pill, timestamp, a Temperature/Water Level metric panel,
 * a temperature scale gauge, and the TREND action last.
 */
const PremiumFireSafetyMachineCard = ({
	title,
	status,
	temperature,
	waterLevel,
	lastUpdated,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const tempStatus = getTemperatureStatus(temperature);

	return (
		<PremiumMachineCard
			app="FIRE-SAFETY"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			trend={slaveId ? { url: trendUrl } : null}
			onOpenTrend={onOpenTrend}
		>
			<MachineMetricPanel
				rows={[
					{
						label: 'Temperature',
						value: `${formatNumber(temperature, 2, { fallback: '0' })} °C`,
					},
					{
						label: 'Water Level',
						value: `${formatNumber(waterLevel, 2, { fallback: '0' })} m`,
					},
				]}
			/>
			{tempStatus && (
				<Box mt={0.6}>
					<Stack direction="row" justifyContent="space-between" mb={0.45}>
						<Typography
							sx={{ fontSize: MACHINE_CARD_DESIGN.helperSize, fontWeight: 800 }}
						>
							Operating Range
						</Typography>
						<Typography
							sx={{
								fontSize: '0.55rem',
								color: tempStatus.color,
								fontWeight: 900,
							}}
						>
							{tempStatus.label}
						</Typography>
					</Stack>
					<MachineTemperatureGauge
						value={temperature}
						statusColor={tempStatus.color}
						statusLabel={`${tempStatus.label} · ${tempStatus.range}`}
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
						'Last Hour',
						`${formatNumber(temperature, 1, { fallback: '0' })} °C`,
						AccessTimeRounded,
						'#2589D8',
					],
					[
						'Avg Level',
						`${formatNumber(waterLevel, 2, { fallback: '0' })} m`,
						OpacityRounded,
						'#7C3AED',
					],
					[
						'Status',
						status?.toLowerCase() === 'online' ? 'Stable' : 'Attention',
						CheckCircleRounded,
						status?.toLowerCase() === 'online' ? '#16A34A' : '#EF3340',
					],
				].map(([label, value, Icon, color], index) => (
					<Box
						key={label}
						sx={{
							minWidth: 0,
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

export default PremiumFireSafetyMachineCard;
