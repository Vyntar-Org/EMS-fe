import {
	DeviceHub,
	OnDeviceTraining,
	OnDeviceTrainingOutlined,
} from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Stack } from '@mui/material';
import {
	MachineRatioDonut,
	MiniMultiDonut,
} from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

// Device status is its own semantic color regardless of app theme — green
// means reachable, red means not, independent of any per-card accent.
const ONLINE_COLOR = '#16A34A';
const OFFLINE_COLOR = '#DC2626';
const ACCENT = '#2563EB';

const CountChip = ({ label, value, color }) => (
	<Stack
		direction="column"
		alignItems="center"
		textAlign="center"
		gap={0.5}
		minWidth={0}
	>
		<ResponsiveTextWrapper
			value={label}
			// fontSize="14px"
			fontWeight={700}
			color={color}
		/>
		<ResponsiveTextWrapper
			value={value}
			fontSize="14px"
			fontWeight={700}
			color={color}
		/>
	</Stack>
);

const ENERGYDevices = ({ data }) => {
	const online = data?.online || 0;
	const offline = data?.offline || 0;
	// const total = online + offline;
	// const onlinePercent = total > 0 ? (online / total) * 100 : 0;

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
						// flexDirection: 'column',
						justifyContent: 'center',
						// gap: 1,
					}}
				>
					<MiniMultiDonut
						icon={OnDeviceTrainingOutlined}
						isThin
						size={110}
						segments={[
							{ value: online, color: ONLINE_COLOR },
							{
								value: offline,
								color: OFFLINE_COLOR,
							},
						]}
					/>

					{/* <MachineRatioDonut
						percent={onlinePercent}
						color={ONLINE_COLOR}
						label="Devices online"
						caption={`${online} of ${total || 0} total`}
					/> */}
					<Stack
						direction="column"
						justifyContent="center"
						gap={1}
						width="calc(100% - 110px - 16px)"
					>
						<CountChip label="ONLINE" value={online} color={ONLINE_COLOR} />
						<CountChip label="OFFLINE" value={offline} color={OFFLINE_COLOR} />
					</Stack>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYDevices;
