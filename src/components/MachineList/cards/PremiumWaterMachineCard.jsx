import {
	CalendarMonthRounded,
	EqualizerRounded,
	SpeedRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import PremiumMachineCard from '../../common/PremiumMachineCard';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

const Metric = ({ metric, index }) => {
	const color = index ? '#7C3AED' : '#0891B2';
	const Icon = index ? SpeedRounded : WaterDropRounded;
	return (
		<Box
			sx={{
				minWidth: 0,
				p: 0.8,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
				borderLeft: `3px solid ${color}`,
			}}
		>
			<Stack direction="row" spacing={0.6} alignItems="center">
				<Icon sx={{ fontSize: 18, color }} />
				<Box minWidth={0}>
					<Typography
						noWrap
						sx={{
							fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
							color: 'text.secondary',
						}}
					>
						{metric.label}
					</Typography>
					<Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 900 }}>
						{metric.value}
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

const Period = ({ label, value, color }) => (
	<Box
		sx={{
			minWidth: 0,
			p: 0.75,
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
		}}
	>
		<Stack direction="row" spacing={0.4} alignItems="center">
			<CalendarMonthRounded sx={{ fontSize: 14, color }} />
			<Typography
				sx={{
					fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
					color: 'text.secondary',
				}}
			>
				{label}
			</Typography>
		</Stack>
		<Typography
			noWrap
			sx={{ fontSize: MACHINE_CARD_DESIGN.metricValueSize, fontWeight: 900 }}
		>
			{value}
		</Typography>
	</Box>
);

const PremiumWaterMachineCard = ({
	title,
	status,
	lastUpdated,
	metrics = [],
	today,
	mtd,
	onOpenTrend,
}) => (
	<PremiumMachineCard
		app="WATER"
		title={title}
		status={status}
		lastUpdated={lastUpdated}
		onOpenTrend={onOpenTrend}
	>
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
				gap: 0.65,
			}}
		>
			{metrics.slice(0, 2).map((metric, index) => (
				<Metric key={metric.label} metric={metric} index={index} />
			))}
		</Box>
		<Box
			sx={{
				mt: 0.7,
				display: 'grid',
				gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
				gap: 0.65,
			}}
		>
			<Period label="Today" value={today} color="#EF476F" />
			<Period label="MTD" value={mtd} color="#EF476F" />
		</Box>
		<Box
			sx={{
				mt: 0.7,
				display: 'grid',
				gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
				overflow: 'hidden',
			}}
		>
			{[
				['Last Hour', today, '#365B8C'],
				['Avg (7d)', mtd, '#365B8C'],
				['Peak (7d)', metrics[1]?.value || '-', '#365B8C'],
			].map(([label, value, color], index) => (
				<Box
					key={label}
					sx={{
						minWidth: 0,
						p: 0.65,
						textAlign: 'center',
						borderLeft: index ? '1px solid' : 0,
						borderColor: 'divider',
						bgcolor: alpha(color, 0.018),
					}}
				>
					<EqualizerRounded sx={{ fontSize: 15, color }} />
					<Typography sx={{ fontSize: '0.5rem', color: 'text.secondary' }}>
						{label}
					</Typography>
					<Typography noWrap sx={{ fontSize: '0.65rem', fontWeight: 900 }}>
						{value}
					</Typography>
				</Box>
			))}
		</Box>
	</PremiumMachineCard>
);

export default PremiumWaterMachineCard;
