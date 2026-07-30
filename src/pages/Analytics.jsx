import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import CompressorAnalytics from '../components/Analytics/CompressorAnalytics';
import EnergyAnalytics from '../components/Analytics/EnergyAnalytics';
import FireSafetyAnalytics from '../components/Analytics/FireSafetyAnalytics';
import FlowMeterAnalytics from '../components/Analytics/FlowMeterAnalytics';
import FuelAnalytics from '../components/Analytics/FuelAnalytics';
import SolarAnalytics from '../components/Analytics/SolarAnalytics';
import SpinningAnalytics from '../components/Analytics/SpinningAnalytics.jsx';
import STPAnalytics from '../components/Analytics/STPAnalytics';
import TemperatureAnalytics from '../components/Analytics/TemperatureAnalytics';
import WaterAnalytics from '../components/Analytics/WaterAnalytics';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

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
	SPINNING: SpinningAnalytics,
};

const Analytics = () => {
	// Driven by the URL itself (route is always `/<appCode>/analytics`), not
	// by ApplicationContext's `selectedApp` — that avoids ever showing the
	// wrong app's analytics while that context is still resolving, e.g. on
	// a hard refresh.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const AnalyticsComponent = ANALYTICS_CONFIG[appCode];

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{AnalyticsComponent ? <AnalyticsComponent /> : <>Analytics not found</>}
		</Box>
	);
};

export default Analytics;
