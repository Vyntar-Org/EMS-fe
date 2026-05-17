import React from "react";
import { useCommonData } from "../../contexts/CommonDataContext";
import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import { CustomAutocomplete } from "../common/CustomAutocomplete";
import { RestartAlt, Search } from "@mui/icons-material";
import { PARAMETER_OPTIONS } from "../../constants/energyAnalytics";

const AnalyticsHeader = ({ slaveOptions }) => {
  return (
    <Box
      sx={{
        pb: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Grid container gap={2} alignItems="center">
        <Grid item md>
          <CustomAutocomplete
            options={slaveOptions}
            // onChange={(e) => setSlavesId(e?.value || "")}
            // value={slavesId || ""}
            label="Select Devices"
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
        </Grid>

        <Grid item md>
          <CustomAutocomplete
            multiple
            options={PARAMETER_OPTIONS}
            // onChange={(e) => setSlavesId(e?.value || "")}
            // value={slavesId || ""}
            label="Select Parameters"
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
        </Grid>

        <Grid item md>
          <CustomAutocomplete
            options={slaveOptions}
            // onChange={(e) => setSlavesId(e?.value || "")}
            // value={slavesId || ""}
            label="Search Devices..."
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
        </Grid>

        <Grid item md>
          <CustomAutocomplete
            options={slaveOptions}
            // onChange={(e) => setSlavesId(e?.value || "")}
            // value={slavesId || ""}
            label="Search Devices..."
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
        </Grid>

        <Grid item md="auto" display="flex" gap={1}>
          <Tooltip title="Search">
            <span>
              <IconButton
                color="primary"
                // onClick={handleSearch}
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: (theme) =>
                    theme.palette.primary.alpha10 || "rgba(25, 118, 210, 0.08)",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.primary.alpha20 ||
                      "rgba(25, 118, 210, 0.15)",
                  },
                }}
              >
                <Search sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Reset">
            <span>
              <IconButton
                color="error"
                // onClick={handleReset}
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  color: "#666666",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                    color: "#333333",
                  },
                }}
              >
                <RestartAlt sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

const EnergyAnalytics = () => {
  const { slavesData } = useCommonData();

  return (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 16px)" },
      }}
    >
      <AnalyticsHeader
        slaveOptions={slavesData?.map((f) => ({
          label: f?.slave_name,
          value: f?.slave_id,
        }))}
      />
    </Box>
  );
};

export default EnergyAnalytics;
