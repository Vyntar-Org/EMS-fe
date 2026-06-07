import React, { useEffect, useMemo, useState } from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import { transformDynamicDataToDailyMatrix } from "../../helpers/common";
import {
  WATER_REPORTS_ALLOW_MONTH,
  WATER_REPORTS_API_DATA_KEY_CONFIG,
  WATER_REPORTS_TAB_OPTIONS,
} from "../../constants/waterReports";
import { exportToCSV, exportToPDF } from "../../helpers/exports";
import { API_URLS } from "../../helpers/apiUrls";
import { api } from "../../helpers/api";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Grid,
  Tab,
  Tabs,
  tabsClasses,
  Tooltip,
} from "@mui/material";
import NoDataFound from "../common/errors/NoDataFound";
import { Loading } from "../common/Loading";
import { CustomTable } from "../common/CustomTable";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { Description, FileDownload, Search } from "@mui/icons-material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";

const ReportsHeader = ({
  selectedTab,
  handleTabChange,
  payload,
  setPayload,
  handleSearch,
  handlePdfDownload,
  handleExcelDownload,
  loading,
  slavesData,
  slavesId,
  setSlavesId,
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
      <Tabs
        value={selectedTab}
        onChange={(e, val) => {
          if (!val) return;

          handleTabChange(val);
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {
            "&.Mui-disabled": { opacity: 0.3 },
          },
          "& .MuiTabs-scroller": {
            height: "40px",
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: "0.95rem",

            color: "#595959",
            minHeight: "40px",
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
          },
        }}
      >
        {WATER_REPORTS_TAB_OPTIONS.map((app) => (
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

      <Grid
        container
        gap={2}
        alignItems="center"
        sx={{ bgcolor: "#f5f5f5", p: 1.5, borderRadius: 2 }}
      >
        {WATER_REPORTS_ALLOW_MONTH.includes(selectedTab) && (
          <Grid item xs sm md={2}>
            <CustomDatePicker
              label="Select Month"
              mode="monthpicker"
              onChange={(val) => handleFieldCh("month", val)}
              value={payload?.month || ""}
            />
          </Grid>
        )}

        <Grid item xs sm md={2}>
          <CustomDatePicker
            label="Select Year"
            mode="yearpicker"
            onChange={(val) => handleFieldCh("year", val)}
            value={payload?.year || ""}
          />
        </Grid>

        <Grid item xs="auto">
          <Tooltip title="Search">
            <span>
              <Button
                disabled={loading}
                variant="contained"
                onClick={handleSearch}
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
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          display="flex"
          gap={2}
          ml="auto"
          justifyContent="end"
        >
          <CustomAutocomplete
            options={slavesData}
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

          <Tooltip title="Download Excel">
            <span>
              <Button
                disabled={loading}
                variant="contained"
                onClick={handleExcelDownload}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  p: 0,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: "#1D7344",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#134B2C",
                  },
                }}
              >
                <FileDownload sx={{ fontSize: 20, color: "#fff" }} />
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Download PDF">
            <span>
              <Button
                disabled={loading}
                variant="contained"
                onClick={handlePdfDownload}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  p: 0,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: "#E11D48",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#9F1239",
                  },
                }}
              >
                <Description sx={{ fontSize: 20, color: "#fff" }} />
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

const FuelReports = () => {
  const { slavesData } = useCommonData();
  const [slavesId, setSlavesId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(
    "WATER_REPORTS_DATE_WISE_CONSUMPTION_DATA",
  );
  const [loading, setLoading] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [payload, setPayload] = useState({
    month: dayjs(new Date()),
    year: dayjs(new Date()),
  });

  const slaveName = slavesData?.find(
    (s) => s?.slave_id === slavesId,
  )?.slave_name;

  const { tableData, tableColumns } = useMemo(() => {
    const { tableData, tableColumns } = transformDynamicDataToDailyMatrix(
      reportsData,
      WATER_REPORTS_API_DATA_KEY_CONFIG[selectedTab],
    );

    const filteredData = slaveName
      ? tableData.filter((row) => row.device === slaveName)
      : tableData;

    return { tableData: filteredData, tableColumns };
  }, [reportsData, selectedTab, slaveName]);

  const fetchReportsData = async (curTab, newPayload) => {
    if (!curTab) return;

    const isMonthAllowed = WATER_REPORTS_ALLOW_MONTH.includes(curTab);

    if (isMonthAllowed && (!newPayload?.month || !newPayload?.year)) return;

    if (!isMonthAllowed && !newPayload?.year) return;

    setLoading(true);
    try {
      const monthObj = newPayload?.month;
      const yearObj = newPayload?.year;
      const formattedMonthObj = monthObj?.isValid?.()
        ? monthObj.format("M")
        : "";
      const formattedYearObj = yearObj?.isValid?.()
        ? yearObj.format("YYYY")
        : "";

      const newApiUrl = API_URLS[curTab](formattedYearObj, formattedMonthObj);

      const res = await api.get(newApiUrl);
      if (res?.success) {
        setReportsData(res?.data || null);
      }
    } catch (error) {
      console.error(`API Error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabVal) => {
    setSelectedTab(tabVal);
    setPayload({
      month: dayjs(new Date()),
      year: dayjs(new Date()),
    });
    setReportsData(null);
    fetchReportsData(tabVal, {
      month: dayjs(new Date()),
      year: dayjs(new Date()),
    });
  };

  const handleSearch = () => {
    fetchReportsData(selectedTab, payload);
  };

  const handlePdfDownload = () => {
    const findTabName = WATER_REPORTS_TAB_OPTIONS.find(
      (r) => r.tab === selectedTab,
    );
    exportToPDF(tableData, tableColumns, findTabName.label);
  };

  const handleExcelDownload = () => {
    const findTabName = WATER_REPORTS_TAB_OPTIONS.find(
      (r) => r.tab === selectedTab,
    );
    exportToCSV(tableData, tableColumns, findTabName.label);
  };

  useEffect(() => {
    fetchReportsData(selectedTab, payload);
  }, []);

  return (
    <Box
      sx={{
        height: {
          xs: "calc(100vh - 56px - 16px)",
          sm: "calc(100vh - 64px - 16px)",
        },
      }}
    >
      <ReportsHeader
        selectedTab={selectedTab}
        handleTabChange={handleTabChange}
        handleSearch={handleSearch}
        payload={payload}
        setPayload={setPayload}
        handlePdfDownload={handlePdfDownload}
        handleExcelDownload={handleExcelDownload}
        loading={loading}
        slavesId={slavesId}
        setSlavesId={setSlavesId}
        slavesData={slavesData?.map((f) => ({
          label: f?.slave_name,
          value: f?.slave_id,
        }))}
      />

      <Box
        height={{
          xs: "calc(100% - 176px)",
          md: "calc(100% - 120px)",
        }}
        pt={1}
        overflow="auto"
        // sx={{
        //   "& .MuiTableCell-root:first-of-type": {
        //     position: "sticky",
        //     left: 0,
        //     zIndex: 3,
        //   },
        // }}
      >
        {loading ? (
          <Loading />
        ) : !reportsData || !tableData?.length ? (
          <NoDataFound />
        ) : (
          <CustomTable data={tableData} columns={tableColumns} />
        )}
      </Box>
    </Box>
  );
};

export default FuelReports;
