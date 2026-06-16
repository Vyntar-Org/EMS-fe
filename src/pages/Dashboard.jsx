import { Box } from '@mui/material';

import EnergyDashboard from '../components/Dashboards/EnergyDashboard';
import FlowMeterDashboard from '../components/Dashboards/FlowMeterDashboard';
import FuelDashboard from '../components/Dashboards/FuelDashboard';
import STPDashboard from '../components/Dashboards/STPDashboard';
import WaterDashboard from '../components/Dashboards/WaterDashboard';
import { useApplications } from '../contexts/ApplicationContext';

const DASHBOARD_CONFIG = {
	ENERGY: EnergyDashboard,
	WATER: WaterDashboard,
	FUEL: FuelDashboard,
	STP: STPDashboard,
	FLOWMETER: FlowMeterDashboard,
};

const Dashboard = () => {
	const { selectedApp } = useApplications();
	const DashboardComponent = DASHBOARD_CONFIG[selectedApp];

	return (
		<Box sx={{ flexGrow: 1 }}>
			{DashboardComponent ? <DashboardComponent /> : <>Dashboard not found</>}
		</Box>
	);
};

export default Dashboard;
