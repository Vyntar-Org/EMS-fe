import {
	CalendarMonthRounded,
	EqualizerRounded,
	TrendingDownRounded,
	TrendingUpRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../helpers/api';
import { formatNumber } from '../../../helpers/formatters';
import {
	APP_ACCENT_COLOR,
	MachineMetricPanel,
} from '../../common/MachineCardBits';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const POSITIVE = '#16A34A';
const NEGATIVE = '#F23857';

const formatMetricValue = (metric) => {
	const numericValue = formatNumber(metric?.value, 2, { fallback: null });
	const value = numericValue ?? metric?.value ?? '-';
	return `${value}${metric?.unit ? ` ${metric.unit}` : ''}`;
};

const getPointValue = (point, metric) => {
	if (typeof point === 'number') {
		return point;
	}
	if (!point || typeof point !== 'object') {
		return Number.NaN;
	}

	const preferredKeys = [
		metric?.metric_key,
		metric?.label,
		'value',
		'actual',
	].filter(Boolean);
	for (const key of preferredKeys) {
		const numericValue = Number(point[key]);
		if (Number.isFinite(numericValue)) {
			return numericValue;
		}
	}

	const ignoredKeys = new Set([
		'timestamp',
		'datetime',
		'date_time',
		'date',
		'time',
		'created_at',
	]);
	return Object.entries(point).reduce((result, [key, value]) => {
		if (Number.isFinite(result) || ignoredKeys.has(key.toLowerCase())) {
			return result;
		}
		const numericValue = Number(value);
		return Number.isFinite(numericValue) ? numericValue : result;
	}, Number.NaN);
};

const percentChange = (current, previous) => {
	if (
		!Number.isFinite(current) ||
		!Number.isFinite(previous) ||
		previous === 0
	) {
		return null;
	}
	return ((current - previous) / Math.abs(previous)) * 100;
};

const ChangeBadge = ({ value }) => {
	if (!Number.isFinite(value)) {
		return null;
	}

	const isPositive = value >= 0;
	const color = isPositive ? POSITIVE : NEGATIVE;
	const Icon = isPositive ? TrendingUpRounded : TrendingDownRounded;

	return (
		<Box sx={{ flexShrink: 0, textAlign: 'right' }}>
			<Stack
				direction="row"
				alignItems="center"
				spacing={0.25}
				sx={{
					px: 0.55,
					py: 0.25,
					borderRadius: 1,
					bgcolor: alpha(color, 0.08),
				}}
			>
				<Icon sx={{ color, fontSize: 15 }} />
				<Typography sx={{ color, fontSize: '0.68rem', fontWeight: 900 }}>
					{isPositive ? '+' : ''}
					{formatNumber(value, 1, { fallback: '0' })}%
				</Typography>
			</Stack>
			<Typography
				sx={{ mt: 0.15, color: 'text.secondary', fontSize: '0.5rem' }}
			>
				latest interval
			</Typography>
		</Box>
	);
};

const TinyTrend = ({ values, color }) => {
	if (values.length < 2) {
		return null;
	}

	const min = Math.min(...values);
	const max = Math.max(...values);
	const line = values
		.map((value, index) => {
			const x = (index / (values.length - 1)) * 160;
			const y = 24 - ((value - min) / (max - min || 1)) * 16;
			return `${x},${y}`;
		})
		.join(' ');

	return (
		<Box
			component="svg"
			viewBox="0 0 160 28"
			preserveAspectRatio="none"
			aria-label="Recent machine readings"
			sx={{
				position: 'absolute',
				left: 8,
				right: 8,
				bottom: 3,
				width: 'calc(100% - 16px)',
				height: 22,
			}}
		>
			<polygon points={`0,28 ${line} 160,28`} fill={alpha(color, 0.1)} />
			<polyline
				points={line}
				fill="none"
				stroke={color}
				strokeWidth="2.3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Box>
	);
};

const PeriodMetric = ({ label, value, trendValues, color }) => (
	<Box
		sx={{
			position: 'relative',
			minWidth: 0,
			minHeight: 68,
			p: 0.75,
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			boxShadow: '0 3px 10px rgba(37,69,111,.04)',
			overflow: 'hidden',
		}}
	>
		<Stack direction="row" spacing={0.4} alignItems="center">
			<CalendarMonthRounded sx={{ color, fontSize: 16 }} />
			<Typography
				sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600 }}
			>
				{label}
			</Typography>
		</Stack>
		<Typography
			noWrap
			sx={{ color: 'text.primary', fontSize: '0.86rem', fontWeight: 900 }}
		>
			{value}
		</Typography>
		<TinyTrend values={trendValues} color={color} />
	</Box>
);

const SummaryMetric = ({ label, value }) => (
	<Stack
		direction="row"
		justifyContent="center"
		alignItems="center"
		spacing={0.4}
		minWidth={0}
	>
		<EqualizerRounded sx={{ color: 'text.secondary', fontSize: 17 }} />
		<Box minWidth={0}>
			<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.55rem' }}>
				{label}
			</Typography>
			<Typography
				noWrap
				sx={{ color: 'text.primary', fontSize: '0.68rem', fontWeight: 900 }}
			>
				{value}
			</Typography>
		</Box>
	</Stack>
);

/**
 * Standard card shared by every non-unique STP and Flow Meter machine type.
 * Its metric, period and analytics sections deliberately follow the Water
 * Monitoring card's layout while retaining each machine's own fields/units.
 */
const PremiumFlowCardMachineCard = ({
	app,
	title,
	status,
	lastUpdated,
	metrics = [],
	today,
	mtd,
	trendUrl,
	onOpenTrend,
}) => {
	const [trendValues, setTrendValues] = useState([]);
	const primaryMetric = metrics[0];
	const accent = APP_ACCENT_COLOR[app] || '#2E90E5';

	useEffect(() => {
		let active = true;
		if (!trendUrl || !primaryMetric) {
			setTrendValues([]);
			return () => {
				active = false;
			};
		}

		api
			.get(trendUrl)
			.then((response) => {
				if (!active) {
					return;
				}
				const rows = response?.data?.trends || response?.data?.data || [];
				setTrendValues(
					rows
						.map((point) => getPointValue(point, primaryMetric))
						.filter(Number.isFinite)
						.slice(-24)
				);
			})
			.catch(() => active && setTrendValues([]));

		return () => {
			active = false;
		};
	}, [primaryMetric, trendUrl]);

	const stats = useMemo(() => {
		if (!trendValues.length) {
			return null;
		}
		const current = trendValues.at(-1);
		const previous = trendValues.length > 1 ? trendValues.at(-2) : null;
		return {
			latest: current,
			average:
				trendValues.reduce((sum, value) => sum + value, 0) / trendValues.length,
			peak: Math.max(...trendValues),
			change: percentChange(current, previous),
		};
	}, [trendValues]);

	const unit = primaryMetric?.unit ? ` ${primaryMetric.unit}` : '';
	const hasPeriodMetrics = today !== undefined || mtd !== undefined;

	return (
		<PremiumMachineCard
			app={app}
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			onOpenTrend={onOpenTrend}
			footer={metrics.length ? undefined : null}
		>
			{metrics.length ? (
				<Box position="relative">
					<MachineMetricPanel
						rows={metrics.map((metric) => ({
							label: metric?.label || metric?.metric_key || 'Metric',
							value: formatMetricValue(metric),
						}))}
					/>
					{Number.isFinite(stats?.change) && metrics.length === 1 ? (
						<Box sx={{ position: 'absolute', top: 5, right: 5 }}>
							<ChangeBadge value={stats.change} />
						</Box>
					) : null}
				</Box>
			) : (
				<Box
					sx={{
						minHeight: 52,
						display: 'grid',
						placeItems: 'center',
						border: '1px dashed',
						borderColor: 'divider',
						borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
					}}
				>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
						No live metrics available
					</Typography>
				</Box>
			)}

			{hasPeriodMetrics ? (
				<Box
					sx={{
						mt: 0.65,
						display: 'grid',
						gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
						gap: 0.65,
					}}
				>
					<PeriodMetric
						label="Today"
						value={today ?? '-'}
						trendValues={trendValues}
						color={accent}
					/>
					<PeriodMetric
						label="MTD"
						value={mtd ?? '-'}
						trendValues={trendValues}
						color={accent}
					/>
				</Box>
			) : null}

			<Box
				sx={{
					mt: 0.65,
					minHeight: 43,
					display: 'grid',
					gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
					alignItems: 'center',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
					overflow: 'hidden',
					'& > * + *': { borderLeft: '1px solid', borderColor: 'divider' },
				}}
			>
				<SummaryMetric
					label="Latest"
					value={
						stats
							? `${formatNumber(stats.latest, 2, { fallback: '-' })}${unit}`
							: '-'
					}
				/>
				<SummaryMetric
					label="Average"
					value={
						stats
							? `${formatNumber(stats.average, 2, { fallback: '-' })}${unit}`
							: '-'
					}
				/>
				<SummaryMetric
					label="Peak"
					value={
						stats
							? `${formatNumber(stats.peak, 2, { fallback: '-' })}${unit}`
							: '-'
					}
				/>
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumFlowCardMachineCard;
