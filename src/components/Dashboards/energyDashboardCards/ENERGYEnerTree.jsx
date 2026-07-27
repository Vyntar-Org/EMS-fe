import { Power } from '@mui/icons-material';
import { Box, Divider, Grid } from '@mui/material';
import React from 'react';

import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { MiniMultiDonut } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = '#008300';
const MAIN_COLOR = '#2563EB';
const BACKUP_COLOR = '#EA580C';
const GREEN_COLOR = ACCENT;

const ENERGYEnerTree = ({ data }) => {
	const MetricBlock = ({ label, value, showDivider, unit }) => (
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
					mt={0.5}
					fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
					color={ACCENT}
					fontWeight={800}
					value={`${value?.toLocaleString() || 0} ${unit}`}
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
		<CustomCard flat titleIcon={<Power />} title="Ener Tree" accentColor={ACCENT}>
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
						/>
						<MetricBlock
							label="Backup"
							value={data?.backup || 0}
							showDivider
							unit={data?.unit || ''}
						/>
						<MetricBlock
							label="Green"
							value={data?.green || 0}
							unit={data?.unit || ''}
						/>
					</Grid>
					<MiniMultiDonut
						segments={[
							{ label: 'Main', value: data?.main || 0, color: MAIN_COLOR },
							{
								label: 'Backup',
								value: data?.backup || 0,
								color: BACKUP_COLOR,
							},
							{ label: 'Green', value: data?.green || 0, color: GREEN_COLOR },
						]}
					/>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYEnerTree;
