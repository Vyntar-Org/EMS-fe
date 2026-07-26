import { OnDeviceTraining } from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Stack } from '@mui/material';
import { MachineRatioDonut } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

// Device status is its own semantic color regardless of app theme — green
// means reachable, red means not, independent of any per-card accent.
const ONLINE_COLOR = '#16A34A';
const OFFLINE_COLOR = '#DC2626';
const ACCENT = '#2563EB';

const CountChip = ({ label, value, color }) => (
	<Stack direction="row" alignItems="center" gap={0.5} minWidth={0}>
		<Box
			sx={{
				width: 6,
				height: 6,
				borderRadius: '50%',
				bgcolor: color,
				flexShrink: 0,
			}}
		/>
		<ResponsiveTextWrapper
			value={`${value} ${label}`}
			fontSize="10.5px"
			fontWeight={700}
			color={color}
		/>
	</Stack>
);

const ENERGYDevices = ({ data }) => {
	const online = data?.online || 0;
	const offline = data?.offline || 0;
	const total = online + offline;
	const onlinePercent = total > 0 ? (online / total) * 100 : 0;

	return (
		<CustomCard
			titleIcon={<OnDeviceTraining />}
			title="Devices"
			accentColor={ACCENT}
		>
			{data ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						gap: 1,
					}}
				>
					<MachineRatioDonut
						percent={onlinePercent}
						color={ONLINE_COLOR}
						label="Devices online"
						caption={`${online} of ${total || 0} total`}
					/>
					<Stack direction="row" justifyContent="center" gap={1.5}>
						<CountChip label="Online" value={online} color={ONLINE_COLOR} />
						<CountChip label="Offline" value={offline} color={OFFLINE_COLOR} />
					</Stack>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYDevices;
