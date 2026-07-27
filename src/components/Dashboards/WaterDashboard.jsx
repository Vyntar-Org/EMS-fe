import {
	ArrowDownward,
	ArrowUpward,
	DeviceHub,
	FilterAlt,
	LocalDrink,
	Opacity,
	Plumbing,
	Recycling,
	TrendingFlat,
	TrendingUp,
	Waves,
} from '@mui/icons-material';
import { Box, Grid, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import { MiniComparisonBars } from '../common/MachineCardBits';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
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

// Real, derived-from-data trend — not a judgment call on whether the
// direction is "good" or "bad" for this particular metric (that needs
// domain thresholds this app doesn't have yet), so it's shown as a neutral
// fact: direction + magnitude, not colored green/red.
const getTrend = (current, previous) => {
	const cur = Number(current);
	const prev = Number(previous);
	if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) {
		return null;
	}
	const pct = ((cur - prev) / Math.abs(prev)) * 100;
	if (Math.abs(pct) < 1) {
		return { Icon: TrendingFlat, label: 'Stable' };
	}
	return pct > 0
		? { Icon: ArrowUpward, label: `+${pct.toFixed(1)}%` }
		: { Icon: ArrowDownward, label: `${pct.toFixed(1)}%` };
};

// One KPI tile: icon + label identify the metric, the value is the visual
// focus (large, bold, in the card's own color), with a real trend chip and
// a 2-point sparkline (today vs. yesterday — the only history this
// endpoint actually returns) rather than a fabricated multi-point graph.
// Row 1's 5 cards each get a guaranteed 200px on desktop; row 2's 3 cards
// (sewage/stations) only get ~1/3 of whatever's left after row 1, which can
// be considerably tighter — so they use the `compact` size tier (a lower
// ceiling on desktop) instead of scaling all the way up like row 1.
const SIZE = {
	comfortable: {
		icon: { xs: 30, sm: 36, md: 44 },
		iconRadius: { xs: '9px', md: '13px' },
		iconGlyph: { xs: 16, sm: 19, md: 24 },
		label: { xs: '10.5px', md: '12.5px' },
		value: { xs: '20px', sm: '24px', md: '30px', lg: '34px' },
		trend: { xs: '10.5px', md: '12.5px' },
		trendGlyph: { xs: 12, md: 15 },
		compare: { xs: '9.5px', md: '11.5px' },
		asOf: { xs: '9px', md: '10.5px' },
		barsHeight: 22,
	},
	compact: {
		icon: { xs: 26, sm: 30, md: 34 },
		iconRadius: '9px',
		iconGlyph: { xs: 14, md: 17 },
		label: { xs: '10px', md: '11px' },
		value: { xs: '18px', sm: '20px', md: '23px', lg: '25px' },
		trend: { xs: '10px', md: '11px' },
		trendGlyph: { xs: 11, md: 13 },
		compare: { xs: '9px', md: '10px' },
		asOf: { xs: '8.5px', md: '9.5px' },
		barsHeight: 16,
	},
};

// Only the volume metrics are measured in KLD — Water Positivity is an
// index/ratio and Total Stations is a device count, neither of which is a
// KLD quantity, so they render without a unit suffix.
const NO_UNIT_METRICS = new Set(['water_positivity', 'total_stations']);

const WaterKpiCard = ({
	metricKey,
	title,
	hasData,
	value,
	yesterdayVal,
	hasYesterday,
	asOf,
	compact = false,
}) => {
	const { icon: Icon, color } = CARD_META[metricKey];
	const trend = hasData ? getTrend(value, yesterdayVal) : null;
	const s = SIZE[compact ? 'compact' : 'comfortable'];
	const unit = NO_UNIT_METRICS.has(metricKey) ? '' : 'KLD';

	return (
		<CustomCard
			title={!hasData && title}
			titleIcon={!hasData && <Icon />}
			accentColor={color}
		>
			{hasData ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-evenly',
						gap: { xs: 0.5, md: 1 },
						px: { xs: 0.75, md: 1 },
						py: { xs: 0.25, md: 0.5 },
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						gap={{ xs: 0.75, md: 1.25 }}
						minWidth={0}
					>
						<Box
							sx={{
								width: s.icon,
								height: s.icon,
								borderRadius: s.iconRadius,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
								background: (t) =>
									`linear-gradient(135deg, ${alpha(
										color,
										t.palette.mode === 'dark' ? 0.36 : 0.18
									)} 0%, ${alpha(
										color,
										t.palette.mode === 'dark' ? 0.16 : 0.07
									)} 100%)`,
								color,
								boxShadow: `0 0 0 1px ${alpha(color, 0.26)}`,
								'& svg': { fontSize: s.iconGlyph },
							}}
						>
							<Icon />
						</Box>
						<Box minWidth={0} flex={1}>
							<ResponsiveTextWrapper
								color="text.secondary"
								fontWeight={700}
								fontSize={s.label}
								value={title}
								sx={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}
							/>
						</Box>
						{asOf && (
							<Box minWidth={0} flexShrink={0}>
								<ResponsiveTextWrapper
									fontSize={s.asOf}
									color="text.secondary"
									fontWeight={500}
									value={asOf}
									sx={{ textAlign: 'right' }}
								/>
							</Box>
						)}
					</Stack>

					<Stack direction="row" alignItems="flex-end" gap={1} minWidth={0}>
						<Box minWidth={0} flex={1}>
							<ResponsiveTextWrapper
								fontSize={s.value}
								fontWeight={800}
								value={`${value?.toLocaleString() || 0}${
									unit ? ` ${unit}` : ''
								}`}
								color={color}
								sx={{ lineHeight: 1.1 }}
							/>
						</Box>
						{trend && (
							<Stack
								direction="row"
								alignItems="center"
								gap={0.35}
								flexShrink={0}
								sx={{ pb: '4px' }}
							>
								<trend.Icon
									sx={{ fontSize: s.trendGlyph, color: 'text.secondary' }}
								/>
								<ResponsiveTextWrapper
									fontSize={s.trend}
									fontWeight={700}
									color="text.secondary"
									value={trend.label}
								/>
							</Stack>
						)}
					</Stack>

					{hasYesterday ? (
						<Box minWidth={0}>
							<MiniComparisonBars
								todayValue={value}
								yesterdayValue={yesterdayVal}
								color={color}
								height={s.barsHeight}
								unit={unit}
							/>
						</Box>
					) : null}
				</Box>
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
			}}
		>
			<Grid
				container
				spacing={1}
				height={{ xs: 'auto', sm: '350px', md: '200px' }}
				flexShrink={0}
			>
				<Grid item xs={12} sm={4} md={2.4}>
					<WaterKpiCard
						metricKey="raw_water_inlet"
						title="Raw Water Inlet"
						hasData={Boolean(overviewData?.raw_water_inlet)}
						value={overviewData?.raw_water_inlet?.current || 0}
						yesterdayVal={overviewData?.raw_water_inlet?.previous || 0}
						hasYesterday={overviewData?.raw_water_inlet?.previous !== undefined}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={4} md={2.4}>
					<WaterKpiCard
						metricKey="raw_water_outlet"
						title="Raw Water Outlet"
						hasData={Boolean(overviewData?.raw_water_outlet)}
						value={overviewData?.raw_water_outlet?.current || 0}
						yesterdayVal={overviewData?.raw_water_outlet?.previous || 0}
						hasYesterday={
							overviewData?.raw_water_outlet?.previous !== undefined
						}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={4} md={2.4}>
					<WaterKpiCard
						metricKey="filter_water_outlet"
						title="Filter Water Outlet"
						hasData={Boolean(overviewData?.filter_water_outlet)}
						value={overviewData?.filter_water_outlet?.current || 0}
						yesterdayVal={overviewData?.filter_water_outlet?.previous || 0}
						hasYesterday={
							overviewData?.filter_water_outlet?.previous !== undefined
						}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={2.4}>
					<WaterKpiCard
						metricKey="drinking_ro"
						title="Drinking RO"
						hasData={Boolean(overviewData?.drinking_ro)}
						value={overviewData?.drinking_ro?.current || 0}
						yesterdayVal={overviewData?.drinking_ro?.previous || 0}
						hasYesterday={overviewData?.drinking_ro?.previous !== undefined}
						asOf={asOf}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={2.4}>
					<WaterKpiCard
						metricKey="water_positivity"
						title="Water Positivity"
						hasData={Boolean(overviewData?.water_positivity)}
						value={overviewData?.water_positivity?.current || 0}
						yesterdayVal={overviewData?.water_positivity?.previous || 0}
						hasYesterday={
							overviewData?.water_positivity?.previous !== undefined
						}
						asOf={asOf}
					/>
				</Grid>
			</Grid>

			<Grid container spacing={1} sx={{ mt: 0 }} flex={1} minHeight={0}>
				<Grid item xs={12} sm={12} md={2.4} height={{ md: '100%' }}>
					<Grid
						container
						rowGap={1}
						spacing={{ sm: 1, md: 0 }}
						height={{ md: '100%' }}
					>
						<Grid item xs={12} sm={4} md={12} height={{ xs: 165, md: '33%' }}>
							<WaterKpiCard
								metricKey="sewage_inlet"
								title="Sewage Inlet"
								hasData={Boolean(overviewData?.sewage_inlet)}
								value={overviewData?.sewage_inlet?.current || 0}
								yesterdayVal={overviewData?.sewage_inlet?.previous || 0}
								hasYesterday={
									overviewData?.sewage_inlet?.previous !== undefined
								}
								asOf={asOf}
								// compact
							/>
						</Grid>
						<Grid item xs={12} sm={4} md={12} height={{ xs: 165, md: '33%' }}>
							<WaterKpiCard
								metricKey="sewage_outlet"
								title="Sewage Outlet"
								hasData={Boolean(overviewData?.sewage_outlet)}
								value={overviewData?.sewage_outlet?.current || 0}
								yesterdayVal={overviewData?.sewage_outlet?.previous || 0}
								hasYesterday={
									overviewData?.sewage_outlet?.previous !== undefined
								}
								asOf={asOf}
								// compact
							/>
						</Grid>
						<Grid
							item
							xs={12}
							sm={4}
							md={12}
							height={{ xs: 165, md: 'calc(33% - 16px)' }}
						>
							<WaterKpiCard
								metricKey="total_stations"
								title="Total Stations"
								hasData={Boolean(overviewData?.total_stations)}
								value={overviewData?.total_stations || 0}
								asOf={asOf}
								// compact
							/>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12} md={9.6} height={{ xs: 400, md: '100%' }}>
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
