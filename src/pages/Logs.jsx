import React from "react";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyLogs from "../components/Logs/EnergyLogs";
import SolarLogs from "../components/Logs/SolarLogs";
import TemperatureLogs from "../components/Logs/TemperatureLogs";
import FireSafetyLogs from "../components/Logs/FireSafetyLogs";
import CompressorLogs from "../components/Logs/CompressorLogs";
import { Box } from "@mui/material";
import WaterLogs from "../components/Logs/WaterLogs";
import FuelLogs from "../components/Logs/FuelLogs";
import STPLogs from "../components/Logs/STPLogs";

const LOGS_CONFIG = {
  ENERGY: EnergyLogs,
  SOLAR: SolarLogs,
  TEMPERATURE: TemperatureLogs,
  "FIRE-SAFETY": FireSafetyLogs,
  COMPRESSOR: CompressorLogs,
  WATER: WaterLogs,
  FUEL: FuelLogs,
  STP: STPLogs,
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
