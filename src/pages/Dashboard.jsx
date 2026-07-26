import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import EnergyDashboard from '../components/Dashboards/EnergyDashboard';
import FlowMeterDashboard from '../components/Dashboards/FlowMeterDashboard';
import FuelDashboard from '../components/Dashboards/FuelDashboard';
import STPDashboard from '../components/Dashboards/STPDashboard';
import WaterDashboard from '../components/Dashboards/WaterDashboard';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const DASHBOARD_CONFIG = {
	ENERGY: EnergyDashboard,
	WATER: WaterDashboard,
	FUEL: FuelDashboard,
	STP: STPDashboard,
	FLOWMETER: FlowMeterDashboard,
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
		<Box sx={{ flexGrow: 1 }}>
			{DashboardComponent ? <DashboardComponent /> : <>Dashboard not found</>}
		</Box>
	);
};

export default Dashboard;
