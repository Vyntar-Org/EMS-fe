import { RestartAlt, Search } from '@mui/icons-material';
import {
	Box,
	Button,
	Grid,
	Tooltip,
	Typography,
	useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';

import {
	basePickerStyles,
	downAnalyticsSampleData,
} from '../../helpers/common';
import {
	getWeatherStationErrorMessage,
	weatherStationApi,
} from '../../helpers/weatherStationApi';
import { mergeChartOptions } from '../../helpers/weatherStationChartTheme';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import NoDataFound from '../common/errors/NoDataFound';
import ApexChart from '../Dashboards/weatherStationDashboardCards/ApexChart';
import DashboardCard from '../Dashboards/weatherStationDashboardCards/DashboardCard';
import PremiumLoader from '../Dashboards/weatherStationDashboardCards/PremiumLoader';
import WindDirectionChart from '../Dashboards/weatherStationDashboardCards/WindDirectionChart';

const LINE_CHART_COLORS = [
	'#60A5FA',
	'#F87171',
	'#FBBF24',
	'#4ADE80',
	'#C084FC',
	'#22D3EE',
	'#FB923C',
	'#818CF8',
];

// Downsample threshold — 10min buckets over long ranges can get huge
const MAX_LINE_POINTS = 1200;

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];
const defaultParameters = {
	label: 'All',
	value: 'all',
};

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
	handleSearch,
	handleReset,
	payload,
	setPayload,
	loading,
	parameterError,
	// handlePdfDownload,
	// handleExcelDownload,
	// isDownloadLoading,
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
						error={Boolean(parameterError)}
						helperText={parameterError || ''}
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

				{/* <Grid item xs md="auto" display="flex" gap={2} ml="auto"> */}
				{/* <Button
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
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              letterSpacing: "0.2px",
              color: "#fff",
              bgcolor: "primary.main",
              minWidth: 180,

              "&:hover": {
                bgcolor: "primary.dark",
              },

              "&.Mui-disabled": {
                bgcolor: "brand.navySoft",
                color: "#fff",
              },
            }}
          >
            {isDownloadLoading ? "Preparing Excel..." : "Download Excel"}
          </Button> */}

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
				{/* </Grid> */}
			</Grid>
		</Box>
	);
};

const WeatherStationAnalytics = () => {
	const theme = useTheme();
	const [payload, setPayload] = useState({
		dateTime: getDefaultDateRange(),
		parameters: [defaultParameters],
	});
	const [submittedFilters, setSubmittedFilters] = useState(() =>
		buildFilters({
			dateTime: getDefaultDateRange(),
			parameters: [defaultParameters],
		})
	);
	const parametersQuery = useQuery({
		queryKey: ['weather', 'analytics', 'parameters'],
		queryFn: ({ signal }) =>
			weatherStationApi.getAnalyticsParameters({ signal }),
		staleTime: 5 * 60 * 1000,
	});
	const analyticsQuery = useQuery({
		queryKey: ['weather', 'analytics', submittedFilters],
		queryFn: ({ signal }) =>
			weatherStationApi.getAnalytics(submittedFilters, { signal }),
		enabled: Boolean(
			submittedFilters.startDatetime && submittedFilters.endDatetime
		),
		placeholderData: (previousData) => previousData,
	});
	const analyticsData = analyticsQuery.data || null;
	const loading =
		analyticsQuery.isLoading ||
		analyticsQuery.isFetching ||
		parametersQuery.isLoading;

	// Hovered data point for the live readout strip (replaces the Apex popup
	// tooltip, which gets clipped/unusable when many parameters are selected).
	const hoverIdxRef = useRef(-1);
	const [hoverIndex, setHoverIndex] = useState(null);

	// Response shape: { interval, bucket_seconds, columns: [{key,label,unit}],
	// points: [{timestamp, values: {key: value}}],
	// wind_direction?: { labels: [...], counts: [...] } }
	const { lineSeries, lineCategories } = useMemo(() => {
		const columns = analyticsData?.columns || [];
		const points = analyticsData?.points || [];

		if (!columns.length || !points.length) {
			return { lineSeries: [], lineCategories: [] };
		}

		// Flatten nested values so the LTTB downsampler can index by key
		let flatPoints = points.map((p) => ({
			timestamp: p.timestamp,
			...(p.values || {}),
		}));

		if (flatPoints.length > MAX_LINE_POINTS) {
			flatPoints = downAnalyticsSampleData(
				flatPoints,
				MAX_LINE_POINTS,
				columns[0].key
			);
		}

		const categories = flatPoints.map((p) => {
			const d = dayjs(p.timestamp);
			return d.isValid() ? d.format('DD MMM HH:mm') : String(p.timestamp);
		});

		const series = columns.map((c) => ({
			name: `${c.label}${c.unit ? ` (${c.unit})` : ''}`,
			data: flatPoints.map((p) => p[c.key] ?? null),
		}));

		return { lineSeries: series, lineCategories: categories };
	}, [analyticsData]);

	const windDirectionData = analyticsData?.wind_direction;
	const hasLineChart = Boolean(lineSeries.length && lineCategories.length);
	const hasWindDirection = Boolean(windDirectionData?.counts?.length);

	const lineChartOptions = useMemo(() => {
		if (!hasLineChart) {
			return null;
		}

		const maxXTicks = 8;
		return mergeChartOptions(theme.palette.mode, {
			chart: {
				type: 'line',
				background: 'transparent',
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
				zoom: {
					enabled: false,
				},
				dropShadow: {
					enabled: true,
					top: 6,
					left: 0,
					blur: 6,
					opacity: 0.12,
				},
				events: {
					mouseLeave: () => {
						hoverIdxRef.current = -1;
						window.requestAnimationFrame(() => setHoverIndex(null));
					},
				},
			},
			colors: LINE_CHART_COLORS,
			stroke: {
				curve: 'straight',
				width: 3,
				lineCap: 'round',
			},
			markers: {
				size: 0,
				strokeWidth: 2,
				strokeColors: theme.palette.background.paper,
				hover: { size: 6 },
			},
			dataLabels: { enabled: false },
			// Legend removed — the readout strip below the chart already maps
			// every parameter to its line color.
			legend: {
				show: false,
			},
			grid: {
				borderColor: theme.palette.divider,
				strokeDashArray: 4,
				padding: {
					left: 8,
					right: 8,
				},
				xaxis: { lines: { show: false } },
				yaxis: { lines: { show: true } },
			},
			xaxis: {
				categories: lineCategories,
				tickAmount: Math.max(1, Math.min(maxXTicks, lineCategories.length - 1)),
				tickPlacement: 'on',
				crosshairs: {
					show: true,
					stroke: {
						color: theme.palette.divider,
						width: 1,
						dashArray: 4,
					},
				},
				labels: {
					rotate: -45,
					hideOverlappingLabels: true,
					style: {
						colors: theme.palette.text.secondary,
						fontSize: '11px',
					},
				},
				axisBorder: { show: false },
				axisTicks: { show: false },
			},
			yaxis: {
				labels: {
					formatter: (val) =>
						val === null || val === undefined ? '' : Number(val).toFixed(2),
					style: { colors: theme.palette.text.secondary },
				},
			},
			tooltip: {
				shared: true,
				intersect: false,
				// The popup tooltip is replaced by the readout strip under the
				// chart: this custom handler only captures which x-position is
				// hovered (deferred via rAF — Apex calls it mid-render) and renders
				// nothing. The empty tooltip element is hidden via CSS on the grid
				// item, while the hover engine keeps driving the crosshair.
				custom: ({ dataPointIndex }) => {
					if (
						typeof dataPointIndex === 'number' &&
						dataPointIndex >= 0 &&
						hoverIdxRef.current !== dataPointIndex
					) {
						hoverIdxRef.current = dataPointIndex;
						window.requestAnimationFrame(() => setHoverIndex(dataPointIndex));
					}
					return '';
				},
			},
			noData: {
				text: 'No data available',
			},
		});
	}, [hasLineChart, lineCategories, theme]);

	const handleSearch = () => {
		hoverIdxRef.current = -1;
		setHoverIndex(null);
		setSubmittedFilters(buildFilters(payload));
	};

	const handleReset = () => {
		const nextPayload = {
			dateTime: getDefaultDateRange(),
			parameters: [defaultParameters],
		};
		setPayload(nextPayload);
		setSubmittedFilters(buildFilters(nextPayload));
		hoverIdxRef.current = -1;
		setHoverIndex(null);
	};

	// const handlePdfDownload = async () => {
	//   const downloadedData = await handleSearch({}, true);
	//   exportToPDF(
	//     downloadedData?.rows,
	//     downloadedData?.columns,
	//     "weather_logs",
	//   );
	// };

	// const handleExcelDownload = async () => {
	//   const response = await handleSearch({}, true);

	//   if (!response) return;

	//   const blob = response.data;

	//   const url = URL.createObjectURL(blob);

	//   triggerFileDownload(
	//     url,
	//     `weather_logs_${dayjs().format("YYYY-MM-DD")}.xlsx`,
	//   );

	//   URL.revokeObjectURL(url);
	// };

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
				parameterOptions={[defaultParameters, ...(parametersQuery.data || [])]}
				handleSearch={handleSearch}
				handleReset={handleReset}
				payload={payload}
				setPayload={setPayload}
				loading={loading}
				parameterError={
					parametersQuery.error
						? getWeatherStationErrorMessage(
								parametersQuery.error,
								'Unable to load analytics parameters.'
						  )
						: null
				}
				// handlePdfDownload={handlePdfDownload}
				// handleExcelDownload={handleExcelDownload}
				// isDownloadLoading={isDownloadLoading}
			/>

			<Box
				height={{
					// xs: "calc(100% - 163px)",
					// sm: "calc(100% - 160px)",
					md: 'calc(100% - 49px)',
				}}
				pt={1}
				overflow={{ xs: 'auto', md: 'hidden' }}
			>
				{loading ? (
					<PremiumLoader />
				) : analyticsQuery.error ? (
					<NoDataFound
						message={getWeatherStationErrorMessage(
							analyticsQuery.error,
							'Unable to load Weather Station analytics.'
						)}
					/>
				) : !hasLineChart && !hasWindDirection ? (
					!payload?.parameters?.length ? (
						<NoDataFound
							message="No parameters selected"
							description="Select at least one parameter and hit search to see the trend."
						/>
					) : (
						<NoDataFound
							message="No analytics data"
							description="No readings in the selected date range — try widening it."
						/>
					)
				) : (
					<DashboardCard
						title={
							!hasLineChart && hasWindDirection
								? 'Wind Trend'
								: 'Parameters Trend'
						}
						sx={{
							height: '100%',
							':hover': {
								transform: 'none',
							},
						}}
					>
						<Grid container height="100%" gap={1}>
							{hasLineChart && (
								<Grid
									item
									xs={12}
									md
									sx={{
										minWidth: 0,
										height: { xs: '800px', md: 'auto' },
										display: 'flex',
										flexDirection: 'column',
										// Popup tooltip is replaced by the readout strip below —
										// hide the (empty) tooltip element, keep the crosshair.
										'& .apexcharts-tooltip': {
											display: 'none',
										},
									}}
								>
									<Box sx={{ flex: 1, minHeight: 0 }}>
										<ApexChart
											chartKey="weather-analytics"
											type="line"
											options={lineChartOptions}
											series={lineSeries}
											height="100%"
											width="100%"
										/>
									</Box>

									{/* Live readout strip — hover the chart to inspect values */}
									<Box
										sx={{
											mt: 1,
											px: 1.5,
											py: 1,
											bgcolor: 'surface.muted',
											border: '1px solid',
											borderColor: 'surface.mutedBorder',
											borderRadius: 2,
										}}
									>
										<Typography
											sx={{
												fontSize: '0.72rem',
												fontWeight: 700,
												color: 'text.secondary',
												letterSpacing: '0.03em',
												textTransform: 'uppercase',
											}}
										>
											{lineCategories[hoverIndex ?? lineCategories.length - 1]}
											{hoverIndex === null && '  ·  Latest'}
										</Typography>
										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												gap: 0.75,
												mt: 0.75,
											}}
										>
											{lineSeries.map((s, i) => {
												const value =
													s.data[hoverIndex ?? lineCategories.length - 1];
												return (
													<Box
														key={s.name}
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 0.75,
															bgcolor: 'background.paper',
															border: '1px solid',
															borderColor: 'surface.mutedBorder',
															borderRadius: '999px',
															px: 1.25,
															py: 0.4,
														}}
													>
														<Box
															sx={{
																width: 8,
																height: 8,
																borderRadius: '50%',
																flexShrink: 0,
																bgcolor:
																	LINE_CHART_COLORS[
																		i % LINE_CHART_COLORS.length
																	],
															}}
														/>
														<Typography
															sx={{
																fontSize: '0.72rem',
																color: 'text.secondary',
															}}
														>
															{s.name}
														</Typography>
														<Typography
															sx={{
																fontSize: '0.78rem',
																fontWeight: 700,
																color: 'text.primary',
															}}
														>
															{typeof value === 'number'
																? Number(value).toFixed(2)
																: value ?? '—'}
														</Typography>
													</Box>
												);
											})}
										</Box>
									</Box>
								</Grid>
							)}

							{hasWindDirection && (
								<Grid
									item
									xs={12}
									md={hasLineChart ? 4 : 6}
									sx={{
										bgcolor: 'surface.muted',
										border: '1px solid',
										borderColor: 'surface.mutedBorder',
										borderRadius: 3,
										p: 1.5,
										display: 'flex',
										flexDirection: 'column',
									}}
								>
									<Typography
										sx={{
											fontSize: '1.05rem',
											color: 'text.primary',
											fontWeight: 600,
											mb: 1,
											textAlign: 'center',
										}}
									>
										Wind Direction Trend
									</Typography>

									<Box sx={{ flex: 1, minHeight: 0 }}>
										<WindDirectionChart data={windDirectionData} isTrend />
									</Box>
								</Grid>
							)}
						</Grid>
					</DashboardCard>
				)}
			</Box>
		</Box>
	);
};

export default WeatherStationAnalytics;
