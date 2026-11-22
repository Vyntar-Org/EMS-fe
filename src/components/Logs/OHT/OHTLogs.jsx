import { RestartAlt, Search } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Chip,
	Grid,
	LinearProgress,
	Tooltip,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { exportToCSV } from '../../../helpers/exports';
import { getWaterMonitoringMachines } from '../../../helpers/oht';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import { CustomDatePicker } from '../../common/CustomDatePicker';
import { CustomTable } from '../../common/CustomTable';
import NoDataFound from '../../common/errors/NoDataFound';
import { Loading } from '../../common/Loading';
import VyntarButtons from '../../common/VyntarButtons';

const defaultRange = () => {
	const now = dayjs();
	return [now.startOf('month'), now];
};
const WATER_MONITORING_LOG_FIELDS = [
	{ key: 'timestamp', label: 'Date & Time', size: 220 },
	{ key: 'tank_level', label: 'Tank Level', size: 130 },
	{ key: 'flowrate', label: 'Flow Rate (m³/h)', size: 130 },
	{ key: 'totalizer', label: 'Totalizer', size: 130 },
	{ key: 'control_mode', label: 'Control Mode', size: 130 },
	{ key: 'control_strategy', label: 'Control Strategy', size: 145 },
	{ key: 'motor_run_state', label: 'Motor Status', size: 130 },
];

const parameterOptions = WATER_MONITORING_LOG_FIELDS.slice(1).map(
	({ key, label }) => ({
		value: key,
		label,
	})
);
const autocompleteSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: 2,
		bgcolor: 'surface.muted',
		transition: '0.3s',
		'&:hover': { bgcolor: 'background.paper' },
	},
};

export default function OHTLogs() {
	const { user } = useAuth();
	const scope = String(
		user?.id ?? user?.username ?? user?.email ?? 'authenticated'
	);
	const [slaveId, setSlaveId] = useState(null);
	const [range, setRange] = useState(defaultRange);
	const [parameters, setParameters] = useState(null);
	const [submitted, setSubmitted] = useState(null);
	const [ready, setReady] = useState(false);
	const [validation, setValidation] = useState('');
	const generation = useRef(0);
	const [pagination, setPagination] = useState({ limit: 50, offset: 0 });
	const [progress, setProgress] = useState(null);
	const [exportError, setExportError] = useState('');
	const exportController = useRef(null);
	useEffect(
		() => () => {
			exportController.current?.abort();
			exportController.current = null;
		},
		[scope]
	);
	const machines = useQuery({
		queryKey: ['water-monitor', scope, 'machine-list'],
		queryFn: ({ signal }) => getWaterMonitoringMachines({ signal }),
		enabled: Boolean(user),
		retry: false,
	});
	const options = useMemo(
		() => waterMonitoringMachineOptions(machines.data?.machines ?? []),
		[machines.data]
	);
	const draftMachine = machines.data?.machines.find(
		(item) => Number(item.slave_id) === Number(slaveId)
	);
	const active = ready && submitted?.scope === scope;
	const filters = active ? submitted.filters : null;
	const machine = active ? submitted.machine : null;
	const logs = useQuery({
		queryKey: [
			'water-monitor',
			scope,
			'logs',
			active ? submitted : 'idle',
			pagination,
		],
		queryFn: ({ signal }) =>
			getWaterMonitoringLogs({ ...filters, ...pagination }, { signal }),
		enabled: Boolean(user && filters && !machines.isError),
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
	const loading = Boolean(active && logs.isFetching);
	const selectedParameters = active ? submitted.parameters : parameters;
	const fields = useMemo(
		() =>
			WATER_MONITORING_LOG_FIELDS.filter(
				(field) =>
					field.key === 'timestamp' ||
					!selectedParameters?.length ||
					selectedParameters.includes(field.key)
			),
		[selectedParameters]
	);
	const units = waterMonitoringLogUnits(logs.data?.meta, machine);
	const unitKey = JSON.stringify(units);
	const columns = useMemo(() => {
		const headers = waterMonitoringLogHeaders(JSON.parse(unitKey));
		return fields.map((field) => ({
			accessorKey: field.key,
			header: headers[WATER_MONITORING_LOG_FIELDS.indexOf(field)],
			size: field.size,
			meta:
				field.key === 'timestamp'
					? { sticky: 'left', fixedExport: true }
					: undefined,
			cell: (info) => {
				const value = waterMonitoringLogValue(info.row.original, field.key);
				if (field.key === 'control_mode' || field.key === 'motor_run_state') {
					const color =
						value === 'Auto' || value === 'Running'
							? 'success'
							: value === 'Manual'
							  ? 'warning'
							  : 'default';
					return (
						<Chip
							component="span"
							label={value}
							color={color}
							size="small"
							variant="outlined"
							sx={{ height: 22, fontSize: '0.75rem' }}
						/>
					);
				}
				return value === null ? '—' : String(value);
			},
		}));
	}, [fields, unitKey]);
	function cancelExport() {
		exportController.current?.abort();
		exportController.current = null;
		setProgress(null);
	}
	function resetForFilters() {
		cancelExport();
		setReady(false);
		setValidation('');
		setPagination((previous) => ({ ...previous, offset: 0 }));
		setExportError('');
	}
	function viewLogs() {
		if (loading) {
			return;
		}
		try {
			const next = makeWaterMonitoringLogFilters(draftMachine?.slave_id, range);
			setSubmitted({
				filters: next,
				machine: { ...draftMachine },
				parameters: parameters ? [...parameters] : null,
				scope,
				generation: ++generation.current,
			});
			setPagination((previous) => ({ ...previous, offset: 0 }));
			setValidation('');
			setExportError('');
			setReady(true);
		} catch (error) {
			setValidation(error.message);
		}
	}
	function refresh() {
		if (filters && !loading) {
			logs.refetch({ cancelRefetch: false });
		}
	}
	async function downloadCsv() {
		if (!canDownload || exportController.current) {
			return;
		}
		const controller = new AbortController();
		exportController.current = controller;
		setProgress({ count: 0, total: logs.data?.meta.total ?? 0 });
		setExportError('');
		try {
			const result = await collectWaterMonitoringLogPages(
				getWaterMonitoringLogs,
				filters,
				{
					signal: controller.signal,
					onProgress: (next) => {
						if (exportController.current === controller) {
							setProgress(next);
						}
					},
				}
			);
			if (!result.rows.length) {
				throw new Error(
					'No readings found for the selected machine and date range.'
				);
			}
			if (!controller.signal.aborted) {
				const headers = waterMonitoringLogHeaders(
					waterMonitoringLogUnits({ units: result.units }, machine)
				);
				const columns = fields.map((field) => ({
					accessorKey: field.key,
					header: headers[WATER_MONITORING_LOG_FIELDS.indexOf(field)],
				}));
				const rows = result.rows.map((row) =>
					Object.fromEntries(
						fields.map(({ key }) => [key, waterMonitoringLogValue(row, key)])
					)
				);
				exportToCSV(
					rows,
					columns,
					waterMonitoringLogsFilename(machine, filters),
					{ escapeFormulae: true, formatNumbers: false }
				);
			}
		} catch (error) {
			if (
				!controller.signal.aborted &&
				exportController.current === controller
			) {
				setExportError(waterMonitoringLogsError(error));
			}
		} finally {
			if (exportController.current === controller) {
				exportController.current = null;
				setProgress(null);
			}
		}
	}
	const meta = logs.data?.meta;
	const canDownload = Boolean(
		filters &&
			logs.isSuccess &&
			!loading &&
			!logs.isError &&
			!machines.isError &&
			logs.data?.logs.length &&
			!progress
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
				<Grid container gap={2} alignItems="center">
					<Grid item xs={12} sm md={2.5} lg={2.2}>
						<CustomAutocomplete
							options={options}
							value={slaveId ?? ''}
							onChange={(option) => {
								resetForFilters();
								setSlaveId(option?.value ?? null);
							}}
							label="Select Devices"
							size="small"
							sx={autocompleteSx}
						/>
					</Grid>
					<Grid item xs={12} sm md={2.5} lg={2.2}>
						<CustomAutocomplete
							multiple
							selectAll
							options={parameterOptions}
							value={parameters ?? []}
							onChange={(selected) => {
								resetForFilters();
								setParameters(
									selected.length
										? selected.map((option) => option.value)
										: null
								);
							}}
							label="Select Parameters"
							size="small"
							sx={autocompleteSx}
						/>
					</Grid>
					<Grid item xs={12} md={5} lg={4}>
						<CustomDatePicker
							mode="datetimerangepicker"
							startLabel="Select Start Date"
							endLabel="Select End Date"
							value={range}
							onChange={(value) => {
								resetForFilters();
								setRange(value);
							}}
						/>
					</Grid>
					<Grid
						item
						xs="auto"
						display="flex"
						gap={2}
						ml={{ xs: 'auto', md: 0 }}
					>
						<Tooltip title="View Logs">
							<span>
								<Button
									aria-label="View Logs"
									variant="contained"
									disabled={loading}
									onClick={viewLogs}
									sx={{
										width: 40,
										height: 40,
										minWidth: 0,
										p: 0,
										borderRadius: 2,
										boxShadow: 'none',
									}}
								>
									<Search sx={{ fontSize: 20, color: '#fff' }} />
								</Button>
							</span>
						</Tooltip>
						<Tooltip title="Refresh">
							<span>
								<Button
									aria-label="Refresh logs"
									variant="contained"
									disabled={!filters || loading}
									onClick={refresh}
									sx={{
										width: 40,
										height: 40,
										minWidth: 0,
										p: 0,
										borderRadius: 2,
										boxShadow: 'none',
										bgcolor: 'surface.muted',
										color: 'text.secondary',
										'&:hover': {
											bgcolor: 'action.hover',
											color: 'text.primary',
										},
									}}
								>
									<RestartAlt sx={{ fontSize: 20 }} />
								</Button>
							</span>
						</Tooltip>
					</Grid>
					<Grid item xs md="auto" display="flex" gap={2} ml="auto">
						<VyntarButtons.Download
							label="Download CSV"
							disabled={!canDownload}
							isDownloadLoading={Boolean(progress)}
							loadingStatus="Preparing export..."
							onClick={downloadCsv}
						/>
					</Grid>
				</Grid>
			</Box>
			{progress && (
				<Box role="status" sx={{ py: 1 }}>
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
					>
						<Typography variant="body2">
							Exporting {progress.count} of {progress.total} readings…
						</Typography>
						<Button onClick={cancelExport}>Cancel export</Button>
					</Box>
					<LinearProgress
						variant={progress.total ? 'determinate' : 'indeterminate'}
						value={
							progress.total
								? Math.min(100, (progress.count / progress.total) * 100)
								: 0
						}
					/>
				</Box>
			)}
			{exportError && <Alert severity="error">{exportError}</Alert>}
			{validation && <Alert severity="warning">{validation}</Alert>}
			<Box
				role="region"
				aria-label="Water Monitoring historical logs"
				aria-busy={loading}
				sx={{ flex: 1, minHeight: 0, pt: 1, overflow: 'auto' }}
			>
				{machines.isError ? (
					<Alert
						severity="error"
						action={<Button onClick={() => machines.refetch()}>Retry</Button>}
					>
						{waterMonitoringLogsError(machines.error)}
					</Alert>
				) : !active ? (
					<NoDataFound message="Select the required filters and click Search to view data." />
				) : loading ? (
					<Loading />
				) : logs.isError ? (
					<Alert
						severity="error"
						action={<Button onClick={refresh}>Retry</Button>}
					>
						{waterMonitoringLogsError(logs.error)}
					</Alert>
				) : !logs.data?.logs.length ? (
					<NoDataFound message="No data found for the selected filters." />
				) : (
					<CustomTable
						data={logs.data.logs}
						columns={columns}
						pageIndex={Math.floor(
							(meta?.offset ?? pagination.offset) /
								(meta?.limit ?? pagination.limit)
						)}
						pageSize={meta?.limit ?? pagination.limit}
						totalRowCount={meta?.total ?? 0}
						onPageChange={(_, page) => {
							const current = Math.floor(meta.offset / meta.limit);
							if (!loading && (page < current || meta.has_more)) {
								setPagination({ limit: meta.limit, offset: page * meta.limit });
							}
						}}
						onRowsPerPageChange={(event) => {
							if (!loading) {
								setPagination({ limit: Number(event.target.value), offset: 0 });
							}
						}}
						paginationProps={{
							rowsPerPageOptions: [25, 50, 100],
							slotProps: {
								actions: {
									nextButton: { disabled: loading || !meta?.has_more },
									previousButton: { disabled: loading || !meta?.offset },
								},
							},
						}}
					/>
				)}
			</Box>
		</Box>
	);
}

async function getWaterMonitoringLogs(filters, { signal } = {}) {
	const selected = validateWaterMonitoringLogFilters(filters);
	const limit = filters.limit ?? 50;
	const offset = filters.offset ?? 0;
	if (
		!Number.isInteger(limit) ||
		limit < 1 ||
		!Number.isInteger(offset) ||
		offset < 0
	) {
		throw new Error('Invalid logs pagination.');
	}
	const query = new URLSearchParams({ ...selected, limit, offset });
	const response = await api.get(`${API_URLS.WATER_MONITORING_LOGS}?${query}`, {
		signal,
	});
	// The shared authenticated client returns the JSON envelope, not an Axios wrapper.
	if (response?.success !== true) {
		throw {
			data: response,
			message: response?.message || 'Unable to load logs. Please try again.',
		};
	}
	const logs = response.data?.logs;
	const meta = response.meta;
	if (
		!Array.isArray(logs) ||
		logs.some((row) => !row || typeof row !== 'object' || Array.isArray(row)) ||
		!meta ||
		!['count', 'total', 'limit', 'offset'].every(
			(key) => Number.isInteger(meta[key]) && meta[key] >= 0
		) ||
		meta.limit < 1 ||
		meta.count !== logs.length ||
		logs.length > meta.limit ||
		typeof meta.has_more !== 'boolean' ||
		meta.offset !== offset
	) {
		throw new Error(
			'The logs response is invalid. Please refresh and try again.'
		);
	}
	return { logs, meta };
}

function waterMonitoringLogsError(error) {
	const messages = {
		400: 'The log filters are invalid. Please check the selected machine and date range.',
		401: 'Please sign in to view logs.',
		403: "You do not have permission to view this machine's logs.",
		404: 'The selected machine or logs endpoint could not be found.',
		500: 'Unable to load logs because of a server error. Please try again.',
	};
	return (
		messages[error?.status] ||
		(error?.message && !/fetch|network/i.test(error.message)
			? error.message
			: 'Unable to load logs. Please try again.')
	);
}

function waterMonitoringControlMode(value) {
	const mode = String(value ?? '')
		.trim()
		.toLowerCase();
	return mode === 'auto' ? 'Auto' : mode === 'manual' ? 'Manual' : 'Unknown';
}

function waterMonitoringMotorStatus(value) {
	return [true, 1, '1'].includes(value)
		? 'Running'
		: [false, 0, '0'].includes(value)
		  ? 'Stopped'
		  : 'Unknown';
}

function formatControlStrategy(value) {
	const strategy = typeof value === 'string' ? value.trim().toUpperCase() : '';
	switch (strategy) {
		case 'LEVEL':
			return 'Level';
		case 'REMOTE':
			return 'Remote';
		default:
			return '—';
	}
}

function waterMonitoringLogTimestamp(value) {
	if (typeof value !== 'string' || !value.trim()) {
		return '—';
	}
	// Preserve the backend wall clock and explicitly show any supplied zone.
	// A naive device timestamp is never interpreted as UTC or shifted by the browser.
	const match =
		/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.exec(
			value
		);
	if (!match) {
		return value;
	}
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const zone = match[6] === 'Z' ? ' UTC' : match[6] ? ` ${match[6]}` : '';
	return `${match[3]} ${months[Number(match[2]) - 1] ?? match[2]} ${match[1]} ${
		match[4]
	}${match[5] ?? ''}${zone}`;
}

function waterMonitoringLogValue(row, key) {
	if (key === 'timestamp') {
		return waterMonitoringLogTimestamp(row[key]);
	}
	if (key === 'control_mode') {
		return waterMonitoringControlMode(row[key]);
	}
	if (key === 'control_strategy') {
		return formatControlStrategy(row[key]);
	}
	if (key === 'motor_run_state') {
		return waterMonitoringMotorStatus(row[key]);
	}
	return row[key] ?? null;
}

function validateWaterMonitoringLogFilters(filters) {
	if (
		!Number.isInteger(Number(filters?.slave_id)) ||
		Number(filters.slave_id) <= 0
	) {
		throw new Error('Please select a machine to view logs.');
	}
	const start = Date.parse(filters.start_datetime);
	const end = Date.parse(filters.end_datetime);
	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		throw new Error('Please select valid start and end dates and times.');
	}
	if (start > end) {
		throw new Error(
			'Start date and time must be before the end date and time.'
		);
	}
	return {
		slave_id: Number(filters.slave_id),
		start_datetime: filters.start_datetime,
		end_datetime: filters.end_datetime,
	};
}

function makeWaterMonitoringLogFilters(slaveId, range) {
	return validateWaterMonitoringLogFilters({
		slave_id: slaveId,
		// Same local wall-clock request format used by the existing Water Logs.
		start_datetime: range?.[0]?.isValid?.()
			? range[0].format('YYYY-MM-DD[T]HH:mm:ss')
			: '',
		end_datetime: range?.[1]?.isValid?.()
			? range[1].format('YYYY-MM-DD[T]HH:mm:ss')
			: '',
	});
}

function waterMonitoringMachineOptions(machines) {
	const names = new Map();
	for (const machine of machines) {
		names.set(machine.slave_name, (names.get(machine.slave_name) ?? 0) + 1);
	}
	return machines
		.filter(
			(machine) =>
				Number.isInteger(Number(machine.slave_id)) &&
				Number(machine.slave_id) > 0
		)
		.map((machine) => ({
			value: Number(machine.slave_id),
			label:
				(machine.slave_name || `Machine ${machine.slave_id}`) +
				(names.get(machine.slave_name) > 1
					? ` (${machine.device_uid || 'Device'} · #${machine.slave_id})`
					: ''),
		}));
}

function waterMonitoringLogUnits(meta = {}, machine = {}) {
	return Object.fromEntries(
		['tank_level', 'flowrate', 'totalizer'].map((key) => {
			const value = [
				meta?.units?.[key],
				machine?.units?.[key],
				machine?.[`${key}_unit`],
			].find((unit) => typeof unit === 'string' && unit.trim());
			return [key, typeof value === 'string' ? value.trim() : ''];
		})
	);
}

function waterMonitoringLogHeaders(units = {}) {
	return WATER_MONITORING_LOG_FIELDS.map(({ key, label }) =>
		units[key] ? `${label} (${units[key]})` : label
	);
}

function waterMonitoringLogsFilename(machine, filters) {
	const name = (machine.slave_name || `Machine_${filters.slave_id}`).replace(
		/[^\p{L}\p{N}_-]+/gu,
		'_'
	);
	return `OHT_${name}_Logs_${filters.start_datetime.slice(
		0,
		10
	)}_to_${filters.end_datetime.slice(0, 10)}`;
}

const WATER_MONITORING_EXPORT_MAX_ROWS = 10000;

function checkCancelled(signal) {
	if (signal?.aborted) {
		throw new DOMException('Export cancelled.', 'AbortError');
	}
}

// An injected reader keeps this collector testable without equipment or credentials.
async function collectWaterMonitoringLogPages(
	readPage,
	filters,
	{ signal, onProgress, maxRows = WATER_MONITORING_EXPORT_MAX_ROWS } = {}
) {
	const rows = [];
	let offset = 0;
	let units;
	let firstTotal;
	for (;;) {
		checkCancelled(signal);
		const page = await readPage({ ...filters, limit: 500, offset }, { signal });
		checkCancelled(signal);
		const { meta, logs } = page;
		if (meta.total > maxRows || rows.length + logs.length > maxRows) {
			throw new Error(
				`This export exceeds ${maxRows.toLocaleString(
					'en-IN'
				)} readings. Narrow the date range or request a backend export endpoint for larger datasets. No partial file was downloaded.`
			);
		}
		if (firstTotal === undefined) {
			firstTotal = meta.total;
		}
		if (meta.total !== firstTotal) {
			throw new Error(
				'The log dataset changed during export. Please retry with a fixed historical date range.'
			);
		}
		const nextUnits = waterMonitoringLogUnits(meta);
		if (units && JSON.stringify(units) !== JSON.stringify(nextUnits)) {
			throw new Error(
				'Measurement units changed during export. Please refresh and try again.'
			);
		}
		units = nextUnits;
		rows.push(...logs);
		onProgress?.({ count: rows.length, total: meta.total });
		if (!meta.has_more) {
			if (rows.length !== meta.total) {
				throw new Error(
					'The complete log dataset could not be retrieved. No partial file was downloaded.'
				);
			}
			return { rows, units };
		}
		if (!logs.length || meta.offset !== offset || meta.count !== logs.length) {
			throw new Error(
				'Log pagination did not advance. No partial file was downloaded.'
			);
		}
		offset = meta.offset + meta.count;
		// Yield between pages so progress and cancellation remain responsive.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}
