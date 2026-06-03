import {
  Box,
  Button,
  Grid,
  Tab,
  Tabs,
  tabsClasses,
  Tooltip,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import {
  FUEL_REPORTS_ALLOW_MONTH,
  FUEL_REPORTS_API_DATA_KEY_CONFIG,
  FUEL_REPORTS_TAB_OPTIONS,
} from "../../constants/fuelReports";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { Description, FileDownload, Search } from "@mui/icons-material";
import { Loading } from "../common/Loading";
import NoDataFound from "../common/errors/NoDataFound";
import { CustomTable } from "../common/CustomTable";
import dayjs from "dayjs";
import { transformDynamicDataToDailyMatrix } from "../../helpers/common";
import { exportToCSV, exportToPDF } from "../../helpers/exports";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { DUMMY_FUEL_MACHINES } from "../../constants/fuelMachineList";

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
        {FUEL_REPORTS_TAB_OPTIONS.map((app) => (
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
        {FUEL_REPORTS_ALLOW_MONTH.includes(selectedTab) && (
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
                  backgroundColor: "#1976d2",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#115293",
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
  const [slavesId, setSlavesId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(
    "FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA"
  );
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [payload, setPayload] = useState({
    month: dayjs(new Date()),
    year: dayjs(new Date()),
  });

  const slaveOptions = DUMMY_FUEL_MACHINES.map((m) => ({
    label: m.card_name,
    value: m.slave_id,
  }));

  const slaveName = slaveOptions.find((s) => s.value === slavesId)?.label;

  const { tableData, tableColumns } = useMemo(() => {
    const { tableData, tableColumns } = transformDynamicDataToDailyMatrix(
      reportsData,
      FUEL_REPORTS_API_DATA_KEY_CONFIG[selectedTab]
    );

    const filteredData = slaveName
      ? tableData.filter((row) => row.device === slaveName)
      : tableData;

    return { tableData: filteredData, tableColumns };
  }, [reportsData, selectedTab, slaveName]);

  const fetchReportsData = (curTab, newPayload) => {
    if (!curTab) return;

    setLoading(true);
    // Simulate API call and generate dummy data
    setTimeout(() => {
      const isDateWise = FUEL_REPORTS_ALLOW_MONTH.includes(curTab);
      const dummyData = {};

      DUMMY_FUEL_MACHINES.forEach((m) => {
        const machineData = [];
        if (isDateWise) {
          const daysInMonth = newPayload.month.daysInMonth();
          for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = newPayload.month.date(i).format("YYYY-MM-DD");
            const baseObj = { date: dateStr };

            if (curTab === "FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA") {
              baseObj.consumption = Math.floor(Math.random() * 50) + 10;
            } else if (curTab === "EMS_REPORTS_DATE_WISE_READING_DATA") {
              baseObj.reading = 5000 + i * 50 + Math.floor(Math.random() * 10);
            } else if (curTab === "EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA") {
              baseObj.cost_consumption = Math.floor(Math.random() * 5000) + 1000;
            }

            machineData.push(baseObj);
          }
        } else {
          for (let i = 1; i <= 12; i++) {
            const baseObj = { month: String(i) };

            if (curTab === "FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA") {
              baseObj.consumption = Math.floor(Math.random() * 1000) + 200;
            } else if (curTab === "EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA") {
              baseObj.consumption = Math.floor(Math.random() * 100000) + 20000;
            }

            machineData.push(baseObj);
          }
        }
        dummyData[m.card_name] = machineData;
      });

      setReportsData(dummyData);
      setLoading(false);
    }, 600);
  };

  const handleTabChange = (tabVal) => {
    setSelectedTab(tabVal);
    setReportsData(null);
    fetchReportsData(tabVal, payload);
  };

  const handleSearch = () => {
    fetchReportsData(selectedTab, payload);
  };

  const handlePdfDownload = () => {
    const findTabName = FUEL_REPORTS_TAB_OPTIONS.find(
      (r) => r.tab === selectedTab
    );
    exportToPDF(tableData, tableColumns, findTabName.label);
  };

  const handleExcelDownload = () => {
    const findTabName = FUEL_REPORTS_TAB_OPTIONS.find(
      (r) => r.tab === selectedTab
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
        slavesData={slaveOptions}
      />

      <Box
        height={{
          xs: "calc(100% - 176px)",
          md: "calc(100% - 120px)",
        }}
        pt={1}
        overflow="auto"
      >
        {loading ? (
          <Loading />
        ) : !reportsData || !tableData?.length ? (
          <NoDataFound />
        ) : (
          <CustomTable
            data={tableData}
            columns={tableColumns}
            fillWidth={!FUEL_REPORTS_ALLOW_MONTH.includes(selectedTab)}
          />
        )}
      </Box>
    </Box>
  );
};

export default FuelReports;
