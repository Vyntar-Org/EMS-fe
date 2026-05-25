import React, { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../helpers/apiUrls";
import { api } from "../../helpers/api";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { CustomSelect } from "../common/CustomSelect";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import {
  BatteryStd,
  DownloadForOffline,
  Insights,
  Thermostat,
  WaterDrop,
} from "@mui/icons-material";
import NoDataFound from "../common/errors/NoDataFound";
import CustomCard from "../common/CustomCard";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";
import { formatTimestamp } from "../../helpers/common";
import { useApplications } from "../../contexts/ApplicationContext";
import { useCommonData } from "../../contexts/CommonDataContext";
import Papa from "papaparse";
import PremiumModal from "../common/PremiumModal";
import ReactApexChart from "react-apexcharts";
import { Loading } from "../common/Loading";
import { TEMPERATURE_TREND_TAB_OPTIONS } from "../../constants/temperatureMachineList";
import TemperatureMachineListSkeleton from "../skeletonLoaders/TemperatureMachineListSkeleton";

const getMachineSlaveId = (machine) => machine?.slave_id ?? machine?.id;

const MachineListHeader = ({
  slaveOptions,
  setSlavesId,
  slavesId,
  handleDownload,
  isDownloadDisabled,
}) => {
  return (
    <Box
      sx={{
        pb: 1,
        borderBottom: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Box sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}>
          <CustomAutocomplete
            options={slaveOptions}
            onChange={(option) =>
              setSlavesId(
                option?.value === undefined || option?.value === null
                  ? null
                  : option.value,
              )
            }
            value={slavesId ?? ""}
            label="Search Devices..."
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
        </Box>

        <Tooltip title="Download Report">
          <span>
            <IconButton
              size="large"
              disabled={isDownloadDisabled}
              color="primary"
              onClick={handleDownload}
              sx={{ width: 36, height: 36 }}
            >
              <DownloadForOffline sx={{ width: 36, height: 36 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

const TemperatureMetricBlock = ({
  label,
  status,
  temperature,
  humidity,
  battery,
  deviceUid,
  slaveIndex,
  lastUpdated,
  handleOpenModal,
}) => {
  const isOnline = status?.toLowerCase() === "online";

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: isOnline ? "#e8f5e9" : "#f2f2f2",
        borderRadius: "16px",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box width="calc(100% - 65px)">
          <ResponsiveTextWrapper
            value={label}
            variant="h6"
            fontWeight="bold"
            color="text.primary"
          />
        </Box>

        <Chip
          label={status?.toUpperCase()}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: "bold",
            color: isOnline ? "success.main" : "error.main",
            borderColor: isOnline ? "success.main" : "error.main",
          }}
        />
      </Stack>

      {lastUpdated && (
        <ResponsiveTextWrapper
          value={formatTimestamp(lastUpdated)}
          color="#595959"
          fontWeight="bold"
          fontSize="16px"
          sx={{ mb: 1, display: "block" }}
        />
      )}

      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.03)",
          borderRadius: 1,
          mb: 1,
          width: "100%",
        }}
      >
        <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  border: 0,
                  width: { xs: "50%", lg: "60%" },
                }}
              >
                <ResponsiveTextWrapper
                  fontSize="16px"
                  fontWeight="bold"
                  value="Parameter"
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: "bold",
                  border: 0,
                  width: { xs: "50%", lg: "40%" },
                }}
              >
                <ResponsiveTextWrapper
                  fontSize="16px"
                  fontWeight="bold"
                  value="Value"
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              {
                name: "Temperature",
                value: `${Number(temperature ?? 0).toFixed(2)} °C`,
                Icon: Thermostat,
                color: "#d32f2f",
              },
              {
                name: "Humidity",
                value: `${Number(humidity ?? 0).toFixed(1)} %`,
                Icon: WaterDrop,
                color: "#1976d2",
              },
              {
                name: "Battery",
                value: `${Number(battery ?? 0).toFixed(2)} V`,
                Icon: BatteryStd,
                color: "#2e7d32",
              },
            ].map((row) => {
              const RowIcon = row.Icon;
              return (
                <TableRow key={row.name}>
                  <TableCell
                    sx={{ border: 0, py: 0.5, width: { xs: "50%", lg: "60%" } }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <RowIcon
                        sx={{
                          fontSize: "14px",
                          color: row.color,
                          mr: 1,
                          flexShrink: 0,
                        }}
                      />
                      <Box width="calc(100% - 14px - 8px)">
                        <ResponsiveTextWrapper
                          fontSize="14px"
                          color="#333333"
                          fontWeight="bold"
                          value={row.name}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ border: 0, py: 0.5, width: { xs: "50%", lg: "40%" } }}
                  >
                    <ResponsiveTextWrapper
                      fontSize="14px"
                      color="#333333"
                      fontWeight="bold"
                      value={row.value}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ mb: 0.5 }} />

      <Button
        onClick={handleOpenModal}
        size="small"
        startIcon={<Insights />}
        disableElevation
        variant="contained"
        fullWidth
        sx={{
          fontWeight: "bold",
          borderRadius: "16px",
        }}
      >
        TREND
      </Button>
    </Box>
  );
};

const handleDownload = (filteredMachines, selectedApp) => {
  const headers = [
    "Room Name",
    "ID",
    "Device UID",
    "Slave Index",
    "Status",
    "Temperature (°C)",
    "Humidity (%)",
    "Battery (V)",
    "Last Updated",
  ];

  const rows = filteredMachines.map((machine) => [
    machine.name || "N/A",
    machine.id ?? "N/A",
    machine.device_uid || "N/A",
    machine.slave_index ?? "N/A",
    machine.status || "N/A",
    Number(machine.temperature ?? 0).toFixed(2),
    Number(machine.humidity ?? 0).toFixed(1),
    Number(machine.battery ?? 0).toFixed(2),
    machine.last_updated ? formatTimestamp(machine.last_updated) : "N/A",
  ]);

  const csvContent = Papa.unparse({
    fields: headers,
    data: rows,
  });

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${selectedApp}_machine_list_${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ModalContentForTrend = ({ handleTabChange, tab, slaveId, slaveName }) => {
  const [chartResponse, setChartResponse] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchTrendModalChartData = async (parameter) => {
    if (!slaveId || !parameter) {
      setChartResponse(null);
      return;
    }

    try {
      setChartLoading(true);
      const res = await api.get(
        API_URLS.TEMPERATURE_MACHINE_LIST_TREND(slaveId, parameter),
      );
      if (res?.success) {
        setChartResponse({
          data: res?.data?.data || [],
          unit: res?.meta?.unit || "",
        });
      }
    } catch (error) {
      console.error("Temperature trend API failed:", error);
      setChartResponse(null);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendModalChartData(tab);
  }, [tab, slaveId]);

  const chartOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    markers: {
      size: 0,
    },
    grid: {
      borderColor: "#ebe5e5",
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      title: {
        text: "Time",
        style: { color: "#6B7280", fontSize: "12px" },
      },
      categories: chartResponse?.data?.map((item) =>
        new Date(item.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      ),
      labels: {
        style: { colors: "#6B7280", fontSize: "11px" },
        rotate: -45,
        formatter: (val) => val,
      },
      tickAmount: 6,
      tooltip: { enabled: false },
    },
    yaxis: {
      title: {
        text: chartResponse?.unit || "",
        style: { color: "#6B7280", fontSize: "12px" },
      },
      labels: {
        style: { colors: "#6B7280", fontSize: "11px" },
      },
    },
    tooltip: {
      enabled: true,
      theme: "light",
      style: { fontSize: "12px" },
      shared: true,
      intersect: false,
      custom: function ({ series, dataPointIndex, w }) {
        let originalDate = "";
        const targetArray = chartResponse?.data || [];

        if (targetArray[dataPointIndex]) {
          const timestamp = targetArray[dataPointIndex]?.timestamp || "";
          if (timestamp) {
            const date = new Date(timestamp);
            originalDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
          }
        }

        let tooltipContent = `
        <div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <div style="font-weight: bold; margin-bottom: 8px; color: #6B7280; font-size: 13px; padding: 6px 10px; background-color: #f4f7f6; border-radius: 4px;">${originalDate}</div>
      `;

        w.globals.seriesNames.forEach((name, index) => {
          const value = series[index][dataPointIndex];
          const color = w.config.series[index]?.color || "#4A90E2";
          tooltipContent += `
          <div style="display: flex; align-items: center; margin-bottom: 6px; padding: 0 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
            <span style="flex: 1; color: #4B5563; font-size: 12px;">${name}:</span>
            <span style="font-weight: bold; color: #1F2937; margin-left: 15px; font-size: 12px;">${value !== undefined ? value : "N/A"}</span>
          </div>`;
        });

        tooltipContent += "</div>";
        return tooltipContent;
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "center",
    },
  };

  const activeTab = TEMPERATURE_TREND_TAB_OPTIONS.find((t) => t.tab === tab);
  const chartSeries = [
    {
      name: `${slaveName} ${activeTab?.label || ""}`,
      data: chartResponse?.data?.map((item) => item.value),
      color: "#4A90E2",
    },
  ];

  return (
    <>
      <Box width={{ xs: "100%", sm: 200 }}>
        <CustomSelect
          label="Parameter"
          value={tab}
          size="small"
          fullWidth
          options={TEMPERATURE_TREND_TAB_OPTIONS.map((option) => ({
            value: option.tab,
            label: option.label,
          }))}
          onChange={(e) => {
            const selected = TEMPERATURE_TREND_TAB_OPTIONS.find(
              (t) => t.tab === e.target.value,
            );
            if (!selected) return;
            handleTabChange(selected.tab, selected.tabDesc);
          }}
        />
      </Box>

      <Box height={355} mt={1}>
        {chartLoading ? (
          <Loading />
        ) : chartResponse?.data?.length ? (
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="line"
            height={350}
            width="100%"
          />
        ) : (
          <NoDataFound />
        )}
      </Box>
    </>
  );
};

const TemperatureMachineList = () => {
  const { slavesData } = useCommonData();
  const { selectedApp } = useApplications();
  const [machineListData, setMachineListData] = useState(null);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalDetails, setModalDetails] = useState(null);

  const machines = machineListData?.machines || [];

  const filteredMachines = useMemo(() => {
    if (slavesId == null || slavesId === "" || !machines.length)
      return machines;
    return machines.filter(
      (m) => String(getMachineSlaveId(m)) === String(slavesId),
    );
  }, [machines, slavesId]);

  const handleTabChange = (tab, tabDesc) => {
    setModalDetails((prev) => ({
      ...prev,
      tab,
      tabDesc,
    }));
  };

  const handleOpenModal = (item) => {
    setModalDetails({
      isOpen: true,
      data: item,
      tab: "temperature",
      tabDesc: "Last 6 hours Temperature data",
    });
  };

  const handleCloseModal = () => {
    setModalDetails(null);
  };

  const fetchMachineListData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(API_URLS.TEMPERATURE_MACHINE_LIST_DATA);
      if (res?.success) {
        setMachineListData(res?.data);
      }
    } catch (error) {
      console.error("Temperature machine list fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachineListData();
  }, []);

  return (
    <>
      <Box
        sx={{
          height: {
            xs: "calc(100vh - 56px - 16px)",
            sm: "calc(100vh - 64px - 16px)",
          },
        }}
      >
        <MachineListHeader
          slaveOptions={
            slavesData?.map((f) => ({
              label: f?.slave_name,
              value: f?.slave_id,
            })) ?? []
          }
          setSlavesId={setSlavesId}
          slavesId={slavesId}
          handleDownload={() => handleDownload(filteredMachines, selectedApp)}
          isDownloadDisabled={!Boolean(filteredMachines?.length)}
        />

        <Grid container height="calc(100% - 44px - 8px)" pt={1} overflow="auto">
          <Grid item xs={12}>
            {isLoading ? (
              <TemperatureMachineListSkeleton />
            ) : filteredMachines?.length ? (
              <Grid container rowGap={1} columnSpacing={1}>
                {filteredMachines.map((mc) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={`temperature-machine-${mc.id}`}
                  >
                    <CustomCard childrenOtherProps={{ height: "100%" }}>
                      <TemperatureMetricBlock
                        label={mc?.name || ""}
                        status={mc?.status}
                        temperature={mc?.temperature}
                        humidity={mc?.humidity}
                        battery={mc?.battery}
                        deviceUid={mc?.device_uid}
                        slaveIndex={mc?.slave_index}
                        lastUpdated={mc?.last_updated}
                        handleOpenModal={() => handleOpenModal(mc)}
                      />
                    </CustomCard>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <NoDataFound />
            )}
          </Grid>
        </Grid>
      </Box>

      <PremiumModal
        open={Boolean(modalDetails?.isOpen)}
        onClose={handleCloseModal}
        title={`${modalDetails?.data?.name} - ${modalDetails?.tabDesc}`}
        confirmText={null}
        cancelText={null}
      >
        {Boolean(modalDetails?.isOpen) ? (
          <ModalContentForTrend
            handleTabChange={handleTabChange}
            tab={modalDetails?.tab}
            slaveId={getMachineSlaveId(modalDetails?.data)}
            slaveName={modalDetails?.data?.name}
          />
        ) : null}
      </PremiumModal>
    </>
  );
};

export default TemperatureMachineList;
