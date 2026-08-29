import { MachineMetricPanel } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import { formatNumber } from '../../../helpers/formatters';

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
			todayValue: `${formatNumber(consumption, 2, { fallback: '0' })} KLD`,
			mtdValue: `${formatNumber(mtd, 2, { fallback: '0' })} KLD`,
		}}
		trend={slaveId ? { url: trendUrl } : null}
		onOpenTrend={onOpenTrend}
	>
		<MachineMetricPanel
			rows={[
				{
					label: 'Rate of Flow',
					value: `${formatNumber(rateOfFlow, 2, { fallback: '0' })} m³/h`,
				},
				{
					label: 'Totalizer',
					value: `${formatNumber(totalizer, 2, { fallback: '0' })} m³`,
				},
			]}
		/>
	</PremiumMachineCard>
);

export default PremiumFuelMachineCard;
