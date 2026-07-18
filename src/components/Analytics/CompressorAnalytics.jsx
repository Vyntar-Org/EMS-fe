import React, { useState } from 'react';
import { useCommonData } from '../../contexts/CommonDataContext';
import { Box, Button, Grid, Typography } from '@mui/material';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { RestartAlt, Search } from '@mui/icons-material';
import {
	KEY_PARAMETER_OPTIONS_MAPPING,
	UNIQUE_PASTEL_BGS,
} from '../../constants/energyAnalytics';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import dayjs from 'dayjs';
import NoDataFound from '../common/errors/NoDataFound';
import ReactApexChart from 'react-apexcharts';
import { basePickerStyles } from '../../helpers/common';
import { Loading } from '../common/Loading';

// Constants defined based on the reference code
const PARAMETER_OPTIONS = [
	{ value: 'connectivity_status', label: 'Connectivity History' },
];

const CHART_COLORS = [
	'#30b44a',
	'#2F6FB0',
	'#e34d4d',
	'#f4b400',
	'#9c27b0',
	'#00bcd4',
];

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

// Updated processing logic to return [timestamp, value] pairs for datetime axis
const getProcessedChartData = (rawAnalytics, activeKeys) => {
	if (!rawAnalytics?.data || rawAnalytics.data.length === 0) {
		return { series: [] };
	}

	const rawData = rawAnalytics.data;

	// Helper to process raw API data into [timestamp, status] tuples
	const processRawData = (data, key) => {
		const seriesData = [];
		data.forEach((item) => {
			const startTime = new Date(item.start).getTime();
			const endTime = new Date(item.end).getTime();
			// Determine the data key. For 'connectivity_status', the API uses 'status'.
			const dataKey = key === 'connectivity_status' ? 'status' : key;
			const value = item[dataKey] ?? item.status ?? null;

			// Push start point
			seriesData.push([startTime, value]);
			// Push end point to maintain status until the end
			seriesData.push([endTime, value]);
		});
		// Sort by timestamp
		seriesData.sort((a, b) => a[0] - b[0]);
		return seriesData;
	};

	const series = activeKeys.map((key) => {
		return {
			name:
				KEY_PARAMETER_OPTIONS_MAPPING[key] ||
				key.replace(/_/g, ' ').toUpperCase(),
			data: processRawData(rawData, key),
		};
	});

	return { series };
};

const GlobalFiltersRow = ({ dateTime, onDateChange, addNewComparisonRow }) => (
	<Box
		sx={{
			pb: 2,
			borderBottom: '1px dashed',
			borderColor: 'divider',
			display: 'flex',
			gap: 2,
		}}
	>
		<Grid container alignItems="end" spacing={2}>
			<Grid item xs={12} md={8} lg={6}>
				{/* <Typography
					variant="subtitle2"
					sx={{ mb: 0.5, color: 'text.secondary' }}
				>
					Global Date/Time
				</Typography> */}
				<CustomDatePicker
					mode="datetimerangepicker"
					onChange={onDateChange}
					value={dateTime || ''}
				/>
			</Grid>

			<Grid item xs={12} sm="auto" ml="auto">
				<Button
					fullWidth
					size="large"
					disableElevation
					sx={{
						fontWeight: 'bold',
						borderRadius: '16px',
					}}
					variant="contained"
					color="secondary"
					onClick={addNewComparisonRow}
				>
					+ Add Device To Compare
				</Button>
			</Grid>
		</Grid>
	</Box>
);

const DeviceFilterRow = ({
	comparisonId,
	slaveOptions,
	payload,
	handleFieldChange,
	handleSearch,
	handleReset,
	showCancel,
	parameterOptions = PARAMETER_OPTIONS,
}) => (
	<Box
		sx={{ py: 1.5, px: 2, bgcolor: 'background.paper', borderRadius: 2, mb: 1 }}
	>
		<Grid container spacing={2} alignItems="center">
			<Grid item xs={12} md={3.5}>
				<CustomAutocomplete
					options={slaveOptions}
					onChange={(val) => handleFieldChange(comparisonId, 'slave_id', val)}
					value={payload?.slave_id || ''}
					label="Select Device"
					size="small"
					sx={basePickerStyles}
				/>
			</Grid>
			<Grid item xs={12} md={4.5}>
				<CustomAutocomplete
					multiple
					options={parameterOptions}
					onChange={(val) => handleFieldChange(comparisonId, 'parameters', val)}
					value={payload?.parameters || []}
					label="Select Parameters"
					size="small"
					sx={basePickerStyles}
				/>
			</Grid>
			<Grid
				item
				xs={12}
				md={4}
				display="flex"
				gap={1}
				justifyContent="flex-end"
			>
				<Button
					variant="contained"
					onClick={() => handleSearch(comparisonId)}
					startIcon={<Search />}
					size="small"
					disableElevation
					sx={{
						fontWeight: 'bold',
						borderRadius: '8px',
					}}
				>
					Analyze
				</Button>
				<Button
					variant="outlined"
					color="inherit"
					onClick={() => handleReset(comparisonId)}
					size="small"
					disableElevation
					sx={{
						fontWeight: 'bold',
						borderRadius: '8px',
					}}
				>
					<RestartAlt fontSize="small" />
				</Button>
				{showCancel && (
					<Button
						variant="outlined"
						color="error"
						onClick={() => handleReset(comparisonId, true)}
						size="small"
						disableElevation
						sx={{
							fontWeight: 'bold',
							borderRadius: '8px',
						}}
					>
						Cancel
					</Button>
				)}
			</Grid>
		</Grid>
	</Box>
);

const CompressorAnalytics = () => {
	const { slavesData } = useCommonData();
	const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
	const [payloads, setPayloads] = useState({ 1: null });
	const [analyticsDataMap, setAnalyticsDataMap] = useState({});
	const [selectedParamsMap, setSelectedParamsMap] = useState({});
	const [loadingMap, setLoadingMap] = useState({});
	const [rowIds, setRowIds] = useState([1]);

	const handleFieldChange = (id, key, value) => {
		setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
	};

	const handleSearch = async (id) => {
		const currentPayload = payloads[id];
		if (!currentPayload?.slave_id) return;

		setLoadingMap((prev) => ({ ...prev, [id]: true }));
		try {
			const slaveId = currentPayload.slave_id?.value ?? '';
			const parameterValues = currentPayload.parameters
				? currentPayload.parameters
						.map((p) => p?.value)
						.filter(Boolean)
						.join(',')
				: '';

			const startDateObj = globalDateTime?.[0];
			const endDateObj = globalDateTime?.[1];
			const formattedStart = startDateObj?.isValid?.()
				? startDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';
			const formattedEnd = endDateObj?.isValid?.()
				? endDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';

			const newApiUrl = API_URLS.COMPRESSOR_ANALYTICS_DATA(
				slaveId,
				parameterValues,
				formattedStart,
				formattedEnd
			);
			const res = await api.get(newApiUrl);
			if (res?.success) {
				setAnalyticsDataMap((prev) => ({ ...prev, [id]: res.data }));
				setSelectedParamsMap((prev) => ({
					...prev,
					[id]: currentPayload.parameters,
				}));
			}
		} catch (error) {
			console.error(`API Error on row ${id}:`, error);
		} finally {
			setLoadingMap((prev) => ({ ...prev, [id]: false }));
		}
	};

	const handleReset = (id, shouldRemoveRow = false) => {
		if (shouldRemoveRow && id !== 1) {
			setRowIds((prev) => prev.filter((rowId) => rowId !== id));
			setPayloads((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setAnalyticsDataMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setSelectedParamsMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setLoadingMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
		} else {
			setPayloads((prev) => ({ ...prev, [id]: null }));
			setAnalyticsDataMap((prev) => ({ ...prev, [id]: null }));
			setSelectedParamsMap((prev) => ({ ...prev, [id]: null }));
		}
	};

	const addNewComparisonRow = () => {
		const nextId = Math.max(...rowIds, 0) + 1;
		setRowIds((prev) => [...prev, nextId]);
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
			<GlobalFiltersRow
				dateTime={globalDateTime}
				onDateChange={(val) => setGlobalDateTime(val)}
				addNewComparisonRow={addNewComparisonRow}
			/>

			<Box
				height={{ xs: 'calc(100% - 115px)', md: 'calc(100% - 58px)' }}
				pt={1}
				overflow="auto"
				display="flex"
				flexDirection="column"
				gap={1}
			>
				{rowIds.map((id, index) => {
					const rawAnalytics = analyticsDataMap[id];
					const currentSelectedParams = selectedParamsMap[id];
					const isLoading = loadingMap[id];

					const activeKeys =
						currentSelectedParams?.flatMap((param) =>
							param.value ? param.value.split(',') : []
						) || [];

					const processedData = getProcessedChartData(rawAnalytics, activeKeys);

					const selectedDeviceIdsInOtherRows = Object.keys(payloads)
						.filter((rowId) => Number(rowId) !== id)
						.map((rowId) => payloads[rowId]?.slave_id?.value)
						.filter(Boolean);

					const filteredSlaveOptions = slaveOptions.filter(
						(option) => !selectedDeviceIdsInOtherRows.includes(option.value)
					);

					const uniqueBgColor =
						UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];

					const isMultiSeries = processedData.series.length > 1;

					const performanceChartOptions = {
						chart: {
							type: 'area',
							height: 420,
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
						},
						stroke: {
							width: 2,
							curve: 'stepline',
						},
						fill: {
							type: 'solid',
							opacity: 0.2,
						},
						colors: CHART_COLORS,
						dataLabels: { enabled: false },
						xaxis: {
							type: 'datetime',
							title: {
								text: 'Time',
								style: { color: '#6B7280', fontSize: '12px' },
							},
							labels: {
								style: { colors: '#6B7280', fontSize: '11px' },
								datetimeUTC: false,
							},
						},
						yaxis: {
							title: {
								text: 'Status',
								style: { color: '#6B7280', fontSize: '12px' },
							},
							min: -0.1,
							max: 1.1,
							tickAmount: 2,
							labels: {
								style: { colors: '#6B7280', fontSize: '12px' },
								formatter: function (val) {
									if (val >= 0.9) return 'Online';
									if (val <= 0.1) return 'Offline';
									return '';
								},
							},
						},
						grid: {
							borderColor: '#E5E7EB',
							xaxis: { lines: { show: false } },
							yaxis: { lines: { show: true } },
						},
						tooltip: {
							enabled: true,
							theme: 'light',
							shared: isMultiSeries,
							custom: function ({ series, seriesIndex, dataPointIndex, w }) {
								const allSeries = w.globals.initialSeries;
								let tooltipHtml = '';
								let timestamp = null;

								const getStatusRow = (name, value) => {
									const statusText = value === 1 ? 'Online' : 'Offline';
									const statusColor = value === 1 ? '#30b44a' : '#e34d4d';
									return `
                    <div style="display: flex; align-items: center; margin-top: 4px;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; margin-right: 8px;"></span>
                      <span style="flex: 1; color: #333; font-size: 12px;">${deviceLabel}:</span>
                      <span style="font-weight: bold; color: ${statusColor}; margin-left: 5px; font-size: 12px;">${statusText}</span>
                    </div>
                  `;
								};

								if (isMultiSeries) {
									allSeries.forEach((s, i) => {
										const point = s.data[dataPointIndex];
										if (point) {
											if (!timestamp) timestamp = point[0];
											tooltipHtml += getStatusRow(s.name, point[1]);
										}
									});
								} else {
									const point = allSeries[seriesIndex].data[dataPointIndex];
									if (point) {
										timestamp = point[0];
										tooltipHtml += getStatusRow(
											allSeries[seriesIndex].name,
											point[1]
										);
									}
								}

								const formattedDate = timestamp
									? dayjs(timestamp).format('DD/MM/YYYY hh:mm:ss A')
									: 'N/A';

								return `
                  <div style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 12px;">${formattedDate}</div>
                    ${tooltipHtml}
                  </div>
                `;
							},
						},
						legend: {
							show: isMultiSeries,
							position: 'top',
							horizontalAlign: 'center',
						},
						markers: {
							size: 0,
							hover: { size: 5 },
						},
					};

					const deviceLabel =
						payloads[id]?.slave_id?.label || `Device Segment ${id}`;

					return (
						<Box
							key={id}
							sx={{
								p: 1,
								borderRadius: 3,
								bgcolor: uniqueBgColor,
								transition: 'background-color 0.3s ease',
								boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
							}}
						>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
								{deviceLabel} Status Analysis
							</Typography>

							<DeviceFilterRow
								comparisonId={id}
								slaveOptions={filteredSlaveOptions}
								payload={payloads[id]}
								handleFieldChange={handleFieldChange}
								handleSearch={handleSearch}
								handleReset={handleReset}
								showCancel={rowIds.length > 1}
								parameterOptions={PARAMETER_OPTIONS}
							/>

							<Box sx={{ height: { xs: 500, sm: 380 } }}>
								{isLoading ? (
									<Loading />
								) : !processedData.series.length ? (
									<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
								) : (
									<ReactApexChart
										options={performanceChartOptions}
										series={processedData.series}
										type="area"
										height="100%"
										width="100%"
									/>
								)}
							</Box>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default CompressorAnalytics;
