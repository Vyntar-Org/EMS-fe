import BoltIcon from '@mui/icons-material/Bolt';
import CompressIcon from '@mui/icons-material/Compress';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ScienceIcon from '@mui/icons-material/Science';
import SensorsIcon from '@mui/icons-material/Sensors';
import SpeedIcon from '@mui/icons-material/Speed';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import {
	Avatar,
	Box,
	Divider,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useId } from 'react';

import { formatChartValue } from '../../helpers/chartConfig';
import { getTemperatureScalePercent } from '../../helpers/temperatureStatus';
// Each app's identity color — drives the icon chip, card wash/border and
// sparkline tint everywhere, so the machine-list grid reads as a colorful
// set of distinct apps rather than one repeated template. Single source of
// truth lives in theme/colors.js; re-exported here for existing call sites.
import { APP_ACCENT_COLOR } from '../../theme/colors';

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

export { APP_ACCENT_COLOR };

export const APP_ICONS = {
	ENERGY: BoltIcon,
	WATER: WaterDropIcon,
	FUEL: LocalGasStationIcon,
	SOLAR: WbSunnyIcon,
	STP: ScienceIcon,
	TEMPERATURE: DeviceThermostatIcon,
	'FIRE-SAFETY': LocalFireDepartmentIcon,
	FLOWMETER: SpeedIcon,
	COMPRESSOR: CompressIcon,
};

/**
 * KPI-style machine card surface: a mild accent tint washing from the top
 * into the theme paper — soft green wash when the device is online, soft
 * primary-blue otherwise. Works in both light and dark modes.
 */
export const machineCardSx = (isOnline) => ({
	background: (t) => {
		const isDark = t.palette.mode === 'dark';
		const accent = isOnline ? t.palette.success.main : t.palette.primary.main;
		return `linear-gradient(155deg, ${alpha(
			accent,
			isDark ? 0.17 : 0.09
		)} 0%, ${t.palette.background.paper} 55%)`;
	},
	border: '1px solid',
	borderColor: (t) =>
		alpha(
			isOnline ? t.palette.success.main : t.palette.primary.main,
			t.palette.mode === 'dark' ? 0.32 : 0.18
		),
	boxShadow: '0 6px 20px rgba(15, 35, 62, 0.06)',
	transition: 'all 0.25s ease',
	'&:hover': {
		boxShadow: '0 10px 26px rgba(15, 35, 62, 0.12)',
		// transform: 'translateY(-2px)',
	},
});

/**
 * Metric row icons: soft accent-tinted rounded chip behind every icon,
 * derived from the icon's own color so it suits both theme modes.
 * Accepts a hex/rgb string, `row.color`-style values, or 'primary.main'.
 */
export const metricIconSx = (color) => ({
	fontSize: '24px',
	p: '4px',
	borderRadius: '8px',
	mr: 1,
	flexShrink: 0,
	color: color || 'primary.main',
	bgcolor: (t) => {
		const resolved =
			!color || color === 'primary.main' ? t.palette.primary.main : color;
		try {
			return alpha(resolved, t.palette.mode === 'dark' ? 0.24 : 0.12);
		} catch {
			return alpha(
				t.palette.primary.main,
				t.palette.mode === 'dark' ? 0.24 : 0.12
			);
		}
	},
});

/**
 * Circular avatar shown at the top-left of every machine card, tinted with
 * the app's own accent color (falls back to primary for unmapped apps).
 * Pick the icon via the `app` code.
 */
export const MachineAvatar = ({ app }) => {
	const Icon = APP_ICONS[app] || SensorsIcon;
	const accent = APP_ACCENT_COLOR[app];
	return (
		<Avatar
			sx={{
				width: 60,
				height: 60,
				flexShrink: 0,
				background: (t) =>
					accent
						? `linear-gradient(135deg, ${alpha(
								accent,
								t.palette.mode === 'dark' ? 0.32 : 0.16
						  )} 0%, ${alpha(
								accent,
								t.palette.mode === 'dark' ? 0.14 : 0.06
						  )} 100%)`
						: alpha(
								t.palette.primary.main,
								t.palette.mode === 'dark' ? 0.25 : 0.1
						  ),
				color: accent || 'primary.main',
				boxShadow: (t) =>
					`0 0 0 1px ${alpha(accent || t.palette.primary.main, 0.22)}`,
			}}
		>
			<Icon fontSize="large" />
		</Avatar>
	);
};

/**
 * Same footprint as `MachineAvatar`, colored by the app's accent, dimmed
 * when the device is offline. No motion — kept static for performance
 * across large machine-list grids.
 */
export const AnimatedMachineAvatar = ({ app, isOnline = true, accent }) => {
	const Icon = APP_ICONS[app] || SensorsIcon;
	const resolvedAccent = accent || APP_ACCENT_COLOR[app];

	return (
		<Avatar
			sx={{
				width: 60,
				height: 60,
				flexShrink: 0,
				background: (t) =>
					resolvedAccent
						? `linear-gradient(135deg, ${alpha(
								resolvedAccent,
								t.palette.mode === 'dark' ? 0.34 : 0.18
						  )} 0%, ${alpha(
								resolvedAccent,
								t.palette.mode === 'dark' ? 0.14 : 0.06
						  )} 100%)`
						: alpha(
								t.palette.primary.main,
								t.palette.mode === 'dark' ? 0.25 : 0.1
						  ),
				color: resolvedAccent || 'primary.main',
				opacity: isOnline ? 1 : 0.55,
				boxShadow: (t) =>
					`0 0 0 1px ${alpha(resolvedAccent || t.palette.primary.main, 0.24)}`,
			}}
		>
			<Icon fontSize="large" />
		</Avatar>
	);
};

/**
 * Soft rounded label/value list used inside the premium machine cards, e.g.
 * `[{ label: 'Inlet Flowrate', value: '1.37 m³/hr' }, ...]`.
 */
export const MachineMetricPanel = ({ rows = [] }) => (
	<Box
		sx={{
			bgcolor: 'surface.muted',
			border: '1px solid',
			borderColor: 'surface.mutedBorder',
			borderRadius: '14px',
			p: 1.25,
			width: '100%',
		}}
	>
		<Stack
			divider={
				<Divider sx={{ my: 0.75, borderColor: 'surface.mutedBorder' }} />
			}
		>
			{rows.map((row) => (
				<Stack
					key={row.label}
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					width="100%"
					gap={1}
				>
					<Box minWidth={0} flex={1}>
						<ResponsiveTextWrapper
							value={row.label}
							fontSize="13.5px"
							color="text.secondary"
							fontWeight={500}
						/>
					</Box>
					<Box flexShrink={0} maxWidth="55%" minWidth={0}>
						<ResponsiveTextWrapper
							value={row.value}
							fontSize="14.5px"
							color="text.primary"
							fontWeight={700}
							sx={{ textAlign: 'right' }}
						/>
					</Box>
				</Stack>
			))}
		</Stack>
	</Box>
);

/**
 * Small "donut" analytics visual built purely from CSS (`conic-gradient`) —
 * no charting library instance per card, no API call, no animation. Reuses
 * data the card already has (e.g. Today vs MTD, fuel level %) to give each
 * card a glanceable proportion read-out instead of raw numbers. Fully
 * responsive: fixed intrinsic size that sits inside a flex row with the
 * label side allowed to shrink/truncate via `minWidth: 0`.
 */
export const MachineRatioDonut = ({ percent = 0, color, label, caption }) => {
	const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

	return (
		<Stack direction="row" alignItems="center" gap={1.25} width="100%">
			<Box
				sx={{
					position: 'relative',
					width: 56,
					height: 56,
					flexShrink: 0,
					borderRadius: '50%',
					background: (t) =>
						`conic-gradient(${color} ${clamped * 3.6}deg, ${alpha(
							color,
							t.palette.mode === 'dark' ? 0.18 : 0.12
						)} 0deg)`,
				}}
			>
				<Box
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: 40,
						height: 40,
						borderRadius: '50%',
						bgcolor: 'background.paper',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Typography
						sx={{ fontSize: '11px', fontWeight: 800, color: 'text.primary' }}
					>
						{Math.round(clamped)}%
					</Typography>
				</Box>
			</Box>
			<Box minWidth={0} flex={1}>
				<ResponsiveTextWrapper
					value={label}
					fontSize="12.5px"
					color="text.secondary"
					fontWeight={500}
				/>
				{caption && (
					<ResponsiveTextWrapper
						value={caption}
						fontSize="12px"
						color="text.primary"
						fontWeight={700}
					/>
				)}
			</Box>
		</Stack>
	);
};

/**
 * Slim single-value progress bar — the low-height counterpart to
 * `MachineRatioDonut` for cards too narrow/short to fit a 56px circle.
 * Pure CSS, no library, no per-frame animation.
 */
export const MiniProgressBar = ({ percent = 0, color, label, value }) => {
	const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

	return (
		<Box width="100%" minWidth={0}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				gap={0.75}
				mb={0.4}
			>
				<Box minWidth={0} flex={1}>
					<ResponsiveTextWrapper
						value={label}
						fontSize="9.5px"
						fontWeight={600}
						color="text.secondary"
						sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
					/>
				</Box>
				{value !== null && value !== undefined && (
					<Box flexShrink={0}>
						<ResponsiveTextWrapper
							value={value}
							fontSize="9.5px"
							fontWeight={700}
							color={color}
						/>
					</Box>
				)}
			</Stack>
			<Box
				sx={{
					height: 6,
					borderRadius: '999px',
					bgcolor: (t) => alpha(color, t.palette.mode === 'dark' ? 0.2 : 0.13),
					overflow: 'hidden',
				}}
			>
				<Box
					sx={{
						height: '100%',
						width: `${clamped}%`,
						borderRadius: '999px',
						bgcolor: color,
						transition: 'width 0.4s ease',
					}}
				/>
			</Box>
		</Box>
	);
};

/**
 * Stacked-segment proportion bar — for a value made up of 2-3 real parts
 * (e.g. Main/Backup/Green generation mix) where a single-value progress bar
 * or donut doesn't apply. Segments are sized by each part's real share of
 * the total; a part with 0 contributes no segment. Pure CSS, no library.
 */
export const MiniProportionBar = ({ segments = [] }) => {
	const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
	const withShare = segments.map((s) => ({
		...s,
		share: total > 0 ? (Number(s.value) || 0) / total : 0,
	}));

	return (
		<Box width="100%" minWidth={0}>
			<Stack
				direction="row"
				sx={{
					height: 6,
					borderRadius: '999px',
					overflow: 'hidden',
					bgcolor: (t) => alpha(t.palette.text.secondary, 0.12),
				}}
			>
				{withShare.map((s, i) => (
					<Box
						key={s.label || i}
						sx={{
							width: `${s.share * 100}%`,
							bgcolor: s.color,
							transition: 'width 0.4s ease',
						}}
					/>
				))}
			</Stack>
			<Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
				{segments.map((s, i) => (
					<Stack
						key={s.label || i}
						direction="row"
						alignItems="center"
						gap={0.4}
						minWidth={0}
					>
						<Box
							sx={{
								width: 6,
								height: 6,
								borderRadius: '50%',
								bgcolor: s.color,
								flexShrink: 0,
							}}
						/>
						<ResponsiveTextWrapper
							value={s.label}
							fontSize="9px"
							fontWeight={600}
							color="text.secondary"
						/>
					</Stack>
				))}
			</Stack>
		</Box>
	);
};

/**
 * Multi-segment donut — the composition counterpart to `MachineRatioDonut`
 * for a value split across 2-3 real parts (e.g. a generation source mix)
 * rather than a single percent-of-whole. Same conic-gradient technique,
 * just with multiple color stops instead of one. Legend sits below rather
 * than beside so it still fits narrow KPI-tile-width cards.
 */
export const MiniMultiDonut = ({ segments = [], size = 46 }) => {
	const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

	let cumulative = 0;
	const stops = segments
		.map((s) => {
			const share = total > 0 ? (Number(s.value) || 0) / total : 0;
			const start = cumulative * 3.6;
			cumulative += share * 100;
			return `${s.color} ${start}deg ${cumulative * 3.6}deg`;
		})
		.join(', ');

	return (
		<Stack direction="row" alignItems="center" gap={1.25} width="100%">
			<Box
				sx={{
					position: 'relative',
					width: size,
					height: size,
					flexShrink: 0,
					borderRadius: '50%',
					background: (t) =>
						total > 0
							? `conic-gradient(${stops})`
							: alpha(t.palette.text.secondary, 0.14),
				}}
			>
				<Box
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: size * 0.62,
						height: size * 0.62,
						borderRadius: '50%',
						bgcolor: 'background.paper',
					}}
				/>
			</Box>
			<Stack direction="row" flexWrap="wrap" gap={0.75} minWidth={0} flex={1}>
				{segments.map((s, i) => (
					<Stack
						key={s.label || i}
						direction="row"
						alignItems="center"
						gap={0.4}
						minWidth={0}
					>
						<Box
							sx={{
								width: 6,
								height: 6,
								borderRadius: '50%',
								bgcolor: s.color,
								flexShrink: 0,
							}}
						/>
						<ResponsiveTextWrapper
							value={s.label}
							fontSize="9px"
							fontWeight={600}
							color="text.secondary"
						/>
					</Stack>
				))}
			</Stack>
		</Stack>
	);
};

/**
 * Small vertical column chart — for comparing 2-3 real values side by side
 * (e.g. a Main/Backup/Green split read as discrete amounts rather than a
 * proportion). Bars are height-scaled to the largest value; pure CSS, no
 * charting library instance.
 */
export const MiniColumnChart = ({ bars = [], height = 38 }) => {
	const max = Math.max(...bars.map((b) => Number(b.value) || 0), 1);

	return (
		<Stack
			direction="row"
			alignItems="flex-end"
			justifyContent="space-around"
			gap={1}
			sx={{ height, width: '100%' }}
		>
			{bars.map((b, i) => (
				<Stack
					key={b.label || i}
					alignItems="center"
					justifyContent="flex-end"
					gap={0.4}
					sx={{ height: '100%', flex: 1, minWidth: 0 }}
				>
					<Box
						sx={{
							width: '55%',
							maxWidth: 18,
							borderRadius: '4px 4px 0 0',
							bgcolor: b.color,
							height: `${Math.max(6, ((Number(b.value) || 0) / max) * 100)}%`,
							transition: 'height 0.4s ease',
						}}
					/>
					<Typography
						sx={{
							fontSize: '8.5px',
							fontWeight: 600,
							color: 'text.secondary',
							lineHeight: 1,
						}}
					>
						{b.label}
					</Typography>
				</Stack>
			))}
		</Stack>
	);
};

/**
 * Today-vs-yesterday comparison bars — two columns instead of one, so a
 * consumption/cost card reads as "trending up or down" at a glance instead
 * of just two separate numbers. Neutral gray/accent coloring (not
 * green/red) since whether a change is "good" depends on domain thresholds
 * this app doesn't have — same reasoning as the dashboards' trend chips.
 */
export const MiniComparisonBars = ({
	todayValue,
	yesterdayValue,
	color,
	height = 38,
	unit = '',
}) => {
	const max = Math.max(Number(todayValue) || 0, Number(yesterdayValue) || 0, 1);
	const pct = (v) => Math.max(6, ((Number(v) || 0) / max) * 100);

	return (
		<Stack
			direction="row"
			alignItems="flex-end"
			justifyContent="center"
			gap={2.5}
			sx={{ width: '100%' }}
		>
			{[
				{ label: 'Today', value: todayValue, faded: false },
				{ label: 'Yesterday', value: yesterdayValue, faded: true },
			].map((b) => (
				<Stack
					key={b.label}
					alignItems="center"
					justifyContent="flex-end"
					gap={0.25}
				>
					<Typography
						sx={{
							fontSize: '9px',
							fontWeight: 700,
							color: 'text.primary',
							lineHeight: 1,
							whiteSpace: 'nowrap',
						}}
					>
						{formatChartValue(b.value)}
						{unit ? ` ${unit}` : ''}
					</Typography>
					<Box
						sx={{
							width: 16,
							borderRadius: '4px 4px 0 0',
							bgcolor: b.faded ? alpha(color, 0.35) : color,
							height: `${(pct(b.value) / 100) * height}px`,
							transition: 'height 0.4s ease',
						}}
					/>
					<Typography
						sx={{
							fontSize: '8.5px',
							fontWeight: 600,
							color: 'text.secondary',
							lineHeight: 1,
						}}
					>
						{b.label}
					</Typography>
				</Stack>
			))}
		</Stack>
	);
};

/**
 * Semi-circle arc gauge — the "meter" counterpart to `MachineRatioDonut`,
 * for a single percent reading where a needle/gauge feel fits better than a
 * full ring or a bar (e.g. a balance/load-style metric). Pure SVG stroke,
 * no library.
 */
export const MiniGaugeArc = ({ percent = 0, color, label }) => {
	const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
	const radius = 26;
	const cx = 32;
	const cy = 30;
	const circumference = Math.PI * radius;
	const dash = (clamped / 100) * circumference;
	const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${
		cx + radius
	} ${cy}`;

	return (
		<Stack direction="row" alignItems="center" gap={1.25} width="100%">
			<Box minWidth={0} flex={1}>
				<ResponsiveTextWrapper
					value={label}
					fontSize="12px"
					fontWeight={600}
					color="text.secondary"
				/>
			</Box>
			<Box sx={{ position: 'relative', width: 64, height: 32, flexShrink: 0 }}>
				<svg width="64" height="32" viewBox="0 0 64 32">
					<path
						d={arcPath}
						fill="none"
						stroke={alpha(color, 0.16)}
						strokeWidth="6"
						strokeLinecap="round"
					/>
					<path
						d={arcPath}
						fill="none"
						stroke={color}
						strokeWidth="6"
						strokeLinecap="round"
						strokeDasharray={`${dash} ${circumference}`}
						style={{ transition: 'stroke-dasharray 0.4s ease' }}
					/>
				</svg>
				<Typography
					sx={{
						position: 'absolute',
						bottom: 0,
						left: '50%',
						transform: 'translateX(-50%)',
						fontSize: '11px',
						fontWeight: 800,
						color: 'text.primary',
					}}
				>
					{Math.round(clamped)}%
				</Typography>
			</Box>
		</Stack>
	);
};

// The raw SVG line+area drawing behind `MiniSparkline` (a bare graphic for
// dashboard KPI tiles that already have their own label elsewhere). Renders
// nothing if there isn't enough real data to draw a line — callers render
// it unconditionally rather than fabricating extra points to fill a shape.
const SparklineGraphic = ({ data, color, gradientId }) => {
	const accent = color || 'primary.main';
	const points = (data || []).filter(
		(v) => typeof v === 'number' && !Number.isNaN(v)
	);

	if (points.length < 2) {
		return null;
	}

	const width = 100;
	const height = 32;
	const min = Math.min(...points);
	const max = Math.max(...points);
	const range = max - min || 1;

	const coords = points.map((v, i) => [
		(i / (points.length - 1)) * width,
		height - ((v - min) / range) * height,
	]);

	const linePath = coords
		.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
		.join(' ');
	const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
	const [lastX, lastY] = coords[coords.length - 1];

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width="100%"
			height="100%"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={accent} stopOpacity="0.4" />
					<stop offset="100%" stopColor={accent} stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
			<path
				d={linePath}
				fill="none"
				stroke={accent}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			/>
			<circle cx={lastX} cy={lastY} r="2.5" fill={accent} />
		</svg>
	);
};

/**
 * Bare sparkline graphic with no label/caption — for dashboard KPI tiles
 * that already show their own label/value elsewhere and just need a small
 * trend shape (e.g. tucked in a card's corner). Renders nothing without at
 * least 2 real points.
 */
export const MiniSparkline = ({
	data = [],
	color,
	width = 56,
	height = 28,
}) => {
	const gradientId = useId();

	return (
		<Box sx={{ width, height, flexShrink: 0 }}>
			<SparklineGraphic data={data} color={color} gradientId={gradientId} />
		</Box>
	);
};

/**
 * Cold→hot gradient scale gauge — a different "small chart" shape from
 * `MachineRatioDonut`, used by apps whose most meaningful reading is a
 * banded temperature (Temperature, Fire Safety, Solar) rather than a
 * proportion. Pure CSS, no library, no animation, no API call: it just
 * places the reading's own value on a fixed cold–hot band.
 */
export const MachineTemperatureGauge = ({
	value,
	statusColor,
	statusLabel,
}) => (
	<Tooltip arrow placement="top" title={statusLabel || ''}>
		<Box
			sx={{
				position: 'relative',
				height: 6,
				borderRadius: 3,
				width: '100%',
				background:
					'linear-gradient(to right, #2563EB 0%, #16A34A 25%, #E3B13E 50%, #EA580C 75%, #DC2626 100%)',
			}}
		>
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: `${getTemperatureScalePercent(value)}%`,
					transform: 'translate(-50%, -50%)',
					width: 12,
					height: 12,
					borderRadius: '50%',
					bgcolor: '#fff',
					border: '2px solid',
					borderColor: statusColor || 'primary.main',
					boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
				}}
			/>
		</Box>
	</Tooltip>
);

/**
 * "● Healthy / ● Offline" status badge for the machine card footer.
 */
export const MachineHealthBadge = ({ isOnline }) => (
	<Stack direction="row" alignItems="center" gap={0.75} flexShrink={0}>
		<Box
			sx={{
				width: 9,
				height: 9,
				borderRadius: '50%',
				bgcolor: isOnline ? 'success.main' : 'error.main',
				boxShadow: (t) =>
					`0 0 0 3px ${alpha(
						isOnline ? t.palette.success.main : t.palette.error.main,
						0.18
					)}`,
			}}
		/>
		<Typography
			sx={{
				fontSize: '13px',
				fontWeight: 700,
				color: isOnline ? 'success.main' : 'error.main',
			}}
		>
			{isOnline ? 'Healthy' : 'Offline'}
		</Typography>
	</Stack>
);
