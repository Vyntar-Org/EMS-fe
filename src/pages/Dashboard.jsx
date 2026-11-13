import { lazy, Suspense } from 'react';
import WaterMonitorPage from '../components/waterMonitor/WaterMonitorPage';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import EnergyDashboard from '../components/Dashboards/EnergyDashboard';
import FlowMeterDashboard from '../components/Dashboards/FlowMeterDashboard';
import FuelDashboard from '../components/Dashboards/FuelDashboard';
import STPDashboard from '../components/Dashboards/STPDashboard';
import WaterDashboard from '../components/Dashboards/WaterDashboard';
import WeatherStationDashboard from '../components/Dashboards/WeatherStationDashboard';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const WaterDistributionDashboard = lazy(
	() =>
		import('../components/waterMonitor/dashboard/WaterDistributionDashboard')
);
function WaterMonitorDashboard() {
	return (
		<Suspense
			fallback={
				<Box sx={{ p: 2 }}>Loading Water Distribution dashboard...</Box>
			}
		>
			<WaterDistributionDashboard />
		</Suspense>
	);
}

const DASHBOARD_CONFIG = {
	WATER_MONITOR: WaterMonitorDashboard,
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
		<WaterMonitorPage appCode={appCode}>
			<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
				{DashboardComponent ? <DashboardComponent /> : <>Dashboard not found</>}
			</Box>
		</WaterMonitorPage>
	);
};

export default Dashboard;
