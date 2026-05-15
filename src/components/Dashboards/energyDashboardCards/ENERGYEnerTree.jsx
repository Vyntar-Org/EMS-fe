import { Power } from "@mui/icons-material";
import React from "react";
import CustomCard from "../../common/CustomCard";
import NoDataFound from "../../common/errors/NoDataFound";
import { Box, Divider, Grid } from "@mui/material";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const ENERGYEnerTree = ({ data }) => {
  const MetricBlock = ({ label, value, showDivider, unit }) => (
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
          mt={1}
          fontSize="14px"
          color="primary.main"
          fontWeight={800}
          value={`${value?.toLocaleString() || 0} ${unit}`}
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
    <CustomCard titleIcon={<Power />} title="Ener Tree">
      {data ? (
        <Grid
          container
          sx={{ height: "100%", width: "100%" }}
          alignItems="center"
        >
          <MetricBlock
            label="Main"
            value={data?.main || 0}
            showDivider
            unit={data?.unit || ""}
          />
          <MetricBlock
            label="Backup"
            value={data?.backup || 0}
            showDivider
            unit={data?.unit || ""}
          />
          <MetricBlock
            label="Green"
            value={data?.green || 0}
            unit={data?.unit || ""}
          />
        </Grid>
      ) : (
        <NoDataFound />
      )}
    </CustomCard>
  );
};

export default ENERGYEnerTree;
