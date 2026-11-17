import { Description, FileDownload, Search } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Grid,
	Menu,
	MenuItem,
	Tab,
	Tabs,
	tabsClasses,
	Tooltip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTable } from '../common/CustomTable';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

import {
	reportParams,
	reportPeriod,
	reportTypeFor,
	waterReportTable,
	WATER_REPORT_TYPES,
} from './waterReportModel';
import { getWaterReport, waterReportError } from './waterReportsApi';

function initialPayload() {
	return { month: dayjs(new Date()), year: dayjs(new Date()) };
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

export default function WaterMonitorReports() {
	const { user } = useAuth();
	const [selectedTab, setSelectedTab] = useState('daily-consumption');
	const [payload, setPayload] = useState(initialPayload);
	const [search, setSearch] = useState(null);
	const [submitted, setSubmitted] = useState(null);
	const [ready, setReady] = useState(false);
	const [validation, setValidation] = useState('');
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
	const [downloadAnchor, setDownloadAnchor] = useState(null);
	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState('');
	const exportLock = useRef(false);
	const generation = useRef(0);
	const knownMachines = useRef({ scope: null, rows: [] });
	const type = reportTypeFor(selectedTab);
	const scope = String(
		user?.id ?? user?.username ?? user?.email ?? 'authenticated'
	);
	useEffect(
		() => () => {
			generation.current++;
		},
		[scope]
	);
	const active = ready && submitted?.scope === scope;
	const query = useQuery({
		queryKey: ['water-monitor', scope, 'reports', active ? submitted : 'idle'],
		queryFn: ({ signal }) =>
			getWaterReport(submitted.type, submitted.filters, { signal }),
		enabled: Boolean(user && active),
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
	// Leaving the submitted key cancels its observer and keeps late/cached results hidden.
	const loading = Boolean(active && query.isFetching);
	const model = active ? query.data : undefined;
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
			!query.isError &&
			!exporting
	);
	const resetPage = () =>
		setPagination((previous) => ({ ...previous, pageIndex: 0 }));
	function updateFilter(key, value) {
		setPayload((previous) => ({ ...previous, [key]: value }));
		clearResults();
	}
	function clearResults() {
		generation.current++;
		setReady(false);
		setValidation('');
		resetPage();
		setExportError('');
		setDownloadAnchor(null);
	}
	function updateSearch(value) {
		setSearch(value || null);
		clearResults();
	}
	function changeTab(value) {
		setSelectedTab(value);
		clearResults();
	}
	function runSearch() {
		if (loading) {
			return;
		}
		try {
			const filters = reportParams(type, {
				month: payload.month?.isValid?.() ? payload.month.month() + 1 : null,
				year: payload.year?.isValid?.() ? payload.year.year() : null,
			});
			setSubmitted({
				type: selectedTab,
				filters,
				deviceSearch: search,
				scope,
				generation: ++generation.current,
			});
			setReady(true);
			setValidation('');
			setExportError('');
			resetPage();
		} catch {
			setValidation(
				type.daily
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
	async function download(format) {
		setDownloadAnchor(null);
		if (!canDownload || exportLock.current) {
			return;
		}
		exportLock.current = true;
		setExporting(true);
		setExportError('');
		try {
			const { downloadWaterReport } = await import('./waterReportExports');
			if (generation.current === submitted.generation) {
				downloadWaterReport(
					format,
					model,
					reportTypeFor(submitted.type),
					submitted.filters,
					submitted.deviceSearch ?? ''
				);
			}
		} catch {
			setExportError('Unable to download the report. Please try again.');
		} finally {
			exportLock.current = false;
			setExporting(false);
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
							id={'oht-tab-' + option.id}
							aria-controls="oht-report-panel"
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
							label="Download Excel or CSV"
							color="success"
							disabled={!canDownload}
							onClick={(event) => setDownloadAnchor(event.currentTarget)}
							aria-haspopup="menu"
							aria-expanded={Boolean(downloadAnchor)}
							aria-controls={downloadAnchor ? 'oht-download-menu' : undefined}
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
						<Menu
							id="oht-download-menu"
							anchorEl={downloadAnchor}
							open={Boolean(downloadAnchor)}
							onClose={() => setDownloadAnchor(null)}
						>
							<MenuItem onClick={() => download('xlsx')}>
								Excel (.xlsx)
							</MenuItem>
							<MenuItem onClick={() => download('csv')}>CSV (.csv)</MenuItem>
						</Menu>
					</Grid>
				</Grid>
			</Box>
			{exportError && <Alert severity="error">{exportError}</Alert>}
			{validation && <Alert severity="warning">{validation}</Alert>}
			<Box
				id="oht-report-panel"
				role="tabpanel"
				aria-labelledby={'oht-tab-' + selectedTab}
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
