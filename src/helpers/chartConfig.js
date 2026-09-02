import { downAnalyticsSampleData } from './common';
import { detectTimeField, smartParseDate } from './dateParse';
import { formatNumber } from './formatters';

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
	return formatNumber(val, 2);
};

/**
 * Compact axis-only number formatting. Tooltips retain their more precise
 * two-decimal formatting while crowded axes use short, stable labels.
 */
export const formatCompactChartValue = (value) => {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return '-';
	}

	if (Math.abs(numericValue) < 1000) {
		return formatNumber(numericValue, 2);
	}

	return new Intl.NumberFormat('en-US', {
		notation: 'compact',
		compactDisplay: 'short',
		maximumFractionDigits: 1,
	})
		.format(numericValue)
		.replace('K', 'k');
};

/**
 * Shared ApexCharts Y-axis defaults. Four intervals produce no more than
 * five labels, while forceNiceScale keeps gridlines on readable steps.
 */
export const getApexYAxisConfig = ({ unit = '', minimal = false } = {}) => ({
	tickAmount: minimal ? 1 : 4,
	forceNiceScale: true,
	decimalsInFloat: 2,
	axisBorder: {
		show: true,
		color: 'rgba(145, 158, 171, 0.32)',
	},
	axisTicks: {
		show: true,
		color: 'rgba(145, 158, 171, 0.32)',
	},
	labels: {
		show: true,
		minWidth: 32,
		maxWidth: 72,
		offsetX: -2,
		style: { colors: '#637381', fontSize: '11px' },
		formatter: (value) => {
			const formatted = formatCompactChartValue(value);
			return unit && formatted !== '-' ? `${formatted} ${unit}` : formatted;
		},
	},
});

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

	// Only builds [x, y] tuples when every row resolves a real, plausible
	// timestamp — otherwise a caller passing xAxesType="datetime" would
	// render points around epoch 0, and a partial mix of tuples/plain
	// values would break ApexCharts outright. CustomApexChart's
	// hasExplicitXValues() falls back to 'category' when this returns
	// plain values, so leaving x off entirely is always safe.
	const detectedField = detectTimeField(sampledArr);
	const timestamps = detectedField
		? sampledArr.map((item) => smartParseDate(item?.[detectedField]))
		: null;
	const timeField = timestamps?.every(Boolean) ? detectedField : null;

	const toPoint = (item, field, index) => {
		const y = item?.[field] ?? 0;
		if (!timeField) {
			return y;
		}
		return [timestamps[index].valueOf(), y];
	};

	const series = [
		{
			name: actualLabel,
			data: sampledArr.map((item, i) => toPoint(item, actual, i)),
		},
	];

	if (hasTarget) {
		series.push({
			name: targetLabel,
			data: sampledArr.map((item, i) => toPoint(item, target, i)),
		});
	}

	return series;
};

/**
 * Same x-detection guarantee as getChartSeries, but for callers that need
 * more than one field name per series (e.g. per-tab voltage/current phases)
 * instead of a single actual/target pair.
 * @param {Array}  data      - raw API data array
 * @param {Array}  seriesDefs - [{ name, field, color }]
 * @param {number} maxPoints - downsample limit for large data
 */
export const buildPointSeries = (
	data,
	seriesDefs,
	maxPoints = DEFAULT_MAX_POINTS
) => {
	const sampled = downsample(data, maxPoints);
	const sampledArr = Array.isArray(sampled) ? sampled : [];

	const detectedField = detectTimeField(sampledArr);
	const timestamps = detectedField
		? sampledArr.map((item) => smartParseDate(item?.[detectedField]))
		: null;
	const timeField = timestamps?.every(Boolean) ? detectedField : null;

	return seriesDefs.map(({ name, field, color }) => ({
		name,
		color,
		data: sampledArr.map((item, i) => {
			const y = item?.[field] ?? 0;
			return timeField ? [timestamps[i].valueOf(), y] : y;
		}),
	}));
};

/**
 * Builds Analytics series without converting timestamps to display-only
 * category strings. Each point retains its actual epoch-ms X value, and each
 * metric keeps the existing LTTB sampling behaviour.
 */
export const buildAnalyticsPointSeries = (
	data,
	fields,
	labelMap = {},
	maxPoints = 300
) => {
	const rows = Array.isArray(data) ? data : [];
	const timeField = detectTimeField(rows);
	// A selected timestamp is an X coordinate, never a metric. Keeping it out
	// of the series list prevents "Timestamp" from appearing in legends or as
	// a plotted value while retaining it on the axis and in the tooltip.
	const valueFields = (Array.isArray(fields) ? fields : []).filter(
		(field) => !timeField || field.toLowerCase() !== timeField.toLowerCase()
	);

	return valueFields.map((field) => {
		const sampled = downAnalyticsSampleData(rows, maxPoints, field) || [];
		const timestamps = timeField
			? sampled.map((row) => smartParseDate(row?.[timeField]))
			: null;
		const hasCompleteTimeline = timestamps?.every(Boolean);
		return {
			name: labelMap[field] || field,
			data: sampled.map((row, index) => {
				const value = row?.[field] ?? null;
				if (!hasCompleteTimeline) {
					return value;
				}
				return [timestamps[index].valueOf(), value];
			}),
		};
	});
};
