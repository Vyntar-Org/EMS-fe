import { Box } from '@mui/material';

import CompressorMachineList from '../components/MachineList/CompressorMachineList';
import EnergyMachineList from '../components/MachineList/EnergyMachineList';
import FireSafetyMachineList from '../components/MachineList/FireSafetyMachineList';
import FlowMeterMachineList from '../components/MachineList/FlowMeterMachineList';
import FuelMachineList from '../components/MachineList/FuelMachineList';
import SolarMachineList from '../components/MachineList/SolarMachineList';
import STPMachineList from '../components/MachineList/STPMachineList';
import TemperatureMachineList from '../components/MachineList/TemperatureMachineList';
import WaterMachineList from '../components/MachineList/WaterMachineList';
import { useApplications } from '../contexts/ApplicationContext';

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
	const { selectedApp } = useApplications();
	const MachineListComponent = MACHINE_LIST_CONFIG[selectedApp];

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
