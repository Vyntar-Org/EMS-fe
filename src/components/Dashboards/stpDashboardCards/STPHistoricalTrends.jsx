import React from "react";
import ReactApexChart from "react-apexcharts";
import CustomCard from "../../common/CustomCard";
import { Box, Typography } from "@mui/material";

const STPHistoricalTrends = ({ data, loading }) => {
  const options = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#0156A6", "#00B69B", "#F99C30", "#EF4444"],
    stroke: {
      curve: "smooth",
      width: 2,
    },
    xaxis: {
      categories: data?.categories || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#6B7280", fontSize: "10px" },
      },
      tickAmount: 5,
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "10px" },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "12px",
      markers: { radius: 12 },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "transparent",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: "#E5E7EB" } },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const series = data?.series || [];

  return (
    <CustomCard title="Historical Trends" loading={loading}>
      <Box sx={{ height: 220, width: "100%", overflow: "hidden" }}>
        {series.length > 0 ? (
          <ReactApexChart options={options} series={series} type="line" height="100%" />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Typography variant="caption" color="text.secondary">No data available</Typography>
          </Box>
        )}
      </Box>
    </CustomCard>
  );
};

export default STPHistoricalTrends;
