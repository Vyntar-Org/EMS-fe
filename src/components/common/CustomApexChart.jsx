import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { memo, useCallback, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

import { smartParseDate } from '../../helpers/dateParse';

const TOOLTIP_STYLE_ID = 'capx-tooltip-styles';

const TOOLTIP_CSS = `
.capx-tooltip {
	min-width: 160px;
	padding: 10px 14px;
	border-radius: 12px;
	border: 1px solid rgba(145, 158, 171, 0.16);
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	box-shadow: 0 8px 28px rgba(20, 30, 45, 0.16), 0 1px 2px rgba(20, 30, 45, 0.08);
	font-family: 'Public Sans', Inter, Roboto, sans-serif;
	animation: capx-tooltip-in 140ms ease-out;
}
@keyframes capx-tooltip-in {
	from { opacity: 0; transform: translateY(-4px) scale(0.98); }
	to { opacity: 1; transform: translateY(0) scale(1); }
}
.capx-tooltip-date {
	font-size: 12px;
	font-weight: 600;
	color: #212b36;
	margin-bottom: 1px;
}
.capx-tooltip-time {
	font-size: 11px;
	font-weight: 500;
	color: #637381;
	letter-spacing: 0.2px;
}
.capx-tooltip-relative {
	font-size: 10.5px;
	font-style: italic;
	color: #919eab;
	margin-bottom: 6px;
}
.capx-tooltip-row {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 2px 0;
}
.capx-tooltip-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}
.capx-tooltip-name {
	font-size: 12px;
	color: #454f5b;
	flex: 1;
}
.capx-tooltip-value {
	font-size: 12px;
	font-weight: 700;
	color: #212b36;
}
`;

const ensureTooltipStylesInjected = () => {
	if (typeof document === 'undefined') {
		return;
	}
	if (document.getElementById(TOOLTIP_STYLE_ID)) {
		return;
	}
	const style = document.createElement('style');
	style.id = TOOLTIP_STYLE_ID;
	style.textContent = TOOLTIP_CSS;
	document.head.appendChild(style);
};

ensureTooltipStylesInjected();

// Rounds to a max of 2 decimals and strips insignificant trailing zeros.
const roundTrim = (val) => {
	const num = Number(val);
	if (val === undefined || val === null || Number.isNaN(num)) {
		return '-';
	}
	const rounded = Math.round(num * 100) / 100;
	return Number.isInteger(rounded)
		? String(rounded)
		: String(rounded.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '');
};

const escapeHtml = (str) =>
	String(str).replace(
		/[&<>"']/g,
		(c) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
				c
			]
	);

// Above this many series, ApexCharts' native bottom legend wraps into
// several rows and eats into the fixed chart-canvas height budget (a
// multi-device merged comparison can easily hit 30-40+ series) — squashing
// the actual plot down to a sliver. Past the threshold we turn the native
// legend off and render our own capped, independently-scrollable one below
// the plot instead, so the canvas always gets its full share of the height.
const LEGEND_WINDOW_THRESHOLD = 5;
const CUSTOM_LEGEND_HEIGHT = 60;

const MAX_RENDER_POINTS = 500;

// Defensive downsample: even if the caller already thinned its data, this
// stops any accidental oversized array from ever reaching ApexCharts.
const downsampleSeries = (series, pointCount) => {
	if (pointCount <= MAX_RENDER_POINTS) {
		return series;
	}
	const stride = Math.ceil(pointCount / MAX_RENDER_POINTS);
	return series.map((s) => ({
		...s,
		data: (s?.data || []).filter((_, idx) => idx % stride === 0),
	}));
};

const WEEKDAY_LABELS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
];

// dayjs format strings per requested label granularity — the tooltip always
// shows full IST/UTC precision regardless, this only controls how terse the
// axis ticks themselves are.
const GRANULARITY_FORMATS = {
	date: 'DD MMM YYYY',
	time: 'hh:mm:ss A',
	datetime: 'DD MMM, hh:mm A',
	day: 'ddd',
	hour: 'hh A',
	minute: 'hh:mm A',
	second: 'hh:mm:ss A',
};

// Renders one axis tick at the requested granularity. Handles the shapes
// actually seen across the app's charts: real timestamps (ms/ISO/unix-sec,
// via smartParseDate), a bare day-of-week index (0-6), a bare hour-of-day
// index (0-23), or an already-human label (weekday name, category string)
// that isn't a parseable date at all.
const formatByGranularity = (rawVal, granularity) => {
	if (rawVal === undefined || rawVal === null || rawVal === '') {
		return '';
	}

	if (
		granularity === 'day' &&
		typeof rawVal === 'number' &&
		rawVal >= 0 &&
		rawVal <= 6
	) {
		return WEEKDAY_LABELS[rawVal].slice(0, 3);
	}

	if (
		granularity === 'hour' &&
		typeof rawVal === 'number' &&
		rawVal >= 0 &&
		rawVal <= 23
	) {
		return dayjs().hour(rawVal).minute(0).second(0).format('hh A');
	}

	const parsed = smartParseDate(rawVal);
	if (parsed) {
		return parsed.format(
			GRANULARITY_FORMATS[granularity] || GRANULARITY_FORMATS.datetime
		);
	}

	if (granularity === 'day' && typeof rawVal === 'string') {
		return rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
	}

	return String(rawVal);
};

// A real datetime axis needs [x, y] tuples or {x, y} points. If a caller
// requests 'datetime' but the series is actually plain y-values (index
// implicit), trusting it verbatim renders the "1970 bug" — every point
// scales against epoch-ms 0,1,2… This checks the actual shape so the axis
// falls back to 'category' instead of silently rendering bogus dates.
const hasExplicitXValues = (series) => {
	const firstPoint = series.find((s) => s?.data?.length)?.data?.[0];
	if (firstPoint === undefined) {
		return false;
	}
	return (
		Array.isArray(firstPoint) ||
		(typeof firstPoint === 'object' && firstPoint !== null && 'x' in firstPoint)
	);
};

const CustomApexChart = ({
	type = 'line',
	series = [],
	colors = ['#1976d2', '#2e7d32', '#ed6c02'],
	xAxesType = 'category', // 'datetime' or 'category'
	categories = null, // explicit category labels for xAxesType="category"
	granularity = null, // axis tick precision: 'date' | 'time' | 'datetime' | 'day' | 'hour' | 'minute' | 'second'
	height = 350,
	title = '',
	unit = '',
	meta = null, // optional API meta envelope: { unit, title }
	tickAmount = 6,
	showToolbar = true,
	minimal = false, // strips background grid + intermediate ticks down to baseline X/Y axes with only start/end labels
	customOptions = {}, // Only for absolute emergency overrides
}) => {
	const resolvedUnit = unit || meta?.unit || '';
	const resolvedTitle = title || meta?.title || '';

	const pointCount = useMemo(
		() => series.reduce((max, s) => Math.max(max, s?.data?.length || 0), 0),
		[series]
	);

	const renderSeries = useMemo(
		() => downsampleSeries(series, pointCount),
		[series, pointCount]
	);

	const effectiveXAxesType = useMemo(
		() =>
			xAxesType === 'datetime' && !hasExplicitXValues(renderSeries)
				? 'category'
				: xAxesType,
		[xAxesType, renderSeries]
	);

	const useCustomLegend = renderSeries.length > LEGEND_WINDOW_THRESHOLD;
	const chartHeight =
		useCustomLegend && typeof height === 'number'
			? Math.max(height - CUSTOM_LEGEND_HEIGHT, 120)
			: height;

	// Large datasets skip animation entirely to avoid frame drops.
	const animationsEnabled = pointCount <= 150;

	const formatValue = useCallback(
		(val) => {
			const rounded = roundTrim(val);
			return resolvedUnit && rounded !== '-'
				? `${rounded} ${resolvedUnit}`
				: rounded;
		},
		[resolvedUnit]
	);

	const yLabelFormatter = useCallback((val) => formatValue(val), [formatValue]);

	const xLabelFormatter = useCallback(
		(val) => formatByGranularity(val, granularity),
		[granularity]
	);

	const buildTooltip = useCallback(
		({ series: s, seriesIndex, dataPointIndex, w }) => {
			const xVal =
				w.globals.seriesX?.[seriesIndex]?.[dataPointIndex] ??
				w.globals.labels?.[dataPointIndex];

			let dateHtml = '';
			const parsed = smartParseDate(xVal);
			if (parsed) {
				const dateStr = parsed.format('DD MMM YYYY');
				const istStr = parsed.format('hh:mm:ss A');
				const utcStr = parsed.utc().format('hh:mm:ss A');
				const relativeStr = parsed.fromNow();
				dateHtml = `<div class="capx-tooltip-date">${dateStr}</div><div class="capx-tooltip-time">${istStr} IST / ${utcStr} UTC</div><div class="capx-tooltip-relative">${relativeStr}</div>`;
			} else if (xVal !== undefined && xVal !== null) {
				dateHtml = `<div class="capx-tooltip-date">${escapeHtml(xVal)}</div>`;
			}

			const rows = (w.globals.seriesNames || [])
				.map((name, idx) => {
					const raw = s[idx]?.[dataPointIndex];
					if (raw === undefined || raw === null) {
						return '';
					}
					const color = w.globals.colors?.[idx] || '#637381';
					return `<div class="capx-tooltip-row"><span class="capx-tooltip-dot" style="background:${color}"></span><span class="capx-tooltip-name">${escapeHtml(
						name
					)}</span><span class="capx-tooltip-value">${formatValue(
						raw
					)}</span></div>`;
				})
				.join('');

			return `<div class="capx-tooltip">${dateHtml}${rows}</div>`;
		},
		[formatValue]
	);

	const baseOptions = useMemo(
		() => ({
			chart: {
				type,
				height: chartHeight,
				toolbar: {
					show: showToolbar,
					tools: {
						download: true,
						selection: false,
						zoom: true,
						zoomin: true,
						zoomout: true,
						pan: false,
						reset: true,
					},
				},
				animations: {
					enabled: animationsEnabled,
					easing: 'easeinout',
					speed: 800,
					animateGradually: { enabled: animationsEnabled, delay: 150 },
				},
				fontFamily: 'Public Sans, Inter, Roboto, sans-serif',
			},
			colors,
			stroke: {
				show: true,
				curve: type === 'line' || type === 'area' ? 'smooth' : 'straight',
				lineCap: 'round',
				width: type === 'line' ? 3 : type === 'area' ? 2.5 : 0,
			},
			...(type === 'bar'
				? {
						plotOptions: {
							bar: { borderRadius: 6, borderRadiusApplication: 'end' },
						},
				  }
				: {}),
			grid: {
				show: !minimal,
				borderColor: 'rgba(145, 158, 171, 0.16)',
				strokeDashArray: 4,
				// Minimal mode renders only 2 edge labels per axis, so they need
				// extra clearance from the plot bounds or they clip against the
				// chart container.
				padding: minimal
					? { top: 10, right: 24, bottom: 10, left: 24 }
					: { top: 10, right: 20, bottom: 10, left: 10 },
			},
			dataLabels: { enabled: false },
			legend: {
				show: !useCustomLegend,
				position: 'bottom',
				horizontalAlign: 'left',
				fontSize: '13px',
				fontWeight: 500,
				markers: { radius: 12, width: 10, height: 10 },
				itemMargin: { horizontal: 12, vertical: 5 },
			},
			fill: {
				type: type === 'area' ? 'gradient' : 'solid',
				gradient:
					type === 'area'
						? {
								shadeIntensity: 1,
								opacityFrom: 0.45,
								opacityTo: 0.05,
								stops: [0, 90, 100],
						  }
						: undefined,
			},
			tooltip: {
				enabled: true,
				shared: true,
				intersect: false,
				followCursor: false,
				fixed: {
					enabled: true,
					position: 'topRight',
					offsetX: -8,
					offsetY: 8,
				},
				custom: buildTooltip,
			},
			xaxis: {
				type: effectiveXAxesType,
				...(effectiveXAxesType === 'category' && categories
					? { categories }
					: {}),
				// tickAmount: 1 is ApexCharts' mechanism for "show only the start
				// and end tick" on category/datetime/numeric axes alike.
				tickAmount: minimal
					? 1
					: Math.min(tickAmount, Math.max(pointCount - 1, 1)),
				labels: {
					style: { colors: '#637381', fontSize: '12px' },
					rotate: 0,
					hideOverlappingLabels: true,
					trim: !minimal,
					...(granularity ? { formatter: xLabelFormatter } : {}),
				},
				axisBorder: {
					show: minimal,
					color: 'rgba(145, 158, 171, 0.32)',
				},
				axisTicks: { show: false },
			},
			yaxis: {
				tickAmount: minimal ? 1 : 5,
				labels: {
					style: { colors: '#637381', fontSize: '12px' },
					formatter: yLabelFormatter,
				},
				axisBorder: {
					show: minimal,
					color: 'rgba(145, 158, 171, 0.32)',
				},
				axisTicks: { show: false },
			},
			title: {
				text: resolvedTitle,
				align: 'left',
				style: { fontSize: '16px', fontWeight: 600, color: '#212b36' },
			},
			...customOptions,
		}),
		[
			type,
			colors,
			effectiveXAxesType,
			categories,
			granularity,
			xLabelFormatter,
			chartHeight,
			useCustomLegend,
			resolvedTitle,
			tickAmount,
			showToolbar,
			pointCount,
			animationsEnabled,
			buildTooltip,
			yLabelFormatter,
			customOptions,
			minimal,
		]
	);

	const legendItems = useMemo(
		() =>
			useCustomLegend
				? renderSeries.map((s, idx) => ({
						key: `${s?.name || 'series'}-${idx}`,
						name: s?.name || `Series ${idx + 1}`,
						color: colors[idx % colors.length] || '#637381',
				  }))
				: [],
		[useCustomLegend, renderSeries, colors]
	);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height,
				width: '100%',
				// Hard boundary: if chart + legend content ever exceeds the fixed
				// `height` (e.g. a percentage-height caller combined with the
				// custom legend), this clips cleanly instead of the legend
				// spilling past this box into whatever renders after it in the
				// DOM — the "bleeding into the card below" failure mode.
				overflow: 'hidden',
			}}
		>
			<Box sx={{ flex: useCustomLegend ? '0 0 auto' : 1, minHeight: 0 }}>
				<ReactApexChart
					height={chartHeight}
					options={baseOptions}
					series={renderSeries}
					type={type}
				/>
			</Box>

			{useCustomLegend && (
				<Box
					sx={{
						flexShrink: 0,
						height: CUSTOM_LEGEND_HEIGHT,
						overflowY: 'auto',
						display: 'flex',
						flexWrap: 'wrap',
						alignContent: 'flex-start',
						gap: '4px 12px',
						px: 0.5,
						pt: 0.5,
						// Solid, theme-aware background + its own stacking context so
						// legend text never visually blends with content behind or
						// adjacent to it (the "transparent bleeding" failure mode).
						position: 'relative',
						zIndex: 10,
						bgcolor: 'background.paper',
						borderTop: '1px solid',
						borderColor: 'divider',
					}}
				>
					{legendItems.map((item) => (
						<Box
							key={item.key}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.5,
								minWidth: 0,
							}}
						>
							<Box
								sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									bgcolor: item.color,
									flexShrink: 0,
								}}
							/>
							<Box
								component="span"
								sx={{
									fontSize: '11px',
									color: 'text.secondary',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									maxWidth: 160,
								}}
							>
								{item.name}
							</Box>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};

export default memo(CustomApexChart);
