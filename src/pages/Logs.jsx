import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import CompressorLogs from '../components/Logs/CompressorLogs';
import EnergyLogs from '../components/Logs/EnergyLogs';
import FireSafetyLogs from '../components/Logs/FireSafetyLogs';
import FlowMeterLogs from '../components/Logs/FlowMeterLogs';
import FuelLogs from '../components/Logs/FuelLogs';
import SolarLogs from '../components/Logs/SolarLogs';
import STPLogs from '../components/Logs/STPLogs';
import TemperatureLogs from '../components/Logs/TemperatureLogs';
import WaterLogs from '../components/Logs/WaterLogs';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const LOGS_CONFIG = {
	ENERGY: EnergyLogs,
	SOLAR: SolarLogs,
	TEMPERATURE: TemperatureLogs,
	'FIRE-SAFETY': FireSafetyLogs,
	COMPRESSOR: CompressorLogs,
	WATER: WaterLogs,
	FUEL: FuelLogs,
	STP: STPLogs,
	FLOWMETER: FlowMeterLogs,
};

const Logs = () => {
	// Driven by the URL itself (route is always `/<appCode>/logs`), not by
	// ApplicationContext's `selectedApp` — this is exactly what was causing
	// a hard refresh to show the wrong app's page: `selectedApp` is async
	// context state that briefly (or, on some timings, persistently) didn't
	// match the URL you actually refreshed on. The URL itself can't be wrong.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const LogsComponent = LOGS_CONFIG[appCode];

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{LogsComponent ? <LogsComponent /> : <>Logs not found</>}
		</Box>
	);
};

export default Logs;
