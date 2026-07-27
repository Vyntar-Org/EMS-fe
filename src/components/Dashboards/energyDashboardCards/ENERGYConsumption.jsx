import { ElectricBolt } from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Divider, Grid } from '@mui/material';
import { MiniComparisonBars } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = '#EDA100';

const ENERGYConsumption = ({ data }) => {
	const MetricBlock = ({ label, value, cost, unit, showDivider }) => (
		<Grid
			item
			xs={4}
			sx={{
				display: 'flex',
				position: 'relative',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Box sx={{ textAlign: 'center', width: '100%', px: 0.5 }}>
				<ResponsiveTextWrapper
					variant="caption"
					color="text.secondary"
					fontWeight={700}
					textTransform="uppercase"
					fontSize={{ xs: '9.5px', md: '11px' }}
					value={label}
				/>

				<ResponsiveTextWrapper
					fontSize={{ xs: '13px', sm: '14px', md: '16px' }}
					color={ACCENT}
					fontWeight={800}
					mt={0.5}
					value={value?.toLocaleString() || 0}
				/>

				<ResponsiveTextWrapper
					color={ACCENT}
					fontWeight={500}
					fontSize={{ xs: '10.5px', md: '12px' }}
					value={unit}
				/>

				<ResponsiveTextWrapper
					variant="body2"
					color="text.primary"
					fontWeight={600}
					borderRadius={1}
					mt={0.5}
					fontSize={{ xs: '11px', md: '13px' }}
					value={`₹ ${cost?.toLocaleString() || 0}`}
					tooltipValue={`COST = ₹ ${cost?.toLocaleString() || 0}`}
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

	const todayValue = Number(data?.today?.value) || 0;
	const yesterdayValue = Number(data?.yesterday?.value) || 0;

	return (
		<CustomCard
			titleIcon={<ElectricBolt />}
			title="Energy Consumption"
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
							label="MTD"
							value={data.mtd?.value}
							cost={data.mtd?.cost}
							unit={data.unit}
							showDivider
						/>
						<MetricBlock
							label="Today"
							value={data.today?.value}
							cost={data.today?.cost}
							unit={data.unit}
							showDivider
						/>
						<MetricBlock
							label="Yesterday"
							value={data.yesterday?.value}
							cost={data.yesterday?.cost}
							unit={data.unit}
						/>
					</Grid>
					<MiniComparisonBars
						todayValue={todayValue}
						yesterdayValue={yesterdayValue}
						color={ACCENT}
						height={14}
					/>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYConsumption;
