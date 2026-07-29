import { Balance } from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Divider, Grid, Typography } from '@mui/material';
import {
	CustomProgressBar,
	MachineRatioDonut,
	MiniGaugeArc,
} from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = '#4A3AA7';

const ENERGYLoadBalance = ({ data }) => {
	const MetricBlock = ({
		label,
		value,
		cost,
		unit,
		showDivider,
		trackColor,
		color,
	}) => (
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
			<Box>
				<ResponsiveTextWrapper
					variant="caption"
					color="text.primary"
					fontWeight={700}
					textTransform="uppercase"
					fontSize={{ xs: '9.5px' }}
					value={label}
				/>
			</Box>
			<Box width="88%">
				<CustomProgressBar
					trackColor={trackColor}
					color={color}
					value={value}
					unit={unit && unit}
				/>
			</Box>
			{/* <Box sx={{ width: '40%' }} textAlign="end"> */}
			{/* <ResponsiveTextWrapper
				fontSize={{ xs: '12px' }}
				color={ACCENT}
				fontWeight={800}
				value={`${value?.toLocaleString() || 0} ${unit && unit}`}
			/> */}
			{/* </Box> */}
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
					<Grid container sx={{ width: '100%' }} alignItems="center" rowGap={1}>
						<MetricBlock
							label="IR"
							value={data?.ir || 0}
							unit={data?.unit || ''}
							color="#D60000"
							trackColor="#FCA5A5"
						/>
						<MetricBlock
							label="IY"
							value={data?.iy || 0}
							unit={data?.unit || ''}
							color="#F59E0B"
							trackColor="#FEF3C7"
						/>
						<MetricBlock
							label="IB"
							value={data?.ib || 0}
							unit={data?.unit || ''}
							color="#0059FF"
							trackColor="#BFDBFE"
							// showDivider
						/>
					</Grid>
					<Divider
						sx={{
							borderStyle: 'dashed',
						}}
					/>

					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						width="100%"
					>
						<ResponsiveTextWrapper
							color="text.primary"
							fontWeight={700}
							fontSize="14px"
							textTransform="uppercase"
							value="Current LBI"
						/>

						<Box>
							<MachineRatioDonut color={ACCENT} percent={lbi} />
						</Box>
					</Box>
					{/* <Box px={0.25} pb={0.5}>
						<MiniGaugeArc percent={lbi} color={ACCENT} label="Current LBI" />
					</Box> */}
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYLoadBalance;
