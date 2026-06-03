import React, { useEffect, useMemo, useState } from "react";
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
import {
  LocalGasStation,
  Insights,
  Thermostat,
  AddCircleOutline,
  PropaneTank,
  DownloadForOffline,
} from "@mui/icons-material";

const ICON_MAP = {
  LocalGasStation: <LocalGasStation fontSize="small" />,
  AddCircleOutline: <AddCircleOutline fontSize="small" />,
  Thermostat: <Thermostat fontSize="small" />,
  PropaneTank: <PropaneTank fontSize="small" />,
};

import { CustomSelect } from "../common/CustomSelect";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import CustomCard from "../common/CustomCard";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";
import { formatTimestamp } from "../../helpers/common";
import { useApplications } from "../../contexts/ApplicationContext";
import { useCommonData } from "../../contexts/CommonDataContext";
import PremiumModal from "../common/PremiumModal";
import ReactApexChart from "react-apexcharts";
import { Loading } from "../common/Loading";
import NoDataFound from "../common/errors/NoDataFound";
import { FUEL_TREND_TAB_OPTIONS, DUMMY_FUEL_MACHINES } from "../../constants/fuelMachineList";

const MachineListHeader = ({
  slaveOptions,
  setSlavesId,
  slavesId,
}) => {
  return (
    <Box sx={{ pb: 1, borderBottom: "1px dashed", borderColor: "divider" }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Box sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}>
          <CustomAutocomplete
            options={slaveOptions}
            onChange={(option) => setSlavesId(option?.value ?? null)}
            value={slavesId ?? ""}
            label="Search Devices..."
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f9f9f9",
                transition: "0.3s",
                "&:hover": { backgroundColor: "#fff" },
              },
            }}
          />
        </Box>

        <Tooltip title="Download Report">
          <span>
            <IconButton size="large" color="primary" sx={{ width: 36, height: 36 }}>
              <DownloadForOffline sx={{ width: 36, height: 36 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

const FuelProgress = ({ percent, ltrs }) => {
  const getColor = (p) => {
    if (p > 60) return "#f44336"; // Red
    if (p > 40) return "#ff9800"; // Orange
    return "#4caf50"; // Green
  };

  const barColor = getColor(percent);

  return (
    <Box sx={{ width: "100%", mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocalGasStation sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" fontWeight="bold" color="text.secondary">Fuel Level</Typography>
        </Stack>
        <Typography variant="caption" fontWeight="bold" color="text.primary">{percent}%</Typography>
      </Stack>
      
      <Box sx={{ position: "relative", width: "100%", height: 6, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 4, overflow: "hidden" }}>
        <Box 
          sx={{ 
            position: "absolute", 
            left: 0, 
            top: 0, 
            height: "100%", 
            width: `${percent}%`, 
            bgcolor: barColor,
            transition: "width 0.5s ease-in-out"
          }} 
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.2 }}>
        <Typography variant="caption" sx={{ fontSize: "9px", color: "text.secondary" }}>0%</Typography>
        <Typography variant="caption" sx={{ fontSize: "9px", color: "text.secondary" }}>100%</Typography>
      </Stack>
      <Typography variant="caption" fontWeight="bold" sx={{ display: "block", mt: -0.5, fontSize: "10px", color: "text.secondary" }}>
        {ltrs} Ltrs
      </Typography>
    </Box>
  );
};

const FuelMetricBlock = ({ machine, handleOpenModal }) => {
  const isOnline = machine.status?.toLowerCase() === "online";

  return (
    <Box sx={{ p: 1, bgcolor: isOnline ? "#e8f5e9" : "#f2f2f2", borderRadius: "16px" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box width="calc(100% - 65px)">
          <ResponsiveTextWrapper value={machine.card_name} variant="h6" fontWeight="bold" color="text.primary" />
        </Box>
        <Chip
          label={machine.status?.toUpperCase()}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: "bold",
            color: isOnline ? "success.main" : "error.main",
            borderColor: isOnline ? "success.main" : "error.main",
            height: 20,
            fontSize: "0.65rem",
          }}
        />
      </Stack>

      <ResponsiveTextWrapper
        value={formatTimestamp(machine.last_updated)}
        color="#595959"
        fontWeight="bold"
        fontSize="14px"
        sx={{ mb: 1, display: "block" }}
      />

      {machine.fuel_level_percent !== undefined && (
        <FuelProgress percent={machine.fuel_level_percent} ltrs={machine.fuel_level_ltrs} />
      )}

      <Box sx={{ bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1, mb: 1, width: "100%" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", border: 0, py: 0.5 }}>
                <ResponsiveTextWrapper fontSize="14px" fontWeight="bold" value="Parameter" />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", border: 0, py: 0.5 }}>
                <ResponsiveTextWrapper fontSize="14px" fontWeight="bold" value="Value" />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machine.metrics.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: 0, py: 0.4 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ color: row.color, mr: 1, display: "flex", alignItems: "center" }}>
                      {ICON_MAP[row.icon] || <LocalGasStation fontSize="small" />}
                    </Box>
                    <ResponsiveTextWrapper fontSize="13px" color="#333333" fontWeight="bold" value={row.label} />
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ border: 0, py: 0.4 }}>
                  <ResponsiveTextWrapper fontSize="13px" color="#333333" fontWeight="bold" value={`${row.value} ${row.unit}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ mb: 0.5 }} />

      <Button
        onClick={() => handleOpenModal(machine)}
        size="small"
        startIcon={<Insights />}
        disableElevation
        variant="contained"
        fullWidth
        sx={{ fontWeight: "bold", borderRadius: "16px", textTransform: "none" }}
      >
        TREND
      </Button>
    </Box>
  );
};

const ModalContentForTrend = ({ parameter, setParameter, slaveName }) => {
  const [loading, setLoading] = useState(false);

  // Generate dummy data based on parameter
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      let value;
      if (parameter === "consumed") {
        value = Math.floor(Math.random() * 50) + 10;
      } else {
        value = Math.floor(Math.random() * 10) + 20;
      }
      return { timestamp: time.toISOString(), value };
    });
  }, [parameter]);

  const activeOption = FUEL_TREND_TAB_OPTIONS.find((o) => o.value === parameter);

  const chartOptions = {
    chart: { type: "line", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#0156A6"],
    xaxis: {
      categories: chartData.map((d) =>
        new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      ),
      tickAmount: 6,
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      title: { text: activeOption?.unit || "", style: { fontWeight: 600 } },
      labels: { style: { fontSize: "11px" } },
    },
    tooltip: { theme: "light", y: { formatter: (val) => `${val} ${activeOption?.unit}` } },
    grid: { borderColor: "#f1f1f1" },
  };

  const chartSeries = [{ name: activeOption?.label, data: chartData.map((d) => d.value) }];

  return (
    <Box mt={1}>
      <Box width={{ xs: "100%", sm: 200 }} mb={2}>
        <CustomSelect
          label="Parameter"
          value={parameter}
          size="small"
          fullWidth
          options={FUEL_TREND_TAB_OPTIONS}
          onChange={(e) => setParameter(e.target.value)}
        />
      </Box>

      <Box height={350}>
        {loading ? (
          <Loading />
        ) : chartData.length ? (
          <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={330} />
        ) : (
          <NoDataFound />
        )}
      </Box>
    </Box>
  );
};

const FuelMachineList = () => {
  const { slavesData } = useCommonData();
  const [slavesId, setSlavesId] = useState(null);
  const [modalDetails, setModalDetails] = useState(null);

  const filteredMachines = useMemo(() => {
    if (!slavesId) return DUMMY_FUEL_MACHINES;
    return DUMMY_FUEL_MACHINES.filter((m) => String(m.slave_id) === String(slavesId));
  }, [slavesId]);

  const handleOpenModal = (machine) => {
    setModalDetails({ isOpen: true, name: machine.card_name, parameter: "consumed" });
  };

  return (
    <>
      <Box sx={{ p: 2, height: "calc(100vh - 80px)", overflowY: "auto" }}>
        <MachineListHeader
          slaveOptions={slavesData?.map((s) => ({ label: s.slave_name, value: s.slave_id })) || []}
          setSlavesId={setSlavesId}
          slavesId={slavesId}
        />

        <Grid container spacing={1} mt={1}>
          {filteredMachines.map((machine) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={machine.slave_id}>
              <CustomCard childrenOtherProps={{ height: "100%" }}>
                <FuelMetricBlock machine={machine} handleOpenModal={handleOpenModal} />
              </CustomCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      <PremiumModal
        open={Boolean(modalDetails?.isOpen)}
        onClose={() => setModalDetails(null)}
        title={`${modalDetails?.name} - Trends`}
        confirmText={null}
        cancelText={null}
        maxWidth="md"
      >
        {modalDetails?.isOpen && (
          <ModalContentForTrend
            parameter={modalDetails.parameter}
            setParameter={(val) => setModalDetails((prev) => ({ ...prev, parameter: val }))}
            slaveName={modalDetails.name}
          />
        )}
      </PremiumModal>
    </>
  );
};

export default FuelMachineList;
