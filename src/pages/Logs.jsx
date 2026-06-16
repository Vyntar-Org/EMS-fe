import { Box } from '@mui/material';

import CompressorLogs from '../components/Logs/CompressorLogs';
import EnergyLogs from '../components/Logs/EnergyLogs';
import FireSafetyLogs from '../components/Logs/FireSafetyLogs';
import FlowMeterLogs from '../components/Logs/FlowMeterLogs';
import FuelLogs from '../components/Logs/FuelLogs';
import SolarLogs from '../components/Logs/SolarLogs';
import STPLogs from '../components/Logs/STPLogs';
import TemperatureLogs from '../components/Logs/TemperatureLogs';
import WaterLogs from '../components/Logs/WaterLogs';
import { useApplications } from '../contexts/ApplicationContext';

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
	const { selectedApp } = useApplications();
	const LogsComponent = LOGS_CONFIG[selectedApp];

	return (
		<Box sx={{ flexGrow: 1 }}>
			{LogsComponent ? <LogsComponent /> : <>Logs not found</>}
		</Box>
	);
};

export default Logs;
