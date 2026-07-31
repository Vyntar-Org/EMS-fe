import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { memo, useCallback, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

dayjs.extend(utc);
dayjs.extend(relativeTime);

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
	if (typeof document === 'undefined') {return;}
	if (document.getElementById(TOOLTIP_STYLE_ID)) {return;}
	const style = document.createElement('style');
	style.id = TOOLTIP_STYLE_ID;
	style.textContent = TOOLTIP_CSS;
	document.head.appendChild(style);
};

ensureTooltipStylesInjected();

// Rounds to a max of 2 decimals and strips insignificant trailing zeros.
const roundTrim = (val) => {
	const num = Number(val);
	if (val === undefined || val === null || Number.isNaN(num)) {return '-';}
	const rounded = Math.round(num * 100) / 100;
	return Number.isInteger(rounded)
		? String(rounded)
		: String(rounded.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '');
};

const escapeHtml = (str) =>
	String(str).replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
	);

const WEEKDAY_NAMES = new Set([
	'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat',
	'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]);

const MIN_PLAUSIBLE_YEAR = 2000;
const MAX_PLAUSIBLE_YEAR = 2100;
const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

// Auto-detects unix-seconds vs unix-ms vs ISO/date strings vs bare HH:mm:ss
// time strings, and only accepts the result if it lands in a real-world year
// range. This is what actually prevents the "1970 bug": a raw category index
// like `5` is technically a valid dayjs input (parsed as an epoch offset), so
// validity alone isn't enough — the plausible-year guard rejects it instead
// of formatting it.
const smartParseDate = (val) => {
	if (val === undefined || val === null || val === '') {return null;}
	const str = typeof val === 'string' ? val.trim() : null;
	if (str && WEEKDAY_NAMES.has(str.toLowerCase())) {return null;}

	let parsed;
	const timeOnlyMatch = str?.match(TIME_ONLY_RE);
	if (typeof val === 'number' || (str && /^\d+$/.test(str))) {
		const num = Number(val);
		// 10-or-fewer-digit numbers are unix seconds; 13-digit are unix ms.
		parsed = String(Math.trunc(Math.abs(num))).length <= 10 ? dayjs.unix(num) : dayjs(num);
	} else if (timeOnlyMatch) {
		const [, hh, mm, ss] = timeOnlyMatch;
		parsed = dayjs()
			.hour(Number(hh))
			.minute(Number(mm))
			.second(Number(ss || 0))
			.millisecond(0);
	} else {
		parsed = dayjs(val);
	}

	if (!parsed.isValid()) {return null;}
	const year = parsed.year();
	if (year < MIN_PLAUSIBLE_YEAR || year > MAX_PLAUSIBLE_YEAR) {return null;}
	return parsed;
};

const MAX_RENDER_POINTS = 500;

// Defensive downsample: even if the caller already thinned its data, this
// stops any accidental oversized array from ever reaching ApexCharts.
const downsampleSeries = (series, pointCount) => {
	if (pointCount <= MAX_RENDER_POINTS) {return series;}
	const stride = Math.ceil(pointCount / MAX_RENDER_POINTS);
	return series.map((s) => ({
		...s,
		data: (s?.data || []).filter((_, idx) => idx % stride === 0),
	}));
};

const CustomApexChart = ({
	type = 'line',
	series = [],
	colors = ['#1976d2', '#2e7d32', '#ed6c02'],
	xAxesType = 'category', // 'datetime' or 'category'
	height = 350,
	title = '',
	unit = '',
	meta = null, // optional API meta envelope: { unit, title }
	tickAmount = 6,
	showToolbar = true,
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

	// Large datasets skip animation entirely to avoid frame drops.
	const animationsEnabled = pointCount <= 150;

	const formatValue = useCallback(
		(val) => {
			const rounded = roundTrim(val);
			return resolvedUnit && rounded !== '-' ? `${rounded} ${resolvedUnit}` : rounded;
		},
		[resolvedUnit]
	);

	const yLabelFormatter = useCallback((val) => formatValue(val), [formatValue]);

	const buildTooltip = useCallback(
		({ series: s, seriesIndex, dataPointIndex, w }) => {
			const xVal = w.globals.seriesX?.[seriesIndex]?.[dataPointIndex] ?? w.globals.labels?.[dataPointIndex];

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
					if (raw === undefined || raw === null) {return '';}
					const color = w.globals.colors?.[idx] || '#637381';
					return `<div class="capx-tooltip-row"><span class="capx-tooltip-dot" style="background:${color}"></span><span class="capx-tooltip-name">${escapeHtml(name)}</span><span class="capx-tooltip-value">${formatValue(raw)}</span></div>`;
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
				height,
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
			grid: {
				show: true,
				borderColor: 'rgba(145, 158, 171, 0.16)',
				strokeDashArray: 4,
				padding: { top: 10, right: 20, bottom: 10, left: 10 },
			},
			dataLabels: { enabled: false },
			legend: {
				show: true,
				position: 'top',
				horizontalAlign: 'right',
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
				type: xAxesType,
				tickAmount: Math.min(tickAmount, Math.max(pointCount - 1, 1)),
				labels: {
					style: { colors: '#637381', fontSize: '12px' },
					rotate: 0,
					hideOverlappingLabels: true,
					trim: true,
				},
				axisBorder: { show: false },
				axisTicks: { show: false },
			},
			yaxis: {
				tickAmount: 5,
				labels: {
					style: { colors: '#637381', fontSize: '12px' },
					formatter: yLabelFormatter,
				},
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
			xAxesType,
			height,
			resolvedTitle,
			tickAmount,
			showToolbar,
			pointCount,
			animationsEnabled,
			buildTooltip,
			yLabelFormatter,
			customOptions,
		]
	);

	return <ReactApexChart height={height} options={baseOptions} series={renderSeries} type={type} />;
};

export default memo(CustomApexChart);
