import { formatNumber } from '../../helpers/formatters.js';

export const WATER_REPORT_TYPES = [
	{
		id: 'daily-consumption',
		title: 'Daily Water Consumption',
		tabLabel: 'Day-Wise Consumption',
		fileLabel: 'Daily_Consumption',
		endpoint: 'daily-consumption-reports/',
		daily: true,
	},
	{
		id: 'monthly-consumption',
		title: 'Monthly Water Consumption',
		tabLabel: 'Month-Wise Consumption',
		fileLabel: 'Monthly_Consumption',
		endpoint: 'monthly-consumption-reports/',
		daily: false,
	},
	{
		id: 'daily-reading',
		title: 'Daily Meter Reading (Totalizer)',
		tabLabel: 'Daily Meter Reading',
		fileLabel: 'Daily_Meter_Reading',
		endpoint: 'daily-reading-reports/',
		daily: true,
		totalizer: true,
	},
	{
		id: 'daily-running-hours',
		title: 'Daily Motor Running Hours',
		fileLabel: 'Daily_Running_Hours',
		endpoint: 'daily-running-hours-reports/',
		daily: true,
		runtime: true,
	},
	{
		id: 'monthly-running-hours',
		title: 'Monthly Motor Running Hours',
		fileLabel: 'Monthly_Running_Hours',
		endpoint: 'monthly-running-hours-reports/',
		daily: false,
		runtime: true,
	},
];

export const REPORT_MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

export function reportTypeFor(id) {
	const type = WATER_REPORT_TYPES.find((item) => item.id === id);
	if (!type) {
		throw new Error('Choose a valid report type.');
	}
	return type;
}

export function reportParams(type, filters) {
	const year = Number(filters.year);
	const month = Number(filters.month);
	if (
		!Number.isInteger(year) ||
		year < 1 ||
		year > 9998 ||
		(type.daily && (!Number.isInteger(month) || month < 1 || month > 12))
	) {
		throw new Error('Choose a valid year and, for daily reports, a month.');
	}
	return type.daily ? { month, year } : { year };
}

export function reportPeriod(type, filters) {
	return type.daily
		? `${REPORT_MONTHS[Number(filters.month) - 1]} ${filters.year}`
		: String(filters.year);
}

export function reportFilename(type, filters) {
	return `OHT_${type.fileLabel}_${reportPeriod(type, filters).replaceAll(
		' ',
		'_'
	)}`;
}

const unitText = (value) => (typeof value === 'string' ? value.trim() : '');

function reportUnit(type, meta, name) {
	// These optional values come from the response itself. No inferred volume unit.
	return type.runtime
		? 'h'
		: unitText(meta?.units?.[name]) || unitText(meta?.unit);
}

export function formatReportValue(value) {
	return typeof value === 'number' && Number.isFinite(value)
		? value.toFixed(2)
		: '—';
}

export function reportDateLabel(period, daily) {
	if (!daily) {
		return REPORT_MONTHS[Number(period) - 1]?.slice(0, 3) ?? String(period);
	}
	// Treat shift dates as literal date strings, never local/UTC timestamps.
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(period));
	return match
		? `${match[3]} ${REPORT_MONTHS[Number(match[2]) - 1]?.slice(0, 3)} ${
				match[1]
		  }`
		: String(period);
}

export function buildWaterReport(grouped, type, meta = {}) {
	if (!grouped || typeof grouped !== 'object' || Array.isArray(grouped)) {
		throw new Error(
			'The report response is invalid. Please refresh the report.'
		);
	}
	const machines = Object.keys(grouped).map((name) => ({
		name,
		unit: reportUnit(type, meta, name),
	}));
	const periods = new Map();
	const maps = machines.map(({ name }) => {
		if (!Array.isArray(grouped[name])) {
			throw new Error('The report response contains invalid machine data.');
		}
		const values = new Map();
		for (const item of grouped[name]) {
			const period = item?.[type.daily ? 'date' : 'month'];
			if (period === undefined || period === null || period === '') {
				continue;
			}
			// Monthly API periods are month numbers; normalize keys only to deduplicate.
			const key = type.daily ? String(period) : String(Number(period));
			if (!periods.has(key)) {
				periods.set(key, period);
			}
			values.set(
				key,
				typeof item.value === 'number' && Number.isFinite(item.value)
					? item.value
					: null
			);
		}
		return values;
	});
	const rows = [...periods]
		.sort(([a], [b]) =>
			type.daily ? a.localeCompare(b) : Number(a) - Number(b)
		)
		.map(([key, period]) => ({
			period,
			label: reportDateLabel(period, type.daily),
			values: maps.map((values) => values.get(key) ?? null),
		}));
	return { machines, rows, periodHeading: type.daily ? 'Date' : 'Month' };
}

// Adapter for the existing Water Reports table: one machine per row and one
// backend period per column. Missing readings stay null, never invented zeroes.
export function waterReportTable(model, search = '') {
	if (!model) {
		return { tableData: [], tableColumns: [] };
	}
	const hasUnits = model.machines.some(({ unit }) => Boolean(unit));
	const needle = search.trim().toLocaleLowerCase();
	const tableData = model.machines.flatMap((machine, index) => {
		if (!machine.name.toLocaleLowerCase().includes(needle)) {
			return [];
		}
		return [
			{
				device: machine.name,
				...(hasUnits ? { unit: machine.unit || '—' } : {}),
				...Object.fromEntries(
					model.rows.map((row, periodIndex) => [
						`p${periodIndex}`,
						row.values[index],
					])
				),
			},
		];
	});
	const tableColumns = [
		{
			accessorKey: 'device',
			header: 'Device Name',
			size: 160,
			meta: { sticky: 'left', fixedExport: true },
		},
		...(hasUnits
			? [
					{
						accessorKey: 'unit',
						header: 'Unit',
						size: 90,
						meta: { fixedExport: true },
					},
			  ]
			: []),
		...model.rows.map((row, index) => ({
			accessorKey: `p${index}`,
			header: row.label,
			size: model.periodHeading === 'Date' ? 110 : 100,
			cell: (info) => formatNumber(info.getValue(), 2, { fallback: '—' }),
		})),
	];
	return { tableData, tableColumns };
}

export function reportExportData(model, type, filters, search = '') {
	const { tableData, tableColumns } = waterReportTable(model, search);
	return [
		[type.title],
		['Period', reportPeriod(type, filters)],
		[
			'Reporting basis',
			type.totalizer
				? 'Last Totalizer reading of each shift day; cumulative readings are not consumption.'
				: 'Backend shift-aligned periods',
		],
		tableColumns.map((column) => column.header),
		...tableData.map((row) =>
			tableColumns.map((column) => row[column.accessorKey])
		),
	];
}
