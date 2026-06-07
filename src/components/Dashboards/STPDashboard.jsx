import React, { useEffect, useState } from "react";
import { api } from "../../helpers/api";
import { API_URLS } from "../../helpers/apiUrls";
import { Box, Divider, Grid } from "@mui/material";
import CustomCard from "../common/CustomCard";
import NoDataFound from "../common/errors/NoDataFound";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import ReactApexChart from "react-apexcharts";
import { getChartOptions } from "../../helpers/chartConfig";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MetricBlock = ({ label, value, subLabel, showDivider }) => (
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
      value={`${value?.toLocaleString() || 0} KL`}
      align="center"
      color="#0156A6"
    />

    {subLabel ? (
      <ResponsiveTextWrapper
        fontSize="12px"
        color="text.secondary"
        fontWeight={800}
        mt={1}
        value={subLabel}
        align="center"
      />
    ) : null}

    {showDivider && (
      <Divider
        orientation="vertical"
        sx={{
          borderStyle: "dashed",
          height: "100%",
          position: "absolute",
          right: 0,
        }}
      />
    )}
  </Grid>
);

const STPDashboard = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardOverviewData = async () => {
    setIsLoading(true);
    try {
      const getOverviewRes = await api.get(API_URLS.STP_DASHBOARD_OVERVIEW);
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

  const summaryData = overviewData?.cards?.reduce((acc, card) => {
    if (card?.title) {
      const cleanKey = card.title.toLowerCase().trim().replace(/\s+/g, "_");

      acc[cleanKey] = card;
    }
    return acc;
  }, {});

  return isLoading ? null : (
    // <EnergyDashboardSkeleton />
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid container spacing={1} height={{ md: "350px" }}>
        <Grid item xs={12} md={6} height={{ md: "100%" }}>
          <Grid container height={{ md: "100%" }}>
            <Grid item xs={12} height={{ md: "50%" }}>
              <Grid container spacing={1} height={{ md: "100%" }}>
                <Grid item xs={12} sm={6} height={{ md: "100%" }}>
                  <CustomCard
                    sx={{ textAlign: "center" }}
                    title={summaryData?.intake_total && "Intake Total"}
                  >
                    {summaryData?.intake_total ? (
                      <Grid
                        container
                        sx={{ height: "100%", width: "100%" }}
                        alignItems="center"
                        spacing={0.5}
                      >
                        <Grid item xs={6} height={{ md: "100%" }}>
                          <MetricBlock
                            label="Total"
                            value={summaryData?.intake_total?.value || 0}
                            subLabel="(Waste Water)"
                            showDivider
                          />
                        </Grid>

                        <Grid item xs={6} height={{ md: "100%" }}>
                          <MetricBlock
                            label="Yesterday"
                            value={
                              summaryData?.intake_total?.previous_value || 0
                            }
                            subLabel="(Waste Water)"
                          />
                        </Grid>
                      </Grid>
                    ) : (
                      <NoDataFound />
                    )}
                  </CustomCard>
                </Grid>

                <Grid item xs={12} sm={6} height={{ md: "100%" }}>
                  <CustomCard
                    sx={{ textAlign: "center" }}
                    title={summaryData?.treated_water && "Treated Water"}
                  >
                    {summaryData?.treated_water ? (
                      <Grid
                        container
                        sx={{ height: "100%", width: "100%" }}
                        alignItems="center"
                        spacing={0.5}
                      >
                        <Grid item xs={6} height={{ md: "100%" }}>
                          <MetricBlock
                            label="Total"
                            value={summaryData?.treated_water?.value || 0}
                            subLabel="(Out)"
                            showDivider
                          />
                        </Grid>

                        <Grid item xs={6} height={{ md: "100%" }}>
                          <MetricBlock
                            label="Yesterday"
                            value={
                              summaryData?.treated_water?.previous_value || 0
                            }
                            subLabel="(Out)"
                          />
                        </Grid>
                      </Grid>
                    ) : (
                      <NoDataFound />
                    )}
                  </CustomCard>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} mt={{ xs: 1, md: 0 }} height={{ md: "50%" }}>
              <CustomCard>
                <Grid container sx={{ height: "100%", width: "100%" }}>
                  {[
                    { label: "pH", key: "ph" },
                    { label: "TDS", key: "tds" },
                    { label: "COD", key: "cod" },
                    { label: "BOD", key: "bod" },
                    { label: "TSS", key: "tss" },
                  ].map((item, ind) => {
                    return (
                      <Grid
                        xs={2.4}
                        height="100%"
                        key={`fuel-radial-${ind + 1}`}
                      >
                        <ReactApexChart
                          options={getChartOptions("radialBar", [], {
                            labels: [item.label],
                          })}
                          series={[summaryData?.[item.key]?.value || 0]}
                          type="radialBar"
                          height={150}
                          width="100%"
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </CustomCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs height={{ xs: 350, md: "100%" }}>
          <CustomCard title="Site Location Map">
            <MapContainer
              center={[9.9252, 78.1198]}
              zoom={14}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle
                center={[9.9252, 78.1198]}
                radius={400}
                pathOptions={{
                  color: "#38bdf8",
                  fillColor: "#38bdf8",
                  fillOpacity: 0.15,
                }}
              />
              <Marker position={[9.9252, 78.1198]}>
                <Popup>
                  <strong>Weather Station + Solar PV Site</strong>
                  <br />
                  Lat: {9.9252}
                  <br />
                  Lon: {78.1198}
                </Popup>
              </Marker>
            </MapContainer>
          </CustomCard>
        </Grid>
      </Grid>

      <Grid
        sx={{ mt: 0 }}
        container
        spacing={1}
        height={{ md: "calc(100% - 350px)" }}
      >
        <Grid item xs={12} sm={6} height={{ md: "100%" }}>
          <CustomCard title={!overviewData?.intake_total && "Raw Water Inlet"}>
            {overviewData?.intake_total ? (
              <Grid
                container
                sx={{ height: "100%", width: "100%" }}
                alignItems="center"
              >
                wd
                {/* <MetricBlock
                  label="Raw Water Inlet"
                  value={overviewData?.intake_total?.current || 0}
                  yesterdayVal={overviewData?.intake_total?.previous || 0}
                  icon={<Water />}
                /> */}
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} height={{ md: "100%" }}>
          <CustomCard title={!overviewData?.intake_total && "Raw Water Inlet"}>
            {overviewData?.intake_total ? (
              <></>
            ) : (
              //   <Grid
              //     container
              //     sx={{ height: "100%", width: "100%" }}
              //     alignItems="center"
              //   >
              //     wd
              //     {/* <MetricBlock
              //   label="Raw Water Inlet"
              //   value={overviewData?.intake_total?.current || 0}
              //   yesterdayVal={overviewData?.intake_total?.previous || 0}
              //   icon={<Water />}
              // /> */}
              //   </Grid>
              <NoDataFound />
            )}
          </CustomCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default STPDashboard;
