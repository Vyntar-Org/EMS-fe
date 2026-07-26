import dayjs from 'dayjs';

import { formatTimeLabel } from './common';

// Chart series palettes per theme mode. Light keeps the original brand
// colors; dark swaps to vivid tones that stay visible on navy surfaces.
// (Axis/legend/grid text is themed globally via CSS in main.jsx.)
const LIGHT_CHART_COLORS = {
	primary: '#0156A6',
	secondary: '#A5AAB5',
	online: '#28A745',
	offline: '#DC3545',
	warning: '#F1B44C',
	danger: '#F46A6A',
	success: '#34C38F',
	purple: '#6F42C1',
	orange: '#FD7E14',
	teal: '#20C997',
	navy: '#12233E',
	// Validated categorical palette (colorblind-safe adjacent ordering) —
	// used for per-card accents and multi-series charts.
	categorical1: '#2a78d6', // blue
	categorical2: '#eb6834', // orange
	categorical3: '#1baf7a', // aqua
	categorical4: '#eda100', // yellow
	categorical5: '#e87ba4', // magenta
	categorical6: '#008300', // green
	categorical7: '#4a3aa7', // violet
	categorical8: '#e34948', // red
	// Per-card semantic accents, aliased onto the categorical slots
	demand: '#2a78d6',
	consumption6h: '#eb6834',
	machinePower: '#1baf7a',
	waterUsage: '#2a78d6',
	fuelUsage: '#eda100',
};

const DARK_CHART_COLORS = {
	primary: '#3B82F6',
	secondary: '#94A3B8',
	online: '#22C55E',
	offline: '#EF4444',
	warning: '#F5B93F',
	danger: '#F87171',
	success: '#2DBE8D',
	purple: '#8B5CF6',
	orange: '#FB923C',
	teal: '#2DD4BF',
	navy: '#60A5FA',
	categorical1: '#3987e5',
	categorical2: '#d95926',
	categorical3: '#199e70',
	categorical4: '#c98500',
	categorical5: '#d55181',
	categorical6: '#008300',
	categorical7: '#9085e9',
	categorical8: '#e66767',
	demand: '#3987e5',
	consumption6h: '#d95926',
	machinePower: '#199e70',
	waterUsage: '#3987e5',
	fuelUsage: '#c98500',
};

// Kept in sync with the app theme by ThemedApp (src/main.jsx).
let chartThemeMode = 'light';
export const setChartThemeMode = (mode) => {
	chartThemeMode = mode === 'dark' ? 'dark' : 'light';
};

const activeColors = () =>
	chartThemeMode === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

// Live object: reading CHART_COLORS.primary always reflects the active
// theme mode, so chart options built during render pick the right palette.
export const CHART_COLORS = {};
Object.keys(LIGHT_CHART_COLORS).forEach((key) => {
	Object.defineProperty(CHART_COLORS, key, {
		get: () => activeColors()[key],
		enumerable: true,
	});
});

// Ordered categorical slots for multi-series charts — order is the
// colorblind-safety mechanism, so callers should slice from the front
// rather than pick slots out of order.
export const getCategoricalColors = (count = 8) => {
	const colors = activeColors();
	return Array.from({ length: count }, (_, i) => colors[`categorical${i + 1}`]);
};

const LARGE_DATA_THRESHOLD = 500;

// Card-sized charts read better with a handful of points than with every
// raw sample — dense axes overflow/crowd a small card. Widgets that need a
// different cap pass their own maxPoints.
export const DEFAULT_MAX_POINTS = 20;

export const downsample = (data, maxPoints = DEFAULT_MAX_POINTS) => {
	if (!Array.isArray(data) || data.length <= maxPoints) {
		return data;
	}
	const step = Math.ceil(data.length / maxPoints);
	return data.filter((_, i) => i % step === 0);
};

// Chart values come straight off the API with full floating-point noise
// (e.g. 10.12545451224) — round to 2 decimals everywhere a value is
// displayed (tooltip rows, donut/radial labels, axis ticks), and drop a
// trailing ".00" so whole numbers stay clean.
const formatChartValue = (val) => {
	const num = Number(val);
	if (!Number.isFinite(num)) {
		return val;
	}
	const rounded = Math.round(num * 100) / 100;
	return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
};

const resolveValue = (raw) => {
	if (typeof raw === 'number') {
		return raw < 1e12 ? raw * 1000 : raw;
	}
	return raw;
};

// Common label fields to look for when a caller passes a `categories` array
// of row objects instead of primitive values (e.g. forgetting `categoryOpts.key`,
// or the API returning `{ label, value }` pairs) — without this, `String(raw)`
// below renders as the literal text "[object Object]" on every x-axis tick.
const OBJECT_LABEL_KEYS = [
	'label',
	'name',
	'timestamp',
	'date',
	'time',
	'value',
];

const autoFormat = (raw) => {
	if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw)) {
		return formatTimeLabel(raw);
	}

	if (typeof raw === 'number') {
		const d = dayjs(resolveValue(raw));
		return d.format('MMM D, h:mm A');
	}

	if (typeof raw === 'string' && dayjs(raw).isValid()) {
		const d = dayjs(raw);
		const hasTime = d.hour() !== 0 || d.minute() !== 0;
		return hasTime ? d.format('MMM D, h:mm A') : d.format('MMM D');
	}

	if (raw && typeof raw === 'object' && !(raw instanceof Date)) {
		const labelKey = OBJECT_LABEL_KEYS.find(
			(k) => raw[k] !== undefined && raw[k] !== null
		);
		if (labelKey) {
			return autoFormat(raw[labelKey]);
		}
		if (import.meta.env.DEV) {
			console.warn(
				'getChartCategories: category item is an object with no recognizable label field — pass `categoryOpts.key`. Received:',
				raw
			);
		}
		return '';
	}

	return String(raw);
};

export const getChartCategories = (data, opts = {}) => {
	const { key, format = 'auto', customFormat, maxPoints } = opts;

	if (!Array.isArray(data)) {
		return [];
	}

	// Only downsample when a cap is explicitly requested — callers that
	// build the series independently (not via getChartSeries) rely on
	// categories matching their data 1:1 by default.
	const sourceData = maxPoints ? downsample(data, maxPoints) : data;

	return sourceData.map((item) => {
		const raw = key ? item?.[key] : item;

		if (raw === null || raw === undefined) {
			return '';
		}

		if (customFormat) {
			return dayjs(resolveValue(raw)).format(customFormat);
		}

		switch (format) {
			case 'time':
				if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw)) {
					return formatTimeLabel(raw);
				}
				return dayjs(resolveValue(raw)).format('h:mm A');

			case 'date':
				return dayjs(resolveValue(raw)).format('MMM D');

			case 'datetime':
				return dayjs(resolveValue(raw)).format('MMM D, h:mm A');

			case 'raw':
				return String(raw);

			case 'auto':
			default:
				return autoFormat(raw);
		}
	});
};

// A rotated label for every single category reads as noise, not signal —
// card-sized charts especially only have room for a handful of ticks. This
// caps how many labels actually render (evenly spaced) regardless of how
// many categories/points the series has, independent of `isLarge` (which
// only affects animation/shadow cost, not label crowding).
const MAX_XAXIS_LABELS = 8;

const commonXAxis = (data, _isLarge, xLabel = 'Day', categoryOpts = {}) => {
	const categories = getChartCategories(data, categoryOpts);
	const labelStep = Math.max(
		1,
		Math.ceil(categories.length / MAX_XAXIS_LABELS)
	);

	return {
		categories,
		title: {
			text: xLabel,
			style: { color: '#555', fontWeight: 'bold' },
		},
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			rotate: -45,
			style: { colors: '#757575', fontSize: '11px' },
			// ApexCharts' category-axis formatter only reliably passes the
			// label itself as the first argument — the 2nd/3rd args are
			// documented for datetime/numeric axes, not category, and were
			// coming through empty here, blanking every single label. Look
			// the value's own position up in the closed-over `categories`
			// array instead of trusting a positional index argument.
			formatter: (val) => {
				const idx = categories.indexOf(val);
				return idx === -1 || idx % labelStep === 0 ? val : '';
			},
		},
		tickAmount: Math.min(categories.length || 1, MAX_XAXIS_LABELS),
	};
};

const commonYAxis = (yLabel = 'Liters') => ({
	title: {
		text: yLabel,
		style: { color: '#555', fontWeight: 'bold' },
	},
	axisBorder: { show: false },
	axisTicks: { show: false },
	labels: {
		style: { colors: '#757575' },
		formatter: (val) => formatChartValue(val),
	},
});

// Chart chrome/ink per theme mode — mirrors the app's card surfaces so the
// tooltip reads as part of the same design system in both modes.
const TOOLTIP_INK = {
	light: {
		surface: '#fcfcfb',
		primary: '#0b0b0b',
		secondary: '#52514e',
		border: 'rgba(11,11,11,0.10)',
	},
	dark: {
		surface: '#242422',
		primary: '#ffffff',
		secondary: '#c3c2b7',
		border: 'rgba(255,255,255,0.12)',
	},
};

/**
 * Builds a themed, premium HTML tooltip for bar/line/area charts (shared
 * across series at a given point). Avoids ApexCharts' plain default box.
 * @param {Object} opts - { unit, titleFormat }
 */
export const buildPremiumTooltip = ({ unit = '', titleFormat } = {}) =>
	function ({ series, seriesIndex, dataPointIndex, w }) {
		const ink = TOOLTIP_INK[chartThemeMode] || TOOLTIP_INK.light;
		const isDatetime = w.config.xaxis?.type === 'datetime';

		let title = '';
		if (isDatetime) {
			const x = w.globals.seriesX?.[seriesIndex]?.[dataPointIndex];
			if (x !== null && x !== undefined) {
				title = dayjs(x).format(titleFormat || 'MMM D, h:mm A');
			}
		} else {
			// Category axis: the label at this point, formatted the same way
			// the x-axis ticks are (falls back to the raw label) so the
			// tooltip title always reads as a real date/category, never blank.
			const rawLabel = w.globals.labels?.[dataPointIndex];
			title = rawLabel !== undefined && rawLabel !== null ? rawLabel : '';
		}

		const rows = (w.globals.seriesNames || [])
			.map((name, i) => {
				const raw = series?.[i]?.[dataPointIndex];
				if (raw === undefined || raw === null) {
					return '';
				}
				const color =
					w.globals.colors?.[i] || w.config.colors?.[i] || '#2a78d6';
				const emphasize = i === seriesIndex ? 'font-weight:700;' : '';
				return `
					<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:3px 0;${emphasize}">
						<span style="display:flex;align-items:center;gap:6px;">
							<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
							<span style="font-size:12px;color:${ink.secondary};">${name}</span>
						</span>
						<span style="font-size:12px;font-weight:700;color:${
							ink.primary
						};white-space:nowrap;">${formatChartValue(raw)}${
							unit ? ` ${unit}` : ''
						}</span>
					</div>`;
			})
			.join('');

		return `
			<div style="background:${ink.surface};border:1px solid ${
				ink.border
			};border-radius:10px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,0.22);min-width:130px;">
				${
					title
						? `<div style="font-size:11px;font-weight:700;color:${ink.secondary};margin-bottom:6px;">${title}</div>`
						: ''
				}
				${rows}
			</div>`;
	};

/**
 * Themed custom tooltip for donut/pie charts — one slice at a time.
 */
export const buildDonutTooltip = ({ unit = '' } = {}) =>
	function ({ series, seriesIndex, w }) {
		const ink = TOOLTIP_INK[chartThemeMode] || TOOLTIP_INK.light;
		const name = w.globals.labels?.[seriesIndex] ?? '';
		const value = series?.[seriesIndex];
		const color = w.globals.colors?.[seriesIndex] || '#2a78d6';

		return `
			<div style="background:${ink.surface};border:1px solid ${
				ink.border
			};border-radius:10px;padding:8px 12px;box-shadow:0 8px 24px rgba(0,0,0,0.22);">
				<div style="display:flex;align-items:center;gap:8px;">
					<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
					<span style="font-size:12px;color:${ink.secondary};">${name}</span>
					<span style="font-size:12px;font-weight:700;color:${ink.primary};">${value}${
						unit ? ` ${unit}` : ''
					}</span>
				</div>
			</div>`;
	};

const commonLegend = {
	show: true,
	position: 'top',
	horizontalAlign: 'center',
	fontWeight: 600,
	markers: { shape: 'circle', size: 6, offsetX: -2 },
	itemMargin: { horizontal: 10 },
};

// Pinned to a fixed corner instead of following the cursor — a
// cursor-tracked tooltip near a card's edge gets clipped by the card's own
// rounded-corner overflow:hidden. Fixed positioning keeps it safely inside
// the chart's own bounds at all times.
const commonTooltip = (yLabel = 'Liters') => ({
	shared: true,
	intersect: false,
	fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 },
	custom: buildPremiumTooltip({ unit: yLabel }),
});

const commonGrid = {
	borderColor: 'rgba(128, 145, 170, 0.18)',
	yaxis: { lines: { show: true } },
	xaxis: { lines: { show: false } },
};

const commonChart = (type, isLarge) => ({
	type,
	toolbar: {
		show: true,
		tools: {
			download: true,
			selection: false,
			zoom: false,
			zoomin: false,
			zoomout: false,
			pan: false,
			reset: false,
		},
	},
	zoom: { enabled: false },
	animations: {
		enabled: !isLarge,
		speed: 400,
		dynamicAnimation: { enabled: !isLarge },
	},
	redrawOnParentResize: true,
	redrawOnWindowResize: true,
});

const barOptions = (data, isLarge, yLabel, xLabel, colors, categoryOpts) => ({
	chart: commonChart('bar', isLarge),
	colors,
	plotOptions: {
		bar: {
			borderRadius: isLarge ? 0 : 6,
			borderRadiusApplication: 'end',
			columnWidth: isLarge ? '90%' : '60%',
			dataLabels: { position: 'top' },
		},
	},
	// Soft vertical gradient gives bars a premium finish in both themes
	fill: {
		type: 'gradient',
		gradient: {
			shade: 'light',
			type: 'vertical',
			shadeIntensity: 0.2,
			opacityFrom: 1,
			opacityTo: 0.85,
			stops: [0, 100],
		},
	},
	stroke: {
		show: true,
		width: 2,
		colors: ['transparent'],
	},
	markers: { size: 0 },
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel),
	legend: commonLegend,
	grid: commonGrid,
});

const lineOptions = (data, isLarge, yLabel, xLabel, colors, categoryOpts) => ({
	chart: {
		...commonChart('line', isLarge),
		// Soft shadow under the line lifts it off the grid
		dropShadow: {
			enabled: !isLarge,
			top: 6,
			left: 0,
			blur: 8,
			opacity: 0.16,
		},
	},
	colors,
	stroke: {
		curve: 'smooth',
		width: 3,
		lineCap: 'round',
	},
	markers: {
		size: 0,
		strokeWidth: 2,
		hover: { size: isLarge ? 4 : 6 },
	},
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel),
	legend: commonLegend,
	grid: commonGrid,
});

const areaOptions = (data, isLarge, yLabel, xLabel, colors, categoryOpts) => ({
	chart: commonChart('area', isLarge),
	colors,
	fill: {
		type: 'gradient',
		gradient: {
			shadeIntensity: isLarge ? 0 : 1,
			opacityFrom: isLarge ? 0.2 : 0.4,
			opacityTo: 0.05,
		},
	},
	stroke: {
		curve: 'straight',
		width: [2, 2],
		dashArray: [0, 6],
	},
	markers: {
		size: 0,
		strokeWidth: 0,
		hover: { size: isLarge ? 4 : 6 },
	},
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel),
	legend: commonLegend,
	grid: commonGrid,
});

const donutOptions = (labels = [], yLabel = '', colors) => ({
	chart: {
		type: 'donut',
		toolbar: {
			show: true,
			tools: {
				download: true,
				selection: false,
				zoom: false,
				zoomin: false,
				zoomout: false,
				pan: false,
				reset: false,
			},
		},
		animations: { enabled: true, speed: 400 },
	},
	colors,
	labels,
	dataLabels: { enabled: false },
	plotOptions: {
		pie: {
			donut: {
				size: '65%',
				labels: {
					show: true,
					total: {
						show: true,
						label: yLabel || 'Total',
						formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0),
					},
				},
			},
		},
	},
	legend: { ...commonLegend, position: 'bottom' },
	tooltip: {
		fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 },
		custom: buildDonutTooltip({ unit: yLabel }),
	},
});

const radialOptions = (labels = [], colors) => ({
	chart: {
		type: 'radialBar',
		toolbar: {
			show: true,
			tools: {
				download: true,
				selection: false,
				zoom: false,
				zoomin: false,
				zoomout: false,
				pan: false,
				reset: false,
			},
		},
		animations: { enabled: true, speed: 400 },
	},
	colors,
	plotOptions: {
		radialBar: {
			offsetY: 0,
			startAngle: -135,
			endAngle: 135,
			hollow: {
				size: '60%',
				background: 'transparent',
			},
			track: {
				background: 'rgba(128, 145, 170, 0.25)',
				strokeWidth: '97%',
				margin: 5,
			},
			dataLabels: {
				name: {
					show: true,
					fontSize: '10px',
					color: '#6B7280',
					offsetY: -10,
				},
				value: {
					show: true,
					fontSize: '14px',
					fontWeight: 'bold',
					color: '#1F2937',
					offsetY: -1,
					formatter: function (val) {
						return val;
					},
				},
			},
		},
	},
	labels,
	legend: {
		show: false,
	},
	stroke: {
		lineCap: 'round',
	},
	tooltip: {
		enabled: true,
		y: { formatter: (val) => `${Math.round(val)}` },
	},
});

/**
 * @param {"bar"|"line"|"area"|"donut"|"radialBar"} type
 * @param {Array} data  - raw API data array
 * @param {Object} opts - { yLabel, xLabel, labels, maxPoints, colors }
 * @author Venkadesan
 */
export const getChartOptions = (type, data, opts = {}) => {
	const {
		yLabel = 'Liters',
		xLabel = 'Day',
		labels = [],
		colors = [CHART_COLORS.primary, CHART_COLORS.secondary],
		categoryOpts = {},
	} = opts;

	const isLarge = Array.isArray(data) && data.length > LARGE_DATA_THRESHOLD;

	switch (type) {
		case 'bar':
			return barOptions(data, isLarge, yLabel, xLabel, colors, categoryOpts);
		case 'line':
			return lineOptions(data, isLarge, yLabel, xLabel, colors, categoryOpts);
		case 'area':
			return areaOptions(data, isLarge, yLabel, xLabel, colors, categoryOpts);
		case 'donut':
			return donutOptions(labels, yLabel, colors);
		case 'radialBar':
			return radialOptions(labels, colors);
		default:
			return lineOptions(data, isLarge, yLabel, xLabel, colors);
	}
};

/**
 * @param {Array}  data       - raw API data array
 * @param {Object} seriesMap  - { actual: "fieldName", target: "fieldName" }
 * @param {number} maxPoints  - downsample limit for large data
 * @author Venkadesan
 */
export const getChartSeries = (
	data,
	seriesMap = {},
	maxPoints = DEFAULT_MAX_POINTS
) => {
	const {
		actual = 'consumption',
		target = 'target',
		actualLabel = 'Actual Consumption',
		targetLabel = 'Target',
		includeTarget,
	} = seriesMap;

	const sampled = downsample(data, maxPoints);
	const sampledArr = Array.isArray(sampled) ? sampled : [];

	const hasTarget =
		includeTarget !== undefined
			? includeTarget
			: sampledArr.some((item) => item?.[target] !== undefined);

	const series = [
		{
			name: actualLabel,
			data: sampledArr.map((item) => item?.[actual] ?? 0),
		},
	];

	if (hasTarget) {
		series.push({
			name: targetLabel,
			data: sampledArr.map((item) => item?.[target] ?? 0),
		});
	}

	return series;
};
