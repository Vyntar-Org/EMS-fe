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
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText
} from '@mui/material';
import Chart from 'react-apexcharts';

const Analytics = ({ onSidebarToggle, sidebarVisible }) => {
    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#f4f7f6',
            fontFamily: '"Ubuntu", sans-serif',
            fontSize: '14px',
            color: '#5A5A5A',
            marginBottom: '20px',
        },
        container: {
            // padding: '0 15px',
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
    const [parameters, setParameters] = React.useState([]);
    
    // Chart configuration based on requirements
    const chartOptions = {
        chart: {
            type: 'line',
            height: 420,
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            },
            animations: {
                enabled: false
            },
            background: '#FFFFFF',
        },
        stroke: {
            width: 2,
            curve: 'smooth'
        },
        markers: {
            size: 0  // This removes the data points, showing only lines
        },
        xaxis: {
            categories: [0, 1, 2, 3, 4, 5, 6],
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '12px',
                },
                show: true
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            min: 0,
            max: 6,
            tickAmount: 6,
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '12px',
                },
            },
            axisBorder: {
                show: false
            }
        },
        grid: {
            borderColor: '#E5E7EB',
            opacity: 1,
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: true,
            style: {
                fontSize: '12px',
            },
        },
        legend: {
            show: parameters.length > 1,  // Show legend only when multiple parameters selected
            position: 'top',
            fontSize: '12px',
            labels: {
                colors: '#6B7280'
            }
        },
        colors: ['#2563EB', '#7C5D8A'],  // Default line colors
        fill: {
            type: 'solid'
        },
        theme: {
            mode: 'light'
        }
    };
    
    // Generate chart series based on selected parameters
    const generateChartSeries = () => {
        if (parameters.length === 0) {
            return [];  // Return empty series when no parameters selected
        }
        
        return parameters.map((param, index) => {
            // Generate different data based on parameter type
            let data;
            switch(param) {
                case 'active_power':
                    data = [0, 1, 1.5, 2.5, 3, 4.5, 6];
                    break;
                case 'load_demand':
                    data = [0.5, 1.2, 2.3, 3.1, 4.2, 5.1, 5.8];
                    break;
                case 'power_factor':
                    data = [0.2, 1.3, 2.1, 2.8, 3.6, 4.4, 6];
                    break;
                case 'max_recorded_energy':
                    data = [0.8, 1.6, 2.4, 3.2, 4, 4.8, 5.6];
                    break;
                case 'max_recorded_power':
                    data = [0.3, 1.4, 2.2, 3.7, 4.1, 5.3, 6];
                    break;
                default:
                    data = [0, 1, 2, 3, 4, 5, 6];
            }
            
            return {
                name: param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert parameter name to readable format
                data: data
            };
        });
    };
    
    const chartSeries = generateChartSeries();

    return (
        <Box style={styles.mainContent} id="main-content">
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
                          Analytics
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
            <Box style={styles.container}>
                <Card style={styles.tableCard}>
                    <CardContent sx={{ p: 1 }}>
                        <Typography
                            gutterBottom
                            sx={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#50342c',
                                mb: 1
                            }}
                        >
                            Select Parameters
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl  size="small" sx={{ flex: 1, width: '300px', mr: 2 }}>
                                <Select
                                    multiple
                                    displayEmpty
                                    value={parameters}
                                    onChange={(e) => setParameters(e.target.value)}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) {
                                            return <span style={{ color: '#999' }}>Select up to 3 parameters</span>;
                                        }
                                        return selected.join(', ');
                                    }}
                                >

                                    <MenuItem value="active_power">
                                        <ListItemText primary="Power" />
                                    </MenuItem>

                                    <MenuItem value="load_demand">
                                        <ListItemText primary="Load" />
                                    </MenuItem>

                                    <MenuItem value="power_factor">
                                        <ListItemText primary="Power Factor" />
                                    </MenuItem>

                                    <MenuItem value="max_recorded_energy">
                                        <ListItemText primary="Max Recorded Energy" />
                                    </MenuItem>

                                    <MenuItem value="max_recorded_power">
                                        <ListItemText primary="Max Recorded Power" />
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => console.log('Generate Chart clicked', parameters)}
                                sx={{ height: '40px' }}
                            >
                                Generate Chart 1
                            </Button>
                        </Box>
                        <Chart
                            options={chartOptions}
                            series={chartSeries}
                            type="line"
                            height={420}
                        />
                    </CardContent>
                </Card>
            </Box>
                        <Box style={styles.container}>
                <Card style={styles.tableCard}>
                    <CardContent sx={{ p: 1 }}>
                        <Typography
                            gutterBottom
                            sx={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#50342c',
                                mb: 1
                            }}
                        >
                            Consumption (Last 7 Days)
                        </Typography>
                        <Chart
                            options={chartOptions}
                            series={chartSeries}
                            type="line"
                            height={420}
                        />
                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
}

export default Analytics
