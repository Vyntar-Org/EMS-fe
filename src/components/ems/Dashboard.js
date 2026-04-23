import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Badge,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search,
  Power,
  FlashOn as FlashOnIcon,
  Dns as DnsIcon,
  Balance as BalanceIcon,
  Speed as SpeedIcon,
  Co2 as Co2Icon,
  BatteryFull as BatteryIcon,
  Power as PowerIcon,
  PaddingOutlined
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import SearchIcon from '@mui/icons-material/Search';
import { getDashboardOverview, getSlaveList, getSlaveWeeklyConsumption, getHourlyEnergyConsumptionTrend, getPeakDemandTrend } from '../../auth/DashboardApi';
import './Dashboard.css';
import Tooltip from '@mui/material/Tooltip';

const Dashboard = ({ onSidebarToggle, sidebarVisible }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  // ✅ FIX: 1024px separate breakpoint
  const is1024 = useMediaQuery('(min-width:1024px) and (max-width:1080px)');

  const truncateText = (text, length = 20) =>
    text.length > length ? text.slice(0, length) + '...' : text;

  const [dashboardData, setDashboardData] = useState(null);
  const [slaveList, setSlaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlave, setSelectedSlave] = useState(null);
  const [weeklyConsumptionData, setWeeklyConsumptionData] = useState([]);
  const [slaveLoading, setSlaveLoading] = useState(false);
  const [activeChart, setActiveChart] = useState('bar');
  const [hourlyEnergyData, setHourlyEnergyData] = useState({ hours: [], consumption: [] });
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [peakDemandData, setPeakDemandData] = useState({ timestamps: [], values: [] });
  const [peakDemandLoading, setPeakDemandLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setHourlyLoading(true);
        setError(null);

        const [dashboardResponse, slaveResponse, hourlyResponse] = await Promise.all([
          getDashboardOverview(),
          getSlaveList(),
          getHourlyEnergyConsumptionTrend().catch(err => {
            console.error('Error fetching hourly energy consumption:', err);
            return { hours: [], consumption: [], meta: {} };
          })
        ]);

        setDashboardData(dashboardResponse);
        setSlaveList(slaveResponse);
        setHourlyEnergyData(hourlyResponse);

        if (Array.isArray(slaveResponse) && slaveResponse.length > 0) {
          const firstSlave = slaveResponse[0];
          handleSlaveSelect(firstSlave);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
        setHourlyLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSlaveSelect = async (slave) => {
    try {
      if (slaveLoading) return;

      setSlaveLoading(true);
      setPeakDemandLoading(true);
      setSelectedSlave(slave);

      setWeeklyConsumptionData([]);
      setPeakDemandData({ timestamps: [], values: [] });

      const weeklyData = await getSlaveWeeklyConsumption(slave.slave_id);
      const peakDemandResponse = await getPeakDemandTrend(slave.slave_id).catch(err => {
        console.error('Error fetching peak demand trend:', err);
        return { timestamps: [], values: [], meta: {} };
      });

      setWeeklyConsumptionData(weeklyData);
      setPeakDemandData(peakDemandResponse);

    } catch (error) {
      console.error('Error fetching weekly consumption data:', error);
      setError(error.message || 'An error occurred while fetching weekly consumption data');
      setSelectedSlave(null);
    } finally {
      setSlaveLoading(false);
      setPeakDemandLoading(false);
    }
  };

  const slavesData = dashboardData?.devices || { total: 0, online: 0, offline: 0 };
  const energyConsumption = dashboardData?.energy_consumption || 0;
  const energyConsumptionUnit = dashboardData?.energy_consumption?.unit || 'kWh';
  const carbonFootprints = dashboardData?.carbon_footprints || 0;

  const hourlyData = Array.isArray(hourlyEnergyData?.hours) ? hourlyEnergyData.hours : [];
  const hourlyValuesRaw = Array.isArray(hourlyEnergyData?.consumption) ? hourlyEnergyData.consumption : [];

  const hourlyValues = hourlyValuesRaw.map(v => {
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return v < 0 ? 0 : v;
    }
    return 0;
  });

  const formatDateTime = (hourString) => {
    if (!hourString) return '';
    const date = new Date(hourString);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}.${minutes}`;
  };

  const hourlyCategories = hourlyData.map(hourString => formatDateTime(hourString) || '--');

  const shortNumber = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(0) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(0) + "M";
    return num.toFixed(0);
  };

  const energyConsumptionOptions = {
    chart: {
      type: 'line',
      height: 140,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 0 },
    grid: {
      strokeDashArray: 4,
      borderColor: 'transparent',
      position: 'back',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: '#E5E7EB' } }
    },
    xaxis: {
      categories: hourlyCategories.length > 0 ? hourlyCategories : ['-'],
      labels: { style: { colors: '#6B7280', fontSize: '12px' }, formatter: (val) => val },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: hourlyValues.length > 0 ? Math.min(...hourlyValues, 0) : 0,
      max: hourlyValues.length > 0 ? Math.max(...hourlyValues, 1) : 1,
      tickAmount: 4,
      labels: { formatter: (val) => shortNumber(val), style: { colors: '#6B7280', fontSize: '12px' } },
      axisBorder: { show: false }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => shortNumber(val),
      offsetY: -10,
      offsetX: 4,
      style: { fontSize: '12px', colors: ['#0a223e'] },
      background: { enabled: false }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' },
      x: {
        formatter: function (val, opts) {
          const index = opts.dataPointIndex;
          if (hourlyData[index]) { return formatDateTime(hourlyData[index]); }
          return val;
        }
      },
      y: {
        formatter: function (val, opts) {
          const index = opts.dataPointIndex;
          const originalValue = hourlyValuesRaw[index];
          return `${Number.isFinite(Number(originalValue)) ? Number(originalValue).toLocaleString() : '0'} kWh`;
        }
      }
    },
    legend: { show: false },
    colors: ['#0a223e']
  };

  const energySeriesData = hourlyValues.length > 0 ? hourlyValues : [0];
  const energyConsumptionSeries = [{ name: '(kWh)', data: energySeriesData }];

  const formatTimestamp = (timestampString) => {
    if (!timestampString) return '';
    const date = new Date(timestampString);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const samplePeakDemandData = () => {
    const timestamps = Array.isArray(peakDemandData?.timestamps) ? peakDemandData.timestamps : [];
    const values = Array.isArray(peakDemandData?.values) ? peakDemandData.values.map(v => (typeof v === 'number' && !Number.isNaN(v) ? v : 0)) : [];
    const totalPoints = timestamps.length;
    if (totalPoints <= 7) {
      return { categories: timestamps.map(timestamp => formatTimestamp(timestamp) || '--'), values: values };
    } else {
      const sampledCategories = [];
      const sampledValues = [];
      const step = Math.floor((totalPoints - 1) / 6);
      for (let i = 0; i < totalPoints; i += step) {
        if (sampledCategories.length < 7) {
          sampledCategories.push(formatTimestamp(timestamps[i]));
          sampledValues.push(values[i] ?? 0);
        } else { break; }
      }
      if (sampledCategories.length < 7 && totalPoints >= 7) {
        const lastIndex = sampledCategories.length - 1;
        sampledCategories[lastIndex] = formatTimestamp(timestamps[totalPoints - 1]);
        sampledValues[lastIndex] = values[totalPoints - 1] ?? 0;
      }
      return { categories: sampledCategories, values: sampledValues };
    }
  };

  const sampledPeakDemand = samplePeakDemandData();

  const peakDemandOptions = {
    chart: { type: 'line', height: 150, toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 6, colors: ['#cbc84c'], strokeColors: '#ffffff', strokeWidth: 2, strokeOpacity: 0.9, fillOpacity: 1 },
    grid: { strokeDashArray: 4, borderColor: 'transparent', position: 'back', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true, color: '#E5E7EB' } } },
    xaxis: { categories: sampledPeakDemand.categories.length > 0 ? sampledPeakDemand.categories : ['-'], labels: { style: { colors: '#6B7280', fontSize: '12px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: sampledPeakDemand.values.length > 0 ? Math.min(...sampledPeakDemand.values, 0) : 0, max: sampledPeakDemand.values.length > 0 ? Math.max(...sampledPeakDemand.values) * 1.1 : 10, tickAmount: 5, labels: { formatter: (val) => shortNumber(val), style: { colors: '#6B7280', fontSize: '12px' } }, axisBorder: { show: false } },
    dataLabels: { enabled: false },
    tooltip: { enabled: sampledPeakDemand.values.length > 0, theme: 'light', style: { fontSize: '12px' }, y: { formatter: (val) => `${Number.isFinite(Number(val)) ? Number(val).toLocaleString() : '0'} kW` } },
    legend: { show: false },
    colors: ['#0a223e']
  };

  const peakDemandSeries = [{ name: 'Peak Demand', data: sampledPeakDemand.values.length > 0 ? sampledPeakDemand.values : [0] }];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    return `${months[date.getMonth()]} ${day}`;
  };

  const calculateYAxis = (data) => {
    if (data.length === 0) { return { min: 0, max: 1, tickAmount: 4 }; }
    const maxValue = Math.max(...data.map(item => item.value));
    let max, tickAmount;
    if (maxValue <= 10) { max = 10; tickAmount = 5; }
    else if (maxValue <= 20) { max = 20; tickAmount = 4; }
    else if (maxValue <= 50) { max = 50; tickAmount = 5; }
    else if (maxValue <= 100) { max = 100; tickAmount = 5; }
    else if (maxValue <= 150) { max = 150; tickAmount = 5; }
    else if (maxValue <= 200) { max = 200; tickAmount = 4; }
    else { const scale = Math.pow(10, Math.floor(Math.log10(maxValue))); max = Math.ceil(maxValue / scale) * scale; tickAmount = 5; }
    return { min: 0, max, tickAmount };
  };

  const machinePowerOptions = {
    chart: { type: 'bar', height: 100, toolbar: { show: false }, background: 'transparent', animations: { enabled: true } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', dataLabels: { position: 'top' } } },
    grid: { strokeDashArray: 4, borderColor: 'transparent', position: 'back', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true, color: '#E5E7EB' } } },
    xaxis: { categories: weeklyConsumptionData.length > 0 ? weeklyConsumptionData.map(item => formatDate(item.date)) : ['-'], labels: { style: { colors: '#6B7280', fontSize: '12px' } }, axisBorder: { show: false }, axisTicks: { show: false }, title: { text: 'Date', style: { color: '#6B7280', fontSize: '12px' } } },
    yaxis: { min: 0, max: calculateYAxis(weeklyConsumptionData).max, tickAmount: calculateYAxis(weeklyConsumptionData).tickAmount, labels: { style: { colors: '#6B7280', fontSize: '12px' } }, axisBorder: { show: false } },
    dataLabels: { enabled: true, formatter: function (val) { return val; }, offsetY: -20, style: { fontSize: '12px', colors: ["#0a223e"] }, background: { enabled: false } },
    tooltip: { enabled: weeklyConsumptionData.length > 0, theme: 'light', style: { fontSize: '12px' }, y: { formatter: function (val) { return val + ' kWh'; } } },
    legend: { show: false },
    colors: ['#0a223e']
  };

  const machinePowerSeries = [{ name: 'kWh', data: weeklyConsumptionData.length > 0 ? weeklyConsumptionData.map(item => (typeof item?.value === 'number' && !Number.isNaN(item.value) ? item.value : 0)) : [0] }];

  const cardStyle1 = { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' };
  const titleStyle1 = { fontSize: '16px', fontWeight: 600, color: '#1F2937', fontFamily: 'sans-serif' };
  const cardStyle = { width: '200px', height: '130px', borderRadius: '14px', padding: '16px', PaddingLeft: '100px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column' };
  const titleStyle = { fontSize: '15px', fontWeight: 600, color: '#1F2937', fontFamily: 'sans-serif' };
  const labelStyle = { fontSize: '12px', color: '#6B7280', fontFamily: 'sans-serif' };
  const miniBoxStyle = { width: '64px', height: '48px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' };

  const styles = {
    mainContent: { width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)', maxWidth: sidebarVisible ? '1600px' : '1800px', minHeight: '89vh', fontFamily: 'sans-serif', fontSize: '14px', marginLeft: '8px' },
    header: { height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px', marginBottom: '20px' },
    titleRow: { marginTop: '20px', marginBottom: '20px' },
    topCard: { height: '120px', padding: '16px', borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
    chartCard: { borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
    alertsCard: { height: '460px', padding: '12px', borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' }
  };

  const getCardWidth = () => sidebarVisible ? '176px' : '206px';
  const getChartCardWidth = () => is1024 ? '100%' : (sidebarVisible ? '500px' : '540px');
  // ✅ FIX: At 1024px, chart card takes full width
  const getChartCardWidth1 = () => is1024 ? '119%' : (sidebarVisible ? '670px' : '810px');
  const getAlertsCardWidth = () => is1024 ? '10%' : (sidebarVisible ? '150px' : '294px');

  const responsiveCardStyle = {
    ...cardStyle,
    width: getCardWidth(),
    transition: 'all 0.3s ease',
    '&:hover': { backgroundColor: '#fff', boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' }
  };

  if (error) {
    return (
      <Box style={{ ...styles.mainContent, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} id="main-content">
        <Box textAlign="center">
          <Typography variant="h6" color="error">Error loading dashboard data</Typography>
          <Typography variant="body2">{error}</Typography>
          <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>Retry</button>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={styles.mainContent} id="main-content">
      <Box sx={{ paddingLeft: '10px', paddingRight: '10px', paddingBottom: '10px', display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: '10px', marginLeft: is1024 ? '-5px' : { lg: '-30px', md: '-15px', sm: '-30px' }, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'left' } }}>

          {/* Card 1: Devices */}
          <Card sx={{ ...responsiveCardStyle, width: is1024 ? '30%' :  { xs: 'calc(88% - 5px)', sm: 'calc(30% - 5px)', md: getCardWidth() }, marginLeft: { xs: '-45px', sm: '30px', md: '0' } }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <DnsIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Devices</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt="auto">
                <Box sx={{ ...miniBoxStyle, flex: 1, mr: 1, minHeight: '80px' }}>
                  <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Online</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#16A34A' }}>{slavesData.online}</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, flex: 1, ml: 1, minHeight: '80px' }}>
                  <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Offline</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#EF4444' }}>{slavesData.offline}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card 2: Energy Consumption */}
          <Card sx={{ ...responsiveCardStyle, width: is1024 ? '58.5%' :  { xs: 'calc(88% - 5px)', sm: 'calc(54% - 5px)', md: getCardWidth() === '230px' ? '500px' : (parseInt(getCardWidth()) * 2) + 'px' }, marginLeft: { xs: '-45px', sm: '0', md: '0' }, height: '130px', position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <FlashOnIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={{ ...titleStyle, fontSize: '16px' }}>Energy Consumption</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ flex: 1, pr: '80px' }}>
                <Box display="flex" flexDirection="column" gap={0.8} sx={{ flex: 1, minWidth: 0 }}>

                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: { xs: '30%', md: '110px' }, flexShrink: 0 }}>MTD</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: { xs: '40%', md: '120px' }, flexShrink: 0, textAlign: 'right' }}>
                      {energyConsumption?.mtd?.value.toFixed(1)} {energyConsumptionUnit}
                    </Typography>
                    <Tooltip title={`Cost: ₹${(energyConsumption?.mtd?.cost.toFixed(2))}`} placement="top" arrow disableHoverListener={true} enterTouchDelay={0}>
                      <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: { xs: '30%', md: '140px' }, flexShrink: 0, marginLeft: sidebarVisible ? '0' : '30px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Cost: ₹{(energyConsumption?.mtd?.cost.toFixed(2))}
                      </Typography>
                    </Tooltip>
                  </Box>

                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: { xs: '30%', md: '110px' }, flexShrink: 0 }}>Today </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: { xs: '40%', md: '120px' }, flexShrink: 0, textAlign: 'right' }}>
                      {(energyConsumption?.today?.value.toFixed(1))} {energyConsumptionUnit}
                    </Typography>
                    <Tooltip title={`Cost: ₹${(energyConsumption?.today?.cost.toFixed(2))}`} placement="top" arrow disableHoverListener={true} enterTouchDelay={0}>
                      <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: { xs: '30%', md: '140px' }, flexShrink: 0, marginLeft: sidebarVisible ? '0' : '30px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Cost: ₹{((energyConsumption?.today?.cost.toFixed(2)))}
                      </Typography>
                    </Tooltip>
                  </Box>

                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: { xs: '30%', md: '110px' }, flexShrink: 0 }}>Yesterday </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: { xs: '40%', md: '120px' }, flexShrink: 0, textAlign: 'right' }}>
                      {(energyConsumption?.yesterday?.value.toFixed(1))} {energyConsumptionUnit}
                    </Typography>
                    <Tooltip title={`Cost: ₹${(energyConsumption?.yesterday?.cost.toFixed(2))}`} placement="top" arrow disableHoverListener={true} enterTouchDelay={0}>
                      <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: { xs: '30%', md: '140px' }, flexShrink: 0, marginLeft: sidebarVisible ? '0' : '30px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Cost: ₹{((energyConsumption?.yesterday?.cost.toFixed(2)))}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card 4: Ener Tree */}
          <Card sx={{ ...responsiveCardStyle, width: is1024 ? '30%' : { xs: 'calc(88% - 7px)', sm: 'calc(30% - 7px)', md: getCardWidth() }, marginLeft: { xs: '-45px', sm: '30px', md: '0' } }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}> <PowerIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} /> <Typography sx={titleStyle}>Ener Tree</Typography> </Box>
              <Box display="flex" justifyContent="space-around" mt="auto">
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>100%</Typography> <Typography sx={labelStyle}>Main</Typography> </Box>
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0%</Typography> <Typography sx={labelStyle}>Backup</Typography> </Box>
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0%</Typography> <Typography sx={labelStyle}>Green</Typography> </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card 5: Carbon Footprints */}
          <Card sx={{ ...responsiveCardStyle, width: is1024 ? '27%' : { xs: 'calc(88% - 7px)', sm: 'calc(25% - 7px)', md: getCardWidth() }, marginLeft: { xs: '-45px', sm: '0', md: '0' } }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}> <Co2Icon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} /> <Typography sx={titleStyle}>Carbon Footprints</Typography> </Box>
              <Box display="flex" justifyContent="space-around" mt="auto">
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{((carbonFootprints?.main?.toFixed(2)))}</Typography> <Typography sx={labelStyle}>Main</Typography> </Box>
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{((carbonFootprints?.backup?.toFixed(2)))}</Typography> <Typography sx={labelStyle}>Backup</Typography> </Box>
                <Box textAlign="center"> <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{((carbonFootprints?.green?.toFixed(2)))}</Typography> <Typography sx={labelStyle}>Green</Typography> </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card 6: Load Balance */}
          <Card sx={{ ...responsiveCardStyle, width: is1024 ? '27%' : { xs: 'calc(88% - 7px)', sm: 'calc(25% - 7px)', md: getCardWidth() }, marginLeft: { xs: '-45px', sm: '0', md: '0' } }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}> <BalanceIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} /> <Typography sx={titleStyle}>Load Balance</Typography> </Box>
              <Box mt="auto">
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}> <Typography sx={labelStyle}>IR</Typography> <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography> </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}> <Typography sx={labelStyle}>IY</Typography> <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography> </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}> <Typography sx={labelStyle}>IB</Typography> <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography> </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}> <Typography sx={labelStyle}>Current LBI %</Typography> <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0%</Typography> </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Chart Section Layout */}
      <Box sx={{ backgroundColor: '', padding: '0px', marginLeft: is1024 ? '-15px' : '0px' }}>
        <Grid container spacing={3} justifyContent="center" gap={'10px'}>
          <Grid item xs={12} sm={12} md={8}>
            <Card sx={{ ...cardStyle1, width: is1024 ? '91%' : { xs: '85%', sm: '90%', md: '129%', lg: getChartCardWidth() }, marginLeft: is1024 ? '20px' : { xs: '0px', sm: '10px', md: '-120px', lg: '-10px' }, height: '170px', padding: '20px', marginBottom: '10px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#fff', boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography sx={titleStyle1}>Energy Consumption (Last 6 Hours)</Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>kWh</Typography>
              </Box>
              {hourlyLoading ? <Box></Box> : <Box sx={{ width: { xs: '100%', sm: '100%', md: '100%', lg: 500 } }}> <Chart options={energyConsumptionOptions} series={energyConsumptionSeries} type="line" height={150} /> </Box>}
            </Card>

            <Card sx={{ ...cardStyle1, width: is1024 ? '91%' : { xs: '85%', sm: '90%', md: getChartCardWidth() }, marginLeft: is1024 ? '20px' : { xs: '0px', sm: '10px', md: '-120px', lg: '-10px' }, height: '170px', padding: '20px', marginBottom: '10px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#fff', boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' } }}>
              <Typography sx={titleStyle1}> {selectedSlave ? `Demand Indicator - ${selectedSlave.slave_name}` : 'Peak Demand Indicator'}</Typography>
              {peakDemandLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '165px' }}><Typography sx={{ color: '#6B7280', fontSize: '14px' }}>Loading peak demand data...</Typography></Box> : <Box sx={{ width: { xs: '100%', sm: '230%', md: '100%', lg: 500 } }}> <Chart options={peakDemandOptions} series={peakDemandSeries} type="line" height={150} /> </Box>}
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ ...cardStyle1, width: { xs: '85%', sm: '90%',md: getChartCardWidth1() }, height: { xs: 'auto', sm: 'auto', md: is1024 ? 'auto' : '389px' }, marginLeft: is1024 ? '-92px' : { xs: '0px', sm: '10px', md: '0', lg: '0' }, padding: '20px', marginBottom: '10px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#fff', boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' } }}>
              <Grid container spacing={2}>
                {/* ✅ FIX: At 1024px chart takes full row, stacks separately */}
                <Grid item xs={12} sm={12} md={is1024 ? 12 : 8}>
                  {activeChart === 'line' ? (
                    <Box sx={{ marginBottom: '20px' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography sx={titleStyle1}>{selectedSlave ? `${selectedSlave.slave_name} Energy` : 'Energy Consumption'}</Typography>
                        <Box display="flex" gap={1}>
                          <button onClick={() => setActiveChart('bar')} style={{ padding: '4px 12px', backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0', color: activeChart === 'bar' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeChart === 'bar' ? 'bold' : 'normal', fontSize: '12px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg></button>
                          <button onClick={() => setActiveChart('line')} style={{ padding: '4px 12px', backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0', color: activeChart === 'line' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeChart === 'line' ? 'bold' : 'normal', fontSize: '12px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></button>
                        </Box>
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: '230%', md: 500, lg: 500 } }}>
                        <Chart options={{ ...energyConsumptionOptions, xaxis: { ...energyConsumptionOptions.xaxis, categories: weeklyConsumptionData.length > 0 ? weeklyConsumptionData.map(item => formatDate(item.date)).filter(Boolean) : ['-'], title: { text: 'Date', style: { color: '#6B7280', fontSize: '12px' } } }, yaxis: { ...energyConsumptionOptions.yaxis, min: 0, max: calculateYAxis(weeklyConsumptionData).max, tickAmount: calculateYAxis(weeklyConsumptionData).tickAmount, labels: { show: true } }, tooltip: { ...energyConsumptionOptions.tooltip, y: { formatter: function (val) { return (Number.isFinite(Number(val)) ? Number(val) : 0) + ' kWh'; } } } }} series={[{ name: 'Energy Consumption', data: weeklyConsumptionData.length > 0 ? weeklyConsumptionData.map(item => (typeof item?.value === 'number' && !Number.isNaN(item.value) ? item.value : 0)) : [0] }]} type="line" height={350} width={isMobile ? '100%' : isTablet ? 500 : 500} />
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography sx={titleStyle1}>Machine Power Consumption</Typography>
                        <Box display="flex" gap={1}>
                          <button onClick={() => setActiveChart('bar')} style={{ padding: '4px 12px', backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0', color: activeChart === 'bar' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeChart === 'bar' ? 'bold' : 'normal', fontSize: '12px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg></button>
                          <button onClick={() => setActiveChart('line')} style={{ padding: '4px 12px', backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0', color: activeChart === 'line' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeChart === 'line' ? 'bold' : 'normal', fontSize: '12px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></button>
                        </Box>
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: '230%', md: 500, lg: 500 } }}>
                        <Chart options={machinePowerOptions} series={machinePowerSeries} type="bar" height={350} width='100%' />
                      </Box>
                    </Box>
                  )}
                </Grid>

                {/* ✅ FIX: At 1024px device list takes full row below chart, separately */}
                <Grid item xs={12} sm={12} md={is1024 ? 12 : 4} sx={{
                  width: { xs: '100%', md: is1024 ? '40%' : getAlertsCardWidth() },
                  padding: '10px',
                  marginLeft: { xs: '0px', md: is1024 ? '0px' : (sidebarVisible ? '0px' : '0px') },
                  marginTop: is1024 ? '-10px' : { xs: '0px', md: is1024 ? '0px' : (sidebarVisible ? '0px' : '-10px') },

                }}>
                  <TextField fullWidth size="small" placeholder="Search Devices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} sx={{ marginBottom: '8px', '& .MuiOutlinedInput-root': { borderRadius: '8px', height: '30px' } }} InputProps={{ startAdornment: (<InputAdornment position="start"> <SearchIcon /> </InputAdornment>), }} />
                  <Box sx={{
                    maxHeight: is1024 ? "340px" : "340px",
                    overflowY: "auto",
                    scrollbarWidth: "thin"
                  }}>
                    {Array.isArray(slaveList) ? (slaveList.filter(slave => slave.slave_name && slave.slave_name.toLowerCase().includes(searchTerm)).map((slave, index) => {

                      const isNameTruncated = slave.slave_name && slave.slave_name.length > 20;

                      const slaveBox = (
                        <Box
                          onClick={() => handleSlaveSelect(slave)}
                          sx={{
                            height: '25px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor:
                              selectedSlave?.slave_id === slave.slave_id
                                ? '#E3F2FD'
                                : index % 2 === 0
                                  ? '#F9FAFB'
                                  : '#FFFFFF',
                            border:
                              selectedSlave?.slave_id === slave.slave_id
                                ? '2px solid #E5E7EB'
                                : '1px solid #E5E7EB',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#F3F4F6',
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          <FlashOnIcon sx={{ mr: 1 }} />

                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '160px'
                            }}
                          >
                            {truncateText(slave.slave_name)}
                          </Typography>
                        </Box>
                      );

                      if (isNameTruncated) {
                        return (
                          <Tooltip
                            key={slave.slave_id}
                            title={slave.slave_name}
                            placement={isMobile ? "top" : "right"}
                            arrow
                            enterTouchDelay={0}
                            disableHoverListener={isMobile}
                            disableFocusListener={isMobile}
                          >
                            {slaveBox}
                          </Tooltip>
                        );
                      }

                      return <React.Fragment key={slave.slave_id}>{slaveBox}</React.Fragment>;

                    })) : null}
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;