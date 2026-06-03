import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import FuelStationSummary from "./fuelDashboardCards/FuelStationSummary";
import FuelDeviceList from "./fuelDashboardCards/FUELDeviceList";
import FuelConsumptionTrend from "./fuelDashboardCards/FUELConsumptionTrend";

const DUMMY_DEVICES = [
  { id: "1", name: "DG 1500 KVA" },
  { id: "2", name: "DG 625 KVA" },
  { id: "3", name: "Mother Tank" },
  { id: "4", name: "DG 380 KVA" },
];

const DUMMY_TREND_DATA = [
  { date: "1/2", value: 75 },
  { date: "3/2", value: 65 },
  { date: "5/2", value: 85 },
  { date: "7/2", value: 70 },
  { date: "9/2", value: 92 },
  { date: "11/2", value: 82 },
  { date: "13/2", value: 100 },
];

const FuelDashboard = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState("1");

  const selectedDevice = DUMMY_DEVICES.find((d) => d.id === selectedDeviceId);

  return (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 24px)" },
        p: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Grid container spacing={1} sx={{ height: "100%" }}>
        {/* Left Column */}
        <Grid
          item
          xs={12}
          sm={5}
          md={4}
          lg={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: { md: "100%" },
          }}
        >
          <Box sx={{ height: { md: "35%" } }}>
            <FuelStationSummary
              data={{ total: 4, online: 4, offline: 0 }}
            />
          </Box>
          <Box sx={{ flexGrow: 1, height: { md: "65%" }, overflow: "hidden" }}>
            <FuelDeviceList
              devices={DUMMY_DEVICES}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={setSelectedDeviceId}
            />
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid
          item
          xs={12}
          sm={7}
          md={8}
          lg={8}
          sx={{ height: { xs: "auto", md: "auto" } }}
        >
          <FuelConsumptionTrend
            deviceName={selectedDevice?.name || "Device"}
            dateRange="February 2026"
            data={DUMMY_TREND_DATA}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FuelDashboard;
