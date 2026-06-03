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
  Typography,
} from "@mui/material";
import { CustomSelect } from "../common/CustomSelect";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import {
  DownloadForOffline,
  Insights,
  Timeline,
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
import STPMachineListSkeleton from "../skeletonLoaders/StpMachineListSkeleton";


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

const STPMetricBlock = ({
  label,
  status,
  metrics = [],
  lastUpdated,
  handleOpenModal,
}) => {
  const isOnline = status?.toLowerCase() === "online";

  const todayMetric = metrics.find((m) => m.metric_key === "today_consumption");
  const mtdMetric = metrics.find((m) => m.metric_key === "mtd_consumption");

  const tableMetrics = metrics.filter(
    (m) =>
      m.metric_key !== "today_consumption" && m.metric_key !== "mtd_consumption",
  );

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: isOnline ? "#e8f5e9" : "#f2f2f2",
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
          flexGrow: 1,
        }}
      >
        <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", border: 0 }}>
                <ResponsiveTextWrapper
                  value="Parameter"
                  fontWeight="bold"
                  fontSize="16px"
                />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", border: 0 }}>
                <ResponsiveTextWrapper
                  value="Value"
                  fontWeight="bold"
                  fontSize="16px"
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableMetrics.map((metric) => (
              <TableRow key={metric.metric_key}>
                <TableCell sx={{ border: 0, py: 0.5 }}>
                  <ResponsiveTextWrapper
                    value={metric.label}
                    fontSize="14px"
                    color="#333333"
                    fontWeight="bold"
                  />
                </TableCell>
                <TableCell align="right" sx={{ border: 0, py: 0.5 }}>
                  <ResponsiveTextWrapper
                    value={metric.value}
                    fontSize="14px"
                    color="#333333"
                    fontWeight="bold"
                    sx={{ color: metric.status_color === "RED" ? "error.main" : "text.primary" }}
                  >
                    {metric.value} {metric.unit || ""}
                  </ResponsiveTextWrapper>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ mb: 1 }} />
      <Grid
        container
        spacing={1}
        justifyContent="space-between"
        alignItems="end"
      >
        <Grid item xs={todayMetric || mtdMetric ? 4 : 0} sx={{ display: todayMetric || mtdMetric ? "block" : "none" }}>
          <ResponsiveTextWrapper
            value="Today"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${todayMetric?.value ?? "--"} ${todayMetric?.unit || ""}`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>

        <Grid item xs={todayMetric || mtdMetric ? 4 : 0} sx={{ display: todayMetric || mtdMetric ? "block" : "none" }}>
          <ResponsiveTextWrapper
            value="MTD"
            variant="caption"
            color="text.secondary"
          />

          <ResponsiveTextWrapper
            value={`${mtdMetric?.value ?? "--"} ${mtdMetric?.unit || ""}`}
            variant="body1"
            fontWeight="bold"
          />
        </Grid>

        <Grid item xs={todayMetric || mtdMetric ? 4 : 12}>
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
              textTransform: "none",
            }}
          >
            TREND
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const STPTankCardBlock = ({
  label,
  status,
  metrics = [],
  lastUpdated,
  handleOpenModal,
}) => {
  const isOnline = status?.toLowerCase() === "online";

  const getMetric = (key) => metrics.find((m) => m.metric_key === key);

  const level1 = getMetric("Level 1");
  const level2 = getMetric("Level 2");
  const motor1 = getMetric("Motor 1 Status");
  const motor2 = getMetric("Motor 2 Status");

  const getChipColor = (value, statusColor) => {
    if (statusColor === "GREEN") return "success";
    if (statusColor === "RED") return "error";
    if (value === "Full") return "primary";
    if (value === "Low") return "error";
    if (value === "ON") return "success";
    if (value === "OFF") return "error";
    return "default";
  };

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: isOnline ? "#e8f5e9" : "#f2f2f2",
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
          fontSize="14px"
          sx={{ mb: 2, display: "block" }}
        />
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1, mb: 2 }}>
        {/* Collection Tank Column */}
        <Grid item xs={6} sx={{ borderRight: "1px solid #ddd" }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Collection Tank / Motor
          </Typography>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" fontWeight="bold">Water Level</Typography>
              <Chip
                label={level1?.value || "--"}
                size="small"
                color={getChipColor(level1?.value, level1?.status_color)}
                sx={{ fontWeight: "bold", minWidth: 50 }}
              />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" fontWeight="bold">Motor Status</Typography>
              <Chip
                label={motor1?.value || "--"}
                size="small"
                color={getChipColor(motor1?.value, motor1?.status_color)}
                sx={{ fontWeight: "bold", minWidth: 50 }}
              />
            </Stack>
          </Stack>
        </Grid>

        {/* Filter out Column */}
        <Grid item xs={6} sx={{ pl: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Filter out / Motor
          </Typography><br />
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" fontWeight="bold">Water Level</Typography>
              <Chip
                label={level2?.value || "--"}
                size="small"
                color={getChipColor(level2?.value, level2?.status_color)}
                sx={{ fontWeight: "bold", minWidth: 50 }}
              />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" fontWeight="bold">Motor Status</Typography>
              <Chip
                label={motor2?.value || "--"}
                size="small"
                color={getChipColor(motor2?.value, motor2?.status_color)}
                sx={{ fontWeight: "bold", minWidth: 50 }}
              />
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 1 }} />

      <Grid item xs={12}>
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
              textTransform: "none",
            }}
          >
            TREND
          </Button>
        </Grid>
    </Box>
  );
};

const handleDownloadCsv = (filteredMachines, selectedApp) => {
  const data = [];
  filteredMachines.forEach(machine => {
    const base = {
      "Card Name": machine.card_name,
      "Device UID": machine.device_uid,
      "Status": machine.status,
      "Last Updated": machine.last_updated ? formatTimestamp(machine.last_updated) : "N/A"
    };

    machine.metrics.forEach(m => {
      data.push({
        ...base,
        "Parameter": m.label,
        "Value": m.value,
        "Unit": m.unit || ""
      });
    });
  });

  const csvContent = Papa.unparse(data);
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `STP_machine_list_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ModalContentForTrend = ({
  slaveId,
  slaveName,
  initialMetric,
  allMetrics,
  uiCardType,
}) => {
  const [selectedMetric, setSelectedMetric] = useState(initialMetric);
  const [chartResponse, setChartResponse] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const isTankCard = uiCardType === "TANK_CARD";
  const chartType = isTankCard ? "area" : "line";

  const fetchTrendData = async (metricKey) => {
    try {
      setChartLoading(true);
      const res = await api.get(
        API_URLS.STP_MACHINE_LIST_TREND(slaveId, metricKey)
      );
      if (res?.success) {
        setChartResponse(res.data.trends || []);
      }
    } catch (error) {
      console.error("STP trend API failed:", error);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (slaveId && selectedMetric?.metric_key) {
      fetchTrendData(selectedMetric.metric_key);
    }
  }, [slaveId, selectedMetric]);

  const chartOptions = {
    chart: { type: chartType, toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: chartResponse?.map((item) =>
        new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      ),
      labels: { rotate: -45, style: { fontSize: "10px" } },
      tickAmount: 6,
    },
    grid: { show: false },
    dataLabels: { enabled: false },
    tooltip: { theme: "light" },
    ...(isTankCard && {
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 90, 100],
        },
      },
    }),
  };

  const chartSeries = [
    {
      name: selectedMetric?.label,
      data:
        chartResponse?.map((item) => {
          const val = item[selectedMetric?.label];
          if (val === "Full" || val === "ON") return 1;
          if (val === "Low" || val === "OFF") return 0;
          return parseFloat(val);
        }) || [],
    },
  ];

  return (
    <Box mt={1}>
      {allMetrics.length > 1 && (
        <Box width={{ xs: "100%", sm: 250 }} mb={2}>
          <CustomSelect
            label="Select Parameter"
            value={selectedMetric?.metric_key}
            size="small"
            fullWidth
            options={allMetrics.map((m) => ({
              value: m.metric_key,
              label: m.label,
            }))}
            onChange={(e) => {
              const metric = allMetrics.find(
                (m) => m.metric_key === e.target.value
              );
              if (metric) setSelectedMetric(metric);
            }}
          />
        </Box>
      )}

      <Box height={400}>
        {chartLoading ? (
          <Loading />
        ) : chartResponse?.length ? (
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type={chartType}
            height={380}
          />
        ) : (
          <NoDataFound />
        )}
      </Box>
    </Box>
  );
};

const STPMachineList = () => {
  const { slavesData } = useCommonData();
  const { selectedApp } = useApplications();
  const [machineListData, setMachineListData] = useState([]);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalDetails, setModalDetails] = useState(null);

  const fetchMachineListData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(API_URLS.STP_MACHINE_LIST_DATA);
      if (res?.success) {
        setMachineListData(res.data.cards || []);
      }
    } catch (error) {
      console.error("STP machine list fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachineListData();
  }, []);

  const filteredMachines = useMemo(() => {
    if (!slavesId) return machineListData;
    return machineListData.filter(m => String(m.slave_id) === String(slavesId));
  }, [machineListData, slavesId]);

  return (
    <>
      <Box sx={{ height: "calc(100vh - 80px)", overflow: "hidden", display: "flex", flexDirection: "column", p: 1 }}>
        <MachineListHeader
          slaveOptions={slavesData?.map(s => ({ label: s.slave_name, value: s.slave_id })) || []}
          setSlavesId={setSlavesId}
          slavesId={slavesId}
          handleDownload={() => handleDownloadCsv(filteredMachines, selectedApp)}
          isDownloadDisabled={!filteredMachines.length}
        />

        <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 1 }}>
          {isLoading ? (
            <STPMachineListSkeleton />
          ) : filteredMachines.length ? (
            <Grid container spacing={1}>
              {filteredMachines.map((mc) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`stp-mc-${mc.slave_id}`}>
                  <CustomCard sx={{ height: "100%" }}>
                    {mc.ui_card_type === "TANK_CARD" ? (
                      <STPTankCardBlock
                        label={mc.card_name}
                        status={mc.status}
                        metrics={mc.metrics}
                        lastUpdated={mc.last_updated}
                        handleOpenModal={() => {
                          const tankMetrics = mc.metrics.filter(
                            (m) =>
                              m.metric_key === "Level 1" ||
                              m.metric_key === "Level 2" ||
                              m.metric_key === "Motor 1 Status" ||
                              m.metric_key === "Motor 2 Status"
                          );
                          setModalDetails({
                            isOpen: true,
                            slaveId: mc.slave_id,
                            slaveName: mc.card_name,
                            initialMetric: tankMetrics[0],
                            allMetrics: tankMetrics,
                            uiCardType: mc.ui_card_type,
                          });
                        }}
                      />
                    ) : (
                      <STPMetricBlock
                        label={mc.card_name}
                        status={mc.status}
                        metrics={mc.metrics}
                        lastUpdated={mc.last_updated}
                        handleOpenModal={() => {
                          const filteredMetrics = mc.metrics.filter(
                            (m) =>
                              typeof m.value === "number" &&
                              m.metric_key !== "today_consumption" &&
                              m.metric_key !== "mtd_consumption"
                          );
                          setModalDetails({
                            isOpen: true,
                            slaveId: mc.slave_id,
                            slaveName: mc.card_name,
                            initialMetric: filteredMetrics[0],
                            allMetrics: filteredMetrics,
                            uiCardType: mc.ui_card_type,
                          });
                        }}
                      />
                    )}
                  </CustomCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoDataFound />
          )}
        </Box>
      </Box>

      <PremiumModal
        open={Boolean(modalDetails?.isOpen)}
        onClose={() => setModalDetails(null)}
        title={`${modalDetails?.slaveName} - Trends`}
        confirmText={null}
        cancelText={null}
        maxWidth="md"
      >
        {modalDetails?.isOpen && (
          <ModalContentForTrend
            slaveId={modalDetails.slaveId}
            slaveName={modalDetails.slaveName}
            initialMetric={modalDetails.initialMetric}
            allMetrics={modalDetails.allMetrics}
            uiCardType={modalDetails.uiCardType}
          />
        )}
      </PremiumModal>
    </>
  );
};

export default STPMachineList;
