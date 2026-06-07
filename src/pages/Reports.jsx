import React from "react";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyReports from "../components/Reports/EnergyReports";
import { Box } from "@mui/material";
import WaterReports from "../components/Reports/WaterReports";
import FuelReports from "../components/Reports/FuelReports";

const REPORTS_CONFIG = {
  ENERGY: EnergyReports,
  WATER: WaterReports,
  FUEL: FuelReports,
};

const Reports = () => {
  const { selectedApp } = useApplications();
  const ReportsComponent = REPORTS_CONFIG[selectedApp];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {ReportsComponent ? <ReportsComponent /> : <>Reports not found</>}
    </Box>
  );
};

export default Reports;
