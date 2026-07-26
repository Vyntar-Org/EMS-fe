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

import { getTemperatureScalePercent } from '../../helpers/temperatureStatus';

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

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

// Each app's identity color — drives the icon chip, card wash/border and
// sparkline tint everywhere, so the machine-list grid reads as a colorful
// set of distinct apps rather than one repeated template.
export const APP_ACCENT_COLOR = {
	ENERGY: '#E3B13E',
	WATER: '#2E90E5',
	FUEL: '#EA580C',
	SOLAR: '#F5A524',
	STP: '#0891B2',
	TEMPERATURE: '#DC2626',
	'FIRE-SAFETY': '#DC2626',
	FLOWMETER: '#7C3AED',
	COMPRESSOR: '#16A34A',
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
export const AnimatedMachineAvatar = ({ app, isOnline = true }) => {
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
								t.palette.mode === 'dark' ? 0.34 : 0.18
						  )} 0%, ${alpha(
								accent,
								t.palette.mode === 'dark' ? 0.14 : 0.06
						  )} 100%)`
						: alpha(
								t.palette.primary.main,
								t.palette.mode === 'dark' ? 0.25 : 0.1
						  ),
				color: accent || 'primary.main',
				opacity: isOnline ? 1 : 0.55,
				boxShadow: (t) =>
					`0 0 0 1px ${alpha(accent || t.palette.primary.main, 0.24)}`,
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
 * Small inline trend line — the line-graph counterpart to `MachineRatioDonut`.
 * Same philosophy: pure SVG built from data the card already fetched, no
 * charting library instance, no per-frame animation, so it's cheap to render
 * across a whole machine-list grid. Renders nothing if there isn't enough
 * data to draw a line, so callers can render it unconditionally.
 */
// The raw SVG line+area drawing, shared by `MachineTrendSparkline` (below,
// which pairs it with a label/caption row for machine-list cards) and
// `MiniSparkline` (a bare graphic for dashboard KPI tiles that already have
// their own label elsewhere). Renders nothing if there isn't enough real
// data to draw a line — callers render it unconditionally rather than
// fabricating extra points to fill a shape.
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

export const MachineTrendSparkline = ({ data = [], color, label, caption }) => {
	const gradientId = useId();
	const accent = color || 'primary.main';
	const hasEnoughData =
		(data || []).filter((v) => typeof v === 'number' && !Number.isNaN(v))
			.length >= 2;

	if (!hasEnoughData) {
		return null;
	}

	return (
		<Stack direction="row" alignItems="center" gap={1.25} width="100%">
			<Box
				sx={{
					position: 'relative',
					width: 72,
					height: 36,
					flexShrink: 0,
					borderRadius: '10px',
					overflow: 'hidden',
					bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.1 : 0.05),
				}}
			>
				<SparklineGraphic data={data} color={color} gradientId={gradientId} />
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
 * Bare sparkline graphic with no label/caption — for dashboard KPI tiles
 * that already show their own label/value elsewhere and just need a small
 * trend shape (e.g. tucked in a card's corner). Same underlying drawing as
 * `MachineTrendSparkline`; renders nothing without at least 2 real points.
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
