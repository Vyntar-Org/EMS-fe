import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import CustomCard from "../../common/CustomCard";
import ResponsiveTextWrapper from "../../common/ResponsiveTextWrapper";

const MetricBlock = ({ label, today, yesterday, unit, subLabel }) => (
  <Grid container spacing={1}>
    <Grid item xs={6} sx={{ borderRight: "1px dashed #e0e0e0", textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "12px", fontWeight: "bold" }}>
        Today
      </Typography>
      {subLabel && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "12px" }}>
          ({subLabel})
        </Typography>
      )}
      <Typography variant="body1" color="primary.main" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: { xs: "18px", md: "16px", lg: "20px" }, color: "#0156a6" }}>
        {today}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "11px", md: "10px", lg: "12px" } }}>
        {unit}
      </Typography>
    </Grid>
    <Grid item xs={6} sx={{ textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "11px", md: "10px", lg: "12px" }, fontWeight: "bold" }}>
        Yesterday
      </Typography>
      {subLabel && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: { xs: "11px", md: "10px", lg: "12px" } }}>
          ({subLabel})
        </Typography>
      )}
      <Typography variant="body1" color="primary.main" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: { xs: "18px", md: "16px", lg: "20px" }, color: "#0156a6" }}>
        {yesterday}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "11px", md: "10px", lg: "12px" } }}>
        {unit}
      </Typography>
    </Grid>
  </Grid>
);

const STPIntakeTreated = ({ intakeData, treatedData }) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6} sm={6}>
        <CustomCard title="Intake Total">
          <MetricBlock
            label={intakeData?.title || "Intake Total"}
            today={intakeData?.value}
            yesterday={intakeData?.previous_value}
            unit={intakeData?.unit || "KL"}
            subLabel={intakeData?.subtitle || "Waste Water"}
          />
        </CustomCard>
      </Grid>
      <Grid item xs={12} md={6} sm={6}>
        <CustomCard title="Treated Water">
         <MetricBlock
            label={treatedData?.title || "Treated Water"}
            today={treatedData?.value}
            yesterday={treatedData?.previous_value}
            unit={treatedData?.unit || "KL"}
            subLabel={treatedData?.subtitle || "Out"}
          />
        </CustomCard>
      </Grid>
    </Grid>
  );
};

export default STPIntakeTreated;
