import dayjs from "dayjs";
import React, { useState } from "react";
import {
  basePickerStyles,
  downAnalyticsSampleData,
} from "../../helpers/common";
import { WATER_LOG_COLUMN_MAPPING } from "../../constants/waterLogs";
import { Box, Button, Grid, Typography } from "@mui/material";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { RestartAlt, Search } from "@mui/icons-material";
import { useCommonData } from "../../contexts/CommonDataContext";
import { API_URLS } from "../../helpers/apiUrls";
import { api } from "../../helpers/api";
import { UNIQUE_PASTEL_BGS } from "../../constants/energyAnalytics";
import { Loading } from "../common/Loading";
import NoDataFound from "../common/errors/NoDataFound";
import ReactApexChart from "react-apexcharts";

const getDefaultDateRange = () => [dayjs().subtract(24, "hour"), dayjs()];

const getProcessedChartData = (rawAnalytics, activeKeys) => {
  if (!rawAnalytics?.data || rawAnalytics.data.length === 0) {
    return { series: [], categories: [] };
  }

  const rawData = rawAnalytics.data;
  const maxPoints = 1200;

  const series = activeKeys.map((key) => {
    const sampledDataPoints = downAnalyticsSampleData(rawData, maxPoints, key);
    return {
      name: WATER_LOG_COLUMN_MAPPING[key] || key,
      data: sampledDataPoints.map((row) => row[key] ?? null),
    };
  });

  const baseSampledData = downAnalyticsSampleData(
    rawData,
    maxPoints,
    activeKeys[0] || "timestamp",
  );
  const categories = baseSampledData.map((item) =>
    item.timestamp ? dayjs(item.timestamp).format("DD MMM HH:mm") : "",
  );

  return { series, categories };
};

const GlobalFiltersRow = ({ dateTime, onDateChange, addNewComparisonRow }) => (
  <Box
    sx={{
      pb: 2,
      borderBottom: "1px dashed",
      borderColor: "divider",
      display: "flex",
      gap: 2,
    }}
  >
    <Grid container alignItems="end" spacing={2}>
      <Grid item xs={12} md={8} lg={6}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 0.5, color: "text.secondary" }}
        >
          Global Date/Time
        </Typography>
        <CustomDatePicker
          mode="datetimerangepicker"
          onChange={onDateChange}
          value={dateTime || ""}
        />
      </Grid>

      <Grid item xs={12} sm="auto" ml="auto">
        <Button
          fullWidth
          size="large"
          disableElevation
          sx={{
            fontWeight: "bold",
            borderRadius: "16px",
          }}
          variant="contained"
          color="secondary"
          onClick={addNewComparisonRow}
        >
          + Add Device To Compare
        </Button>
      </Grid>
    </Grid>
  </Box>
);

const DeviceFilterRow = ({
  comparisonId,
  slaveOptions,
  payload,
  handleFieldChange,
  handleSearch,
  handleReset,
  showCancel,
  parameterOptions,
}) => (
  <Box sx={{ py: 1.5, px: 2, bgcolor: "#fff", borderRadius: 2, mb: 1 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={3.5}>
        <CustomAutocomplete
          options={slaveOptions}
          onChange={(val) => handleFieldChange(comparisonId, "slave_id", val)}
          value={payload?.slave_id || ""}
          label="Select Device"
          size="small"
          sx={basePickerStyles}
        />
      </Grid>
      <Grid item xs={12} md={4.5}>
        <CustomAutocomplete
          multiple
          options={parameterOptions}
          onChange={(val) => handleFieldChange(comparisonId, "parameters", val)}
          value={payload?.parameters || ""}
          label="Select Parameters"
          size="small"
          sx={basePickerStyles}
        />
      </Grid>
      <Grid
        item
        xs={12}
        md={4}
        display="flex"
        gap={1}
        justifyContent="flex-end"
      >
        <Button
          variant="contained"
          onClick={() => handleSearch(comparisonId)}
          startIcon={<Search />}
          size="small"
          disableElevation
          sx={{
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          Analyze
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => handleReset(comparisonId)}
          size="small"
          disableElevation
          sx={{
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          <RestartAlt fontSize="small" />
        </Button>
        {showCancel && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleReset(comparisonId, true)}
            size="small"
            disableElevation
            sx={{
              fontWeight: "bold",
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>
        )}
      </Grid>
    </Grid>
  </Box>
);

const WaterAnalytics = () => {
  const { slavesData, parametersData } = useCommonData();
  const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
  const [payloads, setPayloads] = useState({ 1: null });
  const [analyticsDataMap, setAnalyticsDataMap] = useState({});
  const [selectedParamsMap, setSelectedParamsMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [rowIds, setRowIds] = useState([1]);

  const handleFieldChange = (id, key, value) => {
    setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSearch = async (id) => {
    const currentPayload = payloads[id];
    if (!currentPayload?.slave_id) return;

    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    try {
      const slaveId = currentPayload.slave_id?.value ?? "";
      const parameterValues = currentPayload.parameters
        ? currentPayload.parameters
            .map((p) => p?.value)
            .filter(Boolean)
            .join(",")
        : "";

      const startDateObj = globalDateTime?.[0];
      const endDateObj = globalDateTime?.[1];
      const formattedStart = startDateObj?.isValid?.()
        ? startDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
        : "";
      const formattedEnd = endDateObj?.isValid?.()
        ? endDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
        : "";

      const newApiUrl = API_URLS.WATER_ANALYTICS_DATA(
        slaveId,
        parameterValues,
        formattedStart,
        formattedEnd,
      );
      const res = await api.get(newApiUrl);
      if (res?.success) {
        setAnalyticsDataMap((prev) => ({ ...prev, [id]: res.data }));
        setSelectedParamsMap((prev) => ({
          ...prev,
          [id]: currentPayload.parameters,
        }));
      }
    } catch (error) {
      console.error(`API Error on row ${id}:`, error);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReset = (id, shouldRemoveRow = false) => {
    if (shouldRemoveRow && id !== 1) {
      setRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setPayloads((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
      setAnalyticsDataMap((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
      setSelectedParamsMap((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
      setLoadingMap((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
    } else {
      setPayloads((prev) => ({ ...prev, [id]: null }));
      setAnalyticsDataMap((prev) => ({ ...prev, [id]: null }));
      setSelectedParamsMap((prev) => ({ ...prev, [id]: null }));
    }
  };

  const addNewComparisonRow = () => {
    const nextId = Math.max(...rowIds, 0) + 1;
    setRowIds((prev) => [...prev, nextId]);
  };

  const slaveOptions =
    slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
    [];

  return (
    <Box
      sx={{
        height: {
          xs: "calc(100vh - 56px - 16px)",
          sm: "calc(100vh - 64px - 16px)",
        },
      }}
    >
      <GlobalFiltersRow
        dateTime={globalDateTime}
        onDateChange={(val) => setGlobalDateTime(val)}
        addNewComparisonRow={addNewComparisonRow}
      />

      <Box
        height={{ xs: "calc(100% - 141px)", md: "calc(100% - 82px)" }}
        pt={1}
        overflow="auto"
        display="flex"
        flexDirection="column"
        gap={1}
      >
        {rowIds.map((id, index) => {
          const rawAnalytics = analyticsDataMap[id];
          const currentSelectedParams = selectedParamsMap[id];
          const isLoading = loadingMap[id];

          const activeKeys =
            currentSelectedParams?.flatMap((param) =>
              param.value ? param.value.split(",") : [],
            ) || [];

          const processedData = getProcessedChartData(rawAnalytics, activeKeys);

          const selectedDeviceIdsInOtherRows = Object.keys(payloads)
            .filter((rowId) => Number(rowId) !== id)
            .map((rowId) => payloads[rowId]?.slave_id?.value)
            .filter(Boolean);

          const filteredSlaveOptions = slaveOptions.filter(
            (option) => !selectedDeviceIdsInOtherRows.includes(option.value),
          );

          const uniqueBgColor =
            UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];

          const performanceChartOptions = {
            chart: {
              type: "line",
              zoom: { enabled: true },
              toolbar: { show: false },
            },
            dataLabels: { enabled: false },
            markers: { size: 0, hover: { sizeOffset: 4 } },
            stroke: { curve: "straight", width: 1.5 },
            xaxis: {
              categories: processedData.categories,
              labels: { rotate: -45, style: { fontSize: "10px" } },
              tooltip: { enabled: false },
            },
            yaxis: {
              labels: {
                formatter: (val) => (val !== null ? val.toFixed(2) : ""),
              },
            },
            tooltip: { shared: true, intersect: false },
            legend: { position: "top", horizontalAlign: "left" },
            grid: { borderColor: "#f1f1f1" },
          };

          const deviceLabel =
            payloads[id]?.slave_id?.label || `Device Segment ${id}`;

          return (
            <Box
              key={id}
              sx={{
                p: 1,
                borderRadius: 3,
                bgcolor: uniqueBgColor,
                transition: "background-color 0.3s ease",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.02)",
                // height: "100%",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {deviceLabel} Analysis{" "}
                {rawAnalytics?.data?.length > 1200 &&
                  `(Downsampled from ${rawAnalytics.data.length} points)`}
              </Typography>

              <DeviceFilterRow
                comparisonId={id}
                slaveOptions={filteredSlaveOptions}
                payload={payloads[id]}
                handleFieldChange={handleFieldChange}
                handleSearch={handleSearch}
                handleReset={handleReset}
                showCancel={rowIds.length > 1}
                parameterOptions={parametersData}
              />

              <Box sx={{ height: { xs: 500, sm: 380 } }}>
                {isLoading ? (
                  <Loading />
                ) : !processedData.series.length ? (
                  <NoDataFound />
                ) : (
                  <ReactApexChart
                    options={performanceChartOptions}
                    series={processedData.series}
                    type="line"
                    height="100%"
                    width="100%"
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default WaterAnalytics;
