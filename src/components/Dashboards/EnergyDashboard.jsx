import { Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { EnergySavingsLeafOutlined } from "@mui/icons-material";
import { api } from "../../helpers/api";
import ENERGYDevices from "./energyDashboardCards/ENERGYDevices";
import ENERGYConsumption from "./energyDashboardCards/ENERGYConsumption";
import ENERGYEnerTree from "./energyDashboardCards/ENERGYEnerTree";
import ENERGYCarbonFootprints from "./energyDashboardCards/ENERGYCarbonFootprints";
import ENERGYLoadBalance from "./energyDashboardCards/ENERGYLoadBalance";
import ENERGYConsumptionLastSixHours from "./energyDashboardCards/ENERGYConsumptionLastSixHours";
import ENERGYDemandIndicator from "./energyDashboardCards/ENERGYDemandIndicator";
import ENERGYMachinePowerConsumption from "./energyDashboardCards/ENERGYMachinePowerConsumption";
import { useCommonData } from "../../contexts/CommonDataContext";
import { API_URLS } from "../../helpers/apiUrls";
import EnergyDashboardSkeleton from "../skeletonLoaders/EnergyDashboardSkeleton";

const EnergyDashboard = () => {
  const { slavesData } = useCommonData();
  const [overviewData, setOverviewData] = useState(null);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardOverviewData = async () => {
    setIsLoading(true);
    try {
      const getOverviewRes = await api.get(API_URLS.EMS_DASHBOARD_OVERVIEW);
      if (getOverviewRes?.success) {
        setOverviewData(getOverviewRes?.data);
      }
    } catch (error) {
      console.error("One of the API calls failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverviewData();
  }, []);

  useEffect(() => {
    if (slavesData?.length > 0 && !slavesId) {
      const commonSlave = slavesData.find(
        (s) => s.slave_name.trim().toLowerCase() === "common",
      );

      if (commonSlave) {
        setSlavesId(commonSlave.slave_id);
      } else {
        setSlavesId(slavesData[0].slave_id);
      }
    }
  }, [slavesData, slavesId]);

  return isLoading ? (
    <EnergyDashboardSkeleton />
  ) : (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid container spacing={1} height={{ sm: "350px", md: "200px" }}>
        <Grid item xs={12} sm={4} md={1.7}>
          <ENERGYDevices data={overviewData?.devices} />
        </Grid>
        <Grid item xs={12} sm={8} md={3.7}>
          <ENERGYConsumption data={overviewData?.energy_consumption} />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <ENERGYEnerTree data={overviewData?.ener_tree} />
        </Grid>
        <Grid item xs={12} sm={4} md={2.6}>
          <ENERGYCarbonFootprints data={overviewData?.carbon_footprints} />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <ENERGYLoadBalance data={overviewData?.load_balance} />
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        sx={{ mt: 0 }}
        height={{ md: "calc(100% - 200px)" }}
      >
        <Grid item xs={12} sm={12} md={5.4} height={{ md: "100%" }}>
          <Grid container rowGap={1} height={{ md: "100%" }}>
            <Grid item xs={12} sm={12} height={{ xs: 300, md: "50%" }}>
              <ENERGYConsumptionLastSixHours />
            </Grid>
            <Grid
              item
              xs={12}
              sm={12}
              height={{ xs: 300, md: "calc(50% - 8px)" }}
            >
              <ENERGYDemandIndicator slavesId={slavesId} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={6.6} height={{ xs: 400, md: "100%" }}>
          <ENERGYMachinePowerConsumption
            slavesId={slavesId}
            setSlavesId={setSlavesId}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnergyDashboard;
