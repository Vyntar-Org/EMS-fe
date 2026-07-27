import { Balance } from '@mui/icons-material';
import { Box, Divider, Grid, Typography } from '@mui/material';
import React from 'react';

import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { MiniGaugeArc } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = '#4A3AA7';

const ENERGYLoadBalance = ({ data }) => {
	const MetricBlock = ({ label, value, cost, unit, showDivider }) => (
		<Grid
			item
			xs={12}
			sx={{
				display: 'flex',
				position: 'relative',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<Box sx={{ width: '60%' }}>
				<ResponsiveTextWrapper
					variant="caption"
					color="text.secondary"
					fontWeight={700}
					textTransform="uppercase"
					fontSize={{ xs: '9.5px', md: '11px' }}
					value={label}
				/>
			</Box>

			<Box sx={{ width: '40%' }} textAlign="end">
				<ResponsiveTextWrapper
					fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
					color={ACCENT}
					fontWeight={800}
					value={`${value?.toLocaleString() || 0} ${unit && unit}`}
				/>
			</Box>
			{showDivider && (
				<Divider
					sx={{
						borderStyle: 'dashed',
						height: '1px',
						width: '100%',
						position: 'absolute',
						bottom: 0,
					}}
				/>
			)}
		</Grid>
	);

	const lbi = Number(data?.lbi) || 0;

	return (
		<CustomCard
			flat
			titleIcon={<Balance />}
			title="Load Balance"
			accentColor={ACCENT}
		>
			{data ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
					}}
				>
					<Grid container sx={{ width: '100%' }} alignItems="center">
						<MetricBlock
							label="IR"
							value={data?.ir || 0}
							showDivider
							unit={data?.unit || ''}
						/>
						<MetricBlock
							label="IY"
							value={data?.iy || 0}
							showDivider
							unit={data?.unit || ''}
						/>
						<MetricBlock
							label="IB"
							value={data?.ib || 0}
							unit={data?.unit || ''}
							showDivider
						/>
					</Grid>
					<Box px={0.25} pb={0.5}>
						<MiniGaugeArc percent={lbi} color={ACCENT} label="Current LBI" />
					</Box>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYLoadBalance;
