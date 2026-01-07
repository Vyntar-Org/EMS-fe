import React from 'react';
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
import './Dashboard.css';

const Dashboard = ({ onSidebarToggle, sidebarVisible }) => {
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
      categories: ['11:00', '16:45', '22:30', '04:15'],
      labels: {
        style: { colors: '#6B7280', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 2,
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
      style: { fontSize: '12px' }
    },
    legend: { show: false },
    colors: ['#9B8AE6']
  };

  const energyConsumptionSeries = [{
    name: 'Energy',
    data: [0.5, 0.7, 0.3, 0.6]
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
  const machinePowerOptions = {
    chart: {
      type: 'bar',
      height: 100,
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: false }
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
      categories: ['30 Dec', '31 Dec', '01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan'],
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
      max: 40,
      tickAmount: 4,
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
    colors: ['#6F4A74']
  };

  const machinePowerSeries = [{
    name: 'Power',
    data: [30, 40, 45, 50, 35, 55, 40]
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
    fontFamily: 'Inter, Poppins'
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
    fontFamily: 'Inter, Roboto, Poppins'
  };

  const valueStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1F2937',
    fontFamily: 'Inter, Roboto, Poppins'
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#6B7280',
    fontFamily: 'Inter, Roboto, Poppins'
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
      fontFamily: 'Inter, Roboto, system-ui, sans-serif',
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

  return (
    <Box style={styles.mainContent} id="main-content">
      {/* Header */}
      <Box style={styles.blockHeader} className="block-header mb-1">
        <Grid container>
          <Grid item lg={5} md={8} xs={12}>
            <Typography
              variant="h6"
              className="logs-title"
              style={{
                // marginBottom: '-10px',
                color: '#0156a6',
                fontWeight: 600,
                fontFamily: 'inherit',
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
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#16A34A' }}>0</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#FDECEC' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Offline</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}>0</Typography>
                </Box>
                <Box sx={{ ...miniBoxStyle, backgroundColor: '#EAF3FF' }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Total</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#2563EB' }}>0</Typography>
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
                <Typography sx={valueStyle}>0</Typography>
                <Typography sx={{ fontSize: '13px', color: '#6B7280', ml: 1 }}>kWh</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography sx={labelStyle}>Predictive:</Typography>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>0 kWh</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={labelStyle}>Cost:</Typography>
                <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>₹10</Typography>
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
                height={110}  // Reduced to fit within 150px card
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
                height={110}  // Reduced to fit within 150px card
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
                <Badge badgeContent={3} color="error"></Badge>
              </Box>
            </Card>
            <Card sx={{
              ...cardStyle1,
              width: getAlertsCardWidth(),
              height: '400px',  // Changed from 400px to 150px
              padding: '16px',
              transition: 'all 0.3s ease',
            }}>

              <TextField
                fullWidth
                size="small"
                placeholder="Search machines..."
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
                {[
                  { icon: <FlashOnIcon />, text: "Machine 1" },
                  { icon: <FlashOnIcon />, text: "Machine 2" },
                  { icon: <FlashOnIcon />, text: "Machine 3" },
                  { icon: <FlashOnIcon />, text: "Machine 4" },
                ].map((item, index) => (  // Reduced number of items shown
                  <Box
                    key={index}
                    sx={{
                      height: '30px',  // Reduced height
                      padding: '6px 8px',  // Reduced padding
                      borderRadius: '8px',
                      marginBottom: '4px',  // Reduced margin
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: index % 2 === 0 ? '#F9FAFB' : 'transparent',
                      '&:hover': {
                        backgroundColor: '#F3F4F6'
                      }
                    }}
                  >
                    <Box sx={{ marginRight: '8px', color: '#6B7280' }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#374151' }}>
                      {item.text}
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