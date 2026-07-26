import { RestartAlt, Search } from '@mui/icons-material';
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Grid,
	Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { memo, useCallback, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import {
	KEY_PARAMETER_OPTIONS_MAPPING,
	UNIQUE_PASTEL_BGS,
} from '../../constants/energyAnalytics';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { basePickerStyles } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

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

const extractActiveKeys = (currentSelectedParams) =>
	currentSelectedParams?.flatMap((param) =>
		param.value ? param.value.split(',') : []
	) || [];

// Returns [timestamp, status] tuples so ApexCharts can plot a datetime axis
// directly — connectivity events are naturally sparse (state changes only),
// so no downsampling cap is needed the way dense telemetry series need one.
const getProcessedChartData = (rawAnalytics, activeKeys, namePrefix = '') => {
	if (!rawAnalytics?.data || rawAnalytics.data.length === 0) {
		return { series: [] };
	}

	const rawData = rawAnalytics.data;

	const processRawData = (data, key) => {
		const seriesData = [];
		data.forEach((item) => {
			const startTime = new Date(item.start).getTime();
			const endTime = new Date(item.end).getTime();
			const dataKey = key === 'connectivity_status' ? 'status' : key;
			const value = item[dataKey] ?? item.status ?? null;

			seriesData.push([startTime, value]);
			seriesData.push([endTime, value]);
		});
		seriesData.sort((a, b) => a[0] - b[0]);
		return seriesData;
	};

	const series = activeKeys.map((key) => {
		const baseName =
			KEY_PARAMETER_OPTIONS_MAPPING[key] ||
			key.replace(/_/g, ' ').toUpperCase();
		return {
			name: namePrefix ? `${namePrefix} - ${baseName}` : baseName,
			data: processRawData(rawData, key),
		};
	});

	return { series };
};

// Rebuilt only when `isMultiSeries` changes (memoized by callers) instead of
// on every render — a fresh options object each render forces ApexCharts to
// fully re-diff/re-render even when nothing on screen actually changed.
const buildChartOptions = (isMultiSeries) => ({
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
		animations: { enabled: false },
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
				if (val >= 0.9) {
					return 'Online';
				}
				if (val <= 0.1) {
					return 'Offline';
				}
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
                      <span style="flex: 1; color: #333; font-size: 12px;">${name}:</span>
                      <span style="font-weight: bold; color: ${statusColor}; margin-left: 5px; font-size: 12px;">${statusText}</span>
                    </div>
                  `;
			};

			if (isMultiSeries) {
				allSeries.forEach((s) => {
					const point = s.data[dataPointIndex];
					if (point) {
						if (!timestamp) {
							timestamp = point[0];
						}
						tooltipHtml += getStatusRow(s.name, point[1]);
					}
				});
			} else {
				const point = allSeries[seriesIndex].data[dataPointIndex];
				if (point) {
					timestamp = point[0];
					tooltipHtml += getStatusRow(allSeries[seriesIndex].name, point[1]);
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
});

const GlobalFiltersRow = memo(
	({
		dateTime,
		onDateChange,
		addNewComparisonRow,
		mergeCompare,
		onMergeChange,
		showMergeOption,
	}) => (
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
					<CustomDatePicker
						mode="datetimerangepicker"
						onChange={onDateChange}
						value={dateTime || ''}
					/>
				</Grid>

				<Grid
					item
					xs={12}
					sm="auto"
					ml="auto"
					display="flex"
					alignItems="center"
					gap={1.5}
				>
					{showMergeOption && (
						<FormControlLabel
							control={
								<Checkbox
									checked={mergeCompare}
									onChange={(e) => onMergeChange(e.target.checked)}
									size="small"
								/>
							}
							label="Merge All Devices into One Chart"
							sx={{
								whiteSpace: 'nowrap',
								mr: 0,
								'.MuiFormControlLabel-label': {
									fontSize: '14px',
									fontWeight: 600,
								},
							}}
						/>
					)}
					{!mergeCompare && (
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
					)}
				</Grid>
			</Grid>
		</Box>
	)
);
GlobalFiltersRow.displayName = 'GlobalFiltersRow';

const DeviceFilterRow = memo(
	({
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
			sx={{
				py: 1.5,
				px: 2,
				bgcolor: 'background.paper',
				borderRadius: 2,
				mb: 1,
			}}
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
						onChange={(val) =>
							handleFieldChange(comparisonId, 'parameters', val)
						}
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
	)
);
DeviceFilterRow.displayName = 'DeviceFilterRow';

const AnalyticsRow = memo(
	({
		id,
		index,
		rawAnalytics,
		currentSelectedParams,
		isLoading,
		payload,
		payloads,
		slaveOptions,
		handleFieldChange,
		handleSearch,
		handleReset,
		showCancel,
	}) => {
		const activeKeys = useMemo(
			() => extractActiveKeys(currentSelectedParams),
			[currentSelectedParams]
		);

		const processedData = useMemo(
			() => getProcessedChartData(rawAnalytics, activeKeys),
			[rawAnalytics, activeKeys]
		);

		const isMultiSeries = processedData.series.length > 1;
		const chartOptions = useMemo(
			() => buildChartOptions(isMultiSeries),
			[isMultiSeries]
		);

		const filteredSlaveOptions = useMemo(() => {
			const selectedDeviceIdsInOtherRows = Object.keys(payloads)
				.filter((rowId) => Number(rowId) !== id)
				.map((rowId) => payloads[rowId]?.slave_id?.value)
				.filter(Boolean);
			return slaveOptions.filter(
				(option) => !selectedDeviceIdsInOtherRows.includes(option.value)
			);
		}, [payloads, id, slaveOptions]);

		const uniqueBgColor = UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];
		const deviceLabel = payload?.slave_id?.label || `Device Segment ${id}`;

		return (
			<Box
				sx={{
					height: '100%',
					p: 1,
					borderRadius: 3,
					bgcolor: uniqueBgColor,
					transition: 'background-color 0.3s ease',
					boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
				}}
			>
				<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
					{deviceLabel} Status Analysis
				</Typography>

				<DeviceFilterRow
					comparisonId={id}
					slaveOptions={filteredSlaveOptions}
					payload={payload}
					handleFieldChange={handleFieldChange}
					handleSearch={handleSearch}
					handleReset={handleReset}
					showCancel={showCancel}
					parameterOptions={PARAMETER_OPTIONS}
				/>

				<Box
					height={{
						xs: 'calc(100% - 167px - 28px - 8px)',
						sm: 'calc(100% - 167px - 28px - 8px)',
						md: 'calc(100% - 64px - 28px - 8px)',
					}}
				>
					{isLoading ? (
						<Loading />
					) : !processedData.series.length ? (
						<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
					) : (
						<ReactApexChart
							options={chartOptions}
							series={processedData.series}
							type="area"
							height="100%"
							width="100%"
						/>
					)}
				</Box>
			</Box>
		);
	}
);
AnalyticsRow.displayName = 'AnalyticsRow';

const MergedAnalyticsRow = memo(({ rows, isAnyLoading }) => {
	const mergedSeries = useMemo(
		() =>
			rows
				.filter((row) => row.rawAnalytics?.data?.length)
				.flatMap(
					(row) =>
						getProcessedChartData(
							row.rawAnalytics,
							row.activeKeys,
							row.deviceLabel
						).series
				),
		[rows]
	);

	const isMultiSeries = mergedSeries.length > 1;
	const chartOptions = useMemo(
		() => buildChartOptions(isMultiSeries),
		[isMultiSeries]
	);

	return (
		<Box
			sx={{
				height: '100%',
				p: 1,
				borderRadius: 3,
				bgcolor: 'surface.muted',
				boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
			}}
		>
			<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
				Merged Comparison
			</Typography>

			<Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
				{rows.map((row) => row.deviceLabel).join(' merged ')}
			</Typography>

			<Box
				height={{
					xs: 'calc(100% - 80px)',
					sm: 'calc(100% - 64px)',
				}}
			>
				{isAnyLoading ? (
					<Loading />
				) : !mergedSeries.length ? (
					<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
				) : (
					<ReactApexChart
						options={chartOptions}
						series={mergedSeries}
						type="area"
						height="100%"
						width="100%"
					/>
				)}
			</Box>
		</Box>
	);
});
MergedAnalyticsRow.displayName = 'MergedAnalyticsRow';

const CompressorAnalytics = () => {
	const { slavesData } = useCommonData();
	const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
	const [payloads, setPayloads] = useState({ 1: null });
	const [analyticsDataMap, setAnalyticsDataMap] = useState({});
	const [selectedParamsMap, setSelectedParamsMap] = useState({});
	const [loadingMap, setLoadingMap] = useState({});
	const [rowIds, setRowIds] = useState([1]);
	const [mergeCompare, setMergeCompare] = useState(false);

	const handleFieldChange = useCallback((id, key, value) => {
		setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
	}, []);

	const handleSearch = useCallback(
		(id) => {
			setPayloads((prevPayloads) => {
				const currentPayload = prevPayloads[id];
				if (!currentPayload?.slave_id) {
					return prevPayloads;
				}

				setLoadingMap((prev) => ({ ...prev, [id]: true }));
				(async () => {
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

						const url = API_URLS.COMPRESSOR_ANALYTICS_DATA(
							slaveId,
							parameterValues,
							formattedStart,
							formattedEnd
						);
						const res = await api.get(url);
						if (res?.success) {
							setAnalyticsDataMap((prev) => ({ ...prev, [id]: res.data }));
							setSelectedParamsMap((prev) => ({
								...prev,
								[id]: currentPayload.parameters,
							}));
						}
					} catch (error) {
						console.error(
							`Compressor analytics API error on row ${id}:`,
							error
						);
					} finally {
						setLoadingMap((prev) => ({ ...prev, [id]: false }));
					}
				})();

				return prevPayloads;
			});
		},
		[globalDateTime]
	);

	const handleReset = useCallback((id, shouldRemoveRow = false) => {
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
	}, []);

	const addNewComparisonRow = useCallback(() => {
		setRowIds((prev) => [...prev, Math.max(...prev, 0) + 1]);
	}, []);

	const slaveOptions = useMemo(
		() =>
			slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
			[],
		[slavesData]
	);

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
				onDateChange={setGlobalDateTime}
				addNewComparisonRow={addNewComparisonRow}
				mergeCompare={mergeCompare}
				onMergeChange={setMergeCompare}
				showMergeOption={rowIds.length > 1}
			/>

			<Box
				height={{
					xs: mergeCompare ? 'calc(100% - 111px)' : 'calc(100% - 115px)',
					sm:
						!mergeCompare && rowIds?.length !== 1
							? 'calc(100% - 115px)'
							: 'calc(100% - 58px)',
					lg: 'calc(100% - 59px)',
				}}
				pt={1}
				overflow="auto"
				display="flex"
				flexDirection="column"
				gap={1}
			>
				{mergeCompare ? (
					<MergedAnalyticsRow
						rows={rowIds.map((id) => ({
							id,
							rawAnalytics: analyticsDataMap[id],
							activeKeys: extractActiveKeys(selectedParamsMap[id]),
							deviceLabel:
								payloads[id]?.slave_id?.label || `Device Segment ${id}`,
						}))}
						isAnyLoading={rowIds.some((id) => loadingMap[id])}
					/>
				) : (
					rowIds.map((id, index) => (
						<AnalyticsRow
							key={id}
							id={id}
							index={index}
							rawAnalytics={analyticsDataMap[id]}
							currentSelectedParams={selectedParamsMap[id]}
							isLoading={loadingMap[id]}
							payload={payloads[id]}
							payloads={payloads}
							slaveOptions={slaveOptions}
							handleFieldChange={handleFieldChange}
							handleSearch={handleSearch}
							handleReset={handleReset}
							showCancel={id !== 1 && rowIds.length > 1}
						/>
					))
				)}
			</Box>
		</Box>
	);
};

export default CompressorAnalytics;
