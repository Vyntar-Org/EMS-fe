import { Box } from '@mui/material';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';

/**
 * Dedicated premium card for the Temperature machine list: thermostat icon,
 * title + status pill, timestamp, a metric panel built from whichever
 * parameters the backend actually returned for this device, a cold→hot
 * scale gauge, and the TREND action last.
 */
const PremiumTemperatureMachineCard = ({
	title,
	status,
	temperature,
	metrics,
	lastUpdated,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const tempStatus = getTemperatureStatus(temperature);

	return (
		<PremiumMachineCard
			app="TEMPERATURE"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			accentColor={tempStatus?.color}
			trend={slaveId ? { url: trendUrl } : null}
			onOpenTrend={onOpenTrend}
		>
			<MachineMetricPanel
				rows={(metrics || []).map(({ label, value, unit }) => ({
					label,
					value: `${formatNumber(value, 2, { fallback: '0' })}${
						unit ? ` ${unit}` : ''
					}`,
				}))}
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

export default PremiumTemperatureMachineCard;
