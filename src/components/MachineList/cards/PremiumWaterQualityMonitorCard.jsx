import {
	CalendarMonthRounded,
	ChevronRightRounded,
	InsightsRounded,
	ScienceRounded,
	SignalCellularAltRounded,
	TrendingDownRounded,
	TrendingUpRounded,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../helpers/api';
import { formatTimestamp } from '../../../helpers/common';
import { formatNumber } from '../../../helpers/formatters';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

const GREEN = '#16A34A';

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
		const value = Number(point[key]);
		if (Number.isFinite(value)) {
			return value;
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

const MiniTrend = ({ values }) => {
	const points = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
	const min = Math.min(...points);
	const max = Math.max(...points);
	const line = points
		.map((value, index) => {
			const x = (index / (points.length - 1)) * 600;
			const y = 51 - ((value - min) / (max - min || 1)) * 32;
			return `${x},${y}`;
		})
		.join(' ');

	return (
		<Box sx={{ height: 52, mx: 0.25 }}>
			<Box
				component="svg"
				viewBox="0 0 600 62"
				preserveAspectRatio="none"
				aria-label="Recent monitor readings"
				sx={{ width: '100%', height: '100%', overflow: 'visible' }}
			>
				<defs>
					<linearGradient id="quality-trend-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={GREEN} stopOpacity="0.22" />
						<stop offset="100%" stopColor={GREEN} stopOpacity="0" />
					</linearGradient>
				</defs>
				<polygon
					points={`0,62 ${line} 600,62`}
					fill="url(#quality-trend-fill)"
				/>
				<polyline
					points={line}
					fill="none"
					stroke={GREEN}
					strokeWidth="3.5"
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				<circle
					cx="600"
					cy={line.split(' ').at(-1)?.split(',')[1]}
					r="7"
					fill={GREEN}
				/>
			</Box>
		</Box>
	);
};

const Summary = ({ label, value, unit }) => (
	<Stack
		direction="row"
		alignItems="center"
		justifyContent="center"
		spacing={0.45}
		minWidth={0}
	>
		<SignalCellularAltRounded sx={{ color: 'text.secondary', fontSize: 17 }} />
		<Box minWidth={0}>
			<Typography
				sx={{ color: 'text.secondary', fontSize: '0.62rem', lineHeight: 1.1 }}
			>
				{label}
			</Typography>
			<Typography
				noWrap
				sx={{
					color: 'text.primary',
					fontWeight: 800,
					fontSize: '0.72rem',
					lineHeight: 1.2,
				}}
			>
				{formatNumber(value, 2, { fallback: '-' })}
				{unit ? ` ${unit}` : ''}
			</Typography>
		</Box>
	</Stack>
);

const PremiumWaterQualityMonitorCard = ({
	title,
	status,
	lastUpdated,
	metric,
	trendUrl,
	onOpenTrend,
}) => {
	const currentValue = Number(metric?.value);
	const [trendValues, setTrendValues] = useState([]);
	const isOnline = status?.toLowerCase() === 'online';
	const statusColor = isOnline ? GREEN : '#EF3340';

	useEffect(() => {
		let active = true;
		if (!trendUrl) {
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
				const values = rows
					.map((point) => getPointValue(point, metric))
					.filter(Number.isFinite)
					.slice(-24);
				setTrendValues(values);
			})
			.catch(() => active && setTrendValues([]));

		return () => {
			active = false;
		};
	}, [trendUrl, metric?.metric_key, metric?.label]);

	const values = useMemo(() => {
		if (trendValues.length) {
			return trendValues;
		}
		return Number.isFinite(currentValue) ? [currentValue] : [];
	}, [currentValue, trendValues]);
	const min = values.length ? Math.min(...values) : Number.NaN;
	const max = values.length ? Math.max(...values) : Number.NaN;
	const average = values.length
		? values.reduce((sum, value) => sum + value, 0) / values.length
		: Number.NaN;
	const previous = values.length > 1 ? values[values.length - 2] : currentValue;
	const change =
		Number.isFinite(currentValue) && Number.isFinite(previous) && previous !== 0
			? ((currentValue - previous) / Math.abs(previous)) * 100
			: 0;
	const ChangeIcon = change < 0 ? TrendingDownRounded : TrendingUpRounded;
	const displayTitle = /monitor/i.test(title || '')
		? title
		: `${metric?.label || title || 'Quality'} Monitor`;

	return (
		<Box
			sx={{
				width: '100%',
				p: { xs: 1.25, sm: 1.5 },
				borderRadius: 3,
				border: '1px solid',
				borderColor: (theme) => alpha(theme.palette.primary.main, 0.11),
				bgcolor: 'background.paper',
				boxShadow: '0 12px 35px rgba(37,69,111,.10)',
				display: 'flex',
				flexDirection: 'column',
				gap: MACHINE_CARD_DESIGN.cardGap,
				minWidth: 0,
				minHeight: MACHINE_CARD_DESIGN.cardMinHeight,
				height: '100%',
				boxSizing: 'border-box',
			}}
		>
			<Box
				sx={{
					position: 'relative',
					minHeight: MACHINE_CARD_DESIGN.headerMinHeight,
					borderRadius: 2.25,
					border: `1px solid ${alpha(statusColor, 0.18)}`,
					background: (theme) =>
						`linear-gradient(110deg, ${alpha(
							statusColor,
							theme.palette.mode === 'dark' ? 0.18 : 0.08
						)}, ${alpha(statusColor, 0.025)})`,
					overflow: 'hidden',
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					spacing={1}
					height="100%"
					p={1.05}
				>
					<Box
						sx={{
							width: 56,
							height: 56,
							display: 'grid',
							placeItems: 'center',
							borderRadius: '50%',
							color: '#0891B2',
							bgcolor: 'background.paper',
							boxShadow: '0 7px 16px rgba(37,69,111,.12)',
							flexShrink: 0,
						}}
					>
						<ScienceRounded sx={{ fontSize: 32 }} />
					</Box>
					<Box minWidth={0} flex={1} pt={2}>
						<Typography
							noWrap
							sx={{
								fontSize: MACHINE_CARD_DESIGN.titleSize,
								fontWeight: 900,
								color: 'text.primary',
							}}
						>
							{displayTitle}
						</Typography>
						<Stack
							direction="row"
							alignItems="center"
							spacing={0.6}
							mt={0.35}
							color="text.secondary"
						>
							<CalendarMonthRounded sx={{ fontSize: 17 }} />
							<Typography
								noWrap
								sx={{ fontSize: MACHINE_CARD_DESIGN.helperSize }}
							>
								{formatTimestamp(lastUpdated) || '-'}
							</Typography>
						</Stack>
					</Box>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.55}
					sx={{
						position: 'absolute',
						top: 9,
						right: 9,
						width: 'fit-content',
						px: 0.8,
						py: 0.35,
						borderRadius: 99,
						color: statusColor,
						bgcolor: alpha(statusColor, 0.07),
						border: `1px solid ${alpha(statusColor, 0.18)}`,
					}}
				>
					<Box
						sx={{
							width: 9,
							height: 9,
							borderRadius: '50%',
							bgcolor: statusColor,
						}}
					/>
					<Typography
						sx={{ fontSize: MACHINE_CARD_DESIGN.statusSize, fontWeight: 900 }}
					>
						{isOnline ? 'ONLINE' : 'OFFLINE'}
					</Typography>
				</Stack>
			</Box>

			<Stack
				direction="row"
				alignItems="flex-start"
				justifyContent="space-between"
				spacing={0.75}
				px={0.25}
			>
				<Box>
					<Typography
						sx={{
							color: 'text.secondary',
							fontSize: '0.68rem',
							fontWeight: 600,
						}}
					>
						{metric?.label || title}
					</Typography>
					<Typography
						sx={{
							color: 'text.primary',
							fontSize: '1.5rem',
							lineHeight: 1.05,
							fontWeight: 900,
						}}
					>
						{formatNumber(metric?.value, 2, { fallback: '-' })}{' '}
						<Typography
							component="span"
							sx={{
								color: 'text.secondary',
								fontSize: '0.72rem',
								fontWeight: 700,
							}}
						>
							{metric?.unit || ''}
						</Typography>
					</Typography>
				</Box>
				<Box
					sx={{
						px: 0.7,
						py: 0.4,
						borderRadius: 1.5,
						bgcolor: alpha(GREEN, 0.07),
						textAlign: 'center',
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="center"
						spacing={0.35}
					>
						<ChangeIcon sx={{ color: GREEN, fontSize: 16 }} />
						<Typography
							sx={{ color: GREEN, fontWeight: 900, fontSize: '0.72rem' }}
						>
							{change >= 0 ? '+' : ''}
							{formatNumber(change, 1, { fallback: '0' })}%
						</Typography>
					</Stack>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.56rem' }}>
						vs. last hour
					</Typography>
				</Box>
			</Stack>

			<MiniTrend values={values} />

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
					'& > * + *': { borderLeft: '1px solid', borderColor: 'divider' },
				}}
			>
				<Summary label="Min" value={min} unit={metric?.unit} />
				<Summary label="Avg" value={average} unit={metric?.unit} />
				<Summary label="Max" value={max} unit={metric?.unit} />
			</Box>

			<Button
				onClick={onOpenTrend}
				fullWidth
				variant="contained"
				startIcon={<InsightsRounded />}
				endIcon={<ChevronRightRounded />}
				sx={{
					mt: 'auto',
					minHeight: 34,
					borderRadius: '10px',
					fontSize: MACHINE_CARD_DESIGN.actionSize,
					fontWeight: 900,
					background: isOnline
						? 'linear-gradient(105deg,#16A34A 0%,#22C55E 100%)'
						: 'linear-gradient(105deg,#F23857 0%,#FF5A24 100%)',
					boxShadow: `0 6px 14px ${alpha(statusColor, 0.22)}`,
					'& .MuiButton-endIcon': { position: 'absolute', right: 14 },
				}}
			>
				VIEW TREND
			</Button>
		</Box>
	);
};

export default PremiumWaterQualityMonitorCard;
