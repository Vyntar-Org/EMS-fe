import React from "react";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyReports from "../components/Reports/EnergyReports";
import { Box } from "@mui/material";

const REPORTS_CONFIG = {
  ENERGY: EnergyReports,
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
