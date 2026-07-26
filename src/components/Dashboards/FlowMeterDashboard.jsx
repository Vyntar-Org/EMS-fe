import { Box, Divider, Grid } from '@mui/material';
import { Input, Output } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	getChartOptions,
	getCategoricalColors,
} from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import SiteLocationMap from '../common/SiteLocationMap';
import FlowMeterDashboardSkeleton from '../skeletonLoaders/FlowMeterDashboardSkeleton';

// Distinct, topic-matched accents reused deterministically from the same
// colorblind-safe categorical palette used by the comparison chart below.
const PALETTE = getCategoricalColors(8);
const INLET_ACCENT = PALETTE[0];
const OUTLET_ACCENT = PALETTE[2];

// Compact, premium stat block: tight flexbox column (no accumulating
// margins between lines, which is what made the old stacked-mt version
// overflow its available card slot and force an internal scrollbar) with
// the value as the clear visual focus, matching the KPI-tile hierarchy
// used on the Water dashboard.
const MetricBlock = ({ label, value, subLabel, showDivider, accent }) => (
	<Grid
		item
		xs={12}
		sx={{
			height: '100%',
			display: 'flex',
			position: 'relative',
			alignItems: 'center',
			justifyContent: 'center',
		}}
	>
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: { xs: 0.25, md: 0.5 },
				width: '100%',
				minWidth: 0,
			}}
		>
			{label && (
				<ResponsiveTextWrapper
					color="text.secondary"
					fontWeight={700}
					fontSize={{ xs: '10.5px', md: '12px' }}
					value={label}
					align="center"
					sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
				/>
			)}

			<ResponsiveTextWrapper
				fontSize={{ xs: '16px', sm: '19px', md: '22px' }}
				fontWeight={800}
				value={`${value?.toLocaleString() || 0} KL`}
				align="center"
				color={accent || 'text.accent'}
				sx={{ lineHeight: 1.15 }}
			/>

			{subLabel ? (
				<ResponsiveTextWrapper
					fontSize={{ xs: '9.5px', md: '11px' }}
					color="text.secondary"
					fontWeight={600}
					value={subLabel}
					align="center"
				/>
			) : null}
		</Box>

		{showDivider && (
			<Divider
				orientation="vertical"
				sx={{
					borderStyle: 'dashed',
					height: '70%',
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
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				// The page shell (PrivateLayout's `main`) clips overflow at the
				// viewport edge rather than scrolling the window, so this
				// dashboard has to manage its own scroll.
				overflowY: 'auto',
			}}
		>
			<Grid container spacing={1} flex={1} minHeight={0}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '30%' }}>
							<Grid container spacing={1} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<CustomCard
										sx={{ textAlign: 'center' }}
										title="Inlet Water"
										titleIcon={<Input />}
										accentColor={INLET_ACCENT}
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
														accent={INLET_ACCENT}
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
														accent={INLET_ACCENT}
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
										title="Outlet Water"
										titleIcon={<Output />}
										accentColor={OUTLET_ACCENT}
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
														accent={OUTLET_ACCENT}
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
														accent={OUTLET_ACCENT}
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
							<CustomCard
								title="Water Comparison"
								accentColor={getCategoricalColors(3)[2]}
							>
								{waterComparison ? (
									<Box height="100%" width="100%" overflow="hidden">
										<ReactApexChart
											options={getChartOptions(
												'bar',
												waterComparison?.categories,
												{
													colors: getCategoricalColors(4),
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
