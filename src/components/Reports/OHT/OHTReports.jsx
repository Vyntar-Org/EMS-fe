import { Description, FileDownload, Search } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Grid,
	Tab,
	Tabs,
	tabsClasses,
	Tooltip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { exportToCSV, exportToPDF } from '../../../helpers/exports';
import { formatNumber } from '../../../helpers/formatters.js';
import {
	createReportDeviceUnitMap,
	getReportDisplayUnit,
	normalizeReportDeviceName,
} from '../../../helpers/reportUnits';
import { useReportMachineList } from '../../../hooks/useReportMachineList';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import { CustomDatePicker } from '../../common/CustomDatePicker';
import { CustomTable } from '../../common/CustomTable';
import NoDataFound from '../../common/errors/NoDataFound';
import { Loading } from '../../common/Loading';

const DEFAULT_TAB = 'daily-consumption';

function initialPayload() {
	const now = dayjs();
	return { month: now, year: now };
}

function periodFilters(type, { month, year }) {
	return reportParams(type, {
		month: month?.isValid?.() ? month.month() + 1 : null,
		year: year?.isValid?.() ? year.year() : null,
	});
}

function ReportAction({
	label,
	color = 'primary',
	disabled,
	onClick,
	children,
	...props
}) {
	return (
		<Tooltip title={label}>
			<span>
				<Button
					aria-label={label}
					disabled={disabled}
					variant="contained"
					onClick={onClick}
					sx={{
						width: 40,
						height: 40,
						minWidth: 0,
						p: 0,
						borderRadius: 2,
						boxShadow: 'none',
						bgcolor: color + '.main',
						'&:hover': { boxShadow: 'none', bgcolor: color + '.dark' },
					}}
					{...props}
				>
					{children}
				</Button>
			</span>
		</Tooltip>
	);
}

export default function OHTReports() {
	const { user } = useAuth();
	const scope = String(
		user?.id ?? user?.username ?? user?.email ?? 'authenticated'
	);
	const [selectedTab, setSelectedTab] = useState(DEFAULT_TAB);
	const [payload, setPayload] = useState(initialPayload);
	const [search, setSearch] = useState(null);
	const [submitted, setSubmitted] = useState(() => ({
		type: DEFAULT_TAB,
		filters: periodFilters(reportTypeFor(DEFAULT_TAB), payload),
		deviceSearch: null,
		scope,
		generation: 0,
	}));
	const [validation, setValidation] = useState('');
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
	const [exportError, setExportError] = useState('');
	const generation = useRef(0);
	const knownMachines = useRef({ scope: null, rows: [] });
	const type = reportTypeFor(selectedTab);
	const { data: machineList } = useReportMachineList('WATER_MONITOR', {
		enabled: Boolean(user),
		scope,
	});
	useEffect(
		() => () => {
			generation.current++;
		},
		[scope]
	);
	const active = Boolean(user && submitted?.scope === scope);
	const query = useQuery({
		queryKey: ['water-monitor', scope, 'reports', active ? submitted : 'idle'],
		queryFn: ({ signal }) =>
			getWaterReport(submitted.type, submitted.filters, { signal }),
		enabled: active,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
	// Leaving the submitted key cancels its observer and keeps late/cached results hidden.
	const loading = Boolean(active && query.isFetching);
	const model = useMemo(() => {
		if (!active || !query.data) {
			return undefined;
		}
		const reportType = reportTypeFor(submitted.type);
		const keys = reportType.totalizer
			? ['totalizer']
			: ['consumption', 'water_consumption'];
		const units = createReportDeviceUnitMap(machineList, keys);
		return {
			...query.data,
			machines: query.data.machines.map((machine) => ({
				...machine,
				unit:
					machine.unit ||
					units.get(normalizeReportDeviceName(machine.name)) ||
					'',
			})),
		};
	}, [active, query.data, submitted, machineList]);
	const table = useMemo(
		() => waterReportTable(model, active ? submitted.deviceSearch ?? '' : ''),
		[model, active, submitted]
	);
	useEffect(() => {
		if (model && query.isSuccess) {
			knownMachines.current = { scope, rows: model.machines };
		}
	}, [model, query.isSuccess, scope]);
	const options = useMemo(
		() =>
			(
				model?.machines ??
				(knownMachines.current.scope === scope
					? knownMachines.current.rows
					: [])
			).map(({ name }) => ({ label: name, value: name })),
		[model, scope]
	);
	const canDownload = Boolean(
		active &&
			query.isSuccess &&
			model?.rows.length &&
			table.tableData.length &&
			!loading &&
			!query.isError
	);
	const resetPage = () =>
		setPagination((previous) => ({ ...previous, pageIndex: 0 }));
	function updateFilter(key, value) {
		setPayload((previous) => ({ ...previous, [key]: value }));
		clearResults();
	}
	function clearResults() {
		generation.current++;
		setSubmitted(null);
		setValidation('');
		resetPage();
		setExportError('');
	}
	function updateSearch(value) {
		setSearch(value || null);
		clearResults();
	}
	function changeTab(value) {
		setSelectedTab(value);
		submitReport(value);
	}
	function runSearch() {
		if (loading) {
			return;
		}
		submitReport(selectedTab);
	}
	function submitReport(tab) {
		const reportType = reportTypeFor(tab);
		try {
			const filters = periodFilters(reportType, payload);
			setSubmitted({
				type: tab,
				filters,
				deviceSearch: search,
				scope,
				generation: ++generation.current,
			});
			setValidation('');
			setExportError('');

			resetPage();
		} catch {
			clearResults();
			setValidation(
				reportType.daily
					? 'Please select a valid month and year.'
					: 'Please select a valid year.'
			);
		}
	}
	function refresh() {
		if (active && !loading) {
			query.refetch({ cancelRefetch: false });
		}
	}
	function download(format) {
		if (!canDownload) {
			return;
		}
		setExportError('');
		try {
			const reportType = reportTypeFor(submitted.type);
			const period = reportPeriod(reportType, submitted.filters);
			const title = reportType.title + ' - ' + period;
			if (format === 'pdf') {
				exportToPDF(table.tableData, table.tableColumns, title);
			} else {
				exportToCSV(table.tableData, table.tableColumns, title, {
					escapeFormulae: true,
					formatNumbers: false,
				});
			}
		} catch {
			setExportError('Unable to download the report. Please try again.');
		}
	}
	// Controlled pagination receives a client-side slice; no backend pagination parameters.
	const pageIndex = Math.min(
		pagination.pageIndex,
		Math.max(0, Math.ceil(table.tableData.length / pagination.pageSize) - 1)
	);
	const pageRows = table.tableData.slice(
		pageIndex * pagination.pageSize,
		(pageIndex + 1) * pagination.pageSize
	);
	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 16px)',
					sm: 'calc(100vh - 64px - 16px)',
				},
				minWidth: 0,
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<Box
				sx={{
					pb: 1,
					borderBottom: '1px dashed',
					borderColor: 'divider',
					flexShrink: 0,
				}}
			>
				<Tabs
					value={selectedTab}
					onChange={(_, value) => changeTab(value)}
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					aria-label="Water Monitoring reports"
					sx={{
						[`& .${tabsClasses.scrollButtons}`]: {
							'&.Mui-disabled': { opacity: 0.3 },
						},
						'& .MuiTabs-scroller': { height: '40px' },
						'& .MuiTab-root': {
							textTransform: 'none',
							fontSize: '0.95rem',
							color: 'text.secondary',
							minHeight: '40px',
							transition: 'all 0.3s ease',
							p: 0,
							mr: 3,
							'&.Mui-selected': { color: 'primary.main', fontWeight: 1000 },
						},
						'& .MuiTabs-indicator': { backgroundColor: 'rgb(245, 213, 71)' },
					}}
				>
					{WATER_REPORT_TYPES.map((option) => (
						<Tab
							disableRipple
							key={option.id}
							label={option.tabLabel || option.title}
							value={option.id}
							id={'water-monitoring-tab-' + option.id}
							aria-controls="water-monitoring-report-panel"
						/>
					))}
				</Tabs>
				<Grid
					container
					gap={2}
					alignItems="center"
					sx={{ bgcolor: 'surface.muted', p: 1.5, borderRadius: 2 }}
				>
					{type.daily && (
						<Grid item xs sm md={2}>
							<CustomDatePicker
								label="Select Month"
								mode="monthpicker"
								value={payload.month}
								onChange={(value) => updateFilter('month', value)}
							/>
						</Grid>
					)}
					<Grid item xs sm md={2}>
						<CustomDatePicker
							label="Select Year"
							mode="yearpicker"
							value={payload.year}
							onChange={(value) => updateFilter('year', value)}
						/>
					</Grid>
					<Grid item xs="auto">
						<ReportAction
							label="Search report"
							disabled={loading}
							onClick={runSearch}
						>
							<Search sx={{ fontSize: 20, color: '#fff' }} />
						</ReportAction>
					</Grid>
					<Grid
						item
						xs={12}
						md={4}
						display="flex"
						gap={2}
						ml="auto"
						justifyContent="end"
					>
						<CustomAutocomplete
							options={options}
							value={search ?? ''}
							inputValue={search ?? ''}
							label="Search Devices..."
							size="small"
							onChange={(option) => updateSearch(option?.value || '')}
							onInputChange={(_, value, reason) => {
								if (reason === 'input' || reason === 'clear') {
									updateSearch(value);
								}
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									backgroundColor: 'surface.muted',
									transition: '0.3s',
									'&:hover': { backgroundColor: 'background.paper' },
								},
							}}
						/>
						<ReportAction
							label="Download CSV"
							color="success"
							disabled={!canDownload}
							onClick={() => download('csv')}
						>
							<FileDownload sx={{ fontSize: 20, color: '#fff' }} />
						</ReportAction>
						<ReportAction
							label="Download PDF"
							color="error"
							disabled={!canDownload}
							onClick={() => download('pdf')}
						>
							<Description sx={{ fontSize: 20, color: '#fff' }} />
						</ReportAction>
					</Grid>
				</Grid>
			</Box>
			{exportError && <Alert severity="error">{exportError}</Alert>}
			{validation && <Alert severity="warning">{validation}</Alert>}
			<Box
				id="water-monitoring-report-panel"
				role="tabpanel"
				aria-labelledby={'water-monitoring-tab-' + selectedTab}
				aria-label={
					active
						? type.title + ' — ' + reportPeriod(type, submitted.filters)
						: type.title
				}
				aria-busy={loading}
				sx={{ flex: 1, minHeight: 0, pt: 1, overflow: 'auto' }}
			>
				{!active ? (
					<NoDataFound message="Select the required filters and click Search to view data." />
				) : loading ? (
					<Loading />
				) : query.isError ? (
					<Alert
						severity="error"
						action={<Button onClick={refresh}>Retry</Button>}
					>
						{waterReportError(query.error)}
					</Alert>
				) : !model?.machines.length || !model.rows.length ? (
					<NoDataFound message="No data found for the selected filters." />
				) : !table.tableData.length ? (
					<NoDataFound message="No matching devices found." />
				) : (
					<CustomTable
						data={pageRows}
						columns={table.tableColumns}
						pageIndex={pageIndex}
						pageSize={pagination.pageSize}
						totalRowCount={table.tableData.length}
						onPageChange={(_, newPage) =>
							setPagination((previous) => ({ ...previous, pageIndex: newPage }))
						}
						onRowsPerPageChange={(event) =>
							setPagination({
								pageIndex: 0,
								pageSize: Number(event.target.value),
							})
						}
					/>
				)}
			</Box>
		</Box>
	);
}

async function getWaterReport(id, filters, { signal } = {}) {
	const type = reportTypeFor(id);
	const params = new URLSearchParams(reportParams(type, filters));
	const response = await api.get(`${type.endpoint}?${params}`, {
		signal,
	});
	// api.get already returns the JSON envelope (the equivalent of Axios response.data).
	// Unwrap once more here to read the grouped domain data, never the envelope as columns.
	if (response?.success !== true) {
		throw {
			data: response,
			message: response?.message || 'Unable to retrieve the report.',
		};
	}
	return buildWaterReport(response.data, type, response.meta);
}

function waterReportError(error) {
	const detail =
		error?.data?.message ||
		error?.data?.errors?.detail ||
		error?.data?.detail ||
		error?.message;
	if (/shift.*(config|setting|not found|missing)/i.test(detail ?? '')) {
		return 'Reports are unavailable because shift settings have not been configured. Please contact your administrator.';
	}
	const messages = {
		400: 'The report filters are invalid. Check the month and year and try again.',
		401: 'Please sign in to view Water Monitoring reports.',
		403: 'You do not have permission to view this report.',
		404: 'This reporting endpoint is unavailable. Please contact your administrator.',
		500: 'The report could not be generated because of a server error. Please try again.',
	};
	return (
		messages[error?.status] ||
		(typeof detail === 'string'
			? detail
			: 'Unable to load the report. Please try again.')
	);
}

const WATER_REPORT_TYPES = [
	{
		id: 'daily-consumption',
		title: 'Daily Water Consumption',
		tabLabel: 'Day-Wise Consumption',
		endpoint: API_URLS.WATER_MONITORING_DAILY_CONSUMPTION,
		daily: true,
	},
	{
		id: 'monthly-consumption',
		title: 'Monthly Water Consumption',
		tabLabel: 'Month-Wise Consumption',
		endpoint: API_URLS.WATER_MONITORING_MONTHLY_CONSUMPTION,
		daily: false,
	},
	{
		id: 'daily-reading',
		title: 'Daily Meter Reading (Totalizer)',
		tabLabel: 'Daily Meter Reading',
		endpoint: API_URLS.WATER_MONITORING_DAILY_READING,
		daily: true,
		totalizer: true,
	},
	{
		id: 'daily-running-hours',
		title: 'Daily Motor Running Hours',
		endpoint: API_URLS.WATER_MONITORING_DAILY_RUNNING_HOURS,
		daily: true,
		runtime: true,
	},
	{
		id: 'monthly-running-hours',
		title: 'Monthly Motor Running Hours',
		endpoint: API_URLS.WATER_MONITORING_MONTHLY_RUNNING_HOURS,
		daily: false,
		runtime: true,
	},
];

const REPORT_MONTHS = [
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

function reportTypeFor(id) {
	const type = WATER_REPORT_TYPES.find((item) => item.id === id);
	if (!type) {
		throw new Error('Choose a valid report type.');
	}
	return type;
}

function reportParams(type, filters) {
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

function reportPeriod(type, filters) {
	return type.daily
		? `${REPORT_MONTHS[Number(filters.month) - 1]} ${filters.year}`
		: String(filters.year);
}

function reportUnit(type, meta, name) {
	// These optional values come from the response itself. No inferred volume unit.
	return type.runtime
		? 'h'
		: getReportDisplayUnit({ unit: meta?.units?.[name] }) ||
				getReportDisplayUnit(meta);
}

function reportDateLabel(period, daily) {
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

function buildWaterReport(grouped, type, meta = {}) {
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
function waterReportTable(model, search = '') {
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
