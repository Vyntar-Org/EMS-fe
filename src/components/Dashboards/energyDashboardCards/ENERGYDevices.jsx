import { OnDeviceTraining } from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Divider, Grid, Typography } from '@mui/material';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ONLINE_COLOR = '#16A34A';
const OFFLINE_COLOR = '#DC2626';

const ENERGYDevices = ({ data }) => {
	const MetricBlock = ({ label, value, showDivider }) => (
		<Grid
			item
			xs={6}
			sx={{
				display: 'flex',
				position: 'relative',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Box sx={{ textAlign: 'center', width: '100%', px: 0.5 }}>
				<ResponsiveTextWrapper
					fontSize="16px"
					variant="caption"
					fontWeight={700}
					textTransform="uppercase"
					value={label}
					color={label === 'ONLINE' ? ONLINE_COLOR : OFFLINE_COLOR}
				/>

				<ResponsiveTextWrapper
					fontSize="26px"
					color={label === 'ONLINE' ? ONLINE_COLOR : OFFLINE_COLOR}
					fontWeight={800}
					mt={1}
					value={value?.toLocaleString() || 0}
				/>
			</Box>

			{showDivider && (
				<Divider
					orientation="vertical"
					sx={{
						borderStyle: 'dashed',
						height: '100%',
						position: 'absolute',
						right: 0,
					}}
				/>
			)}
		</Grid>
	);

	return (
		<CustomCard titleIcon={<OnDeviceTraining />} title="Devices">
			{data ? (
				<Grid
					container
					sx={{ height: '100%', width: '100%' }}
					alignItems="center"
				>
					<MetricBlock label="ONLINE" value={data?.online || 0} showDivider />
					<MetricBlock label="OFFLINE" value={data?.offline || 0} />
				</Grid>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYDevices;
