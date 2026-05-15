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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { AccessTime, DownloadForOffline, Insights } from "@mui/icons-material";
import NoDataFound from "../common/errors/NoDataFound";
import CustomCard from "../common/CustomCard";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper";

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
        <Box sx={{ flexGrow: 1, maxWidth: 300 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, fontWeight: 600 }}
          >
            DEVICE FILTER
          </Typography>
          <CustomAutocomplete
            options={slaveOptions}
            onChange={(e) => setSlavesId(e?.value || "")}
            value={slavesId || ""}
            placeholder="Search Devices..."
            size="small"
            sx={{
              mt: 0.5,
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
              disabled={isDownloadDisabled}
              color="primary"
              onClick={handleDownload}
              sx={{
                backgroundColor: "primary.light",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "primary.main",
                },
                width: 45,
                height: 45,
                borderRadius: 2,
              }}
            >
              <DownloadForOffline />
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
}) => {
  const isOnline = status?.toLowerCase() === "online";

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: isOnline ? "#e8f5e9" : "#fff",
        borderRadius: "16px",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Box width="40%">
          <ResponsiveTextWrapper
            value={label}
            variant="h6"
            fontWeight="bold"
            color="text.primary"
          />
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="end"
          width="calc(100% - 40%)"
          pl={1}
        >
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
          <Box maxWidth="calc(100% - 65px)" textAlign="end">
            <ResponsiveTextWrapper
              value={`${total?.toFixed(1)} kWh`}
              variant="subtitle1"
              fontWeight="bold"
            />
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1, mb: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", border: 0 }}>
                Phase
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", border: 0 }}>
                V
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", border: 0 }}>
                A
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
                <TableCell sx={{ border: 0, py: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: row.color,
                        mr: 1,
                      }}
                    />
                    {row.name}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ border: 0, py: 0.5 }}>
                  {row.v?.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ border: 0, py: 0.5 }}>
                  {row.a?.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Active power
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {active_power} kw
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Power factor
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {power_factory} PF
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Frequency
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {frequency} Hz
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 0.5 }} />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Today
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {today} kWh
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            MTD
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {mtd} kWh
          </Typography>
        </Box>

        <Button
          size="small"
          startIcon={<Insights />}
          disableElevation
          variant="contained"
          fullWidth
          sx={{
            width: "90px",
            fontWeight: "bold",
            borderRadius: "16px",
          }}
        >
          TREND
        </Button>
      </Stack>
    </Box>
  );
};

const EnergyMachineList = () => {
  const { slavesData } = useCommonData();
  const [machineListData, setMachineList] = useState(null);
  const [slavesId, setSlavesId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setMachineList(res?.data);
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
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 16px)" },
      }}
    >
      <MachineListHeader
        slaveOptions={slavesData?.map((f) => ({
          label: f?.slave_name,
          value: f?.slave_id,
        }))}
        setSlavesId={setSlavesId}
        slavesId={slavesId}
        handleDownload={() => console.log("down")}
        isDownloadDisabled={!Boolean(filteredMachines?.length)}
      />

      <Grid
        container
        // spacing={1}
        height="calc(100% - 76px - 8px)"
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
  );
};

export default EnergyMachineList;
