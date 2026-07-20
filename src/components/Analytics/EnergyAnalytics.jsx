import { RestartAlt, Search } from '@mui/icons-material';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { alpha, darken, lighten } from '@mui/material/styles';
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
import {
	basePickerStyles,
	downAnalyticsSampleData,
} from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

const CHIP_COLORS = [
	'#3b82f6',
	'#ef4444',
	'#f59e0b',
	'#10b981',
	'#8b5cf6',
	'#06b6d4',
	'#ec4899',
	'#14b8a6',
	'#f97316',
	'#6366f1',
	'#84cc16',
	'#0ea5e9',
];

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

const getProcessedChartData = (rawAnalytics, activeKeys) => {
	if (!rawAnalytics?.data || rawAnalytics.data.length === 0) {
		return { series: [], categories: [] };
	}

	const rawData = rawAnalytics.data;
	const maxPoints = 300;

	const series = activeKeys.map((key) => {
		const sampledDataPoints = downAnalyticsSampleData(rawData, maxPoints, key);
		return {
			name: KEY_PARAMETER_OPTIONS_MAPPING[key] || key,
			data: sampledDataPoints.map((row) => row[key] ?? null),
		};
	});

	const baseSampledData = downAnalyticsSampleData(
		rawData,
		maxPoints,
		activeKeys[0] || 'timestamp'
	);

	const allDates = baseSampledData.map((item) =>
		item.timestamp ? dayjs(item.timestamp).format('DD MMM HH:mm') : ''
	);

	const maxLabels = 10;
	const labelStep = Math.max(1, Math.ceil(allDates.length / maxLabels));
	const categories = allDates.map((date, idx) =>
		idx % labelStep === 0 ? date : ''
	);

	return { series, categories };
};

const GlobalFiltersRow = memo(
	({ dateTime, onDateChange, addNewComparisonRow }) => (
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
	)
);

const DeviceFilterRow = memo(
	({
		comparisonId,
		slaveOptions,
		payload,
		handleFieldChange,
		handleSearch,
		handleReset,
		showCancel,
		parameterOptions,
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
						value={payload?.parameters || ''}
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

const AnalyticsRow = memo(
	({
		id,
		index,
		rawAnalytics,
		currentSelectedParams,
		isLoading,
		payload,
		filteredSlaveOptions,
		parametersData,
		handleFieldChange,
		handleSearch,
		handleReset,
		rowIds,
	}) => {
		const theme = useTheme();
		const isDark = theme.palette.mode === 'dark';
		const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

		const activeKeys =
			currentSelectedParams?.flatMap((param) =>
				param.value ? param.value.split(',') : []
			) || [];

		const processedData = useMemo(
			() => getProcessedChartData(rawAnalytics, activeKeys),
			[rawAnalytics, activeKeys]
		);

		const hoveredData = useMemo(() => {
			if (!rawAnalytics?.data?.length) return null;
			const pointIndex =
				hoveredPointIndex !== null
					? hoveredPointIndex
					: rawAnalytics.data.length - 1;
			const dataPoint = rawAnalytics.data[pointIndex];
			if (!dataPoint) return null;
			return {
				timestamp: dataPoint.timestamp,
				values: activeKeys.map((key) => ({
					key,
					name: KEY_PARAMETER_OPTIONS_MAPPING[key] || key,
					value: dataPoint[key],
				})),
			};
		}, [hoveredPointIndex, rawAnalytics, activeKeys]);

		const uniqueBgColor = UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];

		const performanceChartOptions = useMemo(
			() => ({
				chart: {
					type: 'line',
					zoom: { enabled: false },
					animations: {
						enabled: false,
					},
					toolbar: {
						show: false,
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
					events: {
						mouseMove: (_event, _chartContext, config) => {
							if (config?.dataPointIndex >= 0) {
								setHoveredPointIndex(config.dataPointIndex);
							}
						},
						mouseLeave: () => {
							setHoveredPointIndex(null);
						},
						click: (_event, _chartContext, config) => {
							if (config?.dataPointIndex >= 0) {
								setHoveredPointIndex(config.dataPointIndex);
							}
						},
					},
				},
				dataLabels: { enabled: false },
				markers: {
					size: 0,
					hover: { size: 5, sizeOffset: 3 },
				},
				stroke: { curve: 'smooth', width: 2 },
				xaxis: {
					categories: processedData.categories,
					labels: {
						show: true,
						rotate: 0,
						rotateAlways: false,
						style: {
							fontSize: '12px',
							fontWeight: 600,
							colors: '#a3aed0',
							cssClass: 'apexcharts-xaxis-label',
						},
						maxHeight: 80,
						hideOverlappingLabels: true,
						offsetX: 0,
						offsetY: 5,
					},
					type: 'category',
					axisBorder: { show: false },
					axisTicks: { show: false },
					crosshairs: {
						show: true,
						width: 1,
						opacity: 0.9,
						stroke: { color: '#a3aed0', width: 1, dashArray: 4 },
					},
					tooltip: { enabled: false },
				},
				yaxis: {
					labels: {
						formatter: (val) => (val !== null ? val.toFixed(2) : ''),
						style: { fontSize: '11px' },
					},
					title: { text: 'Value' },
				},
				tooltip: {
					enabled: true,
					shared: true,
					intersect: false,
					custom: () => '',
				},
				legend: { show: false },
				grid: {
					borderColor: '#e0e0e0',
					strokeDasharray: 0,
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
				},
				states: {
					normal: { filter: { type: 'none' } },
					hover: { filter: { type: 'none' } },
					active: { filter: { type: 'none' } },
				},
			}),
			[processedData.categories]
		);

		const deviceLabel = payload?.slave_id?.label || `Device Segment ${id}`;

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
					{deviceLabel} Analysis{' '}
					{rawAnalytics?.data?.length > 1200 &&
						`(Downsampled from ${rawAnalytics.data.length} points)`}
				</Typography>

				<DeviceFilterRow
					comparisonId={id}
					slaveOptions={filteredSlaveOptions}
					payload={payload}
					handleFieldChange={handleFieldChange}
					handleSearch={handleSearch}
					handleReset={handleReset}
					showCancel={rowIds.length > 1}
					parameterOptions={parametersData}
				/>

				<Box sx={{ height: { xs: 520, sm: 420 } }}>
					{isLoading ? (
						<Loading />
					) : !processedData.series.length ? (
						<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
					) : (
						<ReactApexChart
							options={performanceChartOptions}
							series={processedData.series}
							type="line"
							height="100%"
							width="100%"
						/>
					)}
				</Box>

				{hoveredData && (
					<Box
						sx={{
							mt: 2,
							p: 1.5,
							bgcolor: 'transparent',
						}}
					>
						<Typography
							variant="body2"
							sx={{
								mb: 1.5,
								fontWeight: 600,
								color: 'text.secondary',
								fontSize: '12px',
								letterSpacing: '0.5px',
							}}
						>
							{dayjs(hoveredData.timestamp).format('DD MMM HH:mm')}
							{hoveredPointIndex === null && ' · LATEST'}
						</Typography>

						<Box
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: 1.5,
							}}
						>
							{hoveredData.values.map((item, idx) => {
								const base = CHIP_COLORS[idx % CHIP_COLORS.length];
								const chipBg = alpha(base, isDark ? 0.22 : 0.12);
								const chipBorder = alpha(base, isDark ? 0.4 : 0.25);
								const chipText = isDark
									? lighten(base, 0.35)
									: darken(base, 0.25);

								return (
									<Box
										key={item.key}
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 1,
											p: '6px 12px',
											bgcolor: chipBg,
											border: '1px solid',
											borderColor: chipBorder,
											borderRadius: '20px',
											whiteSpace: 'nowrap',
											transition: 'all 0.2s ease',
											'&:hover': {
												bgcolor: alpha(base, isDark ? 0.3 : 0.18),
											},
										}}
									>
										<Box
											sx={{
												width: 6,
												height: 6,
												borderRadius: '50%',
												backgroundColor: base,
												flexShrink: 0,
												boxShadow: `0 0 8px ${alpha(base, 0.5)}`,
											}}
										/>
										<Typography
											variant="caption"
											sx={{
												color: 'text.secondary',
												fontSize: '11px',
												fontWeight: 500,
											}}
										>
											{item.name}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												color: chipText,
												fontSize: '11px',
												fontWeight: 700,
												ml: 0.5,
											}}
										>
											{item.value !== null && item.value !== undefined
												? typeof item.value === 'number'
													? item.value.toFixed(2)
													: item.value
												: '—'}
										</Typography>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</Box>
		);
	}
);

const EnergyAnalytics = () => {
	const { slavesData, parametersData } = useCommonData();
	const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
	const [payloads, setPayloads] = useState({ 1: null });
	const [analyticsDataMap, setAnalyticsDataMap] = useState({});
	const [selectedParamsMap, setSelectedParamsMap] = useState({});
	const [loadingMap, setLoadingMap] = useState({});
	const [rowIds, setRowIds] = useState([1]);

	const handleFieldChange = useCallback((id, key, value) => {
		setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
	}, []);

	const handleSearch = useCallback(
		async (id) => {
			setPayloads((prevPayloads) => {
				const currentPayload = prevPayloads[id];
				if (!currentPayload?.slave_id || !currentPayload?.parameters?.length)
					return prevPayloads;

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

						const newApiUrl = API_URLS.EMS_ANALYTICS_DATA(
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
		setRowIds((prev) => {
			const nextId = Math.max(...prev, 0) + 1;
			return [...prev, nextId];
		});
	}, []);

	const slaveOptions = useMemo(
		() =>
			slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
			[],
		[slavesData]
	);

	const usedDeviceIds = useMemo(
		() =>
			Object.values(payloads)
				.map((p) => p?.slave_id?.value)
				.filter(Boolean),
		[payloads]
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
					const filteredSlaveOptions = slaveOptions.filter(
						(option) =>
							!usedDeviceIds.includes(option.value) ||
							payloads[id]?.slave_id?.value === option.value
					);

					return (
						<AnalyticsRow
							key={id}
							id={id}
							index={index}
							rawAnalytics={analyticsDataMap[id]}
							currentSelectedParams={selectedParamsMap[id]}
							isLoading={loadingMap[id]}
							payload={payloads[id]}
							filteredSlaveOptions={filteredSlaveOptions}
							parametersData={parametersData}
							handleFieldChange={handleFieldChange}
							handleSearch={handleSearch}
							handleReset={handleReset}
							rowIds={rowIds}
						/>
					);
				})}
			</Box>
		</Box>
	);
};

export default EnergyAnalytics;
