import React, { useEffect, useMemo, useState } from "react";
import CustomCard from "../../common/CustomCard";
import { useCommonData } from "../../../contexts/CommonDataContext";
import { api } from "../../../helpers/api";
import { API_URLS } from "../../../helpers/apiUrls";
import { BarChart, SsidChart } from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import NoDataFound from "../../common/errors/NoDataFound";
import { CustomAutocomplete } from "../../common/CustomAutocomplete";
import { CustomInput } from "../../common/CustomInput";
import ReactApexChart from "react-apexcharts";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const ENERGYMachinePowerConsumption = ({ slavesId, setSlavesId }) => {
  const { slavesData } = useCommonData();
  const [mode, setMode] = useState(1);
  const [machineConsumption, setMachineConsumption] = useState(null);
  const [searchDevices, setSearchDevices] = useState(null);

  const slavesDisplayName = useMemo(() => {
    if (!slavesData && mode === 1) return null;

    const slave = slavesData.find((s) => s.slave_id === slavesId);
    return slave ? `${slave.slave_name}` : "";
  }, [slavesId, slavesData, mode]);

  const filteredSlaves = useMemo(() => {
    if (!searchDevices?.trim()) return slavesData;

    const searchLower = searchDevices.toLowerCase().trim();

    return slavesData.filter((slave) => {
      const nameMatch = slave.slave_name?.toLowerCase().includes(searchLower);

      return nameMatch || null;
    });
  }, [searchDevices, slavesData]);
  const fetchMachineConsumption = async () => {
    try {
      const getMachineConsumptionData = await api.get(
        `${API_URLS.EMS_DASHBOARD_MACHINE_CONSUMPTION}?slave_id=${slavesId || 0}`,
      );
      if (getMachineConsumptionData?.success) {
        setMachineConsumption(getMachineConsumptionData?.data);
      }
    } catch (error) {
      console.error("One of the API calls failed:", error);
    }
  };

  useEffect(() => {
    if (!slavesId) return;

    fetchMachineConsumption();
  }, [slavesId]);

  const options1 = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "45%",
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#2E4355"],
        fontWeight: "bold",
      },
    },
    xaxis: {
      categories: machineConsumption?.map((item) => {
        const d = new Date(item.date);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        });
      }),
      position: "bottom",
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9e9e9e" },
      },
    },
    yaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9e9e9e" },
        formatter: (val) => val.toFixed(2),
      },
    },
    tooltip: {
      x: { show: true },
      y: {
        formatter: (val) => `${val} kWh`,
      },
    },
    fill: {
      colors: ["#0a223e"],
    },
    grid: {
      show: false,
    },
  };

  const series1 = [
    {
      name: "(kWh)",
      data: machineConsumption?.map((item) => item.value),
    },
  ];

  const options2 = {
    ...options1,
    chart: {
      ...options1.chart,
      type: "line",
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#2E4355"],
    },
    plotOptions: {
      bar: { enabled: false },
    },
    dataLabels: {
      ...options1.dataLabels,
      formatter: (val) => Math.round(val),
    },
  };

  return (
    <CustomCard
      title={
        mode === 2 ? `${slavesDisplayName} Energy` : "Machine Power Consumption"
      }
      icon={
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, newMode) => newMode !== null && setMode(newMode)}
          sx={{
            height: "28px",
            bgcolor: "background.paper",
            "& .MuiToggleButton-root.Mui-selected": {
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
            },
            marginRight: { sm: "212px" },
          }}
        >
          <ToggleButton value={1}>
            <BarChart sx={{ width: 20, height: 20 }} />
          </ToggleButton>
          <ToggleButton value={2}>
            <SsidChart sx={{ width: 20, height: 20 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      }
    >
      {machineConsumption && machineConsumption?.length ? (
        <Box
          display="flex"
          gap={1.5}
          flexDirection={{ xs: "column-reverse", sm: "row" }}
          height="100%"
        >
          <Box
            // flex={1}
            height="100%"
            width={{ sm: "calc(100% - 200px - 12px)" }}
            overflow="hidden"
          >
            {
              {
                1: (
                  <ReactApexChart
                    options={options1}
                    series={series1}
                    type="bar"
                    height="100%"
                    width="100%"
                  />
                ),
                2: (
                  <ReactApexChart
                    options={options2}
                    series={series1}
                    type="line"
                    height="100%"
                    width="100%"
                  />
                ),
              }[mode]
            }
          </Box>

          <Box
            width={{ sm: "200px" }}
            height={{ sm: "100%" }}
            position={{ sm: "absolute" }}
            // bgcolor="#fff"
            right={{ sm: 14 }}
            top={{ sm: 6 }}
          >
            <CustomAutocomplete
              options={filteredSlaves?.map((f) => ({
                label: f?.slave_name,
                value: f?.slave_id,
              }))}
              onChange={(e) => {
                setSlavesId(e?.value || "");
              }}
              value={slavesId || ""}
              placeholder="Search Devices..."
              size="small"
              sx={{
                display: { sm: "none" },
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <CustomInput
              onChange={(e) => setSearchDevices(e.target.value)}
              value={searchDevices || ""}
              autoComplete="off"
              placeholder="Search Devices"
              size="small"
              sx={{
                display: { xs: "none", sm: "block" },
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Box
              height={{ sm: "calc(100% - 40px - 24px)" }}
              overflow="auto"
              display={{ xs: "none", sm: "block" }}
            >
              {filteredSlaves?.length ? (
                <Grid container rowGap={1} mt={1}>
                  {filteredSlaves.map((s) => {
                    const isActive = slavesId === s.slave_id;
                    return (
                      <Grid item xs={12} key={`slaves-option-${s.slave_id}`}>
                        <Button
                          onClick={() => {
                            setSlavesId(s.slave_id);
                          }}
                          disableElevation
                          sx={{
                            justifyContent: "start",
                            borderRadius: 2,
                            textTransform: "none",
                            bgcolor: isActive ? "#0a223e" : "#fff",
                            border: "2px solid",
                            borderColor: isActive ? "#0a223e" : "#ccc",
                            ":hover": {
                              bgcolor: isActive ? "#0a223e" : "#fff",
                            },
                          }}
                          variant="contained"
                          fullWidth
                        >
                          <ResponsiveTextWrapper
                            value={s.slave_name}
                            color={isActive ? "#fff" : "#0a223e"}
                            fontSize="14px"
                            textAlign="start"
                            fontWeight={600}
                          />
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <NoDataFound />
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <NoDataFound />
      )}
    </CustomCard>
  );
};

export default ENERGYMachinePowerConsumption;
