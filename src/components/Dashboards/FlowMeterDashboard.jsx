import { Input, Output } from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	getChartOptions,
	getCategoricalColors,
} from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import DashboardCard from '../common/DashboardCard';
import NoDataFound from '../common/errors/NoDataFound';
import { MiniComparisonBars } from '../common/MachineCardBits';
import SiteLocationMap from '../common/SiteLocationMap';
import FlowMeterDashboardSkeleton from '../skeletonLoaders/FlowMeterDashboardSkeleton';

// Distinct, topic-matched accents reused deterministically from the same
// colorblind-safe categorical palette used by the comparison chart below.
const PALETTE = getCategoricalColors(8);
const INLET_ACCENT = PALETTE[0];
const OUTLET_ACCENT = PALETTE[2];

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
									<DashboardCard
										icon={<Input />}
										title="Inlet Water (Waste Water)"
										accentColor={INLET_ACCENT}
										hasData={Boolean(summaryData?.inlet_water)}
										value={summaryData?.inlet_water?.value || 0}
										unit="KL"
										analytics={
											<MiniComparisonBars
												todayValue={summaryData?.inlet_water?.value || 0}
												yesterdayValue={
													summaryData?.inlet_water?.previous_value || 0
												}
												color={INLET_ACCENT}
												height={18}
												unit="KL"
											/>
										}
									/>
								</Grid>

								<Grid item xs={12} sm={6} height={{ md: '100%' }}>
									<DashboardCard
										icon={<Output />}
										title="Outlet Water (Out)"
										accentColor={OUTLET_ACCENT}
										hasData={Boolean(summaryData?.outlet_water)}
										value={summaryData?.outlet_water?.value || 0}
										unit="KL"
										analytics={
											<MiniComparisonBars
												todayValue={summaryData?.outlet_water?.value || 0}
												yesterdayValue={
													summaryData?.outlet_water?.previous_value || 0
												}
												color={OUTLET_ACCENT}
												height={18}
												unit="KL"
											/>
										}
									/>
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
									<Box height="100%" width="100%">
										<ReactApexChart
											options={getChartOptions(
												'bar',
												waterComparison?.categories,
												{
													colors: getCategoricalColors(4),
													yLabel: 'KL',
													chartTitle: 'Inlet vs Outlet Water Comparison',
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
