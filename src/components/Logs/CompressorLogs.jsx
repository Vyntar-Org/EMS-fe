import { Box, Button, Grid, Tooltip } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useCommonData } from '../../contexts/CommonDataContext';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { RestartAlt, Search } from '@mui/icons-material';
import { Loading } from '../common/Loading';
import NoDataFound from '../common/errors/NoDataFound';
import { api } from '../../helpers/api';
import { COMPRESSOR_LOG_COLUMN_MAPPING } from '../../constants/compressorLogs';
import { CustomTable } from '../common/CustomTable';
import dayjs from 'dayjs';
import VyntarButtons from '../common/VyntarButtons';
import { LogUrlBuilder } from '../../helpers/logs';

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

const CompressorLogsFilterHeader = ({
	slaveOptions,
	parameterOptions,
	handleSearch,
	handleReset,
	payload,
	setPayload,
	tableLoading,
}) => {
	const downloadApiUrl = useMemo(() => {
		return LogUrlBuilder('COMPRESSOR_LOGS_DATA').build({
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
				<Grid item xs={12} sm md={5} lg={4.4}>
					<CustomAutocomplete
						options={slaveOptions}
						onChange={(val) => handleFieldCh('slave_id', val)}
						value={payload?.slave_id || ''}
						label="Select Devices"
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
						fileNamePrefix="compressor_logs"
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

const CompressorLogs = () => {
	const { slavesData, parametersData } = useCommonData();
	const [loading, setLoading] = useState(false);
	const [logsData, setLogsData] = useState(null);
	const [payload, setPayload] = useState({ dateTime: getDefaultDateRange() });
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
			header: COMPRESSOR_LOG_COLUMN_MAPPING[c] ?? c,
			cell: (info) => {
				const value = info.getValue();

				if (c === 'timestamp' && value) {
					const date = dayjs(value);
					return date.isValid()
						? date.format('DD MMM YYYY HH:mm:ss')
						: String(value);
				}

				if (c === 'idle') {
					const isIdle = Boolean(
						value === true ||
							String(value).toLowerCase() === 'true' ||
							value > 0
					);
					return (
						<Box
							component="span"
							sx={{
								display: 'inline-block',
								bgcolor: isIdle
									? 'rgba(237,108,2,0.12)'
									: 'rgba(145,158,171,0.12)',
								borderRadius: '999px',
								px: 1.5,
								py: 0.25,
								fontSize: '11px',
								fontWeight: 'bold',
								color: isIdle ? 'warning.main' : 'text.secondary',
								textAlign: 'center',
								minWidth: 45,
							}}
						>
							{isIdle ? 'YES' : 'NO'}
						</Box>
					);
				}

				// 3. 🟢 Handle Alert Status Column
				if (c === 'alert') {
					const isAlert = Boolean(
						value === true ||
							String(value).toLowerCase() === 'true' ||
							value > 0
					);
					return (
						<Box
							component="span"
							sx={{
								display: 'inline-block',
								bgcolor: isAlert
									? 'rgba(244,67,54,0.12)'
									: 'rgba(76,175,80,0.12)',
								borderRadius: '999px',
								px: 1.5,
								py: 0.25,
								fontSize: '11px',
								fontWeight: 'bold',
								color: isAlert ? 'error.main' : 'success.main',
								textAlign: 'center',
								minWidth: 80,
							}}
						>
							{isAlert ? 'TRIGGERED' : 'CLEAR'}
						</Box>
					);
				}

				return String(value ?? 'N/A');
			},
		}));
	}, [logsData]);

	const handleSearch = async (paginationDetails = apiPaginationParams) => {
		if (!payload?.slave_id) {
			return;
		}

		setLoading(true);
		try {
			const url = LogUrlBuilder('COMPRESSOR_LOGS_DATA').build({
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
			console.error('Compressor logs API error:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setLogsData(null);
		setBackendTotalRowsCount(0);
		setApiPaginationParams({ limit: 50, offset: 0 });
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
		const nextParams = { limit: newLimit, offset: 0 };
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
			<CompressorLogsFilterHeader
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
					xs: 'calc(100% - 163px)',
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

export default CompressorLogs;
