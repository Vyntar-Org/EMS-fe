import { Box } from '@mui/material';

import { APP_ACCENT_COLOR, MachineMetricPanel, MachineRatioDonut } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';

/**
 * Dedicated premium card for the Water machine list: water-drop icon,
 * title + status pill, timestamp, a soft metric panel (Inlet Flowrate /
 * Inlet Totalizer), a Today-vs-MTD analytics donut, Today/MTD stats, and
 * the TREND action last.
 */
const PremiumWaterMachineCard = ({
	title,
	status,
	lastUpdated,
	metrics = [],
	today,
	mtd,
	consumption,
	mtdValue,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const todayNum = Number(consumption ?? 0);
	const mtdNum = Number(mtdValue ?? 0);
	const donutPercent = mtdNum > 0 ? (todayNum / mtdNum) * 100 : 0;

	return (
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
			<Box mt={1.25}>
				<MachineRatioDonut
					percent={donutPercent}
					color={APP_ACCENT_COLOR.WATER}
					label="Today's share of MTD"
					caption={today}
				/>
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumWaterMachineCard;
