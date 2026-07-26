import { MachineMetricPanel } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

/**
 * Dedicated premium card for the Water machine list: water-drop icon,
 * title + status pill, timestamp, a soft metric panel (Inlet Flowrate /
 * Inlet Totalizer), Today/MTD stats, and the TREND action last.
 */
const PremiumWaterMachineCard = ({
	title,
	status,
	lastUpdated,
	metrics = [],
	today,
	mtd,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => (
	<PremiumMachineCard
		app="WATER"
		title={title}
		status={status}
		lastUpdated={lastUpdated}
		todayMtd={{ todayValue: today, mtdValue: mtd }}
		trend={slaveId ? { url: trendUrl } : null}
		onOpenTrend={onOpenTrend}
	>
		<MachineMetricPanel rows={metrics} />
	</PremiumMachineCard>
);

export default PremiumWaterMachineCard;
