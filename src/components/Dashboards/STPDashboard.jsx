import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import STPIntakeTreated from "./stpDashboardCards/STPIntakeTreated";
import STPWaterQuality from "./stpDashboardCards/STPWaterQuality";
import STPSiteLocation from "./stpDashboardCards/STPSiteLocation";
import STPHistoricalTrends from "./stpDashboardCards/STPHistoricalTrends";
import STPWaterComparison from "./stpDashboardCards/STPWaterComparison";
import { useCommonData } from "../../contexts/CommonDataContext";
import { api } from "../../helpers/api";
import { API_URLS } from "../../helpers/apiUrls";

const STPDashboard = () => {
    const [summaryData, setSummaryData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSTPData = async () => {
    setLoading(true);
    try {
      const [summaryRes, historicalRes, comparisonRes] = await Promise.all([
        api.get(API_URLS.STP_DASHBOARD_SUMMARY),
        api.get(API_URLS.STP_DASHBOARD_HISTORICAL),
        api.get(API_URLS.STP_DASHBOARD_COMPARISON),
      ]);

      if (summaryRes?.success) setSummaryData(summaryRes.data);
      if (historicalRes?.success) setHistoricalData(historicalRes.data);
      if (comparisonRes?.success) setComparisonData(comparisonRes.data);
    } catch (error) {
      console.error("Failed to fetch STP data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSTPData();
  }, []);

  const intakeCard = summaryData?.cards?.find(c => c.title === "Intake Total");
  const treatedCard = summaryData?.cards?.find(c => c.title === "Treated Water");
  const qualityGauges = summaryData?.cards?.filter(c => c.card_type === "GAUGE") || [];
  return (
    <Box 
      sx={{ 
        height: { md: "calc(100vh - 64px - 24px)" }, 
        overflowX: "hidden",
        overflowY: { xs: "auto", md: "hidden" }, 
        p: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 1
      }} 
    > 
      {/* Top Section */}
      <Grid container spacing={1} sx={{ height: { md: "55%" } }}> 
        <Grid item xs={12} md={7} sx={{ height: { md: "100%" }, display: "flex", flexDirection: "column", gap: 1 }}> 
          <Grid sx={{ height: { xs: "auto", md: "45%" } }}> 
            <STPIntakeTreated 
              intakeData={intakeCard} 
              treatedData={treatedCard} 
              loading={loading}
            /> 
          </Grid> 
  
          <Grid sx={{ height: { xs: "auto", lg: "100%" }, marginTop: { md: 2, sx: 0 , lg: 0 } }}> 
            <STPWaterQuality 
              data={qualityGauges} 
              loading={loading}
            />  
          </Grid> 
        </Grid> 
  
        <Grid item xs={12} md={5} sx={{ height: { xs: "auto", md: "100%" } }}> 
          <STPSiteLocation /> 
        </Grid> 
      </Grid> 
  
      {/* Bottom Section */}
      <Grid 
        container 
        spacing={1} 
        sx={{ height: { md: "calc(45% - 8px)" } }} 
      > 
        <Grid item xs={12} sm={6} sx={{ height: { xs: "300px", md: "107%" } }}> 
          <STPHistoricalTrends 
            data={historicalData} 
            loading={loading}
          /> 
        </Grid> 
  
        <Grid item xs={12} sm={6} sx={{ height: { xs: "300px", md: "107%" } }}> 
          <STPWaterComparison 
            data={comparisonData} 
            loading={loading}
          />
        </Grid> 
      </Grid> 
    </Box>
  );
};

export default STPDashboard;
