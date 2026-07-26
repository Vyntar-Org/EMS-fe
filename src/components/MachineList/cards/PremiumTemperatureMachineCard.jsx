import { Box } from '@mui/material';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

/**
 * Dedicated premium card for the Temperature machine list: thermostat icon,
 * title + status pill, timestamp, a Temperature/Humidity/Battery metric
 * panel tinted by the current temperature band, a cold→hot scale gauge, and
 * the TREND action last.
 */
const PremiumTemperatureMachineCard = ({
	title,
	status,
	temperature,
	humidity,
	battery,
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
				rows={[
					{
						label: 'Temperature',
						value: `${Number(temperature ?? 0).toFixed(2)} °C`,
					},
					{ label: 'Humidity', value: `${Number(humidity ?? 0).toFixed(1)} %` },
					{ label: 'Battery', value: `${Number(battery ?? 0).toFixed(2)} V` },
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

export default PremiumTemperatureMachineCard;
