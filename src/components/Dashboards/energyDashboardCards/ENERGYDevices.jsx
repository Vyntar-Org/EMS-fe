import { OnDeviceTraining } from '@mui/icons-material';
import React from 'react';

import DashboardCard from '../../common/DashboardCard';
import { MiniProgressBar } from '../../common/MachineCardBits';

// Device status is its own semantic color regardless of app theme — green
// means reachable, red means not, independent of any per-card accent.
const ONLINE_COLOR = '#16A34A';
const ACCENT = '#2563EB';

const ENERGYDevices = ({ data }) => {
	const online = data?.online || 0;
	const offline = data?.offline || 0;
	const total = online + offline;
	const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;

	return (
		<DashboardCard
			icon={<OnDeviceTraining />}
			title="Devices"
			accentColor={ACCENT}
			hasData={Boolean(data)}
			value={online}
			unit={`of ${total || 0} online`}
			secondaryMetrics={[{ label: 'Offline', value: offline }]}
			analytics={
				<MiniProgressBar
					percent={onlinePercent}
					color={ONLINE_COLOR}
					label={`${onlinePercent}% online`}
				/>
			}
		/>
	);
};

export default ENERGYDevices;
