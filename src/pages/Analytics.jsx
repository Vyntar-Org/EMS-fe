import { Box } from '@mui/material';

import CompressorAnalytics from '../components/Analytics/CompressorAnalytics';
import EnergyAnalytics from '../components/Analytics/EnergyAnalytics';
import FireSafetyAnalytics from '../components/Analytics/FireSafetyAnalytics';
import FlowMeterAnalytics from '../components/Analytics/FlowMeterAnalytics';
import FuelAnalytics from '../components/Analytics/FuelAnalytics';
import SolarAnalytics from '../components/Analytics/SolarAnalytics';
import STPAnalytics from '../components/Analytics/STPAnalytics';
import TemperatureAnalytics from '../components/Analytics/TemperatureAnalytics';
import WaterAnalytics from '../components/Analytics/WaterAnalytics';
import { useApplications } from '../contexts/ApplicationContext';

const ANALYTICS_CONFIG = {
	ENERGY: EnergyAnalytics,
	SOLAR: SolarAnalytics,
	TEMPERATURE: TemperatureAnalytics,
	'FIRE-SAFETY': FireSafetyAnalytics,
	COMPRESSOR: CompressorAnalytics,
	WATER: WaterAnalytics,
	FUEL: FuelAnalytics,
	STP: STPAnalytics,
	FLOWMETER: FlowMeterAnalytics,
};

const Analytics = () => {
	const { selectedApp } = useApplications();
	const AnalyticsComponent = ANALYTICS_CONFIG[selectedApp];

	return (
		<Box sx={{ flexGrow: 1 }}>
			{AnalyticsComponent ? <AnalyticsComponent /> : <>Analytics not found</>}
		</Box>
	);
};

export default Analytics;
