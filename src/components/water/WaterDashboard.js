import React, { useState } from 'react';
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
  InputAdornment
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
// import '../../dashboard.css';
import Tooltip from '@mui/material/Tooltip';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';

const WaterDashboard = ({ onSidebarToggle, sidebarVisible }) => {
  const truncateText = (text, length = 9) =>
    text.length > length ? text.slice(0, length) + '...' : text;

  // Static data instead of API calls
  const [dashboardData] = useState({
    devices: { total: 10, online: 7, offline: 3 },
    energy_consumption: {
      mtd: { value: 1250.5, cost: 12500.50 },
      today: { value: 45.8, cost: 458.00 },
      yesterday: { value: 52.3, cost: 523.00 },
      unit: 'kWh'
    },
    carbon_footprints: {
      main: 875.35,
      backup: 0,
      green: 0,
      unit: 'tCO2'
    }
  });
  
  const [slaveList] = useState([
    { slave_id: 1, slave_name: 'Machine 1 - Production Line A' },
    { slave_id: 2, slave_name: 'Machine 2 - Production Line B' },
    { slave_id: 3, slave_name: 'Machine 3 - Production Line C' },
    { slave_id: 4, slave_name: 'Machine 4 - Production Line D' },
    { slave_id: 5, slave_name: 'Machine 5 - Production Line E' },
    { slave_id: 6, slave_name: 'Machine 6 - Production Line F' },
    { slave_id: 7, slave_name: 'Machine 7 - Production Line G' },
    { slave_id: 8, slave_name: 'Machine 8 - Production Line H' }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlave, setSelectedSlave] = useState(null);
  const [activeChart, setActiveChart] = useState('bar'); // 'line' or 'bar'
  
  // Static hourly energy data
  const [hourlyEnergyData] = useState({
    hours: [
      '2023-06-01T06:00:00Z',
      '2023-06-01T07:00:00Z',
      '2023-06-01T08:00:00Z',
      '2023-06-01T09:00:00Z',
      '2023-06-01T10:00:00Z',
      '2023-06-01T11:00:00Z'
    ],
    consumption: [12, 19, 15, 25, 22, 30]
  });
  
  // Static weekly consumption data
  const [weeklyConsumptionData] = useState([
    { date: '2026-02-5', value: 45 },
    { date: '2026-02-6', value: 52 },
    { date: '2026-02-7', value: 38 },
    { date: '2026-02-8', value: 41 },
    { date: '2026-02-9', value: 55 },
    { date: '2026-02-10', value: 48 },
    { date: '2026-02-11', value: 62 }
  ]);
  
  // Static peak demand data
  const [peakDemandData] = useState({
    timestamps: [
      '2023-06-01T06:00:00Z',
      '2023-06-01T08:00:00Z',
      '2023-06-01T10:00:00Z',
      '2023-06-01T12:00:00Z',
      '2023-06-01T14:00:00Z',
      '2023-06-01T16:00:00Z',
      '2023-06-01T18:00:00Z'
    ],
    values: [120, 145, 165, 180, 175, 160, 140]
  });

  // Function to handle slave selection (no API call)
  const handleSlaveSelect = (slave) => {
    setSelectedSlave(slave);
    console.log('Selected slave:', slave.slave_name);
  };

  // Extract data from static data
  const slavesData = dashboardData?.devices || { total: 0, online: 0, offline: 0 };
  const energyConsumption = dashboardData?.energy_consumption || 0;
  const energyConsumptionUnit = dashboardData?.energy_consumption?.unit || 'kWh';
  const carbonFootprints = dashboardData?.carbon_footprints || 0;
  
  // Use the static hourly energy data
  const hourlyData = hourlyEnergyData.hours;
  const hourlyValues = hourlyEnergyData.consumption;
  
  // Helper function to format as 'HH.MM'
  const formatDateTime = (hourString) => {
    if (!hourString) return '';
    const date = new Date(hourString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}.${minutes}`;
  };

  // Format hours for x-axis categories
  const hourlyCategories = hourlyData.map(hourString => {
    return formatDateTime(hourString);
  });

  const shortNumber = (value) => {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
    if (value >= 1e9) return (value / 1e9).toFixed(0) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(0) + "M";
    return value.toFixed(0);
  };

  // Chart configurations
  const energyConsumptionOptions = {
    chart: {
      type: 'line',
      height: 140,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },

    stroke: {
      curve: 'smooth',
      width: 2
    },

    markers: {
      size: 0
    },

    grid: {
      strokeDashArray: 4,
      borderColor: 'transparent',
      position: 'back',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: '#E5E7EB' } }
    },

    xaxis: {
      categories: hourlyCategories,
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' },
        formatter: (val) => val
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },

    yaxis: {
      min: hourlyValues.length > 0 ? Math.min(...hourlyValues, 0) : 0,
      max: hourlyValues.length > 0 ? Math.max(...hourlyValues, 1) : 1,
      tickAmount: 4,
      labels: {
        formatter: (val) => shortNumber(val),
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false }
    },

    dataLabels: {
      enabled: true,
      formatter: (val) => shortNumber(val),
      offsetY: -10,
      offsetX: 4,
      style: {
        fontSize: '12px',
        colors: ['#0a223e']
      },
      background: {
        enabled: false
      }
    },

    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' },
      x: {
        formatter: function (val, opts) {
          const index = opts.dataPointIndex;
          if (hourlyData[index]) {
            return formatDateTime(hourlyData[index]);
          }
          return val;
        }
      },
      y: {
        formatter: (val) => `${val.toLocaleString()} kWh`
      }
    },

    legend: {
      show: false
    },

    colors: ['#0a223e']
  };

  const energyConsumptionSeries = [{
    name: '(kWh)',
    data: hourlyValues
  }];

  // Helper function to format timestamp as HH:MM
  const formatTimestamp = (timestampString) => {
    if (!timestampString) return '';
    const date = new Date(timestampString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Sample peak demand data to show only 6-7 points for better display
  const samplePeakDemandData = () => {
    const totalPoints = peakDemandData.timestamps.length;
    if (totalPoints <= 7) {
      // If we have 7 or fewer points, use all of them
      return {
        categories: peakDemandData.timestamps.map(timestamp => formatTimestamp(timestamp)),
        values: [...peakDemandData.values]
      };
    } else {
      // Sample 7 evenly spaced points
      const sampledCategories = [];
      const sampledValues = [];
      const step = Math.floor((totalPoints - 1) / 6); // To get 7 points including first and last
      
      for (let i = 0; i < totalPoints; i += step) {
        if (sampledCategories.length < 7) {
          sampledCategories.push(formatTimestamp(peakDemandData.timestamps[i]));
          sampledValues.push(peakDemandData.values[i]);
        } else {
          break;
        }
      }
      
      // Ensure we have exactly 7 points by adding the last point if needed
      if (sampledCategories.length < 7 && totalPoints >= 7) {
        const lastIndex = sampledCategories.length - 1;
        sampledCategories[lastIndex] = formatTimestamp(peakDemandData.timestamps[totalPoints - 1]);
        sampledValues[lastIndex] = peakDemandData.values[totalPoints - 1];
      }
      
      return {
        categories: sampledCategories,
        values: sampledValues
      };
    }
  };
  
  // Get sampled peak demand data
  const sampledPeakDemand = samplePeakDemandData();

  // Chart 2: Peak Demand Indicator
  const peakDemandOptions = {
    chart: {
      type: 'line',
      height: 150,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },

    stroke: {
      curve: 'smooth',
      width: 3
    },

    markers: {
      size: 6,
      colors: ['#cbc84c'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1
    },

    grid: {
      strokeDashArray: 4,
      borderColor: 'transparent',
      position: 'back',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: '#E5E7EB' } }
    },

    xaxis: {
      categories:
        sampledPeakDemand.categories.length > 0
          ? sampledPeakDemand.categories
          : ['-'],
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },

    yaxis: {
      min:
        peakDemandData.values.length > 0
          ? Math.min(...peakDemandData.values, 0)
          : 0,
      max:
        peakDemandData.values.length > 0
          ? Math.max(...peakDemandData.values) * 1.1
          : 10,
      tickAmount: 5,
      labels: {
        formatter: (val) => shortNumber(val),
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false }
    },

    dataLabels: {
      enabled: false
    },

    tooltip: {
      enabled: peakDemandData.values.length > 0,
      theme: 'light',
      style: { fontSize: '12px' },
      y: {
        formatter: (val) => `${val.toLocaleString()} kW`
      }
    },

    legend: {
      show: false
    },

    colors: ['#0a223e']
  };

  const peakDemandSeries = [{
    name: 'Peak Demand',
    data: sampledPeakDemand.values.length > 0 ? sampledPeakDemand.values : [0]
  }];

  // Chart 3: Machine Power Consumption
  // Helper function to format date as 'Jan 01'
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    return `${months[date.getMonth()]} ${day}`;
  };

  // Helper function to calculate appropriate y-axis values based on data range
  const calculateYAxis = (data) => {
    if (data.length === 0) {
      return { min: 0, max: 1, tickAmount: 4 };
    }

    const maxValue = Math.max(...data.map(item => item.value));

    // Determine the appropriate scale based on the max value
    let max, tickAmount;
    if (maxValue <= 10) {
      max = 10;
      tickAmount = 5;
    } else if (maxValue <= 20) {
      max = 20;
      tickAmount = 4;
    } else if (maxValue <= 50) {
      max = 50;
      tickAmount = 5;
    } else if (maxValue <= 100) {
      max = 100;
      tickAmount = 5;
    } else if (maxValue <= 150) {
      max = 150;
      tickAmount = 5;
    } else if (maxValue <= 200) {
      max = 200;
      tickAmount = 4;
    } else {
      // For larger values, round up to a nice number
      const scale = Math.pow(10, Math.floor(Math.log10(maxValue)));
      max = Math.ceil(maxValue / scale) * scale;
      tickAmount = 5;
    }

    return { min: 0, max, tickAmount };
  };

  // Dynamic chart configuration based on selected slave
  const machinePowerOptions = {
    chart: {
      type: 'bar',
      height: 100,
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '25%',
        dataLabels: { position: 'top' }
      }
    },
    grid: {
      strokeDashArray: 4,
      borderColor: 'transparent',
      position: 'back',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true, color: '#E5E7EB' } }
    },
    xaxis: {
      categories: weeklyConsumptionData.length > 0
        ? weeklyConsumptionData.map(item => formatDate(item.date))
        : ['-'],
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: 'Date',
        style: { color: '#6B7280', fontSize: '12px' }
      }
    },
    yaxis: {
      min: 0,
      max: calculateYAxis(weeklyConsumptionData).max,
      tickAmount: calculateYAxis(weeklyConsumptionData).tickAmount,
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#0a223e"]
      },
      background: {
        enabled: false,
      },
    },
    tooltip: {
      enabled: weeklyConsumptionData.length > 0,
      theme: 'light',
      style: { fontSize: '12px' },
      y: {
        formatter: function (val) {
          return val + ' kWh';
        }
      }
    },
    legend: { show: false },
    colors: ['#0a223e']
  };

  const machinePowerSeries = [{
    name: 'kWh',
    data: weeklyConsumptionData.length > 0
      ? weeklyConsumptionData.map(item => item.value)
      : [0]
  }];

  // Card styles
  const cardStyle1 = {
    borderRadius: '16px',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF'
  };

  const titleStyle1 = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
    fontFamily: 'sans-serif'
  };
  const cardStyle = {
    width: '200px',
    height: '100px',
    borderRadius: '14px',
    padding: '16px',
    PaddingLeft: '100px',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  };

  const titleStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1F2937',
    fontFamily: 'sans-serif'
  };

  const valueStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1F2937',
    fontFamily: 'sans-serif'
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#6B7280',
    fontFamily: 'sans-serif'
  };

  const miniBoxStyle = {
    width: '64px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  };

  // Define styles based on the provided requirements
  const styles = {
    mainContent: {
      width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)',
      maxWidth: sidebarVisible ? '1600px' : '1800px',
      minHeight: '89vh',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      marginLeft: '8px',
    },
    header: {
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      marginBottom: '20px'
    },
    titleRow: {
      marginTop: '20px',
      marginBottom: '20px',
    },
    topCard: {
      height: '120px',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
    },
    chartCard: {
      borderRadius: '12px',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
      height: '100%',
    },
    alertsCard: {
      height: '460px',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
    }
  };

  // Calculate responsive card widths based on sidebar visibility
  const getCardWidth = () => {
    if (sidebarVisible) {
      return '176px'; // Smaller width when sidebar is visible
    }
    return '247px'; // Original width when sidebar is hidden
  };

  // Calculate responsive chart card widths based on sidebar visibility
  const getChartCardWidth = () => {
    if (sidebarVisible) {
      return '500px'; // Smaller width when sidebar is visible
    }
    return '540px'; // Original width when sidebar is hidden
  };
  const getChartCardWidth1 = () => {
    if (sidebarVisible) {
      return '670px'; // Smaller width when sidebar is visible
    }
    return '1400px'; // Original width when sidebar is hidden
  };

  // Calculate responsive alerts card width based on sidebar visibility
  const getAlertsCardWidth = () => {
    if (sidebarVisible) {
      return '150px'; // Smaller width when sidebar is visible
    }
    return '350px'; // Original width when sidebar is hidden
  };

  // Update card styles with dynamic width
  const responsiveCardStyle = {
    ...cardStyle,
    width: getCardWidth(),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#fff',
      boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-2px)',
    }
  };

  return (
    <Box style={styles.mainContent} id="main-content">
      {/* Top Summary Cards Row */}
      <Box sx={{
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', gap: '10px', marginLeft: '-40px' }}>
          {/* Card 1: Devices */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '14px' }} />
                <Typography sx={titleStyle}>Raw Water Inlet</Typography>
              </Box>
              <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>24.0 KLD</Typography>
              </Box>
               <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>Yesterday 61.0 KLD</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Merged Card: Energy Consumption & Power Factor */}
          <Card sx={{...responsiveCardStyle,}}>
          <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '14px' }} />
                <Typography sx={titleStyle}>Raw Water Outlet</Typography>
              </Box>
              <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>13.0 KLD</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 4: Ener Tree */}
          <Card sx={responsiveCardStyle}>
           <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '14px' }} />
                <Typography sx={titleStyle}>Filter Water Outlet</Typography>
              </Box>
              <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>18.0 KLD</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 5: Carbon Footprints */}
          <Card sx={responsiveCardStyle}>
         <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <LocalDrinkOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '14px', }} />
              </Box>
              <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '14px', color: '#0156a6', fontWeight: 'bold' }}>Drinking RO</Typography>
              </Box>
               <Box display="flex" justifyContent="center" mt="10px">
                  <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>Yesterday 0.0 KLD</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 6: Load Balance */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center"mb="10px">
                <WaterDropOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '14px' }} />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography sx={titleStyle}>Water Positivity</Typography>
              </Box>
              <Box display="flex" justifyContent="center" mb="10px">
                  <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>26.0 KLD</Typography>
              </Box>
               <Box display="flex" justifyContent="center">
                  <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>Yesterday 60.0 KLD</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Chart Section Layout */}
      <Box sx={{ backgroundColor: '', padding: '0px', marginLeft: '-20px' }}>
        <Grid container spacing={3} justifyContent="center" gap={'10px'}>
          <Grid item xs={12}>
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth1(),
              height: '389px',
              padding: '20px',
              marginBottom: '10px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#fff',
                boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
              }
            }}>
              <Grid container spacing={2}>
                {/* Left Column - Charts */}
                <Grid item xs={8}>
                  {/* Conditional Chart Rendering with Inline Buttons */}
                  {activeChart === 'line' ? (
                    /* Energy Consumption Chart */
                    <Box sx={{ marginBottom: '20px' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography sx={titleStyle1}>
                          {selectedSlave ? `${selectedSlave.slave_name} Energy` : 'Energy Consumption'}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <button
                            onClick={() => setActiveChart('bar')}
                            style={
                              {
                                padding: '4px 12px',
                                backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0',
                                color: activeChart === 'bar' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeChart === 'bar' ? 'bold' : 'normal',
                                fontSize: '12px'
                              }
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10"></line>
                              <line x1="12" y1="20" x2="12" y2="4"></line>
                              <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                          </button>
                          <button
                            onClick={() => setActiveChart('line')}
                            style={
                              {
                                padding: '4px 12px',
                                backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0',
                                color: activeChart === 'line' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeChart === 'line' ? 'bold' : 'normal',
                                fontSize: '12px'
                              }
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                          </button>
                        </Box>
                      </Box>
                      
                        <Chart
                          options={{
                            ...energyConsumptionOptions,
                            xaxis: {
                              ...energyConsumptionOptions.xaxis,
                              categories: weeklyConsumptionData.map(item => formatDate(item.date)),
                              title: {
                                text: 'Date',
                                style: { color: '#6B7280', fontSize: '12px' }
                              }
                            },
                            yaxis: {
                              ...energyConsumptionOptions.yaxis,
                              min: 0,
                              max: calculateYAxis(weeklyConsumptionData).max,
                              tickAmount: calculateYAxis(weeklyConsumptionData).tickAmount,
                              labels: { show: true }
                            },
                            tooltip: {
                              ...energyConsumptionOptions.tooltip,
                              y: {
                                formatter: function (val) {
                                  return val + ' kWh';
                                }
                              }
                            }
                          }}
                          series={[{
                            name: 'Energy Consumption',
                            data: weeklyConsumptionData.map(item => item.value)
                          }]}
                          type="line"
                          height={350}
                          width={900}
                        />
                    </Box>
                  ) : (
                    /* Machine Power Consumption Chart */
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography sx={titleStyle1}>Machine Power Consumption</Typography>
                        <Box display="flex" gap={1}>
                          <button
                            onClick={() => setActiveChart('bar')}
                            style={
                              {
                                padding: '4px 12px',
                                backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0',
                                color: activeChart === 'bar' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeChart === 'bar' ? 'bold' : 'normal',
                                fontSize: '12px'
                              }
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10"></line>
                              <line x1="12" y1="20" x2="12" y2="4"></line>
                              <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                          </button>
                          <button
                            onClick={() => setActiveChart('line')}
                            style={
                              {
                                padding: '4px 12px',
                                backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0',
                                color: activeChart === 'line' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeChart === 'line' ? 'bold' : 'normal',
                                fontSize: '12px'
                              }
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                          </button>
                        </Box>
                      </Box>
                      <Chart
                        options={machinePowerOptions}
                        series={machinePowerSeries}
                        type="bar"
                        height={350}
                        width={900}
                      />
                    </Box>
                  )}
                </Grid>

                {/* Right Column - Alerts Panel */}
                <Grid item xs={4} sx={{ width: getAlertsCardWidth(), padding: '10px', marginLeft: sidebarVisible ? '0px' : '130px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search machines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                    sx={{
                      marginBottom: '8px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        height: '30px'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ maxHeight: "340px", overflowY: "auto", scrollbarWidth: "thin" }}>
                    {Array.isArray(slaveList) ? (
                      slaveList
                        .filter(slave => slave.slave_name && slave.slave_name.toLowerCase().includes(searchTerm))
                        .map((slave, index) => (
                        <Box
                          key={slave.slave_id}
                          sx={{
                            height: '20px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: selectedSlave?.slave_id === slave.slave_id ? '#E3F2FD' : (index % 2 === 0 ? '#F9FAFB' : '#FFFFFF'),
                            border: selectedSlave?.slave_id === slave.slave_id ? '2px solid #E5E7EB' : '1px solid #E5E7EB',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#F3F4F6',
                              boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                              transform: 'translateY(-2px)',
                              border: '1px solid #0a223e'
                            }
                          }}
                          onClick={() => {
                            console.log('Slave list item clicked:', slave.slave_name);
                            handleSlaveSelect(slave);
                          }}
                        >
                          <Box sx={{ marginRight: '8px', color: '#444444', fontWeight: 'bold', marginTop: "10px" }}>
                            <FlashOnIcon fontSize="small" onClick={() => handleSlaveSelect(slave)} />
                          </Box>

                          <Tooltip
                            title={sidebarVisible ? slave.slave_name : ''}
                            placement="right"
                            arrow
                            disableHoverListener={!sidebarVisible}
                          >
                            <Typography
                              sx={{
                                fontSize: '14px',
                                color: '#444444',
                                fontWeight: 'bold',
                                fontFamily: 'ubuntu, sans-serif',
                                cursor: 'pointer',
                                flex: 1,
                                whiteSpace: sidebarVisible ? 'nowrap' : 'normal',
                                overflow: sidebarVisible ? 'hidden' : 'visible',
                                textOverflow: sidebarVisible ? 'ellipsis' : 'clip',
                                maxWidth: sidebarVisible ? '90px' : '100%',
                                transition: 'all 0.3s ease',
                              }}
                              onClick={() => handleSlaveSelect(slave)}
                            >
                              {sidebarVisible ? truncateText(slave.slave_name) : slave.slave_name}
                            </Typography>
                          </Tooltip>
                        </Box>
                      ))) : null}
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

export default WaterDashboard;