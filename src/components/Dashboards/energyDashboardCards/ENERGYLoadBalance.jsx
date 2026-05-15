import { Balance } from "@mui/icons-material";
import React from "react";
import CustomCard from "../../common/CustomCard";
import NoDataFound from "../../common/errors/NoDataFound";
import { Box, Divider, Grid, Typography } from "@mui/material";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const ENERGYLoadBalance = ({ data }) => {
  const MetricBlock = ({ label, value, cost, unit, showDivider }) => (
    <Grid
      item
      xs={12}
      sx={{
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ width: "60%" }}>
        <ResponsiveTextWrapper
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          textTransform="uppercase"
          value={label}
        />
      </Box>

      <Box sx={{ width: "40%" }} textAlign="end">
        <ResponsiveTextWrapper
          fontSize="14px"
          color="primary.main"
          fontWeight={800}
          mt={1}
          value={`${value?.toLocaleString() || 0} ${unit && unit}`}
        />
      </Box>
      {showDivider && (
        <Divider
          sx={{
            borderStyle: "dashed",
            height: "1px",
            width: "100%",
            position: "absolute",
            bottom: 0,
          }}
        />
      )}
    </Grid>
  );

  return (
    <CustomCard titleIcon={<Balance />} title="Load Balance">
      {data ? (
        <Grid
          container
          sx={{ height: "100%", width: "100%" }}
          alignItems="center"
        >
          <MetricBlock
            label="IR"
            value={data?.ir || 0}
            showDivider
            unit={data?.unit || ""}
          />
          <MetricBlock
            label="IY"
            value={data?.iy || 0}
            showDivider
            unit={data?.unit || ""}
          />
          <MetricBlock
            label="IB"
            value={data?.ib || 0}
            unit={data?.unit || ""}
            showDivider
          />
          <MetricBlock label="Current LBI %" value={data?.lbi || 0} unit="" />
        </Grid>
      ) : (
        <NoDataFound />
      )}
    </CustomCard>
  );
};

export default ENERGYLoadBalance;
