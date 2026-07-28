import { Opacity, Recycling, Science } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	DEFAULT_MAX_POINTS,
	buildPremiumTooltip,
	formatChartValue,
	getCategoricalColors,
	getChartCategories,
	getChartOptions,
} from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import DashboardCard from '../common/DashboardCard';
import NoDataFound from '../common/errors/NoDataFound';
import { MiniComparisonBars } from '../common/MachineCardBits';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import SiteLocationMap from '../common/SiteLocationMap';
import STPDashboardSkeleton from '../skeletonLoaders/STPDashboardSkeleton';

// Distinct, topic-matched accents for each card — reused deterministically
// from the same colorblind-safe categorical palette used by the trend
// charts below, so the whole dashboard shares one consistent color system.
const PALETTE = getCategoricalColors(8);
const INTAKE_ACCENT = PALETTE[0];
const TREATED_ACCENT = PALETTE[2];
const QUALITY_ACCENT = PALETTE[6];

const STPDashboard = () => {
	const theme = useTheme();
	const [overviewData, setOverviewData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [historyTrends, setHistoryTrends] = useState(null);
	const [waterComparison, setWaterComparison] = useState(null);

	const fetchDashboardOverviewData = async () => {
		setIsLoading(true);
		try {
			const [overviewRes, historicalTrendsRes, waterComparisonRes] =
				await Promise.all([
					api.get(API_URLS.STP_DASHBOARD_OVERVIEW),
					api.get(API_URLS.STP_DASHBOARD_HISTORICAL_TRENDS),
					api.get(API_URLS.STP_DASHBOARD_WATER_COMPARISON),
				]);
			if (overviewRes?.success) {
				setOverviewData(overviewRes?.data);
			}
			if (historicalTrendsRes?.success) {
				setHistoryTrends(historicalTrendsRes?.data);
			}
			if (waterComparisonRes?.success) {
				setWaterComparison(waterComparisonRes?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDashboardOverviewData();
	}, []);

	const summaryData = overviewData?.cards?.reduce((acc, card) => {
		if (card?.title) {
			const cleanKey = card.title.toLowerCase().trim().replace(/\s+/g, '_');

			acc[cleanKey] = card;
		}
		return acc;
	}, {});

	const location = {
		lat: overviewData?.locations[0]?.latitude || 0,
		lon: overviewData?.locations[0]?.longitude || 0,
	};

	// pH (0-14) plotted on the same linear axis as TDS (hundreds-thousands)
	// renders as a flat line at the bottom — invisible next to TDS. Give pH
	// its own axis (on a fixed 0-14 scale, the real definition of the pH
	// scale, not a guessed range) while TDS/COD/BOD keep sharing one axis,
	// since `getChartOptions` only supports a single shared y-axis.
	const historyChart = useMemo(() => {
		const rawCategories = historyTrends?.categories || [];
		const rawSeries = historyTrends?.series || [];

		// This endpoint can return a very dense series (one point per few
		// minutes). Only *hiding* most x-axis labels (via the formatter below)
		// still left ApexCharts laying out one tick per raw point internally,
		// which — combined with -45° rotated "date, time" label text — pushed
		// the rendered labels below the chart's own SVG bounds and clipped
		// them. Downsampling the actual series/categories (same indices, so
		// series stay aligned to categories) fixes the layout at the root
		// instead of fighting it with padding.
		const maxPoints = DEFAULT_MAX_POINTS;
		const step = Math.max(1, Math.ceil(rawCategories.length / maxPoints));
		const pickIndices = rawCategories
			.map((_, i) => i)
			.filter((i) => i % step === 0);
		const sampledCategories = pickIndices.map((i) => rawCategories[i]);
		const sampledSeries = rawSeries.map((s) => ({
			...s,
			data: pickIndices.map((i) => s.data?.[i]),
		}));

		// Short "h:mm A" labels instead of the default "MMM D, h:mm A" — with
		// -45° rotation and long date+time strings, ApexCharts' own tick
		// placement and our label-hiding formatter fought each other and two
		// ticks ended up rendered on top of one another. Short, unrotated
		// labels sidestep that class of bug entirely rather than fighting it.
		const categories = getChartCategories(sampledCategories, {
			format: 'time',
		});
		const seriesNames = sampledSeries.map((s) => s.name || '');
		const colors = getCategoricalColors(seriesNames.length || 4);
		const phIndex = seriesNames.findIndex(
			(name) => name.toLowerCase() === 'ph'
		);
		const ink = {
			title: theme.palette.text.secondary,
			label: theme.palette.text.secondary,
		};

		const options = {
			chart: {
				type: 'line',
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
				animations: { enabled: true, speed: 400 },
				dropShadow: { enabled: true, top: 6, left: 0, blur: 8, opacity: 0.16 },
			},
			colors,
			stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
			markers: { size: 0, strokeWidth: 2, hover: { size: 6 } },
			dataLabels: { enabled: false },
			xaxis: {
				categories,
				labels: {
					rotate: 0,
					hideOverlappingLabels: true,
					trim: true,
					style: { colors: ink.label, fontSize: '11px' },
				},
				axisBorder: { show: false },
				axisTicks: { show: false },
				tickAmount: Math.min(categories.length || 1, 6),
			},
			yaxis: seriesNames.map((name, i) => {
				const isPh = i === phIndex;
				// Every series needs its own yaxis entry (array is matched to
				// series by index) — only the first non-pH axis and the pH axis
				// are actually shown, so TDS/COD/BOD visually share one scale.
				return {
					seriesName: isPh ? name : seriesNames[0],
					show: i === 0 || isPh,
					opposite: isPh,
					min: isPh ? 0 : undefined,
					max: isPh ? 14 : undefined,
					title: {
						text: isPh ? 'pH' : '',
						style: { color: ink.title, fontWeight: 'bold' },
					},
					labels: {
						style: { colors: ink.label },
						formatter: (val) => formatChartValue(val),
					},
				};
			}),
			tooltip: {
				shared: true,
				intersect: false,
				fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 },
				custom: buildPremiumTooltip({ chartTitle: 'STP Water Quality Trend' }),
			},
			legend: {
				show: true,
				position: 'top',
				horizontalAlign: 'center',
				fontWeight: 600,
				markers: { shape: 'circle', size: 6, offsetX: -2 },
				itemMargin: { horizontal: 10 },
			},
			grid: {
				borderColor: 'rgba(128, 145, 170, 0.18)',
				yaxis: { lines: { show: true } },
				xaxis: { lines: { show: false } },
				// Reserves room below the plot for the rotated x-axis labels —
				// without it, longer date+time category labels at -45° can
				// render partially outside the chart's own bounding box.
				padding: { bottom: 8, left: 8, right: 8 },
			},
		};

		return { options, series: sampledSeries };
	}, [historyTrends, theme]);

	return isLoading ? (
		<STPDashboardSkeleton />
	) : (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				// The page shell (PrivateLayout's `main`) clips overflow at the
				// viewport edge rather than scrolling the window, so this
				// dashboard has to manage its own scroll.
				overflowY: 'auto',
			}}
		>
			<Grid container spacing={1} height={{ md: '350px' }} flexShrink={0}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '55%' }}>
							<Grid container spacing={1} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<DashboardCard
										icon={<Opacity />}
										title="Intake Total (Waste Water)"
										accentColor={INTAKE_ACCENT}
										hasData={Boolean(summaryData?.intake_total)}
										value={formatChartValue(
											summaryData?.intake_total?.value || 0
										)}
										unit="KL"
										secondaryMetrics={[
											{
												label: 'Yesterday',
												value: formatChartValue(
													summaryData?.intake_total?.previous_value || 0
												),
												unit: 'KL',
											},
										]}
										analytics={
											<MiniComparisonBars
												todayValue={summaryData?.intake_total?.value || 0}
												yesterdayValue={
													summaryData?.intake_total?.previous_value || 0
												}
												color={INTAKE_ACCENT}
												height={14}
												unit="KL"
											/>
										}
									/>
								</Grid>

								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<DashboardCard
										icon={<Recycling />}
										title="Treated Water (Out)"
										accentColor={TREATED_ACCENT}
										hasData={Boolean(summaryData?.treated_water)}
										value={formatChartValue(
											summaryData?.treated_water?.value || 0
										)}
										unit="KL"
										secondaryMetrics={[
											{
												label: 'Yesterday',
												value: formatChartValue(
													summaryData?.treated_water?.previous_value || 0
												),
												unit: 'KL',
											},
										]}
										analytics={
											<MiniComparisonBars
												todayValue={summaryData?.treated_water?.value || 0}
												yesterdayValue={
													summaryData?.treated_water?.previous_value || 0
												}
												color={TREATED_ACCENT}
												height={14}
												unit="KL"
											/>
										}
									/>
								</Grid>
							</Grid>
						</Grid>

						<Grid item xs={12} mt={{ xs: 1, md: 0 }} height={{ md: '45%' }}>
							<CustomCard
								title="Water Quality"
								// titleIcon={<Science />}
								accentColor={QUALITY_ACCENT}
							>
								<Grid container sx={{ height: '100%', width: '100%' }}>
									{[
										{ label: 'pH', key: 'ph', unit: 'mg/L' },
										{ label: 'TDS', key: 'tds', unit: 'ppm' },
										{ label: 'COD', key: 'cod', unit: 'mg/L' },
										{ label: 'BOD', key: 'bod', unit: 'mg/L' },
										{ label: 'TSS', key: 'tss', unit: 'mg/L' },
									].map((item, ind) => {
										return (
											<Grid
												item
												xs={2.4}
												height="100%"
												key={`fuel-radial-${ind + 1}`}
												sx={{
													display: 'flex',
													flexDirection: 'column',
													minHeight: 0,
												}}
											>
												<Box flex={1} minHeight={0}>
													<ReactApexChart
														options={getChartOptions('radialBar', [], {
															labels: [item.label],
															colors: [getCategoricalColors(5)[ind]],
														})}
														series={[summaryData?.[item.key]?.value || 0]}
														type="radialBar"
														height="100%"
														width="100%"
													/>
												</Box>
												<ResponsiveTextWrapper
													fontSize={{ xs: '10px', md: '12px' }}
													color="text.secondary"
													fontWeight={800}
													flexShrink={0}
													value={item.unit}
													align="center"
												/>
											</Grid>
										);
									})}
								</Grid>
							</CustomCard>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs height={{ xs: 350, md: '100%' }}>
					<CustomCard title="Site Location Map">
						<SiteLocationMap
							center={[location.lat, location.lon]}
							title="Weather Station + Solar PV Site"
						/>
					</CustomCard>
				</Grid>
			</Grid>

			<Grid sx={{ mt: 0 }} container spacing={1} flex={1} minHeight={0}>
				<Grid item xs={12} md={6} height={{ xs: 350, md: '100%' }}>
					<CustomCard
						title="Historical Trends"
						accentColor={getCategoricalColors(1)[0]}
					>
						{historyTrends ? (
							<Box height="100%" width="100%">
								<ReactApexChart
									options={historyChart.options}
									series={historyChart.series}
									type="line"
									height="100%"
									width="100%"
								/>
							</Box>
						) : (
							<NoDataFound message="Waiting for live device data — readings appear automatically" />
						)}
					</CustomCard>
				</Grid>
				<Grid item xs={12} md={6} height={{ xs: 350, md: '100%' }}>
					<CustomCard
						title="Water Comparison"
						accentColor={getCategoricalColors(3)[2]}
					>
						{waterComparison ? (
							<Box height="100%" width="100%">
								<ReactApexChart
									options={getChartOptions('bar', waterComparison?.categories, {
										colors: getCategoricalColors(4),
										yLabel: 'KL',
										chartTitle: 'Intake vs Treated Water Comparison',
									})}
									series={waterComparison?.series || []}
									type="bar"
									height="100%"
									width="100%"
								/>
							</Box>
						) : (
							<NoDataFound message="Waiting for live device data — readings appear automatically" />
						)}
					</CustomCard>
				</Grid>
			</Grid>
		</Box>
	);
};

export default STPDashboard;
