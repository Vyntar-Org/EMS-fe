import { Box } from '@mui/material';

import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';

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

	return (
		<PremiumMachineCard
			app="SOLAR"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			trend={slaveId ? { url: trendUrl } : null}
			onOpenTrend={onOpenTrend}
		>
			<MachineMetricPanel
				rows={[
					{
						label: 'Instant Flow',
						value: `${formatNumber(instantFlow, 2, { fallback: '0' })} m³/hr`,
					},
					{
						label: 'Flow Temperature',
						value: `${formatNumber(flowTemperature, 2, { fallback: '0' })} °C`,
					},
					{
						label: 'Pressure',
						value: formatNumber(pressure, 2, { fallback: '0' }),
					},
					{
						label: 'Inlet Temperature',
						value: `${formatNumber(inletTemperature, 2, { fallback: '0' })} °C`,
					},
					{
						label: 'Outlet Temperature',
						value: `${formatNumber(outletTemperature, 2, {
							fallback: '0',
						})} °C`,
					},
				]}
			/>
			{outletStatus && (
				<Box mt={1.25}>
					<MachineTemperatureGauge
						value={outletTemperature}
						statusColor={outletStatus.color}
						statusLabel={`Outlet ${outletStatus.label} · ${outletStatus.range}`}
					/>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumSolarMachineCard;
