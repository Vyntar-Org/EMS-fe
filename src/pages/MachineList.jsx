import React from "react";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyMachineList from "../components/MachineList/EnergyMachineList";
import { Box } from "@mui/material";

const MACHINE_LIST_CONFIG = {
  ENERGY: EnergyMachineList,
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
