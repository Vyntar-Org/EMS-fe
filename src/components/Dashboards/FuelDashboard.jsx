import {
	BarChart,
	DeviceHub,
	LocalGasStation,
	Search,
	SsidChart,
} from '@mui/icons-material';
import {
	Box,
	Grid,
	InputAdornment,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';

import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { CHART_COLORS, getChartSeries } from '../../helpers/chartConfig';
import CustomApexChart from '../common/CustomApexChart';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import CustomCard from '../common/CustomCard';
import { CustomInput } from '../common/CustomInput';
import NoDataFound from '../common/errors/NoDataFound';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import FuelDashboardSkeleton from '../skeletonLoaders/FuelDashboardSkeleton';

const STATION_ACCENT = '#2563EB';
const DEVICES_ACCENT = '#0891B2';
const FUEL_ACCENT = CHART_COLORS.fuelUsage;

// Premium, rounded search field — same "surface.muted pill that glows on
// hover/focus" treatment used by the Water dashboard's device search.
const searchFieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '12px',
		backgroundColor: 'surface.muted',
		transition: '0.2s ease',
		'&:hover': { backgroundColor: 'background.paper' },
		'&.Mui-focused': {
			backgroundColor: 'background.paper',
			boxShadow: (t) =>
				`0 0 0 3px ${alpha(
					DEVICES_ACCENT,
					t.palette.mode === 'dark' ? 0.3 : 0.16
				)}`,
		},
	},
};

// One selectable device row: icon chip + name, accent-tinted when selected,
// matching the Water dashboard's validated device-list pattern.
const DeviceRow = ({ name, isActive, onClick }) => (
	<Box
		onClick={onClick}
		role="button"
		tabIndex={0}
		onKeyDown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClick?.();
			}
		}}
		sx={{
			display: 'flex',
			alignItems: 'center',
			gap: 1,
			px: 1.25,
			py: 1,
			borderRadius: '12px',
			cursor: 'pointer',
			border: '1px solid',
			borderColor: isActive ? alpha(DEVICES_ACCENT, 0.45) : 'divider',
			bgcolor: isActive ? alpha(DEVICES_ACCENT, 0.12) : 'background.paper',
			transition: 'all 0.2s ease',
			'&:hover': {
				borderColor: alpha(DEVICES_ACCENT, 0.5),
				bgcolor: alpha(DEVICES_ACCENT, isActive ? 0.16 : 0.06),
			},
		}}
	>
		<Box
			sx={{
				width: 26,
				height: 26,
				borderRadius: '8px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				bgcolor: alpha(DEVICES_ACCENT, isActive ? 0.28 : 0.14),
				color: DEVICES_ACCENT,
				'& svg': { fontSize: 15 },
			}}
		>
			<LocalGasStation />
		</Box>
		<Box minWidth={0} flex={1}>
			<ResponsiveTextWrapper
				value={name}
				color={isActive ? 'text.primary' : 'text.secondary'}
				fontSize="13px"
				fontWeight={isActive ? 700 : 500}
			/>
		</Box>
	</Box>
);

const FuelDashboard = () => {
	const { slavesData } = useCommonData();
	const [overviewData, setOverviewData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [mode, setMode] = useState(1);
	const [fuelConsumption, setFuelConsumption] = useState(null);
	const [searchDevices, setSearchDevices] = useState(null);

	const fetchDashboardOverviewData = async () => {
		setIsLoading(true);
		try {
			const getOverviewRes = await api.get(API_URLS.FUEL_DASHBOARD_OVERVIEW);
			if (getOverviewRes?.success) {
				setOverviewData(getOverviewRes?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const slavesDisplayName = useMemo(() => {
		if (!slavesData) {
			return null;
		}

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? `${slave.slave_name}` : '';
	}, [slavesId, slavesData]);

	const filteredSlaves = useMemo(() => {
		if (!searchDevices?.trim()) {
			return slavesData;
		}

		const searchLower = searchDevices.toLowerCase().trim();

		return slavesData.filter((slave) => {
			const nameMatch = slave.slave_name?.toLowerCase().includes(searchLower);

			return nameMatch || null;
		});
	}, [searchDevices, slavesData]);

	const fetchFuelConsumption = async () => {
		try {
			const getFuelConsumptionData = await api.get(
				`${API_URLS.FUEL_DASHBOARD_DAILY_CONSUMPTION(slavesId || 0)}`
			);
			if (getFuelConsumptionData?.success) {
				setFuelConsumption(getFuelConsumptionData?.data?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
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

	useEffect(() => {
		if (!slavesId) {
			return;
		}

		fetchFuelConsumption();
	}, [slavesId]);

	return isLoading ? (
		<FuelDashboardSkeleton />
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
				<Grid item xs={12} md={4} height={{ md: '100%' }}>
					<Grid container rowGap={1} height={{ md: 'calc(100% - 8px)' }}>
						<Grid item xs={12} height={{ xs: 250, md: '40%' }}>
							<CustomCard
								title="Fuel Station"
								titleIcon={<LocalGasStation />}
								accentColor={STATION_ACCENT}
							>
								{overviewData?.fuel_station ? (
									<Grid
										container
										sx={{ height: '100%', width: '100%' }}
										justifyContent="center"
									>
										<CustomApexChart
											key="fuel-station-chart"
											series={[
												overviewData?.fuel_station?.online,
												overviewData?.fuel_station?.offline,
											]}
											type="donut"
											colors={[CHART_COLORS.online, CHART_COLORS.offline]}
											height="100%"
										/>
									</Grid>
								) : (
									<NoDataFound message="Waiting for live device data — readings appear automatically" />
								)}
							</CustomCard>
						</Grid>
						<Grid item xs={12} height={{ xs: 300, md: '60%' }}>
							<CustomCard
								title="Devices"
								titleIcon={<DeviceHub />}
								accentColor={DEVICES_ACCENT}
								childrenOtherProps={{
									display: 'flex',
									flexDirection: 'column',
									minHeight: 0,
								}}
							>
								<CustomInput
									onChange={(e) => setSearchDevices(e.target.value)}
									value={searchDevices || ''}
									autoComplete="off"
									placeholder="Search devices"
									size="small"
									icon={
										<InputAdornment position="end">
											<Search sx={{ fontSize: 18, color: 'text.secondary' }} />
										</InputAdornment>
									}
									sx={{ flexShrink: 0, ...searchFieldSx }}
								/>

								<Box flex={1} minHeight={0} overflow="auto">
									{filteredSlaves?.length ? (
										<Grid container rowGap={1} mt={1}>
											{filteredSlaves.map((s) => {
												const isActive = slavesId === s.slave_id;
												return (
													<Grid
														item
														xs={12}
														key={`slaves-option-${s.slave_id}`}
													>
														<DeviceRow
															name={s.slave_name}
															isActive={isActive}
															onClick={() => setSlavesId(s.slave_id)}
														/>
													</Grid>
												);
											})}
										</Grid>
									) : (
										<NoDataFound message="Waiting for live device data — readings appear automatically" />
									)}
								</Box>
							</CustomCard>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12} md={8} height={{ xs: 400, md: '100%' }}>
					<CustomCard
						title={`Monthly Fuel Consumption ${
							slavesDisplayName ? `- ${slavesDisplayName}` : ''
						}`}
						accentColor={FUEL_ACCENT}
						icon={
							<ToggleButtonGroup
								value={mode}
								exclusive
								onChange={(e, newMode) => newMode !== null && setMode(newMode)}
								sx={{
									height: '28px',
									bgcolor: 'background.paper',
									border: '1px solid',
									borderColor: 'divider',
									'& .MuiToggleButton-root': {
										border: 'none',
										color: 'text.secondary',
									},
									'& .MuiToggleButton-root.Mui-selected': {
										bgcolor: FUEL_ACCENT,
										color: '#FFFFFF',
										'&:hover': { bgcolor: FUEL_ACCENT },
									},
								}}
							>
								<ToggleButton value={1}>
									<BarChart sx={{ width: 20, height: 20 }} />
								</ToggleButton>
								<ToggleButton value={2}>
									<SsidChart sx={{ width: 20, height: 20 }} />
								</ToggleButton>
							</ToggleButtonGroup>
						}
					>
						{fuelConsumption && fuelConsumption?.length ? (
							<Box height="100%" width="100%" overflow="hidden">
								<CustomApexChart
									key={`chart-${mode}`}
									series={getChartSeries(fuelConsumption, {
										actual: 'consumption',
										target: 'target',
										actualLabel: 'Actual Consumption',
										targetLabel: 'Target',
									})}
									type={mode === 1 ? 'bar' : 'line'}
									colors={[CHART_COLORS.fuelUsage, CHART_COLORS.secondary]}
									xAxesType="category"
									height="100%"
									// title="Monthly Fuel Consumption"
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

export default FuelDashboard;
