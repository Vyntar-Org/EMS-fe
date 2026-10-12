import {
	PowerSettingsNewRounded,
	TimelineRounded,
	WaterDropRounded,
} from '@mui/icons-material';
import {
	Box,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useId, useState } from 'react';

import { api } from '../../../helpers/api';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import StatusChips from '../../common/StatusChips';

const LEVEL_COLOR = '#0891B2';
const SECONDARY_LEVEL_COLOR = '#7C3AED';
const SUCCESS_COLOR = '#16A34A';
const ATTENTION_COLOR = '#F59E0B';
const getTableBorder = (theme) =>
	`1px solid ${alpha(
		theme.palette.text.primary,
		theme.palette.mode === 'dark' ? 0.22 : 0.14
	)}`;

const ACTIVE_MOTOR_VALUES = new Set(['on', 'running', 'active', 'started']);
const LOW_LEVEL_VALUES = new Set(['low', 'empty', 'critical']);

const getMetricValue = (point, metric) => {
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

const getMetricByKey = (metrics, key) =>
	metrics.find(
		(metric) =>
			String(metric?.metric_key || '')
				.trim()
				.toLowerCase() === key.toLowerCase()
	);
const getMetricDisplayValue = (metric) => {
	if (metric?.value === null || metric?.value === undefined) {
		return 'Nil';
	}

	return `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`;
};

const hasMetricValue = (metric) =>
	metric?.value !== null &&
	metric?.value !== undefined &&
	String(metric.value).trim() !== '';

const getNormalizedMetricValue = (metric) =>
	String(metric?.value ?? '')
		.trim()
		.toLowerCase();

const isLowLevel = (metric) => {
	const normalizedValue = getNormalizedMetricValue(metric);
	if (LOW_LEVEL_VALUES.has(normalizedValue)) {
		return true;
	}

	const numericValue = Number(metric?.value);
	return (
		String(metric?.unit || '').includes('%') &&
		Number.isFinite(numericValue) &&
		numericValue <= 25
	);
};

const isMotorRunning = (metric) =>
	ACTIVE_MOTOR_VALUES.has(getNormalizedMetricValue(metric));

const TankReading = ({ label, metric }) => (
	<Stack alignItems="center" spacing={0.45}>
		<Typography
			sx={{
				color: 'text.secondary',
				fontSize: '0.6rem',
				fontWeight: 700,
				lineHeight: 1.2,
			}}
		>
			{label}
		</Typography>
		<StatusChips value={getMetricDisplayValue(metric)} />
	</Stack>
);

const AnalyticsTile = ({ Icon, label, value, caption, color }) => (
	<Box
		sx={{
			minWidth: 0,
			p: 0.5,
			borderRadius: 1.25,
			border: '1px solid',
			borderColor: alpha(color, 0.18),
			background: (theme) =>
				`linear-gradient(135deg, ${alpha(
					color,
					theme.palette.mode === 'dark' ? 0.12 : 0.06
				)}, ${theme.palette.background.paper} 82%)`,
		}}
	>
		<Stack direction="row" alignItems="center" spacing={0.5}>
			<Box
				sx={{
					width: 24,
					height: 24,
					flexShrink: 0,
					display: 'grid',
					placeItems: 'center',
					borderRadius: 1,
					color,
					bgcolor: alpha(color, 0.12),
				}}
			>
				<Icon sx={{ fontSize: 14 }} />
			</Box>
			<Box minWidth={0} flex={1}>
				<Typography
					noWrap
					sx={{ color: 'text.secondary', fontSize: '0.48rem', fontWeight: 700 }}
				>
					{label}
				</Typography>
				<Typography
					noWrap
					sx={{ color: 'text.secondary', fontSize: '0.4rem', lineHeight: 1.1 }}
				>
					{caption}
				</Typography>
			</Box>
			<Typography
				noWrap
				sx={{ color, fontSize: '0.75rem', fontWeight: 900, lineHeight: 1 }}
			>
				{value}
			</Typography>
		</Stack>
	</Box>
);

const LiveAnalytics = ({ levels, motors }) => {
	const availableLevels = levels.filter(hasMetricValue);
	const availableMotors = motors.filter(hasMetricValue);
	const lowLevelCount = availableLevels.filter(isLowLevel).length;
	const runningMotorCount = availableMotors.filter(isMotorRunning).length;
	const levelColor = lowLevelCount ? ATTENTION_COLOR : SUCCESS_COLOR;
	const motorColor = runningMotorCount ? SUCCESS_COLOR : '#64748B';

	return (
		<Box
			aria-label="Live water-level analytics"
			sx={{
				mt: 0.55,
				display: 'grid',
				gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
				gap: 0.55,
			}}
		>
			<AnalyticsTile
				Icon={WaterDropRounded}
				label="Low levels"
				value={
					availableLevels.length
						? `${lowLevelCount} / ${availableLevels.length}`
						: '—'
				}
				caption="Low or empty"
				color={levelColor}
			/>
			<AnalyticsTile
				Icon={PowerSettingsNewRounded}
				label="Motors running"
				value={
					availableMotors.length
						? `${runningMotorCount} / ${availableMotors.length}`
						: '—'
				}
				caption="Active readings"
				color={motorColor}
			/>
		</Box>
	);
};

const MiniLevelTrend = ({ series }) => {
	const gradientId = `level-trend-${useId().replace(/[^a-z0-9_-]/gi, '')}`;
	const allValues = series.flatMap((item) => item.values);
	const min = Math.min(...allValues);
	const max = Math.max(...allValues);
	const getLine = (values) =>
		values
			.map((value, index) => {
				const x = (index / Math.max(values.length - 1, 1)) * 320;
				const y = 50 - ((value - min) / (max - min || 1)) * 34;
				return `${x},${y}`;
			})
			.join(' ');

	return (
		<Box
			sx={{
				p: 0.5,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				spacing={1}
				mb={0.1}
			>
				<Stack direction="row" alignItems="center" spacing={0.4}>
					<TimelineRounded sx={{ color: LEVEL_COLOR, fontSize: 15 }} />
					<Typography sx={{ fontSize: '0.6rem', fontWeight: 800 }}>
						Recent level trend
					</Typography>
				</Stack>
				<Stack direction="row" spacing={0.75} minWidth={0}>
					{series.map((item) => (
						<Stack
							key={item.label}
							direction="row"
							alignItems="center"
							spacing={0.25}
							minWidth={0}
						>
							<Box
								sx={{
									width: 6,
									height: 6,
									borderRadius: '50%',
									bgcolor: item.color,
									flexShrink: 0,
								}}
							/>
							<Typography
								noWrap
								sx={{ color: 'text.secondary', fontSize: '0.48rem' }}
							>
								{item.label}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Stack>
			<Box
				component="svg"
				viewBox="0 0 320 58"
				preserveAspectRatio="none"
				aria-label="Historical water-level readings"
				sx={{ display: 'block', width: '100%', height: 38 }}
			>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={LEVEL_COLOR} stopOpacity="0.2" />
						<stop offset="100%" stopColor={LEVEL_COLOR} stopOpacity="0" />
					</linearGradient>
				</defs>
				{series.map((item, index) => {
					const line = getLine(item.values);
					return (
						<g key={item.label}>
							{index === 0 ? (
								<polygon
									points={`0,58 ${line} 320,58`}
									fill={`url(#${gradientId})`}
								/>
							) : null}
							<polyline
								points={line}
								fill="none"
								stroke={item.color}
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					);
				})}
			</Box>
		</Box>
	);
};

const TrendUnavailable = () => (
	<Stack
		direction="row"
		alignItems="center"
		justifyContent="center"
		spacing={0.6}
		sx={{
			minHeight: 42,
			border: '1px dashed',
			borderColor: 'divider',
			borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			color: 'text.secondary',
		}}
	>
		<TimelineRounded sx={{ fontSize: 17 }} />
		<Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
			No numeric level history available
		</Typography>
	</Stack>
);

const PremiumWaterLevelMachineCard = ({
	app,
	title,
	status,
	lastUpdated,
	metrics = [],
	levelTrendSources = [],
	onOpenTrend,
}) => {
	const [trendSeries, setTrendSeries] = useState([]);
	const [isTrendLoading, setIsTrendLoading] = useState(
		levelTrendSources.length > 0
	);

	const level1 = getMetricByKey(metrics, 'Level 1');
	const level2 = getMetricByKey(metrics, 'Level 2');
	const motor1 = getMetricByKey(metrics, 'Motor 1 Status');
	const motor2 = getMetricByKey(metrics, 'Motor 2 Status');

	useEffect(() => {
		let active = true;
		if (!levelTrendSources.length) {
			setTrendSeries([]);
			setIsTrendLoading(false);
			return () => {
				active = false;
			};
		}

		setIsTrendLoading(true);
		Promise.allSettled(
			levelTrendSources.map(async ({ metric, url }, index) => {
				const response = await api.get(url);
				const rows = response?.data?.trends || response?.data?.data || [];
				return {
					label: metric?.label || metric?.metric_key || `Level ${index + 1}`,
					color: index === 0 ? LEVEL_COLOR : SECONDARY_LEVEL_COLOR,
					values: rows
						.map((point) => getMetricValue(point, metric))
						.filter(Number.isFinite)
						.slice(-24),
				};
			})
		).then((results) => {
			if (!active) {
				return;
			}
			setTrendSeries(
				results
					.filter((result) => result.status === 'fulfilled')
					.map((result) => result.value)
					.filter((item) => item.values.length > 1)
			);
			setIsTrendLoading(false);
		});

		return () => {
			active = false;
		};
	}, [levelTrendSources]);

	return (
		<PremiumMachineCard
			app={app}
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			// headerCaption="WATER LEVEL MONITORING"
			onOpenTrend={onOpenTrend}
			footer={level1 || level2 ? undefined : null}
		>
			<Box
				sx={{
					overflow: 'hidden',
					border: getTableBorder,
					borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
				}}
			>
				<Table
					size="small"
					aria-label="Collection and filter tank readings"
					sx={{
						tableLayout: 'fixed',
						borderCollapse: 'separate',
						borderSpacing: 0,
						'& .MuiTableRow-root > .MuiTableCell-root:not(:last-of-type)': {
							borderRight: getTableBorder,
						},
						'& .MuiTableHead-root .MuiTableCell-root, & .MuiTableBody-root .MuiTableRow-root:not(:last-of-type) .MuiTableCell-root':
							{
								borderBottom: getTableBorder,
							},
						'& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root':
							{
								borderBottom: 0,
							},
					}}
				>
					<TableHead>
						<TableRow
							sx={{
								bgcolor: (theme) =>
									theme.palette.mode === 'dark'
										? 'rgba(255,255,255,0.04)'
										: 'rgba(37,69,111,0.04)',
							}}
						>
							<TableCell
								align="center"
								sx={{
									width: '50%',
									py: 0.7,
									px: 0.5,
									fontSize: '0.64rem',
									fontWeight: 800,
								}}
							>
								Collection Tank
							</TableCell>
							<TableCell
								align="center"
								sx={{
									width: '50%',
									py: 0.7,
									px: 0.5,
									fontSize: '0.64rem',
									fontWeight: 800,
								}}
							>
								Filter out
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell
								align="center"
								sx={{
									py: 0.75,
									px: 0.5,
								}}
							>
								<TankReading label="Water Level" metric={level1} />
							</TableCell>
							<TableCell align="center" sx={{ py: 0.75, px: 0.5 }}>
								<TankReading label="Water Level" metric={level2} />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell
								align="center"
								sx={{
									py: 0.75,
									px: 0.5,
								}}
							>
								<TankReading label="Motor Status" metric={motor1} />
							</TableCell>
							<TableCell align="center" sx={{ py: 0.75, px: 0.5 }}>
								<TankReading label="Motor Status" metric={motor2} />
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Box>

			<LiveAnalytics levels={[level1, level2]} motors={[motor1, motor2]} />

			{/* <Box mt={0.7}>
				{isTrendLoading ? (
					<Skeleton
						variant="rounded"
						height={58}
						sx={{ borderRadius: MACHINE_CARD_DESIGN.sectionRadius }}
					/>
				) : trendSeries.length ? (
					<MiniLevelTrend series={trendSeries} />
				) : (
					<TrendUnavailable />
				)}
			</Box> */}
		</PremiumMachineCard>
	);
};

export default PremiumWaterLevelMachineCard;
