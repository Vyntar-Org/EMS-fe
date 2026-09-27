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
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const GREEN = '#16A34A';
const RED = '#F23857';

const ChangeBadge = ({ value = 0, comparison }) => {
	const isPositive = value >= 0;
	const color = isPositive ? GREEN : RED;
	const Icon = isPositive ? TrendingUpRounded : TrendingDownRounded;
	return (
		<Box sx={{ flexShrink: 0, textAlign: 'right' }}>
			<Stack direction="row" alignItems="center" spacing={0.25} sx={{ px: 0.55, py: 0.25, borderRadius: 1, bgcolor: alpha(color, 0.08) }}>
				<Icon sx={{ color, fontSize: 15 }} />
				<Typography sx={{ color, fontSize: '0.68rem', fontWeight: 900 }}>
					{isPositive ? '+' : ''}{formatNumber(value, 1, { fallback: '0' })}%
				</Typography>
			</Stack>
			<Typography sx={{ mt: 0.15, color: 'text.secondary', fontSize: '0.5rem' }}>{comparison}</Typography>
		</Box>
	);
};

const TinyTrend = ({ values }) => {
	const points = values.length > 1 ? values : [0, 0];
	const min = Math.min(...points);
	const max = Math.max(...points);
	const line = points.map((value, index) => {
		const x = (index / (points.length - 1)) * 160;
		const y = 24 - ((value - min) / (max - min || 1)) * 16;
		return `${x},${y}`;
	}).join(' ');
	return (
		<Box component="svg" viewBox="0 0 160 28" preserveAspectRatio="none" aria-hidden="true" sx={{ position: 'absolute', left: 8, right: 8, bottom: 3, width: 'calc(100% - 16px)', height: 22 }}>
			<polygon points={`0,28 ${line} 160,28`} fill={alpha(RED, 0.1)} />
			<polyline points={line} fill="none" stroke={RED} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
		</Box>
	);
};

const PrimaryMetric = ({ metric, index, change }) => {
	const color = index ? '#7C3AED' : '#14B8A6';
	return (
		<Box sx={{ position: 'relative', minWidth: 0, minHeight: 54, p: 0.75, pl: 1.15, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, boxShadow: '0 3px 10px rgba(37,69,111,.04)', '&::before': { content: '""', position: 'absolute', left: 0, top: 7, bottom: 7, width: 3, borderRadius: '0 4px 4px 0', bgcolor: color } }}>
			<Stack direction="row" justifyContent="space-between" spacing={0.5}>
				<Box minWidth={0}>
					<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.66rem', fontWeight: 600 }}>{metric.label}</Typography>
					<Typography noWrap sx={{ color: 'text.primary', fontSize: '0.88rem', fontWeight: 900 }}>{metric.value}</Typography>
				</Box>
				<ChangeBadge value={change} comparison="vs. last hour" />
			</Stack>
		</Box>
	);
};

const PeriodMetric = ({ label, value, change, comparison, trendValues }) => (
	<Box sx={{ position: 'relative', minWidth: 0, minHeight: 68, p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, boxShadow: '0 3px 10px rgba(37,69,111,.04)', overflow: 'hidden' }}>
		<Stack direction="row" justifyContent="space-between" spacing={0.5}>
			<Box minWidth={0}>
				<Stack direction="row" spacing={0.4} alignItems="center">
					<CalendarMonthRounded sx={{ color: GREEN, fontSize: 16 }} />
					<Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600 }}>{label}</Typography>
				</Stack>
				<Typography noWrap sx={{ color: 'text.primary', fontSize: '0.86rem', fontWeight: 900 }}>{value}</Typography>
			</Box>
			<ChangeBadge value={change} comparison={comparison} />
		</Stack>
		<TinyTrend values={trendValues} />
	</Box>
);

const SummaryMetric = ({ label, value }) => (
	<Stack direction="row" justifyContent="center" alignItems="center" spacing={0.4} minWidth={0}>
		<EqualizerRounded sx={{ color: 'text.secondary', fontSize: 17 }} />
		<Box minWidth={0}>
			<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.55rem' }}>{label}</Typography>
			<Typography noWrap sx={{ color: 'text.primary', fontSize: '0.68rem', fontWeight: 900 }}>{value}</Typography>
		</Box>
	</Stack>
);

const percentChange = (current, previous) => {
	if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
		return 0;
	}
	return ((current - previous) / Math.abs(previous)) * 100;
};

const PremiumWaterMachineCard = ({ title, status, lastUpdated, metrics = [], today, mtd, consumption, mtdValue, trendUrl, onOpenTrend }) => {
	const [trendValues, setTrendValues] = useState([]);

	useEffect(() => {
		let active = true;
		if (!trendUrl) {
			return () => { active = false; };
		}
		api.get(trendUrl).then((response) => {
			if (!active) {
				return;
			}
			const values = (response?.data?.data || response?.data?.trends || [])
				.map((point) => Number(point?.value ?? point?.rate_of_flow ?? point))
				.filter(Number.isFinite)
				.slice(-24);
			setTrendValues(values);
		}).catch(() => active && setTrendValues([]));
		return () => { active = false; };
	}, [trendUrl]);

	const stats = useMemo(() => {
		const values = trendValues.length ? trendValues : [Number(consumption) || 0];
		const current = values.at(-1);
		const previous = values.length > 1 ? values.at(-2) : current;
		return {
			last: current,
			average: values.reduce((sum, value) => sum + value, 0) / values.length,
			peak: Math.max(...values),
			change: percentChange(current, previous),
		};
	}, [consumption, trendValues]);
	const todayChange = percentChange(Number(consumption), stats.last);
	const mtdChange = percentChange(Number(mtdValue), Number(mtdValue) - Number(consumption));

	return (
		<PremiumMachineCard app="WATER" title={title} status={status} lastUpdated={lastUpdated} onOpenTrend={onOpenTrend}>
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.65 }}>
				{metrics.slice(0, 2).map((metric, index) => <PrimaryMetric key={metric.label} metric={metric} index={index} change={stats.change} />)}
			</Box>
			<Box sx={{ mt: 0.65, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.65 }}>
				<PeriodMetric label="Today" value={today} change={todayChange} comparison="vs. yesterday" trendValues={trendValues} />
				<PeriodMetric label="MTD" value={mtd} change={mtdChange} comparison="vs. last month" trendValues={trendValues} />
			</Box>
			<Box sx={{ mt: 0.65, minHeight: 43, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, overflow: 'hidden', '& > * + *': { borderLeft: '1px solid', borderColor: 'divider' } }}>
				<SummaryMetric label="Last Hour" value={`${formatNumber(stats.last, 2, { fallback: '0' })} KLD`} />
				<SummaryMetric label="Avg (7d)" value={`${formatNumber(stats.average, 2, { fallback: '0' })} KLD`} />
				<SummaryMetric label="Peak (7d)" value={`${formatNumber(stats.peak, 2, { fallback: '0' })} KLD`} />
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumWaterMachineCard;
