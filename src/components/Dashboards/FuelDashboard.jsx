import React, { useEffect, useMemo, useState } from 'react';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	Box,
	Button,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';
import { BarChart, SsidChart } from '@mui/icons-material';
import ReactApexChart from 'react-apexcharts';
import {
	CHART_COLORS,
	getChartOptions,
	getChartSeries,
} from '../../helpers/chartConfig';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomInput } from '../common/CustomInput';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import FuelDashboardSkeleton from '../skeletonLoaders/FuelDashboardSkeleton';

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
		if (!slavesData) return null;

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? `${slave.slave_name}` : '';
	}, [slavesId, slavesData]);

	const filteredSlaves = useMemo(() => {
		if (!searchDevices?.trim()) return slavesData;

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
		if (!slavesId) return;

		fetchFuelConsumption();
	}, [slavesId]);

	return isLoading ? (
		<FuelDashboardSkeleton />
	) : (
		<Box
			sx={{
				height: { md: 'calc(100vh - 64px - 8px)' },
			}}
		>
			<Grid container spacing={1} height="100%">
				<Grid item xs={12} md={4} height="100%">
					<Grid container rowGap={1} height="calc(100% - 8px)">
						<Grid item xs={12} height={{ xs: 250, md: '40%' }}>
							<CustomCard title={!overviewData?.fuel_station && 'Fuel Station'}>
								{overviewData?.fuel_station ? (
									<Grid
										container
										sx={{ height: '100%', width: '100%' }}
										overflow="hidden"
										justifyContent="center"
									>
										<ReactApexChart
											key="fuel-station-chart"
											options={getChartOptions('donut', [], {
												yLabel: 'Total',
												labels: ['Online', 'Offline'],
												colors: [CHART_COLORS.online, CHART_COLORS.offline],
											})}
											series={[
												overviewData?.fuel_station?.online,
												overviewData?.fuel_station?.offline,
											]}
											type="donut"
											height="100%"
											width="100%"
										/>
									</Grid>
								) : (
									<NoDataFound />
								)}
							</CustomCard>
						</Grid>
						<Grid item xs={12} height={{ xs: 300, md: '60%' }}>
							<CustomCard>
								<CustomInput
									onChange={(e) => setSearchDevices(e.target.value)}
									value={searchDevices || ''}
									autoComplete="off"
									placeholder="Search Devices"
									size="small"
									sx={{
										mt: 1,
										'& .MuiOutlinedInput-root': {
											borderRadius: 2,
										},
									}}
								/>

								<Box height={{ xs: 'calc(100% - 40px - 8px)' }} overflow="auto">
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
														<Button
															onClick={() => {
																setSlavesId(s.slave_id);
															}}
															disableElevation
															sx={{
																justifyContent: 'start',
																borderRadius: 2,
																textTransform: 'none',
																bgcolor: isActive ? '#0a223e' : '#fff',
																border: '2px solid',
																borderColor: isActive ? '#0a223e' : '#ccc',
																':hover': {
																	bgcolor: isActive ? '#0a223e' : '#fff',
																},
															}}
															variant="contained"
															fullWidth
														>
															<ResponsiveTextWrapper
																value={s.slave_name}
																color={isActive ? '#fff' : '#0a223e'}
																fontSize="14px"
																textAlign="start"
																fontWeight={600}
															/>
														</Button>
													</Grid>
												);
											})}
										</Grid>
									) : (
										<NoDataFound />
									)}
								</Box>
							</CustomCard>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12} md height={{ xs: 400, md: '100%' }}>
					<CustomCard
						title={`Monthly Fuel Consumption ${
							slavesDisplayName ? `- ${slavesDisplayName}` : ''
						}`}
						icon={
							<ToggleButtonGroup
								value={mode}
								exclusive
								onChange={(e, newMode) => newMode !== null && setMode(newMode)}
								sx={{
									height: '28px',
									bgcolor: 'background.paper',
									'& .MuiToggleButton-root.Mui-selected': {
										bgcolor: 'primary.main',
										color: 'white',
										'&:hover': { bgcolor: 'primary.dark' },
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
								<ReactApexChart
									key={`chart-${mode}`}
									options={getChartOptions(
										mode === 1 ? 'bar' : 'line',
										fuelConsumption,
										{ yLabel: 'Liters', xLabel: 'Day' }
									)}
									series={getChartSeries(fuelConsumption, {
										actual: 'consumption',
										target: 'target',
										actualLabel: 'Actual Consumption',
										targetLabel: 'Target',
									})}
									type={mode === 1 ? 'bar' : 'line'}
									height="100%"
									width="100%"
								/>
							</Box>
						) : (
							<NoDataFound />
						)}
					</CustomCard>
				</Grid>
			</Grid>
		</Box>
	);
};

export default FuelDashboard;
