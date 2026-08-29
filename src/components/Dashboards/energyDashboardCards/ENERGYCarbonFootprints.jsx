import { Co2 } from '@mui/icons-material';
import React from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { Box, Divider, Grid } from '@mui/material';
import { MiniColumnChart } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import { formatNumber } from '../../../helpers/formatters';

const ACCENT = '#1BAF7A';
const MAIN_COLOR = '#2563EB';
const BACKUP_COLOR = '#EA580C';
const GREEN_COLOR = ACCENT;

const ENERGYCarbonFootprints = ({ data }) => {
	const MetricBlock = ({ label, value, showDivider, unit, bars = [] }) => (
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
					color="text.primary"
					fontWeight={700}
					textTransform="uppercase"
					fontSize={{ xs: '9.5px', md: '11px' }}
					value={label}
				/>

				<ResponsiveTextWrapper
					mt={1.5}
					fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
					color={ACCENT}
					fontWeight={800}
					value={formatNumber(value, 2, { fallback: '0', useGrouping: true })}
				/>
				<ResponsiveTextWrapper
					mt={0.5}
					fontSize={{ xs: '12px', sm: '13px' }}
					color={ACCENT}
					fontWeight={800}
					value={unit}
					mb={1.5}
				/>
				<MiniColumnChart height={50} bars={bars} />
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
		<CustomCard
			titleIcon={<Co2 />}
			title="Carbon Footprints"
			accentColor={ACCENT}
		>
			{data ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						gap: 0.5,
					}}
				>
					<Grid container sx={{ width: '100%' }} alignItems="center">
						<MetricBlock
							label="Main"
							value={data?.main || 0}
							showDivider
							unit={data?.unit || ''}
							bars={[{ value: data?.main || 0, color: MAIN_COLOR }]}
						/>

						<MetricBlock
							label="Backup"
							value={data?.backup || 0}
							showDivider
							unit={data?.unit || ''}
							bars={[{ value: data?.backup || 0, color: BACKUP_COLOR }]}
						/>
						<MetricBlock
							label="Green"
							value={data?.green || 0}
							unit={data?.unit || ''}
							bars={[{ value: data?.green || 0, color: GREEN_COLOR }]}
						/>
					</Grid>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYCarbonFootprints;
