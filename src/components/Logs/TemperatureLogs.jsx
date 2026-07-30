import { Box, Button, Grid, Tooltip } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useCommonData } from '../../contexts/CommonDataContext';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { RestartAlt, Search } from '@mui/icons-material';
import { Loading } from '../common/Loading';
import NoDataFound from '../common/errors/NoDataFound';
import { api } from '../../helpers/api';
import { TEMPERATURE_LOG_COLUMN_MAPPING } from '../../constants/temperatureLogs';
import { CustomTable } from '../common/CustomTable';
import dayjs from 'dayjs';
import VyntarButtons from '../common/VyntarButtons';
import { LogUrlBuilder } from '../../helpers/logs';

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

const TemperatureLogsFilterHeader = ({
	slaveOptions,
	parameterOptions,
	handleSearch,
	handleReset,
	payload,
	setPayload,
	tableLoading,
}) => {
	const downloadApiUrl = useMemo(() => {
		return LogUrlBuilder('TEMPERATURE_LOGS_DATA').build({
			payload,
			isDownload: true,
		});
	}, [payload]);

	const handleFieldCh = (key, value) => {
		setPayload((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	return (
		<Box
			sx={{
				pb: 1,
				borderBottom: '1px dashed',
				borderColor: 'divider',
			}}
		>
			<Grid container gap={2} alignItems="center">
				<Grid item xs={12} sm md={2.5} lg={2.2}>
					<CustomAutocomplete
						options={slaveOptions}
						onChange={(val) => handleFieldCh('slave_id', val)}
						value={payload?.slave_id || ''}
						label="Select Device"
						size="small"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 2,
								backgroundColor: 'surface.muted',
								transition: '0.3s',
								'&:hover': {
									backgroundColor: 'background.paper',
								},
							},
						}}
					/>
				</Grid>

				<Grid item xs={12} sm md={2.5} lg={2.2}>
					<CustomAutocomplete
						multiple
						options={parameterOptions}
						onChange={(val) => handleFieldCh('parameters', val)}
						value={payload?.parameters || []}
						label="Select Parameters"
						size="small"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 2,
								backgroundColor: 'surface.muted',
								transition: '0.3s',
								'&:hover': {
									backgroundColor: 'background.paper',
								},
							},
						}}
					/>
				</Grid>

				<Grid item xs={12} md={5} lg={4}>
					<CustomDatePicker
						mode="datetimerangepicker"
						onChange={(val) => handleFieldCh('dateTime', val)}
						value={payload?.dateTime || ''}
					/>
				</Grid>

				<Grid item xs="auto" display="flex" gap={2} ml={{ xs: 'auto', md: 0 }}>
					<Tooltip title="Search">
						<span>
							<Button
								variant="contained"
								onClick={() => handleSearch()}
								disabled={!payload?.slave_id || tableLoading}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
									boxShadow: 'none',
									backgroundColor: (theme) =>
										theme.palette.primary.main || '#1976d2',
									'&:hover': {
										boxShadow: 'none',
										backgroundColor: (theme) =>
											theme.palette.primary.dark || '#115293',
									},
								}}
							>
								<Search sx={{ fontSize: 20, color: '#fff' }} />
							</Button>
						</span>
					</Tooltip>

					<Tooltip title="Reset">
						<span>
							<Button
								variant="contained"
								disabled={tableLoading}
								onClick={() => {
									setPayload((prev) => ({
										...(prev || {}),
										dateTime: getDefaultDateRange(),
									}));
									handleReset();
								}}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
									boxShadow: 'none',
									backgroundColor: 'surface.muted',
									color: 'text.secondary',
									'&:hover': {
										boxShadow: 'none',
										backgroundColor: 'action.hover',
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
						apiUrl={downloadApiUrl}
						label="Download Excel"
						disableElevation
						fileNamePrefix="temperature_logs"
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

const TemperatureLogs = () => {
	const { slavesData, parametersData } = useCommonData();
	const [loading, setLoading] = useState(false);
	const [logsData, setLogsData] = useState(null);
	const [payload, setPayload] = useState({
		dateTime: getDefaultDateRange(),
	});
	const [apiPaginationParams, setApiPaginationParams] = useState({
		limit: 50,
		offset: 0,
	});
	const [backendTotalRowsCount, setBackendTotalRowsCount] = useState(0);

	const tablePageIndex = Math.floor(
		apiPaginationParams.offset / apiPaginationParams.limit
	);
	const tablePageSize = apiPaginationParams.limit;

	const logsColumns = useMemo(() => {
		if (!logsData?.length) {
			return [];
		}

		const availableKeys = Object.keys(logsData[0]);
		// Timestamp is always the anchor column for a log row — pin it first
		// regardless of whatever order the API happens to return keys in.
		const orderedKeys = availableKeys.includes('timestamp')
			? ['timestamp', ...availableKeys.filter((k) => k !== 'timestamp')]
			: availableKeys;

		return orderedKeys.map((c) => ({
			accessorKey: c,
			header: TEMPERATURE_LOG_COLUMN_MAPPING[c] ?? c,
			cell: (info) => {
				const value = info.getValue();

				if (c === 'timestamp' && value) {
					const date = dayjs(value);
					return date.isValid()
						? date.format('DD MMM YYYY HH:mm:ss')
						: String(value);
				}

				if (typeof value === 'number') {
					return value.toFixed(2);
				}

				return String(value ?? '-');
			},
		}));
	}, [logsData]);

	const handleSearch = async (paginationDetails = apiPaginationParams) => {
		if (!payload?.slave_id) {
			return;
		}

		setLoading(true);
		try {
			const url = LogUrlBuilder('TEMPERATURE_LOGS_DATA').build({
				payload,
				limit: paginationDetails.limit,
				offset: paginationDetails.offset,
				isDownload: false,
			});
			const res = await api.get(url);
			if (res?.success) {
				setLogsData(res?.data?.logs || []);
				setBackendTotalRowsCount(res?.meta?.total ?? 0);
			}
		} catch (error) {
			console.error('Temperature logs API error:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setLogsData(null);
		setBackendTotalRowsCount(0);
		setApiPaginationParams({
			limit: 50,
			offset: 0,
		});
	};

	const handlePageChange = (event, newPageIndex) => {
		const nextParams = {
			...apiPaginationParams,
			offset: newPageIndex * apiPaginationParams.limit,
		};
		setApiPaginationParams(nextParams);
		handleSearch(nextParams);
	};

	const handleRowsPerPageChange = (event) => {
		const newLimit = parseInt(event.target.value, 10);
		const nextParams = {
			limit: newLimit,
			offset: 0,
		};
		setApiPaginationParams(nextParams);
		handleSearch(nextParams);
	};

	const slaveOptions =
		slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
		[];

	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 16px)',
					sm: 'calc(100vh - 64px - 16px)',
				},
			}}
		>
			<TemperatureLogsFilterHeader
				slaveOptions={slaveOptions}
				parameterOptions={parametersData}
				handleSearch={handleSearch}
				handleReset={handleReset}
				payload={payload}
				setPayload={setPayload}
				tableLoading={loading}
			/>

			<Box
				height={{
					xs: 'calc(100% - 219px)',
					sm: 'calc(100% - 163px)',
					md: 'calc(100% - 107px)',
					lg: 'calc(100% - 51px)',
				}}
				pt={1}
				overflow="auto"
			>
				{loading ? (
					<Loading />
				) : !logsData?.length ? (
					<NoDataFound message="Select a device and date range, then click Search to view logs" />
				) : (
					<CustomTable
						data={logsData}
						columns={logsColumns}
						fillWidth
						pageIndex={tablePageIndex}
						pageSize={tablePageSize}
						totalRowCount={backendTotalRowsCount}
						onPageChange={handlePageChange}
						onRowsPerPageChange={handleRowsPerPageChange}
					/>
				)}
			</Box>
		</Box>
	);
};

export default TemperatureLogs;
