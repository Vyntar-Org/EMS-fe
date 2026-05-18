import React, { useEffect, useMemo, useState } from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import { API_URLS } from "../../helpers/apiUrls";
import { api } from "../../helpers/api";
import EnergyMachineListSkeleton from "../skeletonLoaders/EnergyMachineListSkeleton";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { AccessTime, DownloadForOffline, Insights } from "@mui/icons-material";
import NoDataFound from "../common/errors/NoDataFound";
import CustomCard from "../common/CustomCard";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";
import { formatTimestamp } from "../../helpers/common";
import { useApplications } from "../../contexts/ApplicationContext";
import Papa from "papaparse";
import PremiumModal from "../common/PremiumModal";
import { CustomSelect } from "../common/CustomSelect";
import ReactApexChart from "react-apexcharts";
import { Loading } from "../common/Loading";
import {
  KEY_PARAMETER_OPTIONS,
  TREND_TAB_OPTIONS,
} from "../../constants/energyMachineList";

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
        borderBottom: "1px solid",
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
          {/* <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, fontWeight: 600 }}
          >
            DEVICE FILTER
          </Typography> */}
          <CustomAutocomplete
            options={slaveOptions}
            onChange={(e) => setSlavesId(e?.value || "")}
            value={slavesId || ""}
            label="Search Devices..."
            size="small"
            sx={{
              // mt: 0.5,
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

const MetricBlock = ({
  label,
  status,
  total,
  phase_r_v,
  phase_r_a,
  phase_y_v,
  phase_y_a,
  phase_b_v,
  phase_b_a,
  active_power,
  power_factory,
  frequency,
  today,
  mtd,
  slave_id,
  last_ts,
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

      {(total || formatTimestamp(last_ts)) && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
          gap={1}
        >
          <Box width="65%">
            <ResponsiveTextWrapper
              value={formatTimestamp(last_ts)}
              color="#595959"
              fontWeight="bold"
              fontSize="16px"
            />
          </Box>

          <Box width="35%" textAlign="end">
            <ResponsiveTextWrapper
              value={`${total?.toFixed(1)} kWh`}
              variant="subtitle1"
              fontWeight="bold"
            />
          </Box>
        </Stack>
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
              <TableCell sx={{ fontWeight: "bold", border: 0, width: "40%" }}>
                <ResponsiveTextWrapper
                  fontSize="16px"
                  fontWeight="bold"
                  value="Phase"
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", border: 0, width: "30%" }}
              >
                <ResponsiveTextWrapper
                  fontSize="16px"
                  fontWeight="bold"
                  value="V"
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", border: 0, width: "30%" }}
              >
                <ResponsiveTextWrapper
                  fontSize="16px"
                  variant="caption"
                  fontWeight="bold"
                  value="A"
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              { name: "Phase R", v: phase_r_v, a: phase_r_a, color: "#d32f2f" },
              { name: "Phase Y", v: phase_y_v, a: phase_y_a, color: "#fbc02d" },
              { name: "Phase B", v: phase_b_v, a: phase_b_a, color: "#1976d2" },
            ].map((row) => (
              <TableRow key={row.name}>
                <TableCell sx={{ border: 0, py: 0.5, width: "40%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: "10px",
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: row.color,
                        mr: 1,
                      }}
                    />

                    <Box width="calc(100% - 10px)">
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
                  sx={{ border: 0, py: 0.5, width: "30%" }}
                >
                  <ResponsiveTextWrapper
                    fontSize="14px"
                    color="#333333"
                    fontWeight="bold"
                    value={row.v?.toFixed(2)}
                  />
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ border: 0, py: 0.5, width: "30%" }}
                >
                  <ResponsiveTextWrapper
                    fontSize="14px"
                    color="#333333"
                    fontWeight="bold"
                    value={row.a?.toFixed(1)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={4}>
          <ResponsiveTextWrapper
            value="Active power"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${active_power} kw`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>
        <Grid item xs={4}>
          <ResponsiveTextWrapper
            value="Power factor"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${power_factory} PF`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>
        <Grid item xs={4}>
          <ResponsiveTextWrapper
            value="Frequency"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${frequency} Hz`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 0.5 }} />

      <Grid
        container
        spacing={1}
        justifyContent="space-between"
        alignItems="end"
      >
        <Grid item xs={4}>
          <ResponsiveTextWrapper
            value="Today"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${today} kWh`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>

        <Grid item xs={4}>
          <ResponsiveTextWrapper
            value="MTD"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${mtd} kWh`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>

        <Grid item xs={4}>
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
        </Grid>
      </Grid>
    </Box>
  );
};

const handleDownload = (filteredMachines, selectedApp) => {
  const headers = [
    "Machine Name",
    "ID",
    "Status",
    "R-Volts",
    "Y-Volts",
    "B-Volts",
    "R-Amps",
    "Y-Amps",
    "B-Amps",
    "Active Power (kW)",
    "PF",
    "Frequency (Hz)",
    "Today (kWh)",
    "MTD (kWh)",
    "Last Updated",
  ];

  const rows = filteredMachines.map((machine) => {
    const isOnline = machine.status === "online";
    const latest = machine.latest || {};
    const energy = machine.energy || {};

    return [
      machine.name || "N/A",
      machine.slave_id || "N/A",
      isOnline ? "Online" : "Offline",
      Number(latest.rv || 0).toFixed(2),
      Number(latest.yv || 0).toFixed(2),
      Number(latest.bv || 0).toFixed(2),
      Number(latest.ir || 0).toFixed(1),
      Number(latest.iy || 0).toFixed(1),
      Number(latest.ib || 0).toFixed(1),
      Number(latest.actpr_t || 0).toFixed(2),
      Number(latest.pf_t || 0).toFixed(2),
      Number(latest.fq || 0).toFixed(2),
      Number(energy.today || 0).toFixed(1),
      Number(energy.mtd || 0).toFixed(1),
      latest.last_ts ? formatTimestamp(latest.last_ts) : "N/A",
    ];
  });

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

const ModalContentForTrend = ({
  handleTabChange,
  tab,
  keyParam,
  slaveId,
  slaveName,
}) => {
  const [chartResponse, setChartResponse] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchTrendModalChartData = async (selectedTab, keyForParameter) => {
    if (!slaveId) {
      setChartResponse(null);
      return;
    }

    let API_URL_NAME = "";

    if (selectedTab === "ACTIVE_POWER")
      API_URL_NAME = API_URLS.EMS_MACHINE_LIST_ACTIVE_POWER(slaveId);
    if (selectedTab === "KEY_PARAMETERS" && keyForParameter === "voltage")
      API_URL_NAME = API_URLS.EMS_MACHINE_LIST_VOLTAGE(slaveId);
    if (selectedTab === "KEY_PARAMETERS" && keyForParameter === "current")
      API_URL_NAME = API_URLS.EMS_MACHINE_LIST_CURRENT(slaveId);
    if (selectedTab === "KEY_PARAMETERS" && keyForParameter === "pf")
      API_URL_NAME = API_URLS.EMS_MACHINE_LIST_POWER_FACTOR(slaveId);
    if (selectedTab === "KEY_PARAMETERS" && keyForParameter === "frequency")
      API_URL_NAME = API_URLS.EMS_MACHINE_LIST_FREQUENCY(slaveId);

    if (!API_URL_NAME) {
      setChartResponse(null);
      return;
    }

    try {
      setChartLoading(true);
      const res = await api.get(API_URL_NAME);
      if (res?.success) {
        setChartResponse(res?.data);
      }
    } catch (error) {
      console.error("Modal Trend API calls failed:", error);
      setChartResponse(null);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "ACTIVE_POWER") fetchTrendModalChartData(tab);
  }, [tab]);

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
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        let originalDate = "";

        const targetArray = chartResponse?.data || [];

        if (targetArray && targetArray[dataPointIndex]) {
          const item = targetArray[dataPointIndex];
          const timestamp = item?.timestamp || "";
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
          const color =
            w.config.series[index]?.color ||
            ["#E34D4D", "#F8C537", "#4A90E2", "#EF4444", "#8B5CF6", "#2563EB"][
              index % 6
            ];
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

  const getCurrentChartSeries = () => {
    switch (tab) {
      case "ACTIVE_POWER":
        return [
          {
            name: `${slaveName} Active Power`,
            data: chartResponse?.data?.map((item) => item.value),
            color: "#4A90E2",
          },
        ];
      case "KEY_PARAMETERS":
        switch (keyParam) {
          case "voltage":
            return [
              {
                name: "R-Voltage",
                data: chartResponse?.data?.map((item) => item.rv),
                color: "#E34D4D",
              },
              {
                name: "Y-Voltage",
                data: chartResponse?.data?.map((item) => item.yv),
                color: "#F8C537",
              },
              {
                name: "B-Voltage",
                data: chartResponse?.data?.map((item) => item.bv),
                color: "#4A90E2",
              },
            ];
          case "current":
            return [
              {
                name: "R-Current",
                data: chartResponse?.data?.map((item) => item.i_r),
                color: "#E34D4D",
              },
              {
                name: "Y-Current",
                data: chartResponse?.data?.map((item) => item.i_y),
                color: "#F8C537",
              },
              {
                name: "B-Current",
                data: chartResponse?.data?.map((item) => item.i_b),
                color: "#4A90E2",
              },
            ];

          case "pf":
            return [
              {
                name: `${slaveName} Power Factor`,
                data: chartResponse?.data?.map((item) => item.value),
                color: "#E34D4D",
              },
            ];

          case "frequency":
            return [
              {
                name: `${slaveName} Frequency`,
                data: chartResponse?.data?.map((item) => item.value),
                color: "#E34D4D",
              },
            ];
        }
      default:
        return [];
    }
  };

  const chartSeries = getCurrentChartSeries();

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
      >
        <Tabs
          value={tab}
          onChange={(e, val) => {
            if (!val) return;

            const { tabDesc, tab: newTab } = TREND_TAB_OPTIONS?.find(
              (t) => t.tab === val,
            );
            handleTabChange(newTab, tabDesc);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTabs-scroller": {
              height: "40px",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.95rem",

              color: "#0156A6",
              minHeight: "32px",
              transition: "all 0.3s ease",
              p: 0,
              mr: 3,
              "&.Mui-selected": {
                color: "#0156A6",
                fontWeight: 1000,
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "rgb(245, 213, 71)",
              height: 3,
              borderRadius: "3px 3px 0 0",
              pr: 3,
            },
          }}
        >
          {TREND_TAB_OPTIONS.map((app) => (
            <Tab
              disableRipple
              key={app.tab}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {app.label}
                </Box>
              }
              value={app.tab}
            />
          ))}
        </Tabs>

        {tab === "KEY_PARAMETERS" && (
          <Box width={{ sm: "200px" }}>
            <CustomSelect
              value={keyParam}
              options={KEY_PARAMETER_OPTIONS}
              label="Key Parameters"
              size="small"
              onChange={(e) => {
                const { desc } = KEY_PARAMETER_OPTIONS?.find(
                  (k) => k.value === e?.target?.value,
                );
                fetchTrendModalChartData(tab, e?.target?.value);
                handleTabChange(tab, desc, e?.target?.value);
              }}
            />
          </Box>
        )}
      </Box>

      <Box height={355}>
        {tab === "KEY_PARAMETERS" && !keyParam ? (
          <NoDataFound message="Need to select 'Key Parameters' to get details" />
        ) : chartLoading ? (
          <Loading />
        ) : (
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="line"
            height={350}
            width="100%"
          />
        )}
      </Box>
    </>
  );
};

const EnergyMachineList = () => {
  const { slavesData } = useCommonData();
  const { selectedApp } = useApplications();
  const [machineListData, setMachineListData] = useState(null);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalDetails, setModalDetails] = useState(null);

  const handleTabChange = (tab, tabDesc, keyParam) => {
    setModalDetails({
      ...modalDetails,
      tab,
      tabDesc,
      keyParam,
    });
  };

  const handleOpenModal = (item) => {
    setModalDetails({
      isOpen: true,
      data: item,
      tab: "ACTIVE_POWER",
      tabDesc: "Last 6 hours Active Power data",
    });
  };

  const handleCloseModal = () => {
    setModalDetails(null);
  };
  const filteredMachines = useMemo(() => {
    const machinesData = machineListData?.machines || [];

    if (!slavesId || !machinesData?.length) return machinesData;

    return machinesData.filter((mac) => mac.slave_id === slavesId);
  }, [machineListData, slavesId]);

  const fetchMachineListData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(API_URLS.EMS_MACHINE_LIST_DATA);
      if (res?.success) {
        setMachineListData(res?.data);
      }
    } catch (error) {
      console.error("One of the API calls failed:", error);
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
          height: "calc(100vh - 64px - 16px)",
        }}
      >
        <MachineListHeader
          slaveOptions={slavesData?.map((f) => ({
            label: f?.slave_name,
            value: f?.slave_id,
          }))}
          setSlavesId={setSlavesId}
          slavesId={slavesId}
          handleDownload={() => handleDownload(filteredMachines, selectedApp)}
          isDownloadDisabled={!Boolean(filteredMachines?.length)}
        />

        <Grid
          container
          // spacing={1}
          height="calc(100% - 44px - 8px)"
          pt={1}
          overflow="auto"
        >
          <Grid item xs={12}>
            {isLoading ? (
              <EnergyMachineListSkeleton />
            ) : filteredMachines?.length ? (
              <Grid container rowGap={1} columnSpacing={1}>
                {filteredMachines.map((mc) => {
                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={`machine-card-${mc.slave_id}-${mc.name}`}
                    >
                      <CustomCard childrenOtherProps={{ height: "100%" }}>
                        <MetricBlock
                          label={mc?.name || ""}
                          status={mc?.status}
                          total={mc?.latest?.acte_im || 0}
                          phase_r_v={mc?.latest?.rv || 0}
                          phase_r_a={mc?.latest?.ir || 0}
                          phase_y_v={mc?.latest?.yv || 0}
                          phase_y_a={mc?.latest?.iy || 0}
                          phase_b_v={mc?.latest?.bv || 0}
                          phase_b_a={mc?.latest?.ib || 0}
                          active_power={mc?.latest?.actpr_t || 0}
                          power_factory={mc?.latest?.pf_t || 0}
                          frequency={mc?.latest?.fq || 0}
                          today={mc?.energy?.today || 0}
                          mtd={mc?.energy?.mtd || 0}
                          slave_id={mc?.slave_id}
                          last_ts={mc?.latest?.last_ts || 0}
                          handleOpenModal={() => handleOpenModal(mc)}
                        />
                      </CustomCard>
                    </Grid>
                  );
                })}
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
            keyParam={modalDetails?.keyParam}
            slaveId={modalDetails?.data?.slave_id}
            slaveName={modalDetails?.data?.name}
          />
        ) : null}
      </PremiumModal>
    </>
  );
};

export default EnergyMachineList;
