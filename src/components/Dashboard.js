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
import { getDashboardOverview, getSlaveList, getSlaveWeeklyConsumption } from '../auth/DashboardApi';
import './Dashboard.css';

const Dashboard = ({ onSidebarToggle, sidebarVisible }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [slaveList, setSlaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlave, setSelectedSlave] = useState(null);
  const [weeklyConsumptionData, setWeeklyConsumptionData] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors

        // Fetch both dashboard overview and slave list concurrently
        const [dashboardResponse, slaveResponse] = await Promise.all([
          getDashboardOverview(),
          getSlaveList()
        ]);

        console.log('Dashboard API response in useEffect:', dashboardResponse);
        console.log('Slave list API response:', slaveResponse);

        // Set the data
        setDashboardData(dashboardResponse);
        setSlaveList(slaveResponse);

        // Automatically select slave ID 1 if it exists
        const slaveId1 = slaveResponse.find(slave => slave.id === 1);
        if (slaveId1) {
          console.log('Auto-selecting slave ID 1');
          handleSlaveSelect(slaveId1);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle slave selection and fetch weekly consumption data
  const handleSlaveSelect = async (slave) => {
    try {
      setSelectedSlave(slave);
      console.log('Selected slave:', slave);
      
      // Fetch weekly consumption data for the selected slave
      const weeklyData = await getSlaveWeeklyConsumption(slave.id);
      console.log('Weekly consumption data:', weeklyData);
      
      setWeeklyConsumptionData(weeklyData);
    } catch (error) {
      console.error('Error fetching weekly consumption data:', error);
      setError(error.message || 'An error occurred while fetching weekly consumption data');
    }
  };

  // Extract data from API response
  console.log('Dashboard data state:', dashboardData);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  const slavesData = dashboardData?.slaves || { total: 0, online: 0, offline: 0 };
  const energyConsumption = dashboardData?.acte_im_total || 0;
  const hourlyData = dashboardData?.acte_im_hourly_24h?.data || [];

  console.log('Slaves data:', slavesData);
  console.log('Energy consumption:', energyConsumption);
  console.log('Hourly data length:', hourlyData.length);

  // Helper function to format as 'HH.MM'
  const formatDateTime = (hourString) => {
    if (!hourString) return '';
    const date = new Date(hourString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}.${minutes}`;
  };

  // Transform hourly data for charts - Sample only 6 data points
  const totalDataPoints = hourlyData.length;
  let hourlyCategories = [];
  let hourlyValues = [];

  if (totalDataPoints > 0) {
    if (totalDataPoints <= 8) {
      // If we have 6 or fewer points, use all of them
      hourlyCategories = hourlyData.map(item => {
        return formatDateTime(item.hour);
      });
      hourlyValues = hourlyData.map(item => item.value);
    } else {
      // If we have more than 6 points, sample 6 evenly spaced points
      const step = Math.floor((totalDataPoints - 1) / 7); // To get 6 points including first and last
      for (let i = 0; i < totalDataPoints; i += step) {
        if (hourlyCategories.length < 8) {
          const item = hourlyData[i];
          hourlyCategories.push(formatDateTime(item.hour));
          hourlyValues.push(item.value);
        } else {
          break; // Stop once we have 6 points
        }
      }
      // Ensure we have exactly 6 points by adding the last point if needed
      if (hourlyCategories.length < 8 && hourlyData.length >= 8) {
        const lastItem = hourlyData[hourlyData.length - 1];
        const lastIndex = hourlyCategories.length - 1;
        hourlyCategories[lastIndex] = formatDateTime(lastItem.hour);
        hourlyValues[lastIndex] = lastItem.value;
      }
    }
  }

  // Chart configurations remain the same
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
    markers: { size: 0 },
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
        // rotate: -45,
        // rotateAlways: true,
        hideOverlappingLabels: false,
        formatter: function(val) {
          return val; // Return the full formatted value
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: Math.min(...hourlyValues, 0),
      max: Math.max(...hourlyValues, 1),
      tickAmount: 2,
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false }
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' },
      x: {
        formatter: function (val, opts) {
          // Get the original data point index
          const index = opts.dataPointIndex;
          // Get the original hour string from hourlyData
          if (hourlyData[index]) {
            return formatDateTime(hourlyData[index].hour);
          }
          return val;
        }
      },
      y: {
        formatter: function (val) {
          return val + ' kWh';
        }
      }
    },
    legend: { show: false },
    colors: ['#9B8AE6']
  };

  const energyConsumptionSeries = [{
    name: '(kWh)',
    data: hourlyValues
  }];

  // Chart 2: Peak Demand Indicator
  const peakDemandOptions = {
    chart: {
      type: 'line',
      height: 150,
      toolbar: { show: false },
      background: 'transparent'
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 6,
      colors: ['#2F855A'],
      strokeColors: '#fff',
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
      categories: ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'],
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 100,
      max: 150,
      tickAmount: 5,
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false }
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' }
    },
    legend: { show: false },
    colors: ['#4C8C6B']
  };

  const peakDemandSeries = [{
    name: 'Peak Demand',
    data: [120, 135, 125, 140, 130, 145, 135]
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
        columnWidth: '45%',
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
    dataLabels: { enabled: false },
    tooltip: {
      enabled: weeklyConsumptionData.length > 0, // Only show tooltip when data exists
      theme: 'light',
      style: { fontSize: '12px' },
      y: {
        formatter: function(val) {
          return val + ' kWh';
        }
      }
    },
    legend: { show: false },
    colors: ['#6F4A74']
  };

  const machinePowerSeries = [{
    name: 'kWh',
    data: weeklyConsumptionData.length > 0 
      ? weeklyConsumptionData.map(item => item.value)
      : [0] // Provide a minimal data point to prevent chart breaking
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
    height: '120px',
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
      width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)', // Adjust width based on sidebar visibility
      maxWidth: sidebarVisible ? '1600px' : '1800px', // Adjust max width
      minHeight: 'auto',
      // backgroundColor: '#F8FAFC',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      // padding: '24px',
      margin: '0',
      marginBottom: '20px',
      transition: 'all 0.3s ease', // Add smooth transition
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
      // backgroundColor: '#FFFFFF',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
    },
    chartCard: {
      // backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
      // height: '100%',
    },
    alertsCard: {
      height: '460px',
      padding: '12px',
      borderRadius: '12px',
      // backgroundColor: '#FFFFFF',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
    }
  };

  // Calculate responsive card widths based on sidebar visibility
  const getCardWidth = () => {
    if (sidebarVisible) {
      return '160px'; // Smaller width when sidebar is visible
    }
    return '201px'; // Original width when sidebar is hidden
  };

  // Calculate responsive chart card widths based on sidebar visibility
  const getChartCardWidth = () => {
    if (sidebarVisible) {
      return '470px'; // Smaller width when sidebar is visible
    }
    return '570px'; // Original width when sidebar is hidden
  };

  // Calculate responsive alerts card width based on sidebar visibility
  const getAlertsCardWidth = () => {
    if (sidebarVisible) {
      return '160px'; // Smaller width when sidebar is visible
    }
    return '200px'; // Original width when sidebar is hidden
  };

  // Update card styles with dynamic width
  const responsiveCardStyle = {
    ...cardStyle,
    width: getCardWidth(),
    transition: 'all 0.3s ease',
  };

  // if (loading) {
  //   return (
  //     <Box style={{...styles.mainContent, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}} id="main-content">
  //       <Typography variant="h6">Loading dashboard data...</Typography>
  //     </Box>
  //   );
  // }

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
      {/* Header */}
      <Box style={styles.blockHeader} className="block-header mb-1">
        <Grid container>
          <Grid lg={5} md={8} xs={12}>
            <Typography
              variant="h6"
              className="logs-title"
              style={{
                // marginBottom: '-10px',
                color: '#0156a6',
                fontWeight: 600,
                fontFamily: 'sans-serif',
              }}
            >
              <span
                onClick={onSidebarToggle}
                style={{
                  fontSize: '14px',
                  lineHeight: 1,
                  marginLeft: '-2px',
                  fontWeight: '400',
                  display: 'inline-block',
                  cursor: 'pointer',
                  marginRight: '8px',
                  userSelect: 'none',
                  color: '#007bff'
                }}
              >
                <i className={`fa ${sidebarVisible ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
              </span>
              Dashboard
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Top Summary Cards Row */}
      <Box sx={{
        // backgroundColor: '#FFFFFF', 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', gap: '18px', marginLeft: '-40px' }}>
          {/* Card 1: Devices */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <DnsIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Devices</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt="auto">
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#E9F7E7' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Online</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#16A34A' }}>{slavesData.online}</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#FDECEC' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Offline</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}>{slavesData.offline}</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#EAF3FF' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Total</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#2563EB' }}>{slavesData.total}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Card 2: Energy Consumption */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <FlashOnIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Energy Consumption</Typography>
              </Box>
              <Box display="flex" alignItems="baseline" mt="auto">
                <Typography sx={valueStyle}>{energyConsumption.toFixed(1)}</Typography>
                <Typography sx={{ fontSize: '13px', color: '#6B7280', ml: 1 }}>kWh</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography sx={labelStyle}>Predictive:</Typography>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>{(energyConsumption * 1.1).toFixed(1)} kWh</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={labelStyle}>Cost:</Typography>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>₹{(energyConsumption * 0.1).toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 3: Power Factor */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Power Factor</Typography>
              </Box>
              <Box display="flex" alignItems="baseline" mt="auto">
                <Typography sx={valueStyle}>0.25</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography sx={labelStyle}>Reactive Power:</Typography>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>100 kVAr</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 4: Ener Tree */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <PowerIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Ener Tree</Typography>
              </Box>
              <Box display="flex" justifyContent="space-around" mt="auto">
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>100%</Typography>
                  <Typography sx={labelStyle}>Main</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0%</Typography>
                  <Typography sx={labelStyle}>Backup</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0%</Typography>
                  <Typography sx={labelStyle}>Green</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" mt={1}>
                <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>–</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 5: Carbon Footprints */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Co2Icon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Carbon Footprints</Typography>
              </Box>
              <Box display="flex" justifyContent="space-around" mt="auto">
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>100</Typography>
                  <Typography sx={labelStyle}>Main</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0</Typography>
                  <Typography sx={labelStyle}>Backup</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>0</Typography>
                  <Typography sx={labelStyle}>Green</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" mt={1}>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>kg of CO₂</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Card 6: Load Balance */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <BalanceIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Load Balance</Typography>
              </Box>
              <Box mt="auto">
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>IR</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>25 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>IY</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>25 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>IB</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>25 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>Current LBI %</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>11%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Chart Section Layout */}
      <Box sx={{ backgroundColor: '', padding: '0px', marginLeft: '-1px' }}>
        <Grid container spacing={3} justifyContent="center" gap={'18px'}>
          {/* Left Column - 2 Stacked Cards */}
          <Grid item xs={8}>
            {/* Card 1: Energy Consumption (Last 24 Hours) */}
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth(),
              height: '200px',
              padding: '20px',
              marginBottom: '20px',
              transition: 'all 0.3s ease'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography sx={titleStyle1}>Energy Consumption (Last 24 Hours)</Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>kWh</Typography>
              </Box>
              <Chart
                options={energyConsumptionOptions}
                series={energyConsumptionSeries}
                type="line"
                height={150}  // Reduced to fit within 150px card
              />
            </Card>

            {/* Card 2: Peak Demand Indicator */}
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth(),
              height: '200px',
              padding: '20px',
              marginBottom: '20px',
              transition: 'all 0.3s ease'
            }}>
              <Typography sx={titleStyle1}>Peak Demand Indicator</Typography>
              <Chart
                options={peakDemandOptions}
                series={peakDemandSeries}
                type="line"
                height={180}  // Reduced to fit within 150px card
              />
            </Card>
          </Grid>

          <Grid item xs={8}>
            {/* Card 3: Energy Consumption (Empty Title) */}
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth(),
              height: '200px',  // Changed from 100px to 150px
              padding: '20px',
              marginBottom: '20px',
              transition: 'all 0.3s ease'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography sx={titleStyle1}></Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>kWh</Typography>
              </Box>
              <Chart
                options={energyConsumptionOptions}
                series={energyConsumptionSeries}
                type="line"
                height={150}  // Reduced to fit within 150px card
              />
            </Card>

            {/* Card 4: Machine Power Consumption */}
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth(),
              height: '200px',  // Changed from 400px to 150px
              padding: '20px',
              marginBottom: '20px',
              transition: 'all 0.3s ease'
            }}>
              <Typography sx={titleStyle1}>Machine Power Consumption</Typography>
              <Chart
                options={machinePowerOptions}
                series={machinePowerSeries}
                type="bar"
                height={180}  // Reduced to fit within 150px card
              />
            </Card>
          </Grid>

          {/* Right Side - Alerts Panel */}
          <Grid item xs={4}>
            <Card sx={{
              ...cardStyle1,
              width: getAlertsCardWidth(),
              height: '30px',  // Changed from 400px to 150px
              padding: '16px',
              transition: 'all 0.3s ease',
              marginBottom: '5px'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography sx={titleStyle1}>Alerts</Typography>
                <Badge badgeContent={slaveList.length} color="error"></Badge>
              </Box>
            </Card>
            <Card sx={{
              ...cardStyle1,
              width: getAlertsCardWidth(),
              height: '400px',  // Changed from 400px to 150px
              padding: '16px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}>

              <TextField
                fullWidth
                size="small"
                placeholder="Search machines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                sx={{
                  marginBottom: '8px',  // Reduced margin
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    height: '30px'  // Reduced height
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

              {/* Alert Items - Limited to fit in 150px height */}
              <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
                {slaveList
                  .filter(slave => slave.name.toLowerCase().includes(searchTerm))
                  .map((slave, index) => (  // Use actual slave data
                    <Box
                      key={slave.id}
                      sx={{
                        height: '40px',  // Increased height for better card appearance
                        padding: '8px 12px',  // Increased padding
                        borderRadius: '8px',
                        marginBottom: '6px',  // Increased margin
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                        border: '1px solid #E5E7EB',  // Add border for card appearance
                        transition: 'all 0.2s ease-in-out',  // Smooth transition
                        '&:hover': {
                          backgroundColor: '#F3F4F6',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',  // Shadow effect on hover
                          transform: 'translateY(-1px)',  // Slight lift effect
                          border: '1px solid #D1D5DB'  // Darker border on hover
                        }
                      }}
                      onClick={() => handleSlaveSelect(slave)}
                    >
                      <Box sx={{ marginRight: '8px', color: '#444444', fontWeight: 'bold' }}>
                        <FlashOnIcon fontSize="small" onClick={() => handleSlaveSelect(slave)} />
                      </Box>
                      <Typography 
                        sx={{ 
                          fontSize: '16px', 
                          color: '#444444', 
                          fontWeight: 'bold', 
                          fontFamily: 'ubuntu, sans-serif',
                          cursor: 'pointer',
                          '&:hover': {
                            // textDecoration: 'underline',
                            // color: '#1976d2'
                          }
                        }}
                        onClick={() => handleSlaveSelect(slave)}
                      >
                        {slave.name}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;