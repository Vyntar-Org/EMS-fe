import React from "react";
import ReactApexChart from "react-apexcharts";
import CustomCard from "../../common/CustomCard";
import { Box, Typography } from "@mui/material";

const STPWaterComparison = ({ data, loading }) => {
  const options = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    colors: ["#0156A6", "#00B69B"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#304758"],
        fontWeight: "bold",
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: data?.categories || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
       title: {
        text: "Day",
        style: { color: "#6B7280", fontSize: "12px" },
      },
    },
    yaxis: {
      title: {
        text: "KL",
      },
    },
    grid: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " KL";
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
  };

  const series = data?.series || [];

  return (
    <CustomCard title="water comparison" loading={loading}>
      <Box sx={{ height: 220, width: "100%", overflow: "hidden" }}>
        {series.length > 0 ? (
          <ReactApexChart options={options} series={series} type="bar" height="100%" />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Typography variant="caption" color="text.secondary">No data available</Typography>
          </Box>
        )}
      </Box>
    </CustomCard>
  );
};

export default STPWaterComparison;
