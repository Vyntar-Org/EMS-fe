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
	const num = Number(val);
	if (!Number.isFinite(num)) {
		return val;
	}
	const rounded = Math.round(num * 100) / 100;
	return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
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
