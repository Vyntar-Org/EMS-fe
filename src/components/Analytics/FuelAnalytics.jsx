import React, { useState, useMemo } from "react";
import { Box, Button, Grid, Typography, Stack } from "@mui/material";
import { RestartAlt, Search, AddCircleOutline } from "@mui/icons-material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { CustomDatePicker } from "../common/CustomDatePicker";
import dayjs from "dayjs";
import NoDataFound from "../common/errors/NoDataFound";
import ReactApexChart from "react-apexcharts";
import { Loading } from "../common/Loading";
import { basePickerStyles } from "../../helpers/common";
import { DUMMY_FUEL_MACHINES, FUEL_TREND_TAB_OPTIONS } from "../../constants/fuelMachineList";

const UNIQUE_PASTEL_BGS = [
  "rgba(1, 86, 166, 0.03)",
  "rgba(245, 213, 71, 0.05)",
  "rgba(76, 175, 80, 0.03)",
  "rgba(156, 39, 176, 0.03)",
];

const getDefaultDateRange = () => [dayjs().subtract(24, "hour"), dayjs()];

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
          options={FUEL_TREND_TAB_OPTIONS}
          onChange={(val) => handleFieldChange(comparisonId, "parameters", val)}
          value={payload?.parameters || ""}
          label="Select Parameters"
          size="small"
          sx={basePickerStyles}
        />
      </Grid>
      <Grid item xs={12} md={4} display="flex" gap={1} justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={() => handleSearch(comparisonId)}
          startIcon={<Search />}
          size="small"
          disableElevation
          sx={{ fontWeight: "bold", borderRadius: "8px", textTransform: "none" }}
        >
          Analyze
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => handleReset(comparisonId)}
          size="small"
          disableElevation
          sx={{ fontWeight: "bold", borderRadius: "8px" }}
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
            sx={{ fontWeight: "bold", borderRadius: "8px", textTransform: "none" }}
          >
            Cancel
          </Button>
        )}
      </Grid>
    </Grid>
  </Box>
);

const FuelAnalytics = () => {
  const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
  const [payloads, setPayloads] = useState({ 1: null });
  const [analyticsDataMap, setAnalyticsDataMap] = useState({});
  const [selectedParamsMap, setSelectedParamsMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [rowIds, setRowIds] = useState([1]);

  const handleFieldChange = (id, key, value) => {
    setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSearch = (id) => {
    const currentPayload = payloads[id];
    if (!currentPayload?.slave_id || !currentPayload?.parameters?.length) return;

    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    
    // Simulate API delay
    setTimeout(() => {
      // Generate dummy time-series data
      const now = dayjs();
      const data = Array.from({ length: 24 }, (_, i) => {
        const time = now.subtract(23 - i, "hour");
        const entry = { timestamp: time.toISOString() };
        currentPayload.parameters.forEach((p) => {
          if (p.value === "consumed") entry.consumed = Math.floor(Math.random() * 40) + 10;
          if (p.value === "refilled") entry.refilled = Math.random() > 0.8 ? Math.floor(Math.random() * 200) + 50 : 0;
          if (p.value === "temperature") entry.temperature = Math.floor(Math.random() * 10) + 22;
          if (p.value === "fuel_level") entry.fuel_level = Math.floor(Math.random() * 200) + 500;
        });
        return entry;
      });

      setAnalyticsDataMap((prev) => ({ ...prev, [id]: data }));
      setSelectedParamsMap((prev) => ({ ...prev, [id]: currentPayload.parameters }));
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
    }, 600);
  };

  const handleReset = (id, shouldRemoveRow = false) => {
    if (shouldRemoveRow && id !== 1) {
      setRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setPayloads((prev) => { const c = { ...prev }; delete c[id]; return c; });
      setAnalyticsDataMap((prev) => { const c = { ...prev }; delete c[id]; return c; });
      setSelectedParamsMap((prev) => { const c = { ...prev }; delete c[id]; return c; });
      setLoadingMap((prev) => { const c = { ...prev }; delete c[id]; return c; });
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

  const slaveOptions = DUMMY_FUEL_MACHINES.map((m) => ({ label: m.card_name, value: m.slave_id }));

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

      <Box sx={{ height: "calc(100% - 70px)", pt: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
        {rowIds.map((id, index) => {
          const rawAnalytics = analyticsDataMap[id];
          const currentSelectedParams = selectedParamsMap[id];
          const isLoading = loadingMap[id];
          const uniqueBgColor = UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];

          const chartSeries = currentSelectedParams?.map((p) => ({
            name: p.label,
            data: rawAnalytics?.map((d) => d[p.value]) || [],
          })) || [];

          const chartOptions = {
            chart: { type: "line", toolbar: { show: false }, zoom: { enabled: true } },
            stroke: { curve: "smooth", width: 2.5 },
            xaxis: {
              categories: rawAnalytics?.map((d) => dayjs(d.timestamp).format("HH:mm")) || [],
              labels: { style: { fontSize: "10px" } },
            },
            yaxis: { labels: { formatter: (val) => (val !== null ? val.toFixed(1) : "") } },
            tooltip: { shared: true, theme: "light" },
            legend: { position: "top", horizontalAlign: "left" },
            grid: { borderColor: "#f1f1f1" },
            colors: ["#0156A6", "#E11D48", "#1D7344", "#ed6c02"],
          };

          const deviceLabel = payloads[id]?.slave_id?.label || `Device ${id}`;

          return (
            <Box key={id} sx={{ p: 1.5, borderRadius: 3, bgcolor: uniqueBgColor, boxShadow: "0px 4px 12px rgba(0,0,0,0.02)" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "#0A223E" }}>
                {deviceLabel} Analysis (Simulation)
              </Typography>

              <DeviceFilterRow
                comparisonId={id}
                slaveOptions={slaveOptions.filter(o => !Object.values(payloads).some(p => p?.slave_id?.value === o.value && p !== payloads[id]))}
                payload={payloads[id]}
                handleFieldChange={handleFieldChange}
                handleSearch={handleSearch}
                handleReset={handleReset}
                showCancel={rowIds.length > 1}
              />

              <Box sx={{ height: 350 }}>
                {isLoading ? <Loading /> : !chartSeries.length ? <NoDataFound /> : (
                  <ReactApexChart options={chartOptions} series={chartSeries} type="line" height="100%" />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default FuelAnalytics;
