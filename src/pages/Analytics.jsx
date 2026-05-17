import React from "react";
import EnergyAnalytics from "../components/Analytics/EnergyAnalytics";
import { useApplications } from "../contexts/ApplicationContext";
import { Box } from "@mui/material";

const ANALYTICS_CONFIG = {
  ENERGY: EnergyAnalytics,
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
