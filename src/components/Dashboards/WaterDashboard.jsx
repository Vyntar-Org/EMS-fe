import {
	DeviceHub,
	FilterAlt,
	LocalDrink,
	Opacity,
	Plumbing,
	Recycling,
	TrendingUp,
	Waves,
} from '@mui/icons-material';
import { Box, Grid } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
// Reuses the same colorblind-safe categorical palette the charts already
// use, so each card gets its own distinct, deliberate color instead of a
// random per-title hash — chosen per metric below, not just cycled in order.
import { getCategoricalColors } from '../../helpers/chartConfig';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import CompactSecondaryMetricCard from '../common/MetricCards/CompactSecondaryMetricCard';
import StatCardForTodayYesterdayBar from '../common/MetricCards/StatCardForTodayYesterdayBar';
import StatCardLiveCount from '../common/MetricCards/StatCardLiveCount';
import WaterDashboardSkeleton from '../skeletonLoaders/WaterDashboardSkeleton';

import WATERMonthlyConsumption from './waterDashboardCards/WATERMonthlyConsumption';

const PALETTE = getCategoricalColors(8);

// Each metric gets its own icon (chosen for what it actually represents,
// not one generic water-drop reused everywhere) and its own color from the
// shared categorical palette — a card's identity is legible at a glance
// instead of every tile on the dashboard looking the same.
const CARD_META = {
	raw_water_inlet: { icon: Waves, color: PALETTE[0] },
	raw_water_outlet: { icon: Opacity, color: PALETTE[2] },
	filter_water_outlet: { icon: FilterAlt, color: PALETTE[6] },
	drinking_ro: { icon: LocalDrink, color: PALETTE[5] },
	water_positivity: { icon: TrendingUp, color: PALETTE[3] },
	sewage_inlet: { icon: Plumbing, color: PALETTE[1] },
	sewage_outlet: { icon: Recycling, color: PALETTE[4] },
	total_stations: { icon: DeviceHub, color: '#64748B' },
};

// Only the volume metrics are measured in KL. Water Positivity is a ratio
// index (not a volume), so it gets "%" instead of the wrong "KL" suffix.
// Total Stations is a live device count — no unit, and no today/yesterday
// comparison either (see `total_stations` handling in WaterKpiCard below).
const UNIT_OVERRIDES = { water_positivity: '%' };

const WaterKpiCard = ({
	metricKey,
	title,
	hasData,
	value,
	yesterdayVal,
	asOf,
	isAnalyticsCard = true,
	variant = 'hero', // 'hero' (big Today/Yesterday tile) | 'compact' (bullet-bar tile)
}) => {
	const { icon: Icon, color } = CARD_META[metricKey] || {
		icon: null,
		color: null,
	};
	const isLiveCount = metricKey === 'total_stations';
	const isCompact = variant === 'compact';
	const unit = UNIT_OVERRIDES[metricKey] || 'KL';

	return (
		<CustomCard
			// The compact variant renders its own icon+title header (a much
			// smaller footprint than CustomCard's default 50px icon chip), so
			// it deliberately skips CustomCard's title slot rather than
			// reusing it — that's the whole point of it looking different
			// from the hero KPI tiles instead of being a smaller copy of them.
			title={isCompact ? undefined : title}
			titleIcon={!isCompact && Icon && <Icon />}
			accentColor={color}
			// KPI content is sized to fit its card exactly — an inner scrollbar
			// here would only ever mean a layout bug, so it's clipped rather
			// than left scrollable.
			childrenOtherProps={{ sx: { overflow: 'hidden' } }}
		>
			{hasData ? (
				isLiveCount ? (
					<StatCardLiveCount
						value={value}
						label="Connected Stations"
						accent={color}
						asOf={asOf}
					/>
				) : isCompact ? (
					<CompactSecondaryMetricCard
						title={title}
						icon={Icon}
						value={value || 0}
						previousValue={yesterdayVal || 0}
						unit={unit}
						accent={color}
					/>
				) : (
					<StatCardForTodayYesterdayBar
						value={value || 0}
						previousValue={yesterdayVal || 0}
						accent={color}
						unit={unit}
						asOf={asOf}
						isAnalyticsCard={isAnalyticsCard}
					/>
				)
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

const WaterDashboard = () => {
	const { slavesData } = useCommonData();
	const [overviewData, setOverviewData] = useState(null);
	const [fetchedAt, setFetchedAt] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchDashboardOverviewData = async () => {
		setIsLoading(true);
		try {
			const getOverviewRes = await api.get(API_URLS.WATER_DASHBOARD_OVERVIEW);
			if (getOverviewRes?.success) {
				setOverviewData(getOverviewRes?.data);
				setFetchedAt(new Date());
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

	useEffect(() => {
		if (slavesData?.length > 0) {
			setSlavesId(slavesData[0].slave_id);
		}
	}, [slavesData]);

	// "As of" reflects when this dashboard last pulled data — real and
	// derived from the fetch itself, not a per-device reading timestamp the
	// API doesn't provide.
	const asOf = useMemo(
		() => (fetchedAt ? `as of ${dayjs(fetchedAt).format('h:mm A')}` : ''),
		[fetchedAt]
	);

	return isLoading ? (
		<WaterDashboardSkeleton />
	) : (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				// The page shell (PrivateLayout's `main`) clips overflow at the
				// viewport edge rather than scrolling the window, so this
				// dashboard has to manage its own scroll — otherwise content
				// that's taller than the viewport on small screens is simply
				// unreachable instead of scrollable.
				overflowY: 'auto',
				// rowGap: 2.5,
			}}
		>
			<Grid
				container
				spacing={1.5}
				height={{ xs: 'auto', md: 215 }}
				flexShrink={0}
			>
				<Grid item xs={12} sm={6} md={3} height={{ md: '100%' }}>
					<WaterKpiCard
						metricKey="raw_water_inlet"
						title="Raw Water Inlet"
						hasData={Boolean(overviewData?.raw_water_inlet)}
						value={overviewData?.raw_water_inlet?.current || 0}
						yesterdayVal={overviewData?.raw_water_inlet?.previous || 0}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ md: '100%' }}>
					<WaterKpiCard
						metricKey="raw_water_outlet"
						title="Raw Water Outlet"
						hasData={Boolean(overviewData?.raw_water_outlet)}
						value={overviewData?.raw_water_outlet?.current || 0}
						yesterdayVal={overviewData?.raw_water_outlet?.previous || 0}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ md: '100%' }}>
					<WaterKpiCard
						metricKey="filter_water_outlet"
						title="Filter Water Outlet"
						hasData={Boolean(overviewData?.filter_water_outlet)}
						value={overviewData?.filter_water_outlet?.current || 0}
						yesterdayVal={overviewData?.filter_water_outlet?.previous || 0}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ md: '100%' }}>
					<WaterKpiCard
						metricKey="total_stations"
						title="Total Stations"
						hasData={Boolean(overviewData?.total_stations)}
						value={overviewData?.total_stations || 0}
						asOf={asOf}
					/>
				</Grid>
			</Grid>

			<Grid container spacing={1.5} sx={{ mt: 0 }} flex={1} minHeight={0}>
				<Grid item xs={12} sm={12} md={3} height={{ md: '100%' }}>
					<Grid
						container
						rowGap={{ md: 1.5 }}
						spacing={{ xs: 1.5, md: 0 }}
						height={{ md: 'calc(100% - 36px)' }}
					>
						<Grid item xs={6} sm={3} md={12} height={{ xs: 120, md: '25%' }}>
							<WaterKpiCard
								metricKey="sewage_inlet"
								title="Sewage Inlet"
								hasData={Boolean(overviewData?.sewage_inlet)}
								value={overviewData?.sewage_inlet?.current || 0}
								yesterdayVal={overviewData?.sewage_inlet?.previous || 0}
								variant="compact"
							/>
						</Grid>
						<Grid item xs={6} sm={3} md={12} height={{ xs: 120, md: '25%' }}>
							<WaterKpiCard
								metricKey="sewage_outlet"
								title="Sewage Outlet"
								hasData={Boolean(overviewData?.sewage_outlet)}
								value={overviewData?.sewage_outlet?.current || 0}
								yesterdayVal={overviewData?.sewage_outlet?.previous || 0}
								variant="compact"
							/>
						</Grid>

						<Grid item xs={6} sm={3} md={12} height={{ xs: 120, md: '25%' }}>
							<WaterKpiCard
								metricKey="drinking_ro"
								title="Drinking RO"
								hasData={Boolean(overviewData?.drinking_ro)}
								value={overviewData?.drinking_ro?.current || 0}
								yesterdayVal={overviewData?.drinking_ro?.previous || 0}
								variant="compact"
							/>
						</Grid>
						<Grid item xs={6} sm={3} md={12} height={{ xs: 120, md: '25%' }}>
							<WaterKpiCard
								metricKey="water_positivity"
								title="Water Positivity"
								hasData={Boolean(overviewData?.water_positivity)}
								value={overviewData?.water_positivity?.current || 0}
								yesterdayVal={overviewData?.water_positivity?.previous || 0}
								variant="compact"
							/>
						</Grid>
					</Grid>
				</Grid>
				{/* <Grid item xs={12} sm={12} md={3} height={{ md: '100%' }}>
					<Grid
						container
						rowGap={{ md: 1.5 }}
						spacing={{ xs: 1.5, md: 0 }}
						height={{ md: 'calc(100% - 12px)' }}
					>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							<WaterKpiCard
								metricKey="drinking_ro"
								title="Drinking RO"
								hasData={Boolean(overviewData?.drinking_ro)}
								value={overviewData?.drinking_ro?.current || 0}
								yesterdayVal={overviewData?.drinking_ro?.previous || 0}
								asOf={asOf}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							<WaterKpiCard
								metricKey="water_positivity"
								title="Water Positivity"
								hasData={Boolean(overviewData?.water_positivity)}
								value={overviewData?.water_positivity?.current || 0}
								yesterdayVal={overviewData?.water_positivity?.previous || 0}
								asOf={asOf}
							/>
						</Grid>
					</Grid>
				</Grid> */}

				<Grid item xs={12} md={9} height={{ xs: 400, md: '100%' }}>
					<WATERMonthlyConsumption
						slavesId={slavesId}
						setSlavesId={setSlavesId}
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default WaterDashboard;
