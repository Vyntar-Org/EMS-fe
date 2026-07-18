import { Box, Divider, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { CHART_COLORS, getChartOptions } from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import SiteLocationMap from '../common/SiteLocationMap';
import FlowMeterDashboardSkeleton from '../skeletonLoaders/FlowMeterDashboardSkeleton';

const MetricBlock = ({ label, value, subLabel, showDivider }) => (
	<Grid
		item
		xs={12}
		sx={{
			display: 'flex',
			position: 'relative',
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'column',
		}}
	>
		{label && (
			<ResponsiveTextWrapper
				color="text.primary"
				fontWeight={700}
				value={label}
				align="center"
				mt={1}
			/>
		)}

		<ResponsiveTextWrapper
			fontSize="20px"
			fontWeight={800}
			mt={1}
			value={`${value?.toLocaleString() || 0} KL`}
			align="center"
			color="text.accent"
		/>

		{subLabel ? (
			<ResponsiveTextWrapper
				fontSize="12px"
				color="text.secondary"
				fontWeight={800}
				mt={1}
				value={subLabel}
				align="center"
			/>
		) : null}

		{showDivider && (
			<Divider
				orientation="vertical"
				sx={{
					borderStyle: 'dashed',
					height: '100%',
					position: 'absolute',
					right: 0,
				}}
			/>
		)}
	</Grid>
);

const FlowMeterDashboard = () => {
	const [overviewData, setOverviewData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [waterComparison, setWaterComparison] = useState(null);

	const fetchDashboardOverviewData = async () => {
		setIsLoading(true);
		try {
			const [overviewRes, waterComparisonRes] = await Promise.all([
				api.get(API_URLS.FLOWMETER_DASHBOARD_OVERVIEW),
				api.get(API_URLS.FLOWMETER_DASHBOARD_WATER_COMPARISON),
			]);
			if (overviewRes?.success) {
				setOverviewData(overviewRes?.data);
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

	return isLoading ? (
		<FlowMeterDashboardSkeleton />
	) : (
		<Box
			sx={{
				height: { md: 'calc(100vh - 64px - 8px)' },
			}}
		>
			<Grid container spacing={1} height={{ md: '100%' }}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '30%' }}>
							<Grid container spacing={1} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<CustomCard
										sx={{ textAlign: 'center' }}
										title={summaryData?.inlet_water && 'Inlet Water'}
									>
										{summaryData?.inlet_water ? (
											<Grid
												container
												sx={{ height: '100%', width: '100%' }}
												alignItems="center"
												spacing={0.5}
											>
												<Grid item xs={6} height={{ md: '100%' }}>
													<MetricBlock
														label="Total"
														value={summaryData?.inlet_water?.value || 0}
														subLabel="(Waste Water)"
														showDivider
													/>
												</Grid>

												<Grid item xs={6} height={{ md: '100%' }}>
													<MetricBlock
														label="Yesterday"
														value={
															summaryData?.inlet_water?.previous_value || 0
														}
														subLabel="(Waste Water)"
													/>
												</Grid>
											</Grid>
										) : (
											<NoDataFound message="Waiting for live device data — readings appear automatically" />
										)}
									</CustomCard>
								</Grid>

								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<CustomCard
										sx={{ textAlign: 'center' }}
										title={summaryData?.outlet_water && 'Outlet Water'}
									>
										{summaryData?.outlet_water ? (
											<Grid
												container
												sx={{ height: '100%', width: '100%' }}
												alignItems="center"
												spacing={0.5}
											>
												<Grid item xs={6} height={{ md: '100%' }}>
													<MetricBlock
														label="Total"
														value={summaryData?.outlet_water?.value || 0}
														subLabel="(Out)"
														showDivider
													/>
												</Grid>

												<Grid item xs={6} height={{ md: '100%' }}>
													<MetricBlock
														label="Yesterday"
														value={
															summaryData?.outlet_water?.previous_value || 0
														}
														subLabel="(Out)"
													/>
												</Grid>
											</Grid>
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
							height={{ xs: 350, md: '70%' }}
						>
							<CustomCard title="water comparison">
								{waterComparison ? (
									<Box height="100%" width="100%" overflow="hidden">
										<ReactApexChart
											options={getChartOptions(
												'bar',
												waterComparison?.categories,
												{
													colors: [
														CHART_COLORS.primary,
														CHART_COLORS.success,
														CHART_COLORS.warning,
														CHART_COLORS.danger,
													],
													yLabel: 'KL',
												}
											)}
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
				</Grid>

				<Grid item xs height={{ xs: 350, md: '100%' }}>
					<CustomCard title="Site Location Map">
						<SiteLocationMap
							center={[location.lat, location.lon]}
							title="Flow Meter Site"
						/>
					</CustomCard>
				</Grid>
			</Grid>
		</Box>
	);
};

export default FlowMeterDashboard;
