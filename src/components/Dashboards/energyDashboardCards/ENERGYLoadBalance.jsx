import { Balance } from '@mui/icons-material';
import React from 'react';

import DashboardCard from '../../common/DashboardCard';
import { MiniGaugeArc } from '../../common/MachineCardBits';

const ACCENT = '#4A3AA7';

const ENERGYLoadBalance = ({ data }) => {
	const lbi = Number(data?.lbi) || 0;

	return (
		<DashboardCard
			icon={<Balance />}
			title="Load Balance"
			accentColor={ACCENT}
			hasData={Boolean(data)}
			value={data?.ir || 0}
			unit={data?.unit || ''}
			secondaryMetrics={[
				{ label: 'IY', value: data?.iy || 0, unit: data?.unit || '' },
				{ label: 'IB', value: data?.ib || 0, unit: data?.unit || '' },
			]}
			analytics={
				<MiniGaugeArc percent={lbi} color={ACCENT} label="Current LBI" />
			}
		/>
	);
};

export default ENERGYLoadBalance;
