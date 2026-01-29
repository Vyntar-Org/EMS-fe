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
import Tooltip from '@mui/material/Tooltip';


const Dashboard = ({ onSidebarToggle, sidebarVisible }) => {
  const truncateText = (text, length = 9) =>
    text.length > length ? text.slice(0, length) + '...' : text;

  const [dashboardData, setDashboardData] = useState(null);
  const [slaveList, setSlaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlave, setSelectedSlave] = useState(null);
  const [weeklyConsumptionData, setWeeklyConsumptionData] = useState([]);
  const [slaveLoading, setSlaveLoading] = useState(false);
  const [activeChart, setActiveChart] = useState('bar'); // 'line' or 'bar'

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
      // Prevent multiple simultaneous requests
      if (slaveLoading) return;

      setSlaveLoading(true);
      setSelectedSlave(slave);
      console.log('Selected slave:', slave.name);

      // Clear previous data to show loading state
      setWeeklyConsumptionData([]);

      // Fetch weekly consumption data for the selected slave
      console.log(`Fetching weekly consumption data for slave ID: ${slave.id}`);
      const weeklyData = await getSlaveWeeklyConsumption(slave.id);
      console.log('Weekly consumption data received:', weeklyData);

      // Update the chart data
      setWeeklyConsumptionData(weeklyData);

      // Show success feedback
      console.log(`Successfully loaded data for ${slave.name}`);

    } catch (error) {
      console.error('Error fetching weekly consumption data:', error);
      setError(error.message || 'An error occurred while fetching weekly consumption data');
      // Reset loading state on error
      setSelectedSlave(null);
    } finally {
      setSlaveLoading(false);
    }
  };

  // Extract data from API response
  console.log('Dashboard data state:', dashboardData);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  const slavesData = dashboardData?.devices || { total: 0, online: 0, offline: 0 };
  const energyConsumption = dashboardData?.energy_consumption || 0;
  const energyConsumptionUnit = dashboardData?.energy_consumption?.unit || 'kWh';
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
        formatter: function (val) {
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
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val;
      },
      offsetY: -10,
       offsetX: 5,
      style: {
        fontSize: '12px',
        colors: ["#0a223e"]
      },
      background: {
        enabled: false, // 👈 this removes the blue background
      },
    },
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
    colors: ['#0a223e']
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
      colors: ['#cbc84c'],
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
    colors: ['#0a223e']
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
        enabled: false, // 👈 this removes the blue background
      },
    },
    tooltip: {
      enabled: weeklyConsumptionData.length > 0, // Only show tooltip when data exists
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
    height: '130px',
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
      minHeight: '89vh',
      // backgroundColor: '#F8FAFC',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      // padding: '24px',
      // margin: '0',
      // marginBottom: '20px',
      marginLeft: '8px',
      // marginRight: '20px',
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
      return '176px'; // Smaller width when sidebar is visible
    }
    return '206px'; // Original width when sidebar is hidden
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
    return '810px'; // Original width when sidebar is hidden
  };

  // Calculate responsive alerts card width based on sidebar visibility
  const getAlertsCardWidth = () => {
    if (sidebarVisible) {
      return '150px'; // Smaller width when sidebar is visible
    }
    return '230px'; // Original width when sidebar is hidden
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
      {/* <Box style={styles.blockHeader} className="block-header mb-1">
        <Grid container>
          <Grid lg={5} md={8} xs={12}>
            <Typography
              variant="h6"
              className="logs-title"
              style={{
                // marginBottom: '-10px',
                color: '#0F2A44',
                fontWeight: 600,
                fontFamily: 'sans-serif',
                marginTop: '-5px'
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
      </Box> */}

      {/* Top Summary Cards Row */}
      <Box sx={{
        // backgroundColor: '#FFFFFF', 
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', gap: '10px', marginLeft: '-30px' }}>
          {/* Card 1: Devices */}
          <Card sx={responsiveCardStyle}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <DnsIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={titleStyle}>Devices</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt="auto">
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#E9F7E7', flex: 1, mr: 1, minHeight: '80px' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Online</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#16A34A' }}>{slavesData.online}</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#FDECEC', flex: 1, ml: 1, minHeight: '80px' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Offline</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}>{slavesData.offline}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Merged Card: Energy Consumption & Power Factor */}
          <Card sx={{
            ...responsiveCardStyle,
            width: getCardWidth() === '230px' ? '500px' : (parseInt(getCardWidth()) * 2) + 'px',
            height: '130px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box display="flex" alignItems="center" mb={1.5}>
                <FlashOnIcon sx={{ color: '#1F2937', mr: 1, fontSize: '20px' }} />
                <Typography sx={{ ...titleStyle, fontSize: '16px' }}>Energy Consumption</Typography>
              </Box>

              {/* Main Content Grid */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ flex: 1, pr: '80px' }}>
                {/* Left Side - Metrics */}
                <Box display="flex" flexDirection="column" gap={0.8} sx={{ flex: 1, minWidth: 0 }}>
                  {/* MTD Row */}
                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: '110px', flexShrink: 0 }}>MTD</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: '120px', flexShrink: 0, textAlign: 'right' }}>
                      {energyConsumption?.mtd?.value.toFixed(1)} {energyConsumptionUnit}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: '140px', flexShrink: 0, marginLeft: sidebarVisible ? '0' : '50px' }}>
                      Cost: ₹{(energyConsumption?.mtd?.cost.toFixed(2))}
                    </Typography>
                  </Box>

                  {/* Value kWH Row */}
                  {/* <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: '110px', flexShrink: 0 }}>Value kWH</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: '120px', flexShrink: 0, textAlign: 'right' }}>
                      {energyConsumption.toFixed(1)} kWH
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: '140px', flexShrink: 0, }}>
                      Cost: ₹{(energyConsumption * 0.1).toFixed(2)}
                    </Typography>
                  </Box> */}

                  {/* Today Value Row */}
                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: '110px', flexShrink: 0 }}>Today </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: '120px', flexShrink: 0, textAlign: 'right' }}>
                      {(energyConsumption?.today?.value.toFixed(1))} {energyConsumptionUnit}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: '140px', flexShrink: 0, marginLeft: sidebarVisible ? '0' : '50px' }}>
                      Cost: ₹{((energyConsumption?.today?.cost.toFixed(2)))}
                    </Typography>
                  </Box>

                  {/* Yesterday Value Row */}
                  <Box display="flex" alignItems="center" sx={{ width: '100%', gap: '16px' }}>
                    <Typography sx={{ ...labelStyle, fontSize: '13px', width: '110px', flexShrink: 0 }}>Yesterday </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, width: '120px', flexShrink: 0, textAlign: 'right' }}>
                      {(energyConsumption?.yesterday?.value.toFixed(1))} {energyConsumptionUnit}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', width: '140px', flexShrink: 0, marginLeft: sidebarVisible ? '0' : '50px' }}>
                      Cost: ₹{((energyConsumption?.yesterday?.cost.toFixed(2)))}
                    </Typography>
                  </Box>
                </Box>
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
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>IY</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>IB</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 A</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ lineHeight: '22px' }}>
                  <Typography sx={labelStyle}>Current LBI %</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Chart Section Layout */}
      <Box sx={{ backgroundColor: '', padding: '0px', marginLeft: '-20px' }}>
        <Grid container spacing={3} justifyContent="center" gap={'10px'}>
          {/* Left Column - 2 Stacked Cards */}
          <Grid item xs={8}>
            {/* Card 1: Energy Consumption (Last 24 Hours) */}
            <Card sx={{
              ...cardStyle1,
              width: getChartCardWidth(),
              height: '170px',
              padding: '20px',
              marginBottom: '10px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#fff',
                boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
              }
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
              height: '170px',
              padding: '20px',
              marginBottom: '10px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#fff',
                boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
              }
            }}>
              <Typography sx={titleStyle1}>Peak Demand Indicator</Typography>
              <Chart
                options={peakDemandOptions}
                series={peakDemandSeries}
                type="line"
                height={165}  // Reduced to fit within 150px card
              />
            </Card>
          </Grid>

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
                          {selectedSlave ? `${selectedSlave.name} Energy` : 'Energy Consumption'}
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
                      {slaveLoading && selectedSlave ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                          <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
                            Loading {selectedSlave.name} data...
                          </Typography>
                        </Box>
                      ) : selectedSlave && weeklyConsumptionData.length > 0 ? (
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
                          width={500}
                        />
                      ) : (
                        <Chart
                          options={{
                            ...energyConsumptionOptions,
                            yaxis: {
                              ...energyConsumptionOptions.yaxis,
                              labels: { show: false }
                            }
                          }}
                          series={energyConsumptionSeries}
                          type="line"
                          height={200}
                        />
                      )}
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
                        width={500}
                      />
                    </Box>
                  )}
                </Grid>

                {/* Right Column - Alerts Panel */}
                <Grid item xs={4} sx={{ width: getAlertsCardWidth(), padding: '10px', marginLeft: sidebarVisible ? '0px' : '60px' }}>
                  {/* <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography sx={titleStyle1}>Alerts</Typography>
                    <Badge badgeContent={slaveList.length} color="error"></Badge>
                  </Box> */}

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
                    {slaveList
                      .filter(slave => slave.name.toLowerCase().includes(searchTerm))
                      .map((slave, index) => (
                        <Box
                          key={slave.id}
                          sx={{
                            height: '20px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: selectedSlave?.id === slave.id ? '#E3F2FD' : (index % 2 === 0 ? '#F9FAFB' : '#FFFFFF'),
                            border: selectedSlave?.id === slave.id ? '2px solid #E5E7EB' : '1px solid #E5E7EB',
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
                            console.log('Slave list item clicked:', slave.name);
                            handleSlaveSelect(slave);
                          }}
                        >
                          <Box sx={{ marginRight: '8px', color: '#444444', fontWeight: 'bold', marginTop: "10px" }}>
                            <FlashOnIcon fontSize="small" onClick={() => handleSlaveSelect(slave)} />
                          </Box>

                          <Tooltip
                            title={sidebarVisible ? slave.name : ''}
                            placement="right"
                            arrow
                            disableHoverListener={!sidebarVisible} // 👈 tooltip ONLY when sidebarVisible = true
                          >
                            <Typography
                              sx={{
                                fontSize: '14px',
                                color: '#444444',
                                fontWeight: 'bold',
                                fontFamily: 'ubuntu, sans-serif',
                                cursor: 'pointer',
                                flex: 1,

                                /* ✅ Correct truncate rules */
                                whiteSpace: sidebarVisible ? 'nowrap' : 'normal',
                                overflow: sidebarVisible ? 'hidden' : 'visible',
                                textOverflow: sidebarVisible ? 'ellipsis' : 'clip',
                                maxWidth: sidebarVisible ? '90px' : '100%',

                                transition: 'all 0.3s ease',
                              }}
                              onClick={() => handleSlaveSelect(slave)}
                            >
                              {sidebarVisible ? truncateText(slave.name) : slave.name}
                            </Typography>
                          </Tooltip>
                        </Box>
                      ))}
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