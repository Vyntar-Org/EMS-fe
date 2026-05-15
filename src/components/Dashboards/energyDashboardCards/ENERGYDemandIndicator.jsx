import React, { useEffect, useMemo, useState } from "react";
import CustomCard from "../../common/CustomCard";
import { api } from "../../../helpers/api";
import { API_URLS } from "../../../helpers/apiUrls";
import NoDataFound from "../../common/errors/NoDataFound";
import { useCommonData } from "../../../contexts/CommonDataContext";
import ReactApexChart from "react-apexcharts";
import { Box } from "@mui/material";

const ENERGYDemandIndicator = ({ slavesId }) => {
  const { slavesData } = useCommonData();
  const [demandIndicator, setDemandIndicator] = useState(null);

  const slavesDisplayName = useMemo(() => {
    if (!slavesData) return null;

    const slave = slavesData.find((s) => s.slave_id === slavesId);
    return slave ? ` - ${slave.slave_name}` : "";
  }, [slavesId, slavesData]);

  const fetchDemandIndicator = async () => {
    try {
      const getDemandIndicatorData = await api.get(
        `${API_URLS.EMS_DASHBOARD_DEMAND_INDICATOR}?slave_id=${slavesId || 0}`,
      );
      if (getDemandIndicatorData?.success) {
        setDemandIndicator(getDemandIndicatorData?.data);
      }
    } catch (error) {
      console.error("One of the API calls failed:", error);
    }
  };

  useEffect(() => {
    if (!slavesId) return;

    fetchDemandIndicator();
  }, [slavesId]);

  const seriesData = demandIndicator?.data?.map((item) => ({
    x: new Date(item.timestamp).getTime(),
    y: item.value,
  }));

  const options = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: true },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#2E4355"],
    },
    markers: {
      size: 5,
      colors: ["#C5D05D"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.2,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "HH:mm",
        style: { colors: "#9e9e9e" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: 14,
      tickAmount: 4,
      labels: {
        style: { colors: "#9e9e9e" },
      },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const val = series[seriesIndex][dataPointIndex];
        const time = new Date(
          w.globals.seriesX[seriesIndex][dataPointIndex],
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return `
        <div style="padding: 10px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
          <div style="font-weight: bold; margin-bottom: 5px;">${time}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="height: 10px; width: 10px; border-radius: 50%; background: #2E4355;"></span>
            <span>Peak Demand: <b>${val} kW</b></span>
          </div>
        </div>
      `;
      },
    },
    grid: { show: false },
  };

  const series = [
    {
      name: "Peak Demand",
      data: seriesData,
    },
  ];

  return (
    <CustomCard title={`Demand Indicator ${slavesDisplayName}`}>
      {demandIndicator && demandIndicator?.data?.length ? (
        <Box height="100%" width="100%" overflow="hidden">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height="100%"
            width="100%"
          />
        </Box>
      ) : (
        <NoDataFound />
      )}
    </CustomCard>
  );
};

export default ENERGYDemandIndicator;
