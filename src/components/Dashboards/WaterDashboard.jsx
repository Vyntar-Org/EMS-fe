import {
	DeviceHub,
	FilterAlt,
	LocalDrink,
	Opacity,
	Plumbing,
	Recycling,
	Refresh,
	Speed,
	TrendingUp,
	TuneOutlined,
	ViewQuiltOutlined,
	WaterDrop,
	Waves,
} from '@mui/icons-material';
import { Box, Button, Grid, Stack } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
// Reuses the same colorblind-safe categorical palette the charts already
// use, so each card gets its own distinct, deliberate color instead of a
// random per-title hash — chosen per metric below, not just cycled in order.
import { getCategoricalColors } from '../../helpers/chartConfig';
import { getPagePath } from '../../helpers/pageMapping.jsx';
import { isAdminUser } from '../../helpers/userRole';
import {
	KPI_CARD_TYPE,
	KPI_TOP_ROW_SLOTS,
	getOverviewCards,
} from '../../helpers/waterKpiCards';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import CompactSecondaryMetricCard from '../common/MetricCards/CompactSecondaryMetricCard';
import StatCardForTodayYesterdayBar from '../common/MetricCards/StatCardForTodayYesterdayBar';
import StatCardLiveCount from '../common/MetricCards/StatCardLiveCount';
import WaterDashboardSkeleton from '../skeletonLoaders/WaterDashboardSkeleton';

import WATERMonthlyConsumption from './waterDashboardCards/WATERMonthlyConsumption';

const PALETTE = getCategoricalColors(8);

// Each preset card keeps its own icon (chosen for what it represents) and
// color, so the default cards look exactly as they did before cards became
// configurable. `code` is the backend's internal id: it's only a lookup key
// here and is never shown. Admin-created cards have opaque codes and get a
// generic icon plus a palette color the presets on screen aren't using.
const PRESET_CARD_VISUALS = {
	RAW_WATER_INLET: { icon: Waves, color: PALETTE[0] },
	RAW_WATER_OUTLET: { icon: Opacity, color: PALETTE[2] },
	FILTER_WATER_OUTLET: { icon: FilterAlt, color: PALETTE[6] },
	DRINKING_RO: { icon: LocalDrink, color: PALETTE[5] },
	WATER_POSITIVITY: { icon: TrendingUp, color: PALETTE[3], signed: true },
	SEWAGE_INLET: { icon: Plumbing, color: PALETTE[1] },
	SEWAGE_OUTLET: { icon: Recycling, color: PALETTE[4] },
	TOTAL_STATIONS: { icon: DeviceHub, color: '#64748B' },
};

const getCardVisuals = (cards) => {
	const presetColors = new Set(
		cards.map((card) => PRESET_CARD_VISUALS[card.code]?.color).filter(Boolean)
	);
	const freeColors = PALETTE.filter((color) => !presetColors.has(color));
	let nextFreeColor = 0;

	return cards.map((card, index) => {
		const preset = PRESET_CARD_VISUALS[card.code];
		if (preset) {
			return preset;
		}
		if (card.card_type === KPI_CARD_TYPE.STATION_COUNT) {
			return PRESET_CARD_VISUALS.TOTAL_STATIONS;
		}
		const color = freeColors.length
			? freeColors[nextFreeColor++ % freeColors.length]
			: PALETTE[index % PALETTE.length];
		return {
			icon: card.calculation_type === 'SUM' ? WaterDrop : Speed,
			color,
		};
	});
};

const WaterKpiCard = ({
	card,
	visual,
	asOf,
	variant = 'hero', // 'hero' (big Today/Yesterday tile) | 'compact' (bullet-bar tile)
}) => {
	const { icon: Icon, color, signed = false } = visual;
	const isCompact = variant === 'compact';
	const isStationCount = card.card_type === KPI_CARD_TYPE.STATION_COUNT;
	const unit = card.unit || '';
	const hasData = card.current !== null && card.current !== undefined;
	// `previous: null` means "no comparison available" (always the case for the
	// station count), not zero, so the card shows just the current value, with
	// no vs-yesterday comparison.
	const hasComparison = card.previous !== null && card.previous !== undefined;

	return (
		<CustomCard
			// The compact variant renders its own icon+title header (a much
			// smaller footprint than CustomCard's default 50px icon chip), so
			// it deliberately skips CustomCard's title slot rather than
			// reusing it — that's the whole point of it looking different
			// from the hero KPI tiles instead of being a smaller copy of them.
			title={isCompact ? undefined : card.title}
			titleIcon={!isCompact && Icon && <Icon />}
			accentColor={color}
			// KPI content is sized to fit its card exactly — an inner scrollbar
			// here would only ever mean a layout bug, so it's clipped rather
			// than left scrollable.
			childrenOtherProps={{ sx: { overflow: 'hidden' } }}
		>
			{!hasData ? (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			) : !hasComparison ? (
				<StatCardLiveCount
					value={card.current}
					label={
						isCompact
							? card.title
							: isStationCount
							  ? 'Connected Stations'
							  : 'Today'
					}
					accent={color}
					asOf={asOf}
					compact={isCompact}
					icon={Icon}
					unit={unit}
					statusLabel={isStationCount ? 'Connected' : null}
				/>
			) : isCompact ? (
				<CompactSecondaryMetricCard
					title={card.title}
					icon={Icon}
					value={card.current || 0}
					previousValue={card.previous || 0}
					unit={unit}
					accent={color}
				/>
			) : (
				<StatCardForTodayYesterdayBar
					value={card.current || 0}
					previousValue={card.previous || 0}
					accent={color}
					colorByValueSign={signed}
					emphasizeValue={signed}
					unit={unit}
					asOf={asOf}
				/>
			)}
		</CustomCard>
	);
};

// Stands in for the top row when there are no cards to show.
const KpiCardsNotice = ({ message, action }) => (
	<CustomCard title="KPI cards" titleIcon={<ViewQuiltOutlined />}>
		<Stack height="100%" alignItems="center" justifyContent="center" gap={1.5}>
			<Box flex={1} minHeight={0} width="100%">
				<NoDataFound message={message} />
			</Box>
			{action}
		</Stack>
	</CustomCard>
);

const noticeButtonSx = {
	textTransform: 'none',
	fontWeight: 600,
	borderRadius: '8px',
	flexShrink: 0,
};

const WaterDashboard = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { slavesData } = useCommonData();
	const [overviewData, setOverviewData] = useState(null);
	const [fetchedAt, setFetchedAt] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);

	const fetchDashboardOverviewData = async () => {
		setIsLoading(true);
		setLoadFailed(false);
		try {
			const getOverviewRes = await api.get(API_URLS.WATER_DASHBOARD_OVERVIEW);
			if (getOverviewRes?.success) {
				setOverviewData(getOverviewRes?.data);
				setFetchedAt(new Date());
			} else {
				setLoadFailed(true);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
			setLoadFailed(true);
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

	// Admin-configured cards in the order the API gives (display_order is
	// applied server-side): the first 4 fill the top row, the next 4 stack
	// beside the consumption chart. Anything from 0 to 8 cards is valid.
	const cards = useMemo(() => getOverviewCards(overviewData), [overviewData]);
	const visuals = useMemo(() => getCardVisuals(cards), [cards]);
	const topRowCards = cards.slice(0, KPI_TOP_ROW_SLOTS);
	const sideCards = cards.slice(KPI_TOP_ROW_SLOTS);
	const canManageCards = isAdminUser(user);

	const renderTopRowNotice = () => {
		if (loadFailed) {
			return (
				<KpiCardsNotice
					message="Couldn't load the KPI cards. Check your connection and try again."
					action={
						<Button
							variant="outlined"
							size="small"
							startIcon={<Refresh />}
							onClick={fetchDashboardOverviewData}
							sx={noticeButtonSx}
						>
							Try again
						</Button>
					}
				/>
			);
		}

		return (
			<KpiCardsNotice
				message={
					canManageCards
						? 'No KPI cards are set up for this dashboard yet.'
						: 'No KPI cards are set up for this dashboard yet. Ask your administrator to add them.'
				}
				action={
					canManageCards && (
						<Button
							variant="outlined"
							size="small"
							startIcon={<TuneOutlined />}
							onClick={() => navigate(getPagePath('SETTINGS', 'WATER'))}
							sx={noticeButtonSx}
						>
							Set up KPI cards
						</Button>
					)
				}
			/>
		);
	};

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
			{topRowCards.length > 0 ? (
				<Grid
					container
					spacing={1.5}
					height={{ xs: 'auto', md: 215 }}
					flexShrink={0}
				>
					{/* Fewer than 4 cards share the row instead of leaving gaps. */}
					{topRowCards.map((card, index) => (
						<Grid
							key={card.id}
							item
							xs={12}
							sm={topRowCards.length === 1 ? 12 : 6}
							md={12 / topRowCards.length}
							height={{ md: '100%' }}
						>
							<WaterKpiCard card={card} visual={visuals[index]} asOf={asOf} />
						</Grid>
					))}
				</Grid>
			) : (
				<Box height={{ xs: 240, md: 215 }} flexShrink={0}>
					{renderTopRowNotice()}
				</Box>
			)}

			<Grid container spacing={1.5} sx={{ mt: 0 }} flex={1} minHeight={0}>
				{sideCards.length > 0 && (
					<Grid item xs={12} sm={12} md={3} height={{ md: '100%' }}>
						{/* Always 4 equal slots, filled from the top: compact tiles are
						    designed for this height and look wrong stretched. */}
						<Grid
							container
							rowGap={{ md: 1.5 }}
							spacing={{ xs: 1.5, md: 0 }}
							height={{ md: 'calc(100% - 36px)' }}
						>
							{sideCards.map((card, index) => (
								<Grid
									key={card.id}
									item
									xs={6}
									sm={3}
									md={12}
									height={{ xs: 120, md: '25%' }}
								>
									<WaterKpiCard
										card={card}
										visual={visuals[KPI_TOP_ROW_SLOTS + index]}
										variant="compact"
									/>
								</Grid>
							))}
						</Grid>
					</Grid>
				)}

				<Grid
					item
					xs={12}
					md={sideCards.length > 0 ? 9 : 12}
					height={{ xs: 400, md: '100%' }}
				>
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
