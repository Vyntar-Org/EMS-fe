import { Opacity, Recycling } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	buildPremiumTooltip,
	formatChartValue,
	getCategoricalColors,
	getChartCategories,
	getChartOptions,
} from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
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

// No hero "Total" value — just Today's and Yesterday's values side by side
// (Today on the left, Yesterday on the right), each under its own label,
// with a small caption (e.g. "(Waste Water)"/"(Out)") under the value.
const StatCard = ({ value, previousValue, accent, caption }) => (
	<Box
		sx={{
			height: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: { xs: 3, md: 4 },
			width: '100%',
			minWidth: 0,
			px: 1,
		}}
	>
		{[
			{ label: 'Today', value },
			{ label: 'Yesterday', value: previousValue },
		].map((item) => (
			<Box key={item.label} sx={{ textAlign: 'center' }}>
				<ResponsiveTextWrapper
					color="text.secondary"
					fontWeight={700}
					fontSize={{ xs: '10.5px', md: '12px' }}
					value={item.label}
					align="center"
					sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
				/>
				<ResponsiveTextWrapper
					fontSize={{ xs: '18px', sm: '21px', md: '23px' }}
					fontWeight={800}
					value={`${formatChartValue(item.value) || 0} KL`}
					align="center"
					color={accent}
					sx={{ lineHeight: 1.1 }}
				/>
				{caption ? (
					<ResponsiveTextWrapper
						color="text.secondary"
						fontWeight={500}
						fontSize={{ xs: '9px', md: '10px' }}
						value={`(${caption})`}
						align="center"
						sx={{ lineHeight: 1.2, mt: 0.25 }}
					/>
				) : null}
			</Box>
		))}
	</Box>
);

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
	const historyChartOptions = useMemo(() => {
		const categories = getChartCategories(historyTrends?.categories);
		const seriesNames = (historyTrends?.series || []).map((s) => s.name || '');
		const colors = getCategoricalColors(seriesNames.length || 4);
		const phIndex = seriesNames.findIndex(
			(name) => name.toLowerCase() === 'ph'
		);
		// A rotated label per category is noise on a card-sized chart — cap
		// how many actually render, evenly spaced, same as the shared
		// dashboard/card charts (`MAX_XAXIS_LABELS` in chartConfig.js).
		const maxLabels = 8;
		const labelStep = Math.max(1, Math.ceil(categories.length / maxLabels));
		const ink = {
			title: theme.palette.text.secondary,
			label: theme.palette.text.secondary,
		};

		return {
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
					rotate: -45,
					style: { colors: ink.label, fontSize: '11px' },
					formatter: (val) => {
						const idx = categories.indexOf(val);
						return idx === -1 || idx % labelStep === 0 ? val : '';
					},
				},
				axisBorder: { show: false },
				axisTicks: { show: false },
				tickAmount: Math.min(categories.length || 1, maxLabels),
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
			},
		};
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
						<Grid item xs={12} height={{ md: '50%' }}>
							<Grid container spacing={1} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<CustomCard
										sx={{ textAlign: 'center' }}
										title="Intake Total"
										titleIcon={<Opacity />}
										accentColor={INTAKE_ACCENT}
									>
										{summaryData?.intake_total ? (
											<StatCard
												caption="Waste Water"
												value={summaryData?.intake_total?.value || 0}
												previousValue={
													summaryData?.intake_total?.previous_value || 0
												}
												accent={INTAKE_ACCENT}
											/>
										) : (
											<NoDataFound message="Waiting for live device data — readings appear automatically" />
										)}
									</CustomCard>
								</Grid>

								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<CustomCard
										sx={{ textAlign: 'center' }}
										title="Treated Water"
										titleIcon={<Recycling />}
										accentColor={TREATED_ACCENT}
									>
										{summaryData?.treated_water ? (
											<StatCard
												caption="Out"
												value={summaryData?.treated_water?.value || 0}
												previousValue={
													summaryData?.treated_water?.previous_value || 0
												}
												accent={TREATED_ACCENT}
											/>
										) : (
											<NoDataFound message="Waiting for live device data — readings appear automatically" />
										)}
									</CustomCard>
								</Grid>
							</Grid>
						</Grid>

						<Grid item xs={12} mt={{ xs: 1, md: 0 }} height={{ md: '50%' }}>
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
							<Box height="100%" width="100%" overflow="hidden">
								<ReactApexChart
									options={historyChartOptions}
									series={historyTrends?.series || []}
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
							<Box height="100%" width="100%" overflow="hidden">
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
