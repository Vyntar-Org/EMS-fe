import { Box } from '@mui/material';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';

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
				<Box mt={1.25}>
					<MachineTemperatureGauge
						value={temperature}
						statusColor={tempStatus.color}
						statusLabel={`${tempStatus.label} · ${tempStatus.range}`}
					/>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumFireSafetyMachineCard;
