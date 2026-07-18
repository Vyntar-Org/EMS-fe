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

const LARGE_DATA_THRESHOLD = 500;

const downsample = (data, maxPoints = 100) => {
	if (!Array.isArray(data) || data.length <= maxPoints) {
		return data;
	}
	const step = Math.ceil(data.length / maxPoints);
	return data.filter((_, i) => i % step === 0);
};

const resolveValue = (raw) => {
	if (typeof raw === 'number') {
		return raw < 1e12 ? raw * 1000 : raw;
	}
	return raw;
};

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

	return String(raw);
};

export const getChartCategories = (data, opts = {}) => {
	const { key, format = 'auto', customFormat } = opts;

	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item) => {
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

const commonXAxis = (data, isLarge, xLabel = 'Day', categoryOpts = {}) => ({
	categories: getChartCategories(data, categoryOpts),
	title: {
		text: xLabel,
		style: { color: '#555', fontWeight: 'bold' },
	},
	axisBorder: { show: false },
	axisTicks: { show: false },
	labels: {
		rotate: -45,
		style: { colors: '#757575', fontSize: '11px' },
		formatter: isLarge ? (val, i) => (i % 5 === 0 ? val : '') : undefined,
	},
	tickAmount: isLarge ? 20 : 20,
});

const commonYAxis = (yLabel = 'Liters') => ({
	title: {
		text: yLabel,
		style: { color: '#555', fontWeight: 'bold' },
	},
	axisBorder: { show: false },
	axisTicks: { show: false },
	labels: {
		style: { colors: '#757575' },
		formatter: (val) => Math.round(val),
	},
});

const commonLegend = {
	show: true,
	position: 'top',
	horizontalAlign: 'center',
	fontWeight: 600,
	markers: { shape: 'circle', size: 6, offsetX: -2 },
	itemMargin: { horizontal: 10 },
};

const commonTooltip = (yLabel = 'Liters') => ({
	shared: true,
	intersect: false,
	followCursor: true,
	y: { formatter: (val) => `${val} ${yLabel}` },
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
	markers: { size: isLarge ? 0 : 4, strokeWidth: 0 },
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
	dataLabels: {
		enabled: true,
		formatter: (val) => `${Math.round(val)}%`,
	},
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
		y: { formatter: (val) => `${val} ${yLabel}` },
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
export const getChartSeries = (data, seriesMap = {}, maxPoints = 100) => {
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
