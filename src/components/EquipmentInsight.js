import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import Chart from 'react-apexcharts';

const EquipmentInsight = ({ onSidebarToggle, sidebarVisible }) => {
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
    tableCard: {
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      padding: '15px',
      marginTop: '20px',
    },
    statusChip: {
      fontWeight: 'bold',
      fontSize: '12px',
    },
    actionButton: {
      margin: '0 5px',
    },
    tableHeader: {
      backgroundColor: '#e9ecef',
      fontWeight: 'bold',
    },
    tableRow: {
      '&:hover': {
        backgroundColor: '#f9f9f9',
      },
    },
    activeStatus: {
      color: '#30b44a',
      backgroundColor: '#e8f9e6',
    },
    inactiveStatus: {
      color: '#e34d4d',
      backgroundColor: '#fae8e8',
    }
  };
  
  // Chart configuration for Energy Consumption Trend
  const energyChartOptions = {
    chart: {
      type: 'line',
      height: 200,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 0  // This removes the data points, showing only lines
    },
    xaxis: {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      title: {
        text: 'Time'
      }
    },
    yaxis: {
      title: {
        text: 'kWh'
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'], // Alternate row colors
        opacity: 0.5
      },
    },
    tooltip: {
      enabled: true,
    },
  };
  
  const energyChartSeries = [
    {
      name: "Energy Consumption",
      data: [20, 30, 25, 40, 45, 35, 30]
    }
  ];
  
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
                  marginBottom: '20px',
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
                Machine 1
              </Typography>
              <span style={{ marginLeft: '10px', fontWeight: 'bold', fontFamily: '"Ubuntu", sans-serif', color: 'black', fontSize: '14px' }}>Load Specific Information</span>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Box style={{ padding: '0 15px', marginTop: '20px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={sidebarVisible ? 2.4 : 3}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>

                  Active Power
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  1000
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={sidebarVisible ? 2.4 : 3}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>

                  Demand Load
                </Typography>
                <Typography variant="body2" color="textSecondary">

                  75.76
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={sidebarVisible ? 2.4 : 3}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Power Factor
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  0.99
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={sidebarVisible ? 2.4 : 3}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Max Recorded Energy
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  1000
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={sidebarVisible ? 2.4 : 3}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>

                  Max Recorded Power
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  1000
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box style={{ padding: '0 15px', marginTop: '20px' }}>
        <span style={{ marginLeft: '10px', fontWeight: 'bold', fontFamily: '"Ubuntu", sans-serif', color: 'black', fontSize: '14px' }}>Power Source Information</span>

        <Grid container spacing={2} style={{ marginTop: '10px' }}>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Box style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.76 v</Typography>
                    <Typography variant="body2" color="textSecondary">Y Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.66 v</Typography>
                    <Typography variant="body2" color="textSecondary">R Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>247.35 v</Typography>
                    <Typography variant="body2" color="textSecondary">B Phase</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Box style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.76 v</Typography>
                    <Typography variant="body2" color="textSecondary">Y Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.66 v</Typography>
                    <Typography variant="body2" color="textSecondary">R Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>247.35 v</Typography>
                    <Typography variant="body2" color="textSecondary">B Phase</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
               <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  50.15 v
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Frequency
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

            <Box style={{ padding: '0 15px', marginTop: '20px' }}>
        <span style={{ marginLeft: '10px', fontWeight: 'bold', fontFamily: '"Ubuntu", sans-serif', color: 'black', fontSize: '14px' }}>Harmonics</span>

        <Grid container spacing={2} style={{ marginTop: '10px' }}>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Box style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.76 v</Typography>
                    <Typography variant="body2" color="textSecondary">Y Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.66 v</Typography>
                    <Typography variant="body2" color="textSecondary">R Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>247.35 v</Typography>
                    <Typography variant="body2" color="textSecondary">B Phase</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
              <CardContent>
                <Box style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.76 v</Typography>
                    <Typography variant="body2" color="textSecondary">Y Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>244.66 v</Typography>
                    <Typography variant="body2" color="textSecondary">R Phase</Typography>
                  </Box>
                  <Box style={{ textAlign: 'center', padding: '5px' }}>
                    <Typography variant="body1" style={{ fontWeight: 'bold', color: '#333' }}>247.35 v</Typography>
                    <Typography variant="body2" color="textSecondary">B Phase</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card style={{ ...styles.tableCard, padding: '15px' }}>
             <CardContent>
                <Typography variant="h6" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Energy Consumption Trend
                </Typography>
                <Chart
                  options={energyChartOptions}
                  series={energyChartSeries}
                  type="line"
                  height={200}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default EquipmentInsight
