import { Box } from '@mui/material';

import { formatNumber } from '../../../helpers/formatters';
import { getTemperatureAppStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

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
	const tempStatus = getTemperatureAppStatus(temperature);

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
					color: /temperature/i.test(label) ? tempStatus?.color : undefined,
				}))}
			/>
			{tempStatus && (
				<Box mt={0.6}>
					<MachineTemperatureGauge
						value={temperature}
						statusColor={tempStatus.color}
						statusLabel={`${tempStatus.label} · ${tempStatus.range}`}
						useStatusColor
					/>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumTemperatureMachineCard;
