import { ElectricBolt } from "@mui/icons-material";
import React from "react";
import CustomCard from "../../common/CustomCard";
import NoDataFound from "../../common/errors/NoDataFound";
import { Box, Divider, Grid, Typography } from "@mui/material";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const ENERGYConsumption = ({ data }) => {
  const MetricBlock = ({ label, value, cost, unit, showDivider }) => (
    <Grid
      item
      xs={4}
      sx={{
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ textAlign: "center", width: "100%", px: 0.5 }}>
        <ResponsiveTextWrapper
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          textTransform="uppercase"
          value={label}
        />

        <ResponsiveTextWrapper
          fontSize="14px"
          color="primary.main"
          fontWeight={800}
          mt={1}
          value={value?.toLocaleString() || 0}
        />

        <Typography
          sx={{ color: "primary.main", fontSize: "12px", fontWeight: 500 }}
        >
          {unit}
        </Typography>

        <ResponsiveTextWrapper
          variant="body2"
          color="text.primary"
          fontWeight={600}
          borderRadius={1}
          mt={1}
          value={`₹ ${cost?.toLocaleString() || 0}`}
          tooltipValue={`COST = ₹ ${cost?.toLocaleString() || 0}`}
        />
      </Box>

      {showDivider && (
        <Divider
          orientation="vertical"
          sx={{
            borderStyle: "dashed",
            height: "100%",
            position: "absolute",
            right: 0,
          }}
        />
      )}
    </Grid>
  );

  return (
    <CustomCard titleIcon={<ElectricBolt />} title="Energy Consumption">
      {data ? (
        <Grid
          container
          sx={{ height: "100%", width: "100%" }}
          alignItems="center"
        >
          <MetricBlock
            label="MTD"
            value={data.mtd?.value}
            cost={data.mtd?.cost}
            unit={data.unit}
            showDivider
          />
          <MetricBlock
            label="Today"
            value={data.today?.value}
            cost={data.today?.cost}
            unit={data.unit}
            showDivider
          />
          <MetricBlock
            label="Yesterday"
            value={data.yesterday?.value}
            cost={data.yesterday?.cost}
            unit={data.unit}
          />
        </Grid>
      ) : (
        <NoDataFound />
      )}
    </CustomCard>
  );
};

export default ENERGYConsumption;
