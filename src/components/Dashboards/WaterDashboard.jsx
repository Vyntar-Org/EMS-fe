import React, { useEffect, useState } from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import { API_URLS } from "../../helpers/apiUrls";
import { api } from "../../helpers/api";
import { Box, Grid } from "@mui/material";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";
import CustomCard from "../common/CustomCard";
import NoDataFound from "../common/errors/NoDataFound";
import { LocalDrink, Water, WaterDrop } from "@mui/icons-material";
import WATERMonthlyConsumption from "./waterDashboardCards/WATERMonthlyConsumption";
import WaterDashboardSkeleton from "../skeletonLoaders/WaterDashboardSkeleton";

const MetricBlock = ({ icon, label, value, yesterdayVal }) => (
  <Grid
    item
    xs={12}
    sx={{
      display: "flex",
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}
  >
    {icon && icon}

    {label && (
      <ResponsiveTextWrapper
        color="#0A223E"
        fontWeight={700}
        value={label}
        align="center"
        mt={1}
      />
    )}

    <ResponsiveTextWrapper
      fontSize="20px"
      fontWeight={800}
      mt={1}
      value={`${value?.toLocaleString() || 0} KLD`}
      align="center"
      color="#0156A6"
    />

    {yesterdayVal ? (
      <ResponsiveTextWrapper
        fontSize="12px"
        color="text.secondary"
        fontWeight={800}
        mt={1}
        value={`Yesterday ${yesterdayVal?.toLocaleString() || 0} KLD`}
        align="center"
      />
    ) : null}
  </Grid>
);

const WaterDashboard = () => {
  const { slavesData } = useCommonData();
  const [overviewData, setOverviewData] = useState(null);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardOverviewData = async () => {
    setIsLoading(true);
    try {
      const getOverviewRes = await api.get(API_URLS.WATER_DASHBOARD_OVERVIEW);
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
  }, [slavesData]);

  return isLoading ? (
    <WaterDashboardSkeleton />
  ) : (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid container spacing={1} height={{ sm: "350px", md: "200px" }}>
        <Grid item xs={12} sm={4} md={2.4}>
          <CustomCard
            titleIcon={!overviewData?.raw_water_inlet && <Water />}
            title={!overviewData?.raw_water_inlet && "Raw Water Inlet"}
          >
            {overviewData?.raw_water_inlet ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                <MetricBlock
                  label="Raw Water Inlet"
                  value={overviewData?.raw_water_inlet?.current || 0}
                  yesterdayVal={overviewData?.raw_water_inlet?.previous || 0}
                  icon={<Water />}
                />
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={4} md={2.4}>
          <CustomCard
            titleIcon={!overviewData?.raw_water_outlet && <Water />}
            title={!overviewData?.raw_water_outlet && "Raw Water Outlet"}
          >
            {overviewData?.raw_water_outlet ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                <MetricBlock
                  label="Raw Water Outlet"
                  value={overviewData?.raw_water_outlet?.current || 0}
                  yesterdayVal={overviewData?.raw_water_outlet?.previous || 0}
                  icon={<Water />}
                />
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={4} md={2.4}>
          <CustomCard
            titleIcon={!overviewData?.filter_water_outlet && <Water />}
            title={!overviewData?.filter_water_outlet && "Filter Water Outlet"}
          >
            {overviewData?.filter_water_outlet ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                <MetricBlock
                  label="Filter Water Outlet"
                  value={overviewData?.filter_water_outlet?.current || 0}
                  yesterdayVal={
                    overviewData?.filter_water_outlet?.previous || 0
                  }
                  icon={<Water />}
                />
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <CustomCard
            titleIcon={!overviewData?.drinking_ro && <LocalDrink />}
            title={!overviewData?.drinking_ro && "Drinking RO"}
          >
            {overviewData?.drinking_ro ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                <MetricBlock
                  label="Drinking RO"
                  value={overviewData?.drinking_ro?.current || 0}
                  yesterdayVal={overviewData?.drinking_ro?.previous || 0}
                  icon={<LocalDrink />}
                />
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <CustomCard
            titleIcon={!overviewData?.water_positivity && <WaterDrop />}
            title={!overviewData?.water_positivity && "Water Positivity"}
          >
            {overviewData?.water_positivity ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                <MetricBlock
                  label="Water Positivity"
                  value={overviewData?.water_positivity?.current || 0}
                  yesterdayVal={overviewData?.water_positivity?.previous || 0}
                  icon={<WaterDrop />}
                />
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        sx={{ mt: 0 }}
        height={{ md: "calc(100% - 200px)" }}
      >
        <Grid item xs={12} sm={12} md={2.4} height={{ md: "100%" }}>
          <Grid
            container
            rowGap={1}
            spacing={{ sm: 1, md: 0 }}
            height={{ md: "100%" }}
          >
            <Grid item xs={12} sm={4} md={12} height={{ xs: 165, md: "33%" }}>
              <CustomCard title={!overviewData?.sewage_inlet && "Sewage Inlet"}>
                {overviewData?.sewage_inlet ? (
                  <Grid
                    container
                    sx={{ height: "100%", width: "100%" }}
                    alignItems="center"
                  >
                    <MetricBlock
                      label="Sewage Inlet"
                      value={overviewData?.sewage_inlet?.current || 0}
                      yesterdayVal={overviewData?.sewage_inlet?.previous || 0}
                    />
                  </Grid>
                ) : (
                  <NoDataFound />
                )}
              </CustomCard>
            </Grid>
            <Grid item xs={12} sm={4} md={12} height={{ xs: 165, md: "33%" }}>
              <CustomCard
                title={!overviewData?.sewage_outlet && "Sewage Outlet"}
              >
                {overviewData?.sewage_outlet ? (
                  <Grid
                    container
                    sx={{ height: "100%", width: "100%" }}
                    alignItems="center"
                  >
                    <MetricBlock
                      label="Sewage Outlet"
                      value={overviewData?.sewage_outlet?.current || 0}
                      yesterdayVal={overviewData?.sewage_outlet?.previous || 0}
                    />
                  </Grid>
                ) : (
                  <NoDataFound />
                )}
              </CustomCard>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              md={12}
              height={{ xs: 165, md: "calc(33% - 16px)" }}
            >
              <CustomCard
                title={!overviewData?.total_stations && "Total Stations"}
              >
                {overviewData?.total_stations ? (
                  <Grid
                    container
                    sx={{ height: "100%", width: "100%" }}
                    alignItems="center"
                  >
                    <MetricBlock
                      label="Total Stations"
                      value={overviewData?.total_stations || 0}
                    />
                  </Grid>
                ) : (
                  <NoDataFound />
                )}
              </CustomCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={9.6} height={{ xs: 400, md: "100%" }}>
          <WATERMonthlyConsumption
            slavesId={slavesId}
            setSlavesId={setSlavesId}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WaterDashboard;
