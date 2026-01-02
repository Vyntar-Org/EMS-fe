import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Badge,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment
} from '@mui/material';
import { Search, Power, FlashOn, Dns  as DnsIcon } from '@mui/icons-material';
import Chart from 'react-apexcharts';

const Dashboard = ({ onSidebarToggle, sidebarVisible }) => {
  // Chart data based on image
  const energyConsumption48Hrs = {
    series: [{
      name: 'Energy Consumption',
      data: [120, 130, 150, 180, 200, 170, 140, 160, 190, 175, 155, 135, 145, 165, 185, 195, 175, 150, 125, 140]
    }],
    options: {
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      colors: ['#9c27b0'],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: ['02:00', '07:00', '12:00', '17:00', '22:00', '03:00', '08:00', '13:00', '18:00', '23:00', '04:00', '09:00', '14:00', '19:00', '00:00', '05:00', '10:00', '15:00', '20:00', '01:00'],
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        min: 100,
        max: 200,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 3
      },
      tooltip: {
        theme: 'light'
      }
    }
  };

  const machinePowerConsumption = {
    series: [{
      name: 'Power Consumption',
      data: [200, 100, 400, 0, 100, 250, 150]
    }],
    options: {
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false }
      },
      colors: ['#9c27b0'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '60%'
        }
      },
      xaxis: {
        categories: ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'],
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        min: 0,
        max: 500,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 3
      },
      tooltip: {
        theme: 'light'
      }
    }
  };

  const peakDemandIndicator = {
    series: [{
      name: 'Peak Demand',
      data: [120, 110, 140, 130, 125, 135, 115]
    }],
    options: {
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      colors: ['#4caf50'],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'],
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        min: 100,
        max: 140,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 3
      },
      tooltip: {
        theme: 'light'
      }
    }
  };

  const todayVsYesterday = {
    series: [{
      name: 'Today',
      data: [1.2, 1.4, 1.5, 1.6, 1.61, 1.58, 1.55]
    }, {
      name: 'Yesterday',
      data: [4.8, 4.9, 5.0, 5.02, 5.05, 5.03, 5.01]
    }],
    options: {
      chart: {
        type: 'line',
        height: 120,
        toolbar: { show: false },
        sparkline: { enabled: false }
      },
      colors: ['#2196f3', '#ff9800'],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        labels: { show: false }
      },
      yaxis: {
        labels: { show: false }
      },
      grid: {
        show: false
      },
      tooltip: {
        theme: 'light'
      }
    }
  };

  // Define styles based on the provided CSS
  const styles = {
    mainContent: {
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f4f7f6',
      fontFamily: '"Ubuntu", sans-serif',
      fontSize: '14px',
      color: '#5A5A5A',
    },
    container: {
      padding: '0 15px',
    },
    blockHeader: {
      padding: '10px 0',
    },
    headerTitle: {
      margin: '0',
      fontSize: '24px',
      fontWeight: '400',
      color: '#515151',
    },
    toggleButton: {
      padding: '5px',
      marginRight: '10px',
      minWidth: 'auto',
    },
    kpiCard: {
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
      height: '100%',
      '&:hover': {
        boxShadow: '0 7px 14px rgba(0,0,0,0.12), 0 5px 5px rgba(0,0,0,0.22)',
      }
    },
    energyCard: {
      background: 'linear-gradient(to right, #fff, #f9f9f9)',
      height: '100%',
    },
    chartCard: {
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      padding: '15px',
      marginBottom: '20px',
    },
    deviceOnline: {
      background: '#e8f9e6',
      color: '#30b44a',
    },
    deviceOffline: {
      background: '#fae8e8',
      color: '#e34d4d',
    },
    deviceTotal: {
      background: '#e8f1fa',
      color: '#428bfa',
    },
    feedsLeft: {
      marginRight: '10px',
      width: '35px',
      height: '35px',
      lineHeight: '35px',
      textAlign: 'center',
      borderRadius: '50%',
      backgroundColor: '#f2f4f8',
    },
    feedsWidget: {
      padding: '10px 5px',
      borderBottom: '1px solid #eee',
      display: 'flex',
    },
    chartContainer: {
      minHeight: '200px',
      width: '100%',
    }
  };

  return (
    <Box style={styles.mainContent} id="main-content">
      <Box style={styles.container}>
        <Box style={styles.blockHeader} className="block-header mb-1">
          <Grid container>
            <Grid item lg={5} md={8} xs={12}>
              <Typography
                variant="h6"
                className="logs-title"
                style={{
                  marginBottom: '-10px',
                  color: '#50342c',
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
        <Box style={{ padding: '-10px', paddingTop: '12px', fontFamily: "inherit" }}>
          {/* KPI ROW */}
          <Grid container spacing={2}>
            <Grid item xs={2}>
              <Card style={styles.kpiCard} className="kpi-card">
                <CardContent style={{ padding: '12px' }}>
                  <Box display="flex" alignItems="center" style={{ marginBottom: "28px" }}>
                    <i className="fa fa-hdd-o mr-2"></i>
                    <Typography variant="h5" className="card-title mb-0 fw-semibold" style={{ fontWeight: 600, fontSize: "17px", fontFamily: "inherit", lineHeight: 1.2 }}>
                      <DnsIcon  sx={{ mr: 1, verticalAlign: 'middle', fontSize: '14px', lineHeight: 1 }} />
                      Devices
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" textAlign="center">
                    <Box p={1} borderRadius={4} style={{ ...styles.deviceOnline, width: "32%" }}>
                      <Typography variant="caption" color="textSecondary">Online</Typography>
                      <Typography variant="h5" style={{ color: "#30b44a", fontSize: "20px", fontWeight: 700 }}>
                        3
                      </Typography>
                    </Box>
                    <Box p={1} borderRadius={4} style={{ ...styles.deviceOffline, width: "32%" }}>
                      <Typography variant="caption" color="textSecondary">Offline</Typography>
                      <Typography variant="h5" style={{ color: "#e34d4d", fontSize: "20px", fontWeight: 700 }}>
                        2
                      </Typography>
                    </Box>
                    <Box p={1} borderRadius={4} style={{ ...styles.deviceTotal, width: "32%" }}>
                      <Typography variant="caption" color="textSecondary">Total</Typography>
                      <Typography variant="h5" style={{ color: "#428bfa", fontSize: "20px", fontWeight: 700 }}>
                        5
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* CARD 2: Energy Consumption */}
            <Grid item xs={2}>
              <Card style={{ ...styles.energyCard, ...styles.kpiCard }} className="energy-card kpi-card">
                <CardContent style={{ padding: '12px' }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <span className="me-2 fs-4">🔌</span>
                    <Typography variant="h4" style={{ fontSize: "25px", fontWeight: "500", marginRight: '8px', marginLeft: '8px' }}>
                      755
                    </Typography>
                    <Typography variant="body1">kWh</Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 600, fontSize: "14px", fontFamily: "inherit", lineHeight: 1.2 }}>Energy Consumption</Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">Predictive:</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>10 kWh</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Cost:</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>₹10</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={2}>
              <Card style={{ ...styles.energyCard, ...styles.kpiCard }} className="energy-card kpi-card">
                <CardContent style={{ padding: '12px' }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <span className="me-2 fs-4">🔌</span>
                    <Typography variant="h4" style={{ fontSize: "25px", fontWeight: "500", marginRight: '8px', marginLeft: '8px' }}>
                      0.25
                    </Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 600, fontSize: "14px", fontFamily: "inherit", lineHeight: 1.2 }}>Power Factor</Typography>
                  <Box style={{ marginTop: "29px" }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">Reactive<br /> Power:</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>100<br /> kVAr</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* CARD 4: Ener Tree */}
            <Grid item xs={2}>
              <Card style={{ ...styles.energyCard, ...styles.kpiCard }} className="energy-card kpi-card">
                <CardContent style={{ padding: '12px', textAlign: 'center' }}>
                  <Box display="flex" justifyContent="space-around" style={{ marginBottom: "13px" }}>
                    <Box textAlign="center">
                      <Typography variant="body1">🔌 75%</Typography>
                      <Typography variant="caption" color="textSecondary">Main</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body1">🔋 20%</Typography>
                      <Typography variant="caption" color="textSecondary">Backup</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body1">🌿 5%</Typography>
                      <Typography variant="caption" color="textSecondary">Green</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 600, fontSize: "14px", fontFamily: "inherit", lineHeight: 1.2 }}>Ener Tree</Typography>
                  <Box mt={3}>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>-</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={2}>
              <Card style={{ ...styles.energyCard, ...styles.kpiCard }} className="energy-card kpi-card">
                <CardContent style={{ padding: '12px', textAlign: 'center' }}>
                  <Box display="flex" justifyContent="space-around" style={{ marginBottom: "13px" }}>
                    <Box textAlign="center">
                      <Typography variant="body1">🔌 75%</Typography>
                      <Typography variant="caption" color="textSecondary">Main</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body1">🔋 20%</Typography>
                      <Typography variant="caption" color="textSecondary">Backup</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body1">🌿 5%</Typography>
                      <Typography variant="caption" color="textSecondary">Green</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 600, fontSize: "14px", fontFamily: "inherit", lineHeight: 1.2 }}>Carbon Footprints</Typography>
                  <Box mt={3}>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>kg of CO2</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={2}>
              <Card style={{ ...styles.energyCard, ...styles.kpiCard }} className="energy-card kpi-card">
                <CardContent style={{ padding: '12px' }}>
                  <Typography variant="h6" style={{ fontSize: "18px", fontWeight: "500" }}>Load Balance</Typography>
                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">IR</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>25 A</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">IY</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>25 A</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">IB</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>25 A</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Current LBI %</Typography>
                      <Typography variant="body1" style={{ fontWeight: "500" }}>11 %</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        {/* END KPI ROW */}

        {/* MAIN CONTENT 3-COLUMN LAYOUT */}
        <Grid container spacing={3} style={{ padding: '0 15px', marginTop: '24px' }}>
          {/* COLUMN 1 (col-5) */}
          <Grid item xs={12} md={5}>
            {/* Energy Consumption 48 hrs */}
            <Card style={styles.chartCard} className="panel chart-card mb-3">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Energy Consumption (Last 48 Hours)</Typography>
                <Typography variant="caption" color="textSecondary">kWh</Typography>
              </Box>
              <Chart
                options={energyConsumption48Hrs.options}
                series={energyConsumption48Hrs.series}
                type="line"
                height={300}
              />
            </Card>

            {/* Peak Demand */}
            <Card style={styles.chartCard} className="panel chart-card">
              <Typography variant="h6" mb={2}>Peak Demand Indicator</Typography>
              <Chart
                options={peakDemandIndicator.options}
                series={peakDemandIndicator.series}
                type="line"
                height={300}
              />
            </Card>
          </Grid>

          {/* COLUMN 2 (col-5) */}
          <Grid item xs={12} md={5}>
            {/* Today vs Yesterday */}
            <Card style={styles.chartCard} className="panel chart-card mb-3">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Today vs Yesterday</Typography>
                <Typography variant="caption" color="textSecondary">Trend</Typography>
              </Box>
              <Chart
                options={todayVsYesterday.options}
                series={todayVsYesterday.series}
                type="line"
                height={120}
              />
              <Typography variant="caption" color="textSecondary" mt={2}>Today: 1.61 MLD • Yesterday: 5.05 MLD</Typography>
            </Card>

            {/* Machine Power Consumption */}
            <Card style={styles.chartCard} className="panel chart-card">
              <Typography variant="h6" mb={2}>Machine Power Consumption</Typography>
              <Chart
                options={machinePowerConsumption.options}
                series={machinePowerConsumption.series}
                type="bar"
                height={300}
              />
            </Card>
          </Grid>

          {/* COLUMN 3 (col-2) Sidebar */}
          <Grid item xs={12} md={2}>
            <Card style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', padding: '15px', marginBottom: '16px' }}>
              <Typography variant="h6">Alerts</Typography>
              <Badge badgeContent={3} color="error" style={{ color: "#fff" }}></Badge>
            </Card>
            <Card style={{ marginBottom: '16px' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search machines..."
                style={{ marginBottom: '8px', padding: '0 15px', paddingTop: '15px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Machine list */}
              <Box style={{ maxHeight: "420px", overflowY: "auto", padding: '0 15px', paddingBottom: '15px' }}>
                <Card>
                  <CardContent>
                    {/* Search Bar */}
                    <Box mb={1}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* List of Items */}
                    <List style={{ padding: 0 }}>
                      <ListItem style={styles.feedsWidget} data-key="energy">
                        <Box style={styles.feedsLeft}>
                          <FlashOn />
                        </Box>
                        <ListItemText primary="Machine 1" />
                      </ListItem>
                      <ListItem style={styles.feedsWidget} data-key="genset_diesel_con">
                        <Box style={styles.feedsLeft}>
                          <FlashOn />
                        </Box>
                        <ListItemText primary="Machine 2" />
                      </ListItem>
                      <ListItem style={styles.feedsWidget} data-key="power_cut">
                        <Box style={styles.feedsLeft}>
                          <FlashOn />
                        </Box>
                        <ListItemText primary="Machine 3" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;