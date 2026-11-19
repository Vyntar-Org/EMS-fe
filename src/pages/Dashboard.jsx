import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

import EnergyDashboard from '../components/Dashboards/EnergyDashboard';
import FlowMeterDashboard from '../components/Dashboards/FlowMeterDashboard';
import FuelDashboard from '../components/Dashboards/FuelDashboard';
import STPDashboard from '../components/Dashboards/STPDashboard';
import WaterDashboard from '../components/Dashboards/WaterDashboard';
import WeatherStationDashboard from '../components/Dashboards/WeatherStationDashboard';
import WaterMonitoringPage from '../components/WaterMonitoring/WaterMonitoringPage';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const WaterMonitoringDashboard = lazy(
	() =>
		import('../components/Dashboards/WaterMonitoring/WaterMonitoringDashboard')
);
function LazyWaterMonitoringDashboard() {
	return (
		<Suspense
			fallback={<Box sx={{ p: 2 }}>Loading Water Monitoring dashboard...</Box>}
		>
			<WaterMonitoringDashboard />
		</Suspense>
	);
}

const DASHBOARD_CONFIG = {
	OHT: LazyWaterMonitoringDashboard,
	WATER_MONITOR: LazyWaterMonitoringDashboard,
	ENERGY: EnergyDashboard,
	WATER: WaterDashboard,
	FUEL: FuelDashboard,
	STP: STPDashboard,
	FLOWMETER: FlowMeterDashboard,
	WEATHER: WeatherStationDashboard,
};

const Dashboard = () => {
	// Driven by the URL itself (route is always `/<appCode>/dashboard`), not
	// by ApplicationContext's `selectedApp` — that avoids ever showing the
	// wrong app's dashboard while that context is still resolving, e.g. on
	// a hard refresh.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const DashboardComponent = DASHBOARD_CONFIG[appCode];

	return (
		<WaterMonitoringPage appCode={appCode}>
			<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
				{DashboardComponent ? <DashboardComponent /> : <>Dashboard not found</>}
			</Box>
		</WaterMonitoringPage>
	);
};

export default Dashboard;
