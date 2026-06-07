import { Box, Grid, Skeleton } from "@mui/material";
import React from "react";

const FuelDashboardSkeleton = () => {
  return (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid container spacing={1} height="100%">
        <Grid item xs={12} md={4} height="100%">
          <Grid container rowGap={1} height="calc(100% - 8px)">
            <Grid item xs={12} height={{ xs: 250, md: "40%" }}>
              <Skeleton
                sx={{ borderRadius: "16px" }}
                animation="wave"
                variant="rounded"
                width="100%"
                height="100%"
              />
            </Grid>
            <Grid item xs={12} height={{ xs: 300, md: "60%" }}>
              <Skeleton
                sx={{ borderRadius: "16px" }}
                animation="wave"
                variant="rounded"
                width="100%"
                height="100%"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md height={{ xs: 400, md: "100%" }}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FuelDashboardSkeleton;
