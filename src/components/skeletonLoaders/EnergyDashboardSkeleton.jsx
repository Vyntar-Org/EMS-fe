import { Box, Grid, Skeleton } from "@mui/material";
import React from "react";

const EnergyDashboardSkeleton = () => {
  return (
    <Box
      sx={{
        height: { md: "calc(100vh - 64px - 8px)" },
      }}
    >
      <Grid
        container
        spacing={1}
        height={{ xs: "450px", sm: "350px", md: "200px" }}
      >
        <Grid item xs={12} sm={4} md={1.7}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
        <Grid item xs={12} sm={8} md={3.7}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
        <Grid item xs={12} sm={4} md={2.6}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Skeleton
            sx={{ borderRadius: "16px" }}
            animation="wave"
            variant="rounded"
            width="100%"
            height="100%"
          />
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        sx={{ mt: 0 }}
        height={{ md: "calc(100% - 200px)" }}
      >
        <Grid item xs={12} sm={12} md={5.4} height={{ md: "100%" }}>
          <Grid container rowGap={1} height={{ md: "100%" }}>
            <Grid item xs={12} sm={12} height={{ xs: 300, md: "50%" }}>
              <Skeleton
                sx={{ borderRadius: "16px" }}
                animation="wave"
                variant="rounded"
                width="100%"
                height="100%"
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={12}
              height={{ xs: 300, md: "calc(50% - 8px)" }}
            >
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

        <Grid item xs={12} sm={12} md={6.6} height={{ xs: 400, md: "100%" }}>
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

export default EnergyDashboardSkeleton;
