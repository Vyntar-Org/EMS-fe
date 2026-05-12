import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import Chart from "react-apexcharts";
import { CustomTable } from "../components/common/CustomTable";
import { useFetch } from "../hooks/useApi";
import { useApplications } from "../contexts/ApplicationContext";
import EnergyDashboard from "../components/Dashboards/EnergyDashboard";
import WaterDashboard from "../components/Dashboards/WaterDashboard";
import FuelDashboard from "../components/Dashboards/FuelDashboard";

const DASHBOARD_CONFIG = {
  ENERGY: EnergyDashboard,
  WATER: WaterDashboard,
  FUEL: FuelDashboard,
};

const Dashboard = () => {
  const { selectedApp } = useApplications();
  const DashboardComponent = DASHBOARD_CONFIG[selectedApp];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {DashboardComponent ? <DashboardComponent /> : <>Dashboard not found</>}
    </Box>
  );
};

export default Dashboard;
