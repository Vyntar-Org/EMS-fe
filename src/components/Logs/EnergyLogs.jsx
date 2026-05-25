import { Box, Button, Grid, Tooltip } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import { API_URLS } from "../../helpers/apiUrls";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { RestartAlt, Search } from "@mui/icons-material";
import { Loading } from "../common/Loading";
import NoDataFound from "../common/errors/NoDataFound";
import { api } from "../../helpers/api";
import { KEY_PARAMETER_OPTIONS_MAPPING } from "../../constants/energyAnalytics";
import { CustomTable } from "../common/CustomTable";

const LogsFilterHeader = ({
  slaveOptions,
  parameterOptions,
  handleSearch,
  handleReset,
}) => {
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
        borderBottom: "1px dashed",
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
            options={parameterOptions}
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
                onClick={() => {
                  setPayload(null);
                  handleReset();
                }}
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

const EnergyLogs = () => {
  const { slavesData, parametersData } = useCommonData();
  const [loading, setLoading] = useState(null);
  const [logsData, setLogsData] = useState(null);

  const logsColumns = useMemo(() => {
    if (!logsData?.length) return [];

    const columnDef = Object.keys(logsData[1]).map((c) => ({
      accessorKey: c,
      header: KEY_PARAMETER_OPTIONS_MAPPING?.[c],
      size: c === "timestamp" ? 150 : 120,
    }));

    return columnDef;
  }, [logsData]);

  const handleSearch = async (payload) => {
    if (!payload?.slave_id) return;

    setLoading(true);
    try {
      const slaveId = payload.slave_id?.value ?? "";
      const parameterValues = payload?.parameters
        ? payload.parameters
            .map((p) => p?.value)
            .filter(Boolean)
            .join(",")
        : "";

      const startDateObj = payload?.dateTime?.[0];
      const endDateObj = payload?.dateTime?.[1];
      const formattedStart = startDateObj?.isValid?.()
        ? startDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
        : "";
      const formattedEnd = endDateObj?.isValid?.()
        ? endDateObj.format("YYYY-MM-DD[T]HH:mm:ss")
        : "";

      const newApiUrl = API_URLS.EMS_LOGS_DATA(
        slaveId,
        parameterValues,
        formattedStart,
        formattedEnd,
      );
      const res = await api.get(newApiUrl);
      if (res?.success) {
        setLogsData(res?.data || []);
      }
    } catch (error) {
      console.error(`API Error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLogsData(null);
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
      <LogsFilterHeader
        slaveOptions={slaveOptions}
        parameterOptions={parametersData}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      <Box
        height={{
          xs: "calc(100% - 216px)",
          sm: "calc(100% - 160px)",
          md: "calc(100% - 48px)",
        }}
        pt={1}
        overflow="auto"
      >
        {loading ? (
          <Loading />
        ) : !logsData?.length ? (
          <NoDataFound />
        ) : (
          <CustomTable data={logsData} columns={logsColumns} />
        )}
      </Box>
    </Box>
  );
};

export default EnergyLogs;
