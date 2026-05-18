import React, { useState } from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { RestartAlt, Search } from "@mui/icons-material";
import {
  KEY_PARAMETER_OPTIONS_MAPPING,
  PARAMETER_OPTIONS,
} from "../../constants/energyAnalytics";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { api } from "../../helpers/api";
import { API_URLS } from "../../helpers/apiUrls";
import dayjs from "dayjs";
import NoDataFound from "../common/errors/NoDataFound";
import ReactApexChart from "react-apexcharts";

const AnalyticsHeader = ({ slaveOptions, handleSearch, handleReset }) => {
  const [payload, setPayload] = useState(null);

  const handleFieldCh = (key, value) => {
    setPayload((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Box
      sx={{
        pb: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Grid container gap={2} alignItems="center">
        <Grid item xs={12} sm md lg={3}>
          <CustomAutocomplete
            options={slaveOptions}
            onChange={(val) => handleFieldCh("slave_id", val)}
            value={payload?.slave_id || ""}
            label="Select Devices"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f9f9f9",
                transition: "0.3s",
                "&:hover": {
                  backgroundColor: "#fff",
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12} sm md lg={3}>
          <CustomAutocomplete
            multiple
            options={PARAMETER_OPTIONS}
            onChange={(val) => handleFieldCh("parameters", val)}
            value={payload?.parameters || ""}
            label="Select Parameters"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f9f9f9",
                transition: "0.3s",
                "&:hover": {
                  backgroundColor: "#fff",
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={4.5} lg>
          <CustomDatePicker
            mode="datetimerangepicker"
            onChange={(val) => handleFieldCh("dateTime", val)}
            value={payload?.dateTime || ""}
          />
        </Grid>

        <Grid item xs="auto" display="flex" gap={1} ml={{ xs: "auto", md: 0 }}>
          <Tooltip title="Search">
            <span>
              <Button
                variant="contained"
                onClick={() => handleSearch(payload)}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  p: 0,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: (theme) =>
                    theme.palette.primary.main || "#1976d2",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: (theme) =>
                      theme.palette.primary.dark || "#115293",
                  },
                }}
              >
                <Search sx={{ fontSize: 20, color: "#fff" }} />
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Reset">
            <span>
              <Button
                variant="contained"
                onClick={handleReset}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  p: 0,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: "#f5f5f5",
                  color: "#666666",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#e0e0e0",
                    color: "#333333",
                  },
                }}
              >
                <RestartAlt sx={{ fontSize: 20 }} />
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

const EnergyAnalytics = () => {
  const { slavesData } = useCommonData();
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedParameters, setSelectedParameters] = useState(null);

  const handleSearch = async (payload) => {
    if (!payload) return;

    setIsLoading(true);
    try {
      const slaveId = payload?.slave_id?.value ?? "";

      const parameterValues = payload?.parameters
        ? payload.parameters
            .map((p) => p?.value)
            .filter(Boolean)
            .join(",")
        : "";

      const startDateObj = payload?.dateTime?.[0];
      const endDateObj = payload?.dateTime?.[1];

      const formattedStart =
        startDateObj?.isValid && startDateObj.isValid()
          ? startDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
          : "";

      const formattedEnd =
        endDateObj?.isValid && endDateObj.isValid()
          ? endDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
          : "";

      const newApiUrl = API_URLS.EMS_ANALYTICS_DATA(
        slaveId,
        parameterValues,
        formattedStart,
        formattedEnd,
      );

      const res = await api.get(newApiUrl);
      if (res?.success) {
        setAnalyticsData(res?.data);
        setSelectedParameters(payload?.parameters);
      }
    } catch (error) {
      console.error("energy analytics api failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalyticsData(null);
    setSelectedParameters(null);
  };

  const activeKeys = selectedParameters?.flatMap((param) => {
    return param.value ? param.value.split(",") : [];
  });

  const chartSeries = activeKeys?.map((key) => {
    return {
      name: KEY_PARAMETER_OPTIONS_MAPPING[key] || key,
      data: analyticsData?.data?.map((row) => row[key] ?? null),
    };
  });

  const chartCategories = analyticsData?.data?.map((item) =>
    item.timestamp ? dayjs(item.timestamp).format("DD MMM HH:mm") : "",
  );

  const chartOptions = {
    chart: {
      type: "line",
      zoom: { enabled: true },
      toolbar: { show: false },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    xaxis: {
      categories: chartCategories,
      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
          colors: "#595959",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => (val !== null ? val.toFixed(2) : ""),
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        format: "dd MMM yyyy HH:mm:ss",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      offsetY: 0,
    },
    grid: {
      borderColor: "#f1f1f1",
    },
  };

  return (
    <Box
      sx={{
        height: {
          sm: "calc(100vh - 64px - 16px)",
        },
      }}
    >
      <AnalyticsHeader
        slaveOptions={slavesData?.map((f) => ({
          label: f?.slave_name,
          value: f?.slave_id,
        }))}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      <Box
        height={{
          sm: "calc(100% - 160px)",
          md: "calc(100% - 48px)",
        }}
        pt={1}
        overflow={{ sm: "auto" }}
        bgcolor={{
          ...(!isLoading && analyticsData?.data?.length
            ? { sm: "#f5f5f5" }
            : {}),
        }}
      >
        {isLoading ? (
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        ) : !analyticsData?.data?.length ? (
          <NoDataFound />
        ) : (
          <Box
            height={{ xs: 500, sm: "100%" }}
            width="100%"
            overflow={{ sm: "hidden" }}
          >
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="line"
              height="100%"
              width="100%"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EnergyAnalytics;
