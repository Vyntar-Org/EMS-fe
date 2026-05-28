import React from "react";
import EnergyAnalytics from "../components/Analytics/EnergyAnalytics";
import SolarAnalytics from "../components/Analytics/SolarAnalytics";
import TemperatureAnalytics from "../components/Analytics/TemperatureAnalytics";
import FireSafetyAnalytics from "../components/Analytics/FireSafetyAnalytics";
import CompressorAnalytics from "../components/Analytics/CompressorAnalytics";
import { useApplications } from "../contexts/ApplicationContext";
import { Box } from "@mui/material";

const ANALYTICS_CONFIG = {
  ENERGY: EnergyAnalytics,
  SOLAR: SolarAnalytics,
  TEMPERATURE: TemperatureAnalytics,
  "FIRE-SAFETY": FireSafetyAnalytics,
  COMPRESSOR: CompressorAnalytics,
};

const Analytics = () => {
  const { selectedApp } = useApplications();
  const AnalyticsComponent = ANALYTICS_CONFIG[selectedApp];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {AnalyticsComponent ? <AnalyticsComponent /> : <>Analytics not found</>}
    </Box>
  );
};

export default Analytics;
