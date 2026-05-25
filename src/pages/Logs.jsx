import React from "react";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyLogs from "../components/Logs/EnergyLogs";
import { Box } from "@mui/material";

const LOGS_CONFIG = {
  ENERGY: EnergyLogs,
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
