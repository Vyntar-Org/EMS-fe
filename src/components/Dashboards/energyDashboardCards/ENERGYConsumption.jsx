import { ElectricBolt } from '@mui/icons-material';
import React from 'react';

import DashboardCard from '../../common/DashboardCard';
import { MiniComparisonBars } from '../../common/MachineCardBits';

const ACCENT = '#EDA100';

const ENERGYConsumption = ({ data }) => {
	const todayValue = Number(data?.today?.value) || 0;
	const yesterdayValue = Number(data?.yesterday?.value) || 0;

	return (
		<DashboardCard
			icon={<ElectricBolt />}
			title="Energy Consumption"
			accentColor={ACCENT}
			hasData={Boolean(data)}
			value={data?.today?.value || 0}
			unit={data?.unit}
			secondaryMetrics={[
				{ label: 'MTD', value: data?.mtd?.value, unit: data?.unit },
				{ label: 'Yesterday', value: data?.yesterday?.value, unit: data?.unit },
			]}
			supportingText={`Today's cost: ₹ ${data?.today?.cost?.toLocaleString() || 0}`}
			analytics={
				<MiniComparisonBars
					todayValue={todayValue}
					yesterdayValue={yesterdayValue}
					color={ACCENT}
					height={14}
				/>
			}
		/>
	);
};

export default ENERGYConsumption;
