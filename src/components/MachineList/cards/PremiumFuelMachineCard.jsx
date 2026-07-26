import { MachineMetricPanel } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

/**
 * Dedicated premium card for the Fuel machine list: gas-can icon, Rate of
 * Flow / Totalizer metric panel, Today (consumption) / MTD stats, and the
 * TREND action last.
 */
const PremiumFuelMachineCard = ({
	title,
	status,
	lastUpdated,
	consumption,
	rateOfFlow,
	totalizer,
	mtd,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => (
	<PremiumMachineCard
		app="FUEL"
		title={title}
		status={status}
		lastUpdated={lastUpdated}
		todayMtd={{
			todayValue: `${Number(consumption ?? 0).toFixed(2)} KLD`,
			mtdValue: `${Number(mtd ?? 0).toFixed(2)} KLD`,
		}}
		trend={slaveId ? { url: trendUrl } : null}
		onOpenTrend={onOpenTrend}
	>
		<MachineMetricPanel
			rows={[
				{
					label: 'Rate of Flow',
					value: `${Number(rateOfFlow ?? 0).toFixed(2)} m³/h`,
				},
				{
					label: 'Totalizer',
					value: `${Number(totalizer ?? 0).toFixed(1)} m³`,
				},
			]}
		/>
	</PremiumMachineCard>
);

export default PremiumFuelMachineCard;
