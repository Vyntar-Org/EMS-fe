import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import CustomCard from "../../common/CustomCard";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const CircularGauge = ({ label, value, unit, color }) => {
  const options = {
    chart: {
      type: "radialBar",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: "65%",
        },
        track: {
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 3,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: 4,
            fontSize: "12px",
            fontWeight: 800,
            color: "#0A223E",
            formatter: function (val) {
              return value;
            },
          },
        },
      },
    },
    fill: {
      colors: [color || "#0156A6"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: [label],
  };

  return (
    <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, color: "text.secondary", fontSize: "10px" }}>
        {label}
      </Typography>
      <Box sx={{ width: 80, height: 80, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        <ReactApexChart
          options={options}
          series={[70]} // Just for visualization, the value is displayed in dataLabels
          type="radialBar"
          height={90}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary", mt: -1.5, fontSize: "9px" }}>
        {unit}
      </Typography>
    </Box>
  );
};

const STPWaterQuality = ({ data }) => {
  const getApiData = (title) => {
    return Array.isArray(data) ? data.find((item) => item.title === title) : null;
  };

  const phData = getApiData("pH");
  const tdsData = getApiData("TDS");

  const qualityMetrics = [
    {
      label: "pH",
      value: phData?.value ?? 6.76,
      unit: phData?.unit || "mg/L",
      color: "#0156A6",
    },
    {
      label: "TDS",
      value: tdsData?.value ?? 3200,
      unit: tdsData?.unit || "ppm",
      color: "#0156A6",
    },
    { label: "COD", value: 0, unit: "mg/L", color: "#A5AAB5" },
    { label: "BOD", value: 0, unit: "mg/L", color: "#A5AAB5" },
    { label: "TSS", value: 0, unit: "mg/L", color: "#A5AAB5" },
  ];

  return (
    <CustomCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "100%",
          px: 1,
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 3, sm: 0 }
        }}
      >
        {qualityMetrics.map((metric, index) => (
          <Box key={index} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <CircularGauge {...metric} />
          </Box>
        ))}
      </Box>
    </CustomCard>
  );
};

export default STPWaterQuality;
