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
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import { CustomDatePicker } from '../../common/CustomDatePicker';
import { CustomTable } from '../../common/CustomTable';
import NoDataFound from '../../common/errors/NoDataFound';
import { Loading } from '../../common/Loading';
import VyntarButtons from '../../common/VyntarButtons';
import { getWaterMonitoringMachines } from '../../WaterMonitoring/waterMonitoringService';

import { collectWaterMonitoringLogPages } from './waterMonitoringLogExportPages';
import {
	makeWaterMonitoringLogFilters,
	WATER_MONITORING_LOG_FIELDS,
	waterMonitoringLogHeaders,
	waterMonitoringLogUnits,
	waterMonitoringLogValue,
	waterMonitoringMachineOptions,
} from './waterMonitoringLogModel';
import {
	getWaterMonitoringLogs,
	waterMonitoringLogsError,
} from './waterMonitoringLogsApi';

const defaultRange = () => {
	const now = dayjs();
	return [now.startOf('month'), now];
};
const parameterOptions = WATER_MONITORING_LOG_FIELDS.slice(1).map(({ key, label }) => ({
	value: key,
	label,
}));
const autocompleteSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: 2,
		bgcolor: 'surface.muted',
		transition: '0.3s',
		'&:hover': { bgcolor: 'background.paper' },
	},
};

export default function WaterMonitoringLogs() {
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
	async function downloadExcel() {
		if (!canDownload || exportController.current) {
			return;
		}
		const controller = new AbortController();
		exportController.current = controller;
		setProgress({ count: 0, total: logs.data?.meta.total ?? 0 });
		setExportError('');
		try {
			const result = await collectWaterMonitoringLogPages(getWaterMonitoringLogs, filters, {
				signal: controller.signal,
				onProgress: (next) => {
					if (exportController.current === controller) {
						setProgress(next);
					}
				},
			});
			if (!result.rows.length) {
				throw new Error(
					'No readings found for the selected machine and date range.'
				);
			}
			const { downloadWaterMonitoringLogs } = await import('./waterMonitoringLogDownloads');
			if (!controller.signal.aborted) {
				downloadWaterMonitoringLogs(
					'xlsx',
					result.rows,
					machine,
					filters,
					waterMonitoringLogUnits({ units: result.units }, machine),
					fields
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
							label="Download Excel"
							disabled={!canDownload}
							isDownloadLoading={Boolean(progress)}
							loadingStatus="Preparing export..."
							onClick={downloadExcel}
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
							nextIconButtonProps: { disabled: loading || !meta?.has_more },
							backIconButtonProps: { disabled: loading || !meta?.offset },
						}}
					/>
				)}
			</Box>
		</Box>
	);
}
