import { Opacity, Recycling } from '@mui/icons-material';
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
			<Grid container spacing={1.5} height={{ md: '350px' }} flexShrink={0}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '50%' }}>
							<Grid container spacing={1.5} height={{ md: '100%' }}>
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

						<Grid
							item
							xs={12}
							mt={{ xs: 1, md: 0 }}
							height={{ xs: 400, sm: 200, md: '50%' }}
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
												sm
												height="100%"
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

				<Grid item xs height={{ xs: 350, md: '100%' }}>
					<CustomCard title="Site Location Map">
						<SiteLocationMap
							center={[location.lat, location.lon]}
							title="Weather Station + Solar PV Site"
						/>
					</CustomCard>
				</Grid>
			</Grid>

			<Grid sx={{ mt: 0 }} container spacing={1.5} flex={1} minHeight={0}>
				<Grid item xs={12} md={6} height={{ xs: 350, md: '100%' }}>
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
									title="STP Water Quality Trend"
									meta={historyTrends?.meta}
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
						{waterComparison?.series?.length ? (
							<Box height="100%" width="100%" overflow="hidden">
								<CustomApexChart
									series={waterComparison.series}
									type="bar"
									colors={getCategoricalColors(4)}
									xAxesType="category"
									height="100%"
									title="Intake vs Treated Water Comparison"
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
