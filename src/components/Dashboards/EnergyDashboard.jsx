import { Box, Grid } from "@mui/material";
import React from "react";
import CustomCard from "../common/CustomCard";
import { EnergySavingsLeafOutlined } from "@mui/icons-material";
import { api } from "../../helpers/api";

const EnergyDashboard = () => {
  return (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid container spacing={1} height={{ sm: "500px", md: "200px" }}>
        <Grid item xs={12} sm={4} md={2.2}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={8} md={3.2}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={4} md={2.2}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={4} md={2.2}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={4} md={2.2}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
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
            <Grid item xs={12} sm={12}>
              <CustomCard
                titleIcon={<EnergySavingsLeafOutlined />}
                title="Energy Dashboard"
              >
                wd
              </CustomCard>
            </Grid>
            <Grid item xs={12} sm={12}>
              <CustomCard
                titleIcon={<EnergySavingsLeafOutlined />}
                title="Energy Dashboard"
              >
                wd
              </CustomCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={6.6}>
          <CustomCard
            titleIcon={<EnergySavingsLeafOutlined />}
            title="Energy Dashboard"
          >
            wd
          </CustomCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnergyDashboard;
