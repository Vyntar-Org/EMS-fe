import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import EnergyReports from '../components/Reports/EnergyReports';
import FlowMeterReports from '../components/Reports/FlowMeterReports';
import FuelReports from '../components/Reports/FuelReports';
import WaterReports from '../components/Reports/WaterReports';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const REPORTS_CONFIG = {
	ENERGY: EnergyReports,
	WATER: WaterReports,
	FUEL: FuelReports,
	FLOWMETER: FlowMeterReports,
};

const Reports = () => {
	// Driven by the URL itself (route is always `/<appCode>/reports`), not
	// by ApplicationContext's `selectedApp` — that avoids ever showing the
	// wrong app's reports while that context is still resolving, e.g. on a
	// hard refresh.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const ReportsComponent = REPORTS_CONFIG[appCode];

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{ReportsComponent ? <ReportsComponent /> : <>Reports not found</>}
		</Box>
	);
};

export default Reports;
