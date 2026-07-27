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
export const formatChartValue = (val) => {
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

	const ink = activeAxisInk();

	return {
		categories,
		title: {
			text: xLabel,
			style: { color: ink.title, fontWeight: 'bold' },
		},
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			rotate: -45,
			style: { colors: ink.label, fontSize: '11px' },
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

const commonYAxis = (yLabel = 'Liters') => {
	const ink = activeAxisInk();
	return {
		title: {
			text: yLabel,
			style: { color: ink.title, fontWeight: 'bold' },
		},
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: {
			style: { colors: ink.label },
			formatter: (val) => formatChartValue(val),
		},
	};
};

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

// Axis/label ink per theme mode — hardcoded greys read as washed-out or
// invisible against a dark card surface, so axis titles/ticks/data-label
// text must swap alongside the tooltip and series palettes.
const AXIS_INK = {
	light: { title: '#555555', label: '#757575', dataLabel: '#1F2937' },
	dark: { title: '#cbd5e1', label: '#94a3b8', dataLabel: '#e2e8f0' },
};

const activeAxisInk = () => AXIS_INK[chartThemeMode] || AXIS_INK.light;

// Exposed for the handful of call sites that build a fully custom
// ApexCharts `options` object (bespoke hover-sync behavior, etc.) instead of
// going through `getChartOptions`/`buildComparisonChartOptions` — they still
// need theme-aware ink rather than a hardcoded grey.
export const getAxisInk = () => activeAxisInk();

// Same escape hatch as `getAxisInk`, for call sites building a fully custom
// HTML tooltip (bespoke multi-row status tooltips, etc.) that still need to
// match the app's tooltip surface/border/text ink per theme mode.
export const getTooltipInk = () => TOOLTIP_INK[chartThemeMode] || TOOLTIP_INK.light;

/**
 * Builds a themed, premium HTML tooltip for bar/line/area charts (shared
 * across series at a given point). Avoids ApexCharts' plain default box.
 * @param {Object} opts - { unit, titleFormat }
 */
export const buildPremiumTooltip = ({ unit = '', titleFormat, chartTitle } = {}) =>
	function ({ series, seriesIndex, dataPointIndex, w }) {
		const ink = TOOLTIP_INK[chartThemeMode] || TOOLTIP_INK.light;
		const isDatetime = w.config.xaxis?.type === 'datetime';

		let xLabel = '';
		if (isDatetime) {
			const x = w.globals.seriesX?.[seriesIndex]?.[dataPointIndex];
			if (x !== null && x !== undefined) {
				xLabel = dayjs(x).format(titleFormat || 'MMM D, h:mm A');
			}
		} else {
			// Category axis: the label at this point, formatted the same way
			// the x-axis ticks are (falls back to the raw label) so the
			// tooltip title always reads as a real date/category, never blank.
			const rawLabel = w.globals.labels?.[dataPointIndex];
			xLabel = rawLabel !== undefined && rawLabel !== null ? rawLabel : '';
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
			};border-radius:10px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,0.22);min-width:150px;">
				${
					chartTitle
						? `<div style="font-size:12px;font-weight:700;color:${ink.primary};margin-bottom:2px;">${chartTitle}</div>`
						: ''
				}
				${
					xLabel
						? `<div style="font-size:11px;color:${ink.secondary};margin-bottom:6px;">${xLabel}</div>`
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
					<span style="font-size:12px;font-weight:700;color:${
						ink.primary
					};">${formatChartValue(value)}${unit ? ` ${unit}` : ''}</span>
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

// Pinned to a fixed corner instead of following the cursor for small,
// card-sized charts — a cursor-tracked tooltip near a card's edge gets
// clipped by the card's own rounded-corner overflow:hidden there. Wide,
// full-row charts (analytics comparison rows) don't have that edge-clipping
// problem and are wide enough that a corner-pinned tooltip goes unnoticed
// far from the cursor, so those pass `tooltipFixed: false` to get the
// normal cursor-following tooltip instead.
const commonTooltip = (yLabel = 'Liters', chartTitle, tooltipFixed = true) => ({
	shared: true,
	intersect: false,
	...(tooltipFixed
		? { fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 } }
		: {}),
	custom: buildPremiumTooltip({ unit: yLabel, chartTitle }),
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

const barOptions = (
	data,
	isLarge,
	yLabel,
	xLabel,
	colors,
	categoryOpts,
	chartTitle,
	tooltipFixed
) => ({
	chart: {
		...commonChart('bar', isLarge),
		// Soft shadow under each bar lifts it off the grid, same treatment
		// as the line/area charts.
		dropShadow: {
			enabled: !isLarge,
			top: 3,
			left: 0,
			blur: 4,
			opacity: 0.18,
		},
	},
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
	// Values live in the tooltip (hover), not printed permanently on every
	// bar — keeps the chart itself clean; see `commonTooltip`.
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel, chartTitle, tooltipFixed),
	legend: commonLegend,
	grid: commonGrid,
});

const lineOptions = (
	data,
	isLarge,
	yLabel,
	xLabel,
	colors,
	categoryOpts,
	chartTitle,
	tooltipFixed
) => ({
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
	// Values live in the tooltip (hover), not printed permanently on every
	// point — keeps the chart itself clean; see `commonTooltip`.
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel, chartTitle, tooltipFixed),
	legend: commonLegend,
	grid: commonGrid,
});

const areaOptions = (
	data,
	isLarge,
	yLabel,
	xLabel,
	colors,
	categoryOpts,
	chartTitle,
	tooltipFixed
) => ({
	chart: {
		...commonChart('area', isLarge),
		// Soft shadow under the line/fill lifts it off the grid, same
		// treatment as the bar/line charts.
		dropShadow: {
			enabled: !isLarge,
			top: 4,
			left: 0,
			blur: 6,
			opacity: 0.14,
		},
	},
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
	// Values live in the tooltip (hover), not printed permanently on every
	// point — keeps the chart itself clean; see `commonTooltip`.
	dataLabels: { enabled: false },
	xaxis: commonXAxis(data, isLarge, xLabel, categoryOpts),
	yaxis: commonYAxis(yLabel),
	tooltip: commonTooltip(yLabel, chartTitle, tooltipFixed),
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
	// Values live in the tooltip (hover) and legend, not printed permanently
	// on each slice — keeps the chart itself clean; see `buildDonutTooltip`.
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
						formatter: (w) =>
							formatChartValue(
								w.globals.seriesTotals.reduce((a, b) => a + b, 0)
							),
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
					color: activeAxisInk().label,
					offsetY: -10,
				},
				value: {
					show: true,
					fontSize: '14px',
					fontWeight: 'bold',
					color: activeAxisInk().dataLabel,
					offsetY: -1,
					formatter: function (val) {
						return formatChartValue(val);
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
		y: { formatter: (val) => formatChartValue(val) },
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
		chartTitle,
		// Wide, full-row charts (analytics comparison rows) should pass
		// `false` here — see the comment on `commonTooltip` for why.
		tooltipFixed = true,
	} = opts;

	const isLarge = Array.isArray(data) && data.length > LARGE_DATA_THRESHOLD;

	switch (type) {
		case 'bar':
			return barOptions(
				data,
				isLarge,
				yLabel,
				xLabel,
				colors,
				categoryOpts,
				chartTitle,
				tooltipFixed
			);
		case 'line':
			return lineOptions(
				data,
				isLarge,
				yLabel,
				xLabel,
				colors,
				categoryOpts,
				chartTitle,
				tooltipFixed
			);
		case 'area':
			return areaOptions(
				data,
				isLarge,
				yLabel,
				xLabel,
				colors,
				categoryOpts,
				chartTitle,
				tooltipFixed
			);
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

/**
 * Shared options builder for the multi-device "comparison" line charts used
 * across the Analytics screens (Water/Fuel/Solar/Temperature/FireSafety/...).
 * Centralizes theme-aware axes, the premium tooltip (with a contextual
 * `chartTitle`), shadows and 2-decimal formatting so each screen no longer
 * hand-rolls its own copy of this options object.
 * @param {Object} opts - { categories, chartTitle, unit, xLabel, yLabel }
 */
export const buildComparisonChartOptions = ({
	categories = [],
	chartTitle = '',
	unit = '',
	xLabel = 'Time',
	yLabel = 'Value',
} = {}) => {
	const ink = activeAxisInk();

	return {
		chart: {
			type: 'line',
			zoom: { enabled: false },
			animations: { enabled: false },
			// Subtle lift under the line so it reads as a premium chart rather
			// than a flat plot — cheap since chart animations are already off.
			dropShadow: {
				enabled: true,
				top: 4,
				left: 0,
				blur: 4,
				opacity: 0.12,
			},
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
		},
		dataLabels: { enabled: false },
		markers: { size: 0, hover: { sizeOffset: 4 } },
		stroke: { curve: 'smooth', width: 2, lineCap: 'round' },
		xaxis: {
			categories,
			title: { text: xLabel, style: { color: ink.title, fontWeight: 'bold' } },
			labels: { rotate: -45, style: { colors: ink.label, fontSize: '11px' } },
			axisBorder: { show: false },
			axisTicks: { show: false },
			tooltip: { enabled: false },
		},
		yaxis: {
			title: { text: yLabel, style: { color: ink.title, fontWeight: 'bold' } },
			labels: {
				style: { colors: ink.label },
				formatter: (val) => (val !== null ? formatChartValue(val) : ''),
			},
		},
		tooltip: {
			shared: true,
			intersect: false,
			// No `fixed` positioning here (unlike `commonTooltip`) — these are
			// wide, full-row comparison charts, not small cards with a
			// rounded-corner overflow:hidden to dodge, so the normal
			// cursor-following tooltip is what's actually visible/expected.
			custom: buildPremiumTooltip({ unit, chartTitle }),
		},
		legend: commonLegend,
		grid: commonGrid,
		states: {
			normal: { filter: { type: 'none' } },
			hover: { filter: { type: 'none' } },
			active: { filter: { type: 'none' } },
		},
	};
};
