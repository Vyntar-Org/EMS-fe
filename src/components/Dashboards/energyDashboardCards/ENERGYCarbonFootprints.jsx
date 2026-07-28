import { Co2 } from '@mui/icons-material';
import React from 'react';

import DashboardCard from '../../common/DashboardCard';
import { MiniColumnChart } from '../../common/MachineCardBits';

const ACCENT = '#1BAF7A';
const MAIN_COLOR = '#2563EB';
const BACKUP_COLOR = '#EA580C';
const GREEN_COLOR = ACCENT;

const ENERGYCarbonFootprints = ({ data }) => {
	return (
		<DashboardCard
			icon={<Co2 />}
			title="Carbon Footprints"
			accentColor={ACCENT}
			hasData={Boolean(data)}
			value={data?.main || 0}
			unit={data?.unit || ''}
			secondaryMetrics={[
				{ label: 'Backup', value: data?.backup || 0, unit: data?.unit || '' },
				{ label: 'Green', value: data?.green || 0, unit: data?.unit || '' },
			]}
			analytics={
				<MiniColumnChart
					bars={[
						{ label: 'Main', value: data?.main || 0, color: MAIN_COLOR },
						{ label: 'Backup', value: data?.backup || 0, color: BACKUP_COLOR },
						{ label: 'Green', value: data?.green || 0, color: GREEN_COLOR },
					]}
				/>
			}
		/>
	);
};

export default ENERGYCarbonFootprints;
