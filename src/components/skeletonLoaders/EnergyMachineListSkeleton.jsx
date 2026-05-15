import { Grid, Skeleton } from "@mui/material";
import React from "react";

const EnergyMachineListSkeleton = () => {
  const skeletonItems = Array.from({ length: 9 }, (_, i) => i);

  return (
    <Grid container rowGap={1} columnSpacing={1}>
      {skeletonItems.map((_, ind) => {
        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={`machine-card-skeleton-${ind + 1}`}
            height="390px"
          >
            <Skeleton
              sx={{ borderRadius: "16px" }}
              animation="wave"
              variant="rounded"
              width="100%"
              height="100%"
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default EnergyMachineListSkeleton;
