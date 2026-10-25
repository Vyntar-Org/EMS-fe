import { Box, Grid, Typography } from '@mui/material';

import { useWeatherStation } from '../../hooks/useWeatherStation';

import AirQualityChart from './weatherStationDashboardCards/AirQualityChart';
import MetricCardsRow from './weatherStationDashboardCards/MetricCardsRow';
import PremiumLoader from './weatherStationDashboardCards/PremiumLoader';
import RainfallTempPressureChart from './weatherStationDashboardCards/RainfallTempPressureChart';
import SiteLocationMap from './weatherStationDashboardCards/SiteLocationMap';
import SiteLocationSummary from './weatherStationDashboardCards/SiteLocationSummary';
import SolarIrradianceEnergyChart from './weatherStationDashboardCards/SolarIrradianceEnergyChart';
import WindDirectionChart from './weatherStationDashboardCards/WindDirectionChart';

const WeatherStationDashboard = () => {
	const { loading, error, kpiCardsData, chartData } = useWeatherStation();

	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 24px)',
					sm: 'calc(100vh - 64px - 24px)',
				},
			}}
		>
			{loading && (
				<Box sx={{ height: '100%' }}>
					<PremiumLoader message="Loading live station data" />
				</Box>
			)}

			{error && (
				<Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
					{error}
				</Typography>
			)}

			{!loading && (
				<Grid
					sx={{
						overflowX: 'hidden',
						px: 0.5,
					}}
					container
					justifyContent="space-between"
					height="100%"
					overflow="auto"
					pt={0.2}
					rowGap={1.5}
				>
					<Grid xs={12} sm={12} md={12} lg={12}>
						<MetricCardsRow kpiCardsData={kpiCardsData} />
					</Grid>

					<Grid xs={12} sm={12} md={7.9}>
						<RainfallTempPressureChart data={chartData?.rainfall} />
					</Grid>

					<Grid xs={12} sm={12} md={4} lg={4}>
						<WindDirectionChart data={chartData?.windDirection} />
					</Grid>

					<Grid xs={12} sm={12} md={7.9}>
						<SolarIrradianceEnergyChart data={chartData?.solarIrradiance} />
					</Grid>

					<Grid xs={12} sm={12} md={4} lg={4}>
						<AirQualityChart data={chartData?.airQuality} />
					</Grid>

					<Grid xs={12} sm={12} md={7.9}>
						<SiteLocationMap />
					</Grid>

					<Grid xs={12} sm={12} md={4} lg={4}>
						<SiteLocationSummary />
					</Grid>
				</Grid>
			)}
		</Box>
	);
};

export default WeatherStationDashboard;
