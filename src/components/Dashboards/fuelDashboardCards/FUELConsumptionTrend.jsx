import React, { useState } from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup, Stack } from "@mui/material";
import { BarChart, Timeline } from "@mui/icons-material";
import ReactApexChart from "react-apexcharts";
import CustomCard from "../../common/CustomCard";

const FuelConsumptionTrend = ({ deviceName, dateRange, data = [] }) => {
  const [chartType, setChartType] = useState("bar");

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const chartOptions = {
    chart: {
      type: chartType,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "25%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: chartType === "line" ? 3 : 0,
    },
    colors: ["#0156A6"],
    xaxis: {
      categories: data.map((item) => item.date),
      title: {
        text: "Date",
        style: { fontWeight: 700, color: "#595959" },
      },
      labels: {
        style: { fontSize: "11px", fontWeight: 500 },
      },
    },
    yaxis: {
      title: {
        text: "Fuel Consumed (Ltrs.)",
        style: { fontWeight: 700, color: "#595959" },
      },
      labels: {
        style: { fontSize: "11px", fontWeight: 500 },
      },
    },
    markers: {
      size: chartType === "line" ? 4 : 0,
      hover: {
        size: 6,
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      strokeDashArray: 4,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: "light",
      x: {
        show: true,
      },
      y: {
        formatter: (val) => `${val} Ltrs.`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Consumption",
      data: data.map((item) => item.value),
    },
  ];

  return (
    <CustomCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#0A223E" }}>
          {deviceName}, {dateRange}
        </Typography>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "8px !important",
              mx: 0.5,
              p: 0.5,
              bgcolor: "rgba(0,0,0,0.04)",
              "&.Mui-selected": {
                bgcolor: "#0156A6",
                color: "#fff",
                "&:hover": { bgcolor: "#014585" },
              },
            },
          }}
        >
          <ToggleButton value="bar">
            <BarChart sx={{ fontSize: 20 }} />
          </ToggleButton>
          <ToggleButton value="line">
            <Timeline sx={{ fontSize: 20 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flexGrow: 1, px: 1, pb: 1 }}>
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type={chartType}
          height={500}
        />
      </Box>
    </CustomCard>
  );
};

export default FuelConsumptionTrend;
