import { FileDownload, RestartAlt, Search } from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, Tooltip } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { basePickerStyles, triggerFileDownload } from '../../helpers/common';
import {
	getDownloadFileName,
	getWeatherStationErrorMessage,
	weatherStationApi,
} from '../../helpers/weatherStationApi';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTable } from '../common/CustomTable';
import NoDataFound from '../common/errors/NoDataFound';
import { useToast } from '../common/PremiumToast';
import PremiumLoader from '../Dashboards/weatherStationDashboardCards/PremiumLoader';

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];
const defaultParameters = { label: 'All', value: 'all' };

const buildFilters = (payload) => {
	const selectedParameters = (payload?.parameters || [])
		.map((parameter) => parameter?.value)
		.filter(Boolean);
	const parameters =
		!selectedParameters.length || selectedParameters.includes('all')
			? 'all'
			: selectedParameters.join(',');
	const start = payload?.dateTime?.[0];
	const end = payload?.dateTime?.[1];

	return {
		parameters,
		startDatetime: start?.isValid?.()
			? start.format('YYYY-MM-DD[T]HH:mm:ss')
			: '',
		endDatetime: end?.isValid?.() ? end.format('YYYY-MM-DD[T]HH:mm:ss') : '',
	};
};

const LogsFilterHeader = ({
	parameterOptions,
	onSearch,
	onReset,
	payload,
	setPayload,
	loading,
	onDownload,
	downloadLoading,
	parameterError,
}) => {
	const handleFieldChange = (key, value) => {
		setPayload((previous) => ({ ...previous, [key]: value }));
	};

	return (
		<Box sx={{ pb: 1, borderBottom: '2px dashed', borderColor: 'divider' }}>
			<Grid container gap={2} alignItems="center">
				<Grid item xs={12} sm md={4} lg={3}>
					<CustomAutocomplete
						multiple
						error={Boolean(parameterError)}
						helperText={parameterError || ''}
						options={parameterOptions}
						onChange={(value) => handleFieldChange('parameters', value)}
						value={payload.parameters}
						label="Select Parameters"
						size="small"
						sx={basePickerStyles}
					/>
				</Grid>

				<Grid item xs={12} md={6} lg={4}>
					<CustomDatePicker
						mode="datetimerangepicker"
						onChange={(value) => handleFieldChange('dateTime', value)}
						value={payload.dateTime}
					/>
				</Grid>

				<Grid item xs="auto" display="flex" gap={2} ml={{ xs: 'auto', md: 0 }}>
					<Tooltip title="Search">
						<span>
							<Button
								disableElevation
								variant="contained"
								disabled={loading}
								onClick={onSearch}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
								}}
							>
								<Search sx={{ fontSize: 20, color: '#fff' }} />
							</Button>
						</span>
					</Tooltip>

					<Tooltip title="Reset">
						<span>
							<Button
								disabled={loading}
								variant="contained"
								onClick={onReset}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
									backgroundColor: '#e0e0e0',
									color: '#666',
									'&:hover': { backgroundColor: '#d1d1d1', color: '#333' },
								}}
							>
								<RestartAlt sx={{ fontSize: 20 }} />
							</Button>
						</span>
					</Tooltip>
				</Grid>

				<Grid item xs md="auto" display="flex" ml="auto">
					<Button
						disableElevation
						disabled={downloadLoading || loading}
						variant="contained"
						startIcon={
							downloadLoading ? (
								<CircularProgress size={18} thickness={5} color="inherit" />
							) : (
								<FileDownload sx={{ fontSize: 20 }} />
							)
						}
						onClick={onDownload}
						sx={{
							height: 42,
							px: 2.5,
							borderRadius: '12px',
							textTransform: 'none',
							fontWeight: 600,
							color: '#fff',
							minWidth: 180,
						}}
					>
						{downloadLoading ? 'Preparing Excel...' : 'Download Excel'}
					</Button>
				</Grid>
			</Grid>
		</Box>
	);
};

const WeatherStationLogs = () => {
	const { showToast } = useToast();
	const initialPayload = useMemo(
		() => ({
			dateTime: getDefaultDateRange(),
			parameters: [defaultParameters],
		}),
		[]
	);
	const [payload, setPayload] = useState(initialPayload);
	const [submittedFilters, setSubmittedFilters] = useState(() =>
		buildFilters(initialPayload)
	);
	const [pagination, setPagination] = useState({ limit: 50, offset: 0 });

	const filtersAreValid = Boolean(
		submittedFilters.startDatetime && submittedFilters.endDatetime
	);
	const parametersQuery = useQuery({
		queryKey: ['weather', 'logs', 'parameters'],
		queryFn: ({ signal }) => weatherStationApi.getLogsParameters({ signal }),
		staleTime: 5 * 60 * 1000,
	});
	const logsQuery = useQuery({
		queryKey: ['weather', 'logs', submittedFilters, pagination],
		queryFn: ({ signal }) =>
			weatherStationApi.getLogs(
				{ ...submittedFilters, ...pagination },
				{ signal }
			),
		enabled: filtersAreValid,
		placeholderData: (previousData) => previousData,
	});

	const logsData = useMemo(() => {
		const response = logsQuery.data;
		const rows = Array.isArray(response?.rows)
			? response.rows.map(({ values, ...row }) => ({
					...row,
					...(values || {}),
			  }))
			: [];
		const total = Number(response?.total);
		return {
			columns: Array.isArray(response?.columns) ? response.columns : [],
			rows,
			total: Number.isFinite(total) ? total : rows.length,
		};
	}, [logsQuery.data]);

	const columns = useMemo(
		() =>
			[
				{ key: 'timestamp', label: 'Timestamp', unit: '' },
				...logsData.columns,
			].map((column) => ({
				accessorKey: column.key,
				header: column.label,
				size: column.key === 'timestamp' ? 150 : 110,
				cell: (info) => {
					const value = info.getValue();
					if (column.key === 'timestamp' && value) {
						const date = dayjs(value);
						return date.isValid()
							? date.format('DD MMM YYYY HH:mm:ss')
							: String(value);
					}
					return value !== null && value !== undefined && value !== ''
						? `${value}${column.unit ? ` ${column.unit}` : ''}`
						: '—';
				},
			})),
		[logsData.columns]
	);

	const downloadMutation = useMutation({
		mutationFn: (filters) => weatherStationApi.downloadLogs(filters),
		onSuccess: (response) => {
			const url = URL.createObjectURL(response.data);
			triggerFileDownload(
				url,
				getDownloadFileName(
					response.headers,
					`weather_logs_${dayjs().format('YYYY-MM-DD')}.xlsx`
				)
			);
			URL.revokeObjectURL(url);
		},
		onError: (error) =>
			showToast(
				getWeatherStationErrorMessage(error, 'Unable to download logs.'),
				'error'
			),
	});

	const handleSearch = () => {
		const filters = buildFilters(payload);
		if (!filters.startDatetime || !filters.endDatetime) {
			showToast('Select a valid date and time range.', 'error');
			return;
		}
		setPagination((previous) => ({ ...previous, offset: 0 }));
		setSubmittedFilters(filters);
	};

	const handleReset = () => {
		const nextPayload = {
			dateTime: getDefaultDateRange(),
			parameters: [defaultParameters],
		};
		setPayload(nextPayload);
		setPagination({ limit: 50, offset: 0 });
		setSubmittedFilters(buildFilters(nextPayload));
	};

	const loading =
		logsQuery.isLoading || logsQuery.isFetching || parametersQuery.isLoading;
	const pageIndex = Math.floor(pagination.offset / pagination.limit);

	return (
		<Box
			sx={{ height: { xs: 'calc(100vh - 80px)', sm: 'calc(100vh - 88px)' } }}
		>
			<LogsFilterHeader
				parameterOptions={[defaultParameters, ...(parametersQuery.data || [])]}
				onSearch={handleSearch}
				onReset={handleReset}
				payload={payload}
				setPayload={setPayload}
				loading={loading}
				onDownload={() => {
					const filters = buildFilters(payload);
					if (!filters.startDatetime || !filters.endDatetime) {
						showToast('Select a valid date and time range.', 'error');
						return;
					}
					downloadMutation.mutate(filters);
				}}
				downloadLoading={downloadMutation.isPending}
				parameterError={
					parametersQuery.error
						? getWeatherStationErrorMessage(
								parametersQuery.error,
								'Unable to load log parameters.'
						  )
						: null
				}
			/>

			<Box
				height={{ xs: 'calc(100% - 163px)', md: 'calc(100% - 49px)' }}
				pt={1}
				overflow="auto"
			>
				{loading ? (
					<PremiumLoader />
				) : logsQuery.error ? (
					<NoDataFound
						message={getWeatherStationErrorMessage(
							logsQuery.error,
							'Unable to load Weather Station logs.'
						)}
					/>
				) : !logsData.rows.length ? (
					<NoDataFound message="No logs found for the selected filters." />
				) : (
					<CustomTable
						data={logsData.rows}
						columns={columns}
						pageIndex={pageIndex}
						pageSize={pagination.limit}
						totalRowCount={logsData.total}
						onPageChange={(_event, nextPage) =>
							setPagination((previous) => ({
								...previous,
								offset: nextPage * previous.limit,
							}))
						}
						onRowsPerPageChange={(event) =>
							setPagination({
								limit: Number(event.target.value),
								offset: 0,
							})
						}
					/>
				)}
			</Box>
		</Box>
	);
};

export default WeatherStationLogs;
