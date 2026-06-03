import { Box, Button, Chip, Grid, Tooltip } from "@mui/material";
import React, { useMemo, useState } from "react";
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
import dayjs from "dayjs";

const getDefaultDateRange = () => [dayjs().subtract(24, "hour"), dayjs()];

const LogsFilterHeader = ({
  slaveOptions,
  handleSearch,
  handleReset,
  payload,
  setPayload,
}) => {
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
        <Grid item xs={12} md={4.5} lg>
          <CustomDatePicker
            mode="datetimerangepicker"
            onChange={(val) => handleFieldCh("dateTime", val)}
            value={payload?.dateTime || ""}
          />
        </Grid>

        <Grid item xs="auto" display="flex" gap={2} ml={{ xs: "auto", md: 0 }}>
          <Tooltip title="Search">
            <span>
              <Button
                variant="contained"
                disabled={!payload?.slave_id}
                onClick={() => handleSearch()}
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
                  setPayload((prev) => ({
                    ...(prev || {}),
                    dateTime: getDefaultDateRange(),
                    slave_id: null,
                    parameters: [],
                  }));
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

const STPLogs = () => {
  const { slavesData, parametersData } = useCommonData();
  const [loading, setLoading] = useState(null);
  const [logsData, setLogsData] = useState(null);
  const [payload, setPayload] = useState({
    dateTime: getDefaultDateRange(),
    slave_id: null,
    parameters: [],
  });
  const [apiPaginationParams, setApiPaginationParams] = useState({
    limit: 50,
    offset: 0,
  });
  const [backendTotalRowsCount, setBackendTotalRowsCount] = useState(0);

  const tablePageIndex = Math.floor(
    apiPaginationParams.offset / apiPaginationParams.limit
  );
  const tablePageSize = apiPaginationParams.limit;

  const logsColumns = useMemo(() => {
    if (!logsData?.length) return [];

    const getChipStyle = (value) => {
      const val = String(value).toUpperCase();
      if (val === "FULL") return { bgcolor: "#4f92d4", color: "#fff", fontWeight: "bold", minWidth: 60 };
      if (val === "LOW") return { bgcolor: "#d05353", color: "#fff", fontWeight: "bold", minWidth: 60 };
      if (val === "ON") return { bgcolor: "#008000", color: "#fff", fontWeight: "bold", minWidth: 60 };
      if (val === "OFF") return { bgcolor: "#FF0000", color: "#fff", fontWeight: "bold", minWidth: 60 };
      return null;
    };

    const sampleData = logsData[0];
    const columnDef = Object.keys(sampleData).map((c) => ({
      accessorKey: c,
      header: KEY_PARAMETER_OPTIONS_MAPPING?.[c] || c,
      size: c === "timestamp" ? 200 : 150,
      cell: (info) => {
        const value = info.getValue();

        if (c === "timestamp" && value) {
          const date = dayjs(value);
          return date.isValid()
            ? date.format("DD MMM YYYY HH:mm:ss")
            : String(value);
        }

        const chipStyle = getChipStyle(value);
        if (chipStyle) {
          return (
            <Chip
              label={String(value).toUpperCase()}
              size="small"
              sx={chipStyle}
            />
          );
        }

        return String(value ?? "-");
      },
    }));

    // Reorder logic: timestamp first, then following the user requested order
    const desiredOrder = [
      "timestamp",
      "Level 1",
      "Motor 1 Status",
      "Level 2",
      "Motor 2 Status",
      "Inlet Flowrate",
      "Inlet Totalizer",
      "Outlet Flowrate",
      "Outlet Totalizer",
      "TDS",
      "pH",
    ];

    const sortedCols = [];
    desiredOrder.forEach((key) => {
      const col = columnDef.find((cd) => cd.accessorKey === key);
      if (col) sortedCols.push(col);
    });

    // Add any remaining columns that weren't in the desired order
    columnDef.forEach((col) => {
      if (!sortedCols.find((sc) => sc.accessorKey === col.accessorKey)) {
        sortedCols.push(col);
      }
    });

    return sortedCols;
  }, [logsData]);

  const handleSearch = async (paginationDetails = apiPaginationParams) => {
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

      const newApiUrl = API_URLS.STP_LOGS_DATA(
        slaveId,
        parameterValues,
        formattedStart,
        formattedEnd,
        paginationDetails.limit,
        paginationDetails.offset
      );
      const res = await api.get(newApiUrl);
      if (res?.success) {
        setLogsData(res?.data?.logs || []);
        setBackendTotalRowsCount(res?.meta?.total || 0);
      }
    } catch (error) {
      console.error(`API Error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLogsData(null);
    setBackendTotalRowsCount(0);
    setApiPaginationParams({
      limit: 50,
      offset: 0,
    });
  };

  const handlePageChange = (event, newPageIndex) => {
    const newOffset = newPageIndex * apiPaginationParams.limit;
    setApiPaginationParams((prev) => ({
      ...prev,
      offset: newOffset,
    }));
    handleSearch({
      ...apiPaginationParams,
      offset: newOffset,
    });
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setApiPaginationParams({
      limit: newLimit,
      offset: 0,
    });
    handleSearch({
      limit: newLimit,
      offset: 0,
    });
  };

  const slaveOptions = useMemo(() => {
    return (
      slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
      []
    );
  }, [slavesData]);

  return (
    <Box
      sx={{
        height: {
          xs: "calc(100vh - 56px - 16px)",
          sm: "calc(100vh - 64px - 16px)",
        },
        p: 1,
      }}
    >
      <LogsFilterHeader
        slaveOptions={slaveOptions}
        parameterOptions={parametersData}
        handleSearch={handleSearch}
        handleReset={handleReset}
        payload={payload}
        setPayload={setPayload}
      />

      <Box
        height={{
          xs: "calc(100% - 216px)",
          sm: "calc(100% - 160px)",
          md: "calc(100% - 60px)",
        }}
        pt={1}
        overflow="auto"
      >
        {loading ? (
          <Loading />
        ) : !logsData?.length ? (
          <NoDataFound />
        ) : (
          <CustomTable
            data={logsData}
            columns={logsColumns}
            fillWidth={true}
            pageIndex={tablePageIndex}
            pageSize={tablePageSize}
            totalRowCount={backendTotalRowsCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Box>
    </Box>
  );
};

export default STPLogs;
