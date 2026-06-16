import { Box } from '@mui/material';

import EnergyReports from '../components/Reports/EnergyReports';
import FlowMeterReports from '../components/Reports/FlowMeterReports';
import FuelReports from '../components/Reports/FuelReports';
import WaterReports from '../components/Reports/WaterReports';
import { useApplications } from '../contexts/ApplicationContext';

const REPORTS_CONFIG = {
	ENERGY: EnergyReports,
	WATER: WaterReports,
	FUEL: FuelReports,
	FLOWMETER: FlowMeterReports,
};

const Reports = () => {
	const { selectedApp } = useApplications();
	const ReportsComponent = REPORTS_CONFIG[selectedApp];

	return (
		<Box sx={{ flexGrow: 1 }}>
			{ReportsComponent ? <ReportsComponent /> : <>Reports not found</>}
		</Box>
	);
};

export default Reports;
