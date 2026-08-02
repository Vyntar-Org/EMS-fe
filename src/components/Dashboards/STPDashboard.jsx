import { LocationOn, Opacity, Recycling } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { useEffect, useState } from 'react';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	formatChartValue,
	getCategoricalColors,
} from '../../helpers/chartConfig';
import CustomApexChart from '../common/CustomApexChart';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import StatCardForTodayYesterday from '../common/MetricCards/StatCardForTodayYesterday';
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
				setHistoryTrends({
					...historicalTrendsRes?.data,
					meta: historicalTrendsRes?.meta,
				});
			}
			if (waterComparisonRes?.success) {
				setWaterComparison({
					...waterComparisonRes?.data,
					meta: waterComparisonRes?.meta,
				});
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
			<Grid container spacing={1.5} height={{ md: '400px' }} flexShrink={0}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '55%' }}>
							<Grid container spacing={1.5} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ xs: 210, md: '100%' }}>
									<CustomCard
										title="Intake Total"
										titleIcon={<Opacity />}
										// icon={<Insights />}
										accentColor={INTAKE_ACCENT}
									>
										{summaryData?.intake_total ? (
											<StatCardForTodayYesterday
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

								<Grid item xs={12} sm={6} height={{ xs: 210, md: '100%' }}>
									<CustomCard
										title="Treated Water"
										titleIcon={<Recycling />}
										// icon={<Insights />}
										accentColor={TREATED_ACCENT}
									>
										{summaryData?.treated_water ? (
											<StatCardForTodayYesterday
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

						<Grid
							item
							xs={12}
							mt={{ xs: 1.5, md: 0 }}
							height={{ xs: 400, sm: 170, md: '45%' }}
						>
							<CustomCard
								title="Water Quality"
								// titleIcon={<Science />}
								accentColor={QUALITY_ACCENT}
							>
								<Grid container sx={{ width: '100%' }}>
									{[
										{ label: 'pH', key: 'ph', unit: 'mg/L' },
										{ label: 'TDS', key: 'tds', unit: 'ppm' },
										{ label: 'COD', key: 'cod', unit: 'mg/L' },
										{ label: 'BOD', key: 'bod', unit: 'mg/L' },
										{ label: 'TSS', key: 'tss', unit: 'mg/L' },
									].map((item, ind) => {
										const gaugeColor = getCategoricalColors(5)[ind];
										return (
											<Grid
												item
												xs={6}
												sm={2.4}
												// height="100%"
												key={`fuel-radial-${ind + 1}`}
												sx={{
													display: 'flex',
													flexDirection: 'column',
													minHeight: 0,
												}}
											>
												<Box flex={1} maxHeight={110}>
													<CustomApexChart
														series={[summaryData?.[item.key]?.value || 0]}
														type="radialBar"
														colors={[gaugeColor]}
														height="100%"
														showToolbar={false}
														customOptions={{
															chart: {
																type: 'radialBar',
																sparkline: { enabled: true },
															},
															plotOptions: {
																radialBar: {
																	startAngle: -90,
																	endAngle: 90,
																	hollow: {
																		size: '60%',
																		background: 'transparent',
																	},
																	track: {
																		background: 'rgba(128, 145, 170, 0.2)',
																		strokeWidth: '97%',
																		margin: 4,
																	},
																	dataLabels: {
																		name: {
																			show: true,
																			fontSize: '11px',
																			offsetY: -8,
																		},
																		value: {
																			show: true,
																			fontSize: '14px',
																			fontWeight: 700,
																			// offsetY: -1,
																			formatter: (val) =>
																				formatChartValue(val) + ' ' + item.unit,
																		},
																	},
																},
															},
															// Standard ApexCharts semi-gauge trick: a full circle's worth
															// of vertical space is allocated even though only the top
															// half is drawn — negative top padding pulls the chart up
															// so the visible arc fills the box instead of leaving a
															// blank gap below it.
															grid: { padding: { top: -10, bottom: -10 } },
															labels: [item.label],
															legend: { show: false },
															stroke: { lineCap: 'round' },
															tooltip: { enabled: false },
														}}
													/>
												</Box>
												{/* <ResponsiveTextWrapper
													fontSize={{ xs: '10px', md: '12px' }}
													color="text.secondary"
													fontWeight={800}
													flexShrink={0}
													value={item.unit}
													align="center"
												/> */}
											</Grid>
										);
									})}
								</Grid>
							</CustomCard>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs height={{ xs: 400, md: '100%' }}>
					<CustomCard title="Site Location Map" titleIcon={<LocationOn />}>
						<SiteLocationMap
							center={[location.lat, location.lon]}
							title="Weather Station + Solar PV Site"
						/>
					</CustomCard>
				</Grid>
			</Grid>

			<Grid sx={{ mt: 0 }} container spacing={1.5} flex={1} minHeight={0}>
				<Grid item xs={12} md={6} height={{ xs: 400, md: '100%' }}>
					<CustomCard
						title="Historical Trends"
						accentColor={getCategoricalColors(1)[0]}
					>
						{historyTrends?.series?.length ? (
							<Box height="100%" width="100%" overflow="hidden">
								<CustomApexChart
									series={historyTrends.series}
									type="line"
									colors={getCategoricalColors(
										(historyTrends?.series || []).length || 4
									)}
									xAxesType="category"
									height="100%"
									meta={historyTrends?.meta}
								/>
							</Box>
						) : (
							<NoDataFound message="Waiting for live device data — readings appear automatically" />
						)}
					</CustomCard>
				</Grid>
				<Grid item xs={12} md={6} height={{ xs: 400, md: '100%' }}>
					<CustomCard
						title="Water Comparison"
						accentColor={getCategoricalColors(3)[2]}
					>
						{waterComparison?.series?.length ? (
							<Box height="100%" width="100%" overflow="hidden">
								<CustomApexChart
									series={waterComparison.series}
									type="bar"
									colors={getCategoricalColors(4)}
									xAxesType="category"
									height="100%"
									meta={waterComparison?.meta}
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
