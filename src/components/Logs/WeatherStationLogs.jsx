import { FileDownload, RestartAlt, Search } from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, Tooltip } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { useCommonData } from '../../contexts/CommonDataContext';
import { weatherStationApi as api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { basePickerStyles, triggerFileDownload } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTable } from '../common/CustomTable';
import NoDataFound from '../common/errors/NoDataFound';
import PremiumLoader from '../Dashboards/weatherStationDashboardCards/PremiumLoader';

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];
const defaultParameters = {
	label: 'All',
	value: 'all',
};
const LogsFilterHeader = ({
	parameterOptions,
	handleSearch,
	handleReset,
	payload,
	setPayload,
	loading,
	// handlePdfDownload,
	handleExcelDownload,
	isDownloadLoading,
}) => {
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
				borderBottom: '2px dashed',
				borderColor: 'divider',
			}}
		>
			<Grid container gap={2} alignItems="center">
				{/* <Grid item xs={12} sm md lg={3}>
					<CustomAutocomplete
						options={slaveOptions}
						onChange={(val) => handleFieldCh('slave_id', val)}
						value={payload?.slave_id || ''}
						label="Select Devices"
						size="small"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 2,

								backgroundColor: '#f9f9f9',

								transition: '0.3s',

								'&:hover': {
									backgroundColor: '#fff',
								},
							},
						}}
					/>
				</Grid> */}

				<Grid item xs={12} sm md={4} lg={3}>
					<CustomAutocomplete
						multiple
						options={parameterOptions}
						onChange={(val) => handleFieldCh('parameters', val)}
						value={payload?.parameters || []}
						label="Select Parameters"
						size="small"
						sx={basePickerStyles}
					/>
				</Grid>

				<Grid item xs={12} md={6} lg={4}>
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
								disableElevation
								variant="contained"
								disabled={loading}
								onClick={() => handleSearch()}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
									boxShadow: 'none',
									color: '#fff',
									bgcolor: 'primary.main',
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
								onClick={() => {
									setPayload((prev) => ({
										...(prev || {}),
										dateTime: getDefaultDateRange(),
										parameters: [defaultParameters],
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

									backgroundColor: '#e0e0e0',
									color: '#666666',
									'&:hover': {
										boxShadow: 'none',
										backgroundColor: '#d1d1d1',
										color: '#333333',
									},
								}}
							>
								<RestartAlt sx={{ fontSize: 20 }} />
							</Button>
						</span>
					</Tooltip>
				</Grid>

				<Grid item xs md="auto" display="flex" gap={2} ml="auto">
					<Button
						disableElevation
						disabled={isDownloadLoading || loading}
						variant="contained"
						startIcon={
							isDownloadLoading ? (
								<CircularProgress size={18} thickness={5} color="inherit" />
							) : (
								<FileDownload sx={{ fontSize: 20 }} />
							)
						}
						onClick={handleExcelDownload}
						sx={{
							height: 42,
							px: 2.5,
							borderRadius: '12px',
							textTransform: 'none',
							fontWeight: 600,
							fontSize: '0.9rem',
							letterSpacing: '0.2px',
							color: '#fff',
							bgcolor: 'primary.main',
							minWidth: 180,

							'&:hover': {
								bgcolor: 'primary.dark',
							},

							'&.Mui-disabled': {
								bgcolor: 'brand.navySoft',
								color: '#fff',
							},
						}}
					>
						{isDownloadLoading ? 'Preparing Excel...' : 'Download Excel'}
					</Button>

					{/* <Tooltip title="Download PDF">
            <span>
              <Button
                disabled={loading}
                variant="contained"
                onClick={handlePdfDownload}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  p: 0,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: "#E11D48",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#9F1239",
                  },
                }}
              >
                <Description sx={{ fontSize: 20, color: "#fff" }} />
              </Button>
            </span>
          </Tooltip> */}
				</Grid>
			</Grid>
		</Box>
	);
};

const WeatherStationLogs = () => {
	const { parametersData } = useCommonData();
	const [loading, setLoading] = useState(true);
	const [isDownloadLoading, setIsDownloadLoading] = useState(null);
	const [logsData, setLogsData] = useState(null);
	const [isReset, setIsReset] = useState(null);

	const [payload, setPayload] = useState({
		dateTime: getDefaultDateRange(),
		parameters: [defaultParameters],
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
		if (!logsData?.rows?.length) {
			return [];
		}

		const columnsForTable = [
			{
				key: 'timestamp',
				label: 'Timestamp',
				unit: '',
			},
			...(logsData?.columns || []),
		];

		const columnDef = columnsForTable?.map((c) => ({
			accessorKey: c?.key,
			header: c?.label,
			size: c?.key === 'timestamp' ? 150 : 100,
			cell: (info) => {
				const value = info.getValue();

				if (c?.key === 'timestamp' && value) {
					const date = dayjs(value);
					return date.isValid()
						? date.format('DD MMM YYYY HH:mm:ss')
						: String(value);
				}

				return value !== null && value !== undefined && value !== ''
					? String(value) + (c?.unit ? ` ${c?.unit}` : '')
					: '-';
			},
		}));

		return columnDef;
	}, [logsData]);

	const handleSearch = async (
		paginationDetails = apiPaginationParams,
		isDownload = false
	) => {
		if (isDownload) {
			setIsDownloadLoading(true);
		} else {
			setLoading(true);
		}
		try {
			const parameterValues = payload?.parameters
				? payload.parameters
						.map((p) => p?.value)
						.filter(Boolean)
						.join(',')
				: '';

			const startDateObj = payload?.dateTime?.[0];
			const endDateObj = payload?.dateTime?.[1];
			const formattedStart = startDateObj?.isValid?.()
				? startDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';
			const formattedEnd = endDateObj?.isValid?.()
				? endDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';

			const newApiUrl = isDownload
				? API_URLS.WEATHER_STATION_DOWNLOAD_LOGS_DATA(
						parameterValues,
						formattedStart,
						formattedEnd
				  )
				: API_URLS.WEATHER_STATION_LOGS_DATA(
						parameterValues,
						formattedStart,
						formattedEnd,
						paginationDetails.limit,
						paginationDetails.offset
				  );
			const res = await api.get(newApiUrl, {
				responseType: isDownload ? 'blob' : 'json',
			});

			if (isDownload) {
				return res;
			}

			const resStructure = {
				columns: res?.columns || [],
				rows: res?.rows?.map(({ values, ...rest }) => ({
					...rest,
					...values,
				})),
			};

			setLogsData(resStructure);
			setBackendTotalRowsCount(res?.total || 0);
		} catch (error) {
			console.error(`API Error:`, error);
		} finally {
			if (isDownload) {
				setIsDownloadLoading(false);
			} else {
				setLoading(false);
			}
		}
	};

	const handleReset = () => {
		setLogsData(null);
		setBackendTotalRowsCount(0);
		setApiPaginationParams({
			limit: 50,
			offset: 0,
		});
		setIsReset(new Date());
	};

	const handlePageChange = (event, newPageIndex) => {
		setApiPaginationParams((prev) => ({
			...prev,
			offset: newPageIndex * prev.limit,
		}));
		handleSearch({
			...apiPaginationParams,
			offset: newPageIndex * apiPaginationParams.limit,
		});
	};

	const handleRowsPerPageChange = (event) => {
		const newLimit = parseInt(event.target.value, 10);
		setApiPaginationParams({
			limit: newLimit,
			offset: 0,
		});
		handleSearch({
			limit: newLimit,
			offset: 0,
		});
	};

	// const handlePdfDownload = async () => {
	//   const downloadedData = await handleSearch({}, true);
	//   exportToPDF(
	//     downloadedData?.rows,
	//     downloadedData?.columns,
	//     "weather_station_logs",
	//   );
	// };

	const handleExcelDownload = async () => {
		const response = await handleSearch({}, true);

		if (!response) {
			return;
		}

		const blob = response.data;

		const url = URL.createObjectURL(blob);

		triggerFileDownload(
			url,
			`weather_station_logs_${dayjs().format('YYYY-MM-DD')}.xlsx`
		);

		URL.revokeObjectURL(url);
	};

	useEffect(() => {
		handleSearch(apiPaginationParams);
	}, [isReset]);

	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 24px)',
					sm: 'calc(100vh - 64px - 24px)',
				},
			}}
		>
			<LogsFilterHeader
				parameterOptions={[defaultParameters, ...(parametersData?.logs || [])]}
				handleSearch={handleSearch}
				handleReset={handleReset}
				payload={payload}
				setPayload={setPayload}
				loading={loading}
				// handlePdfDownload={handlePdfDownload}
				handleExcelDownload={handleExcelDownload}
				isDownloadLoading={isDownloadLoading}
			/>

			<Box
				height={{
					xs: 'calc(100% - 163px)',
					sm: 'calc(100% - 160px)',
					md: 'calc(100% - 107px)',
					lg: 'calc(100% - 49px)',
				}}
				pt={1}
				overflow="auto"
			>
				{loading ? (
					<PremiumLoader />
				) : !logsData?.rows?.length ? (
					<NoDataFound
						message="No logs found"
						description="Try adjusting the parameters or the date/time range, then search again."
					/>
				) : (
					<CustomTable
						data={logsData?.rows}
						columns={logsColumns}
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

export default WeatherStationLogs;
