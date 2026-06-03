import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import CustomCard from "../../common/CustomCard";

const FuelStationSummary = ({ data }) => {
  const total = data?.total || 4;
  const online = data?.online || 4;
  const offline = data?.offline || 0;

  const chartOptions = {
    chart: {
      type: "donut",
    },
    labels: ["Online", "Offline"],
    colors: ["#2E7D32", "#D32F2F"], // Green and Red
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: "#595959",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              color: "#0A223E",
              offsetY: 5,
              formatter: () => total,
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              fontWeight: 600,
              color: "#595959",
              formatter: () => total,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      show: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: "light",
      onDatasetHover: {
        highlightDataSeries: true,
      },
    },
    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: "none",
        },
      },
    },
  };

  const chartSeries = [online, offline];

  return (
    <CustomCard title="Fuel Station">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          height: "100%",
          py: 1,
        }}
      >
        <Box sx={{ width: 180, overflow: "hidden" }}>
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            height={125}
          />
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#2E7D32",
              }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Online - {online}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#D32F2F",
              }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Offline - {offline}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </CustomCard>
  );
};

export default FuelStationSummary;
