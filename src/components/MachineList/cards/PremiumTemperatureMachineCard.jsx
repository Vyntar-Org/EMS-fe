import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { api } from '../../../helpers/api';
import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import {
	MachineMetricPanel,
	MachineTemperatureGauge,
	MachineTrendSparkline,
} from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

/**
 * Dedicated premium card for the Temperature machine list: thermostat icon,
 * title + status pill, timestamp, a Temperature/Humidity/Battery metric
 * panel tinted by the current temperature band, a cold→hot scale gauge, a
 * 6-hour temperature line graph (same data as the TREND modal, fetched
 * quietly per card), and the TREND action last.
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
	const [sparklineValues, setSparklineValues] = useState(null);

	useEffect(() => {
		if (!slaveId || !trendUrl) {
			setSparklineValues(null);
			return undefined;
		}

		let cancelled = false;

		(async () => {
			try {
				const res = await api.get(trendUrl);
				if (!cancelled && res?.success) {
					setSparklineValues(
						(res?.data?.data || []).map((item) => Number(item.value))
					);
				}
			} catch (error) {
				console.error('Temperature sparkline fetch failed:', error);
				if (!cancelled) {
					setSparklineValues(null);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [slaveId, trendUrl]);

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
			{sparklineValues && sparklineValues.length > 1 && (
				<Box mt={1.25}>
					<MachineTrendSparkline
						data={sparklineValues}
						color={tempStatus?.color}
						label="Temperature · Last 6 hrs"
						caption={`${sparklineValues[sparklineValues.length - 1].toFixed(
							1
						)} °C`}
					/>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumTemperatureMachineCard;
