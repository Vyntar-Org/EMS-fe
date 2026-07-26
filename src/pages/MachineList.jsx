import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import CompressorMachineList from '../components/MachineList/CompressorMachineList';
import EnergyMachineList from '../components/MachineList/EnergyMachineList';
import FireSafetyMachineList from '../components/MachineList/FireSafetyMachineList';
import FlowMeterMachineList from '../components/MachineList/FlowMeterMachineList';
import FuelMachineList from '../components/MachineList/FuelMachineList';
import SolarMachineList from '../components/MachineList/SolarMachineList';
import STPMachineList from '../components/MachineList/STPMachineList';
import TemperatureMachineList from '../components/MachineList/TemperatureMachineList';
import WaterMachineList from '../components/MachineList/WaterMachineList';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const MACHINE_LIST_CONFIG = {
	ENERGY: EnergyMachineList,
	TEMPERATURE: TemperatureMachineList,
	SOLAR: SolarMachineList,
	'FIRE-SAFETY': FireSafetyMachineList,
	COMPRESSOR: CompressorMachineList,
	WATER: WaterMachineList,
	FUEL: FuelMachineList,
	STP: STPMachineList,
	FLOWMETER: FlowMeterMachineList,
};

const MachineList = () => {
	// Driven by the URL itself (route is always `/<appCode>/machine_list`),
	// not by ApplicationContext's `selectedApp` — that avoids ever showing
	// the wrong app's list while that context is still resolving, e.g. on a
	// hard refresh.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const MachineListComponent = MACHINE_LIST_CONFIG[appCode];

	return (
		<Box sx={{ flexGrow: 1 }}>
			{MachineListComponent ? (
				<MachineListComponent />
			) : (
				<>Machine List not found</>
			)}
		</Box>
	);
};

export default MachineList;
