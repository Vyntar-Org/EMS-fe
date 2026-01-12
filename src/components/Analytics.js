import React, { useState, useEffect } from 'react'
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
import { getTotalActiveEnergy7Days, getConsumption7Days } from '../auth/AnalyticsApi';

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
    const [totalActiveEnergyData, setTotalActiveEnergyData] = useState([]);
    const [consumptionData, setConsumptionData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
        
    // Fetch analytics data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [energyData, consumption] = await Promise.all([
                    getTotalActiveEnergy7Days(),
                    getConsumption7Days()
                ]);
                setTotalActiveEnergyData(energyData);
                setConsumptionData(consumption);
                setError(null);
            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
            
        fetchData();
    }, []);
        
    // Process the total active energy data to create chart series and categories
    const processedEnergyData = React.useMemo(() => {
        if (!totalActiveEnergyData || !Array.isArray(totalActiveEnergyData) || totalActiveEnergyData.length === 0) {
            return { series: [], categories: [] };
        }
            
        // Extract the first item's data to get the dates
        const firstSlaveData = totalActiveEnergyData[0]?.data || [];
        const categories = firstSlaveData.map(item => {
            // Format date as 'DD MMM' (e.g., '01 Jan')
            const date = new Date(item.date);
            return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
        });
            
        // Create series for each slave
        const series = totalActiveEnergyData.map(slave => {
            return {
                name: slave.slave_name,
                data: slave.data.map(item => item.value)
            };
        });
            
        return { series, categories };
    }, [totalActiveEnergyData]);
        
    // Process the consumption data to create chart series and categories
    const processedConsumptionData = React.useMemo(() => {
        if (!consumptionData || !Array.isArray(consumptionData) || consumptionData.length === 0) {
            return { series: [], categories: [] };
        }
            
        // Extract the first item's data to get the dates
        const firstSlaveData = consumptionData[0]?.data || [];
        const categories = firstSlaveData.map(item => {
            // Format date as 'DD MMM' (e.g., '01 Jan')
            const date = new Date(item.date);
            return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
        });
            
        // Create series for each slave
        const series = consumptionData.map(slave => {
            return {
                name: slave.slave_name,
                data: slave.data.map(item => item.value)
            };
        });
            
        return { series, categories };
    }, [consumptionData]);

    // Define colors for each series to match the dots in the image
    const seriesColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

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
            categories: processedEnergyData.categories,
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
            shared: true, // Enable shared tooltip to show all series at once
            intersect: false, // Show tooltip when hovering anywhere on the x-axis
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the original date from the data
                let originalDate = '';
                if (totalActiveEnergyData && totalActiveEnergyData.length > 0) {
                    originalDate = totalActiveEnergyData[0]?.data[dataPointIndex]?.date || '';
                }
                
                // Build the tooltip content
                let tooltipContent = `<div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight: bold; margin-bottom: 8px; color: lightgray; font-size: 14px; padding: 10px; background-color: #f4f7f6">${originalDate}</div>`;
                
                // Add each series with its color dot and value
                w.globals.seriesNames.forEach((name, index) => {
                    const value = series[index][dataPointIndex];
                    const color = seriesColors[index % seriesColors.length];
                    tooltipContent += `
                        <div style="display: flex; align-items: center; margin-bottom: 20px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
                            <span style="flex: 1; color: #333; font-size: 12px;">${name}:</span>
                            <span style="font-weight: bold; color: #333; margin-left: 5px; font-size: 12px;">${value}</span>
                        </div>`;
                });
                
                tooltipContent += '</div>';
                return tooltipContent;
            }
        },
        legend: {
            show: true,  // Show legend for multiple slaves
            position: 'top',
            fontSize: '12px',
            labels: {
                colors: '#6B7280'
            }
        },
        colors: seriesColors,  // Use the defined colors for multiple slaves
        fill: {
            type: 'solid'
        },
        theme: {
            mode: 'light'
        }
    };

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
                            Total Active Energy (Last 7 Days)
                        </Typography>
                        {loading ? (
                            <div>Loading...</div>
                        ) : error ? (
                            <div>Error: {error}</div>
                        ) : (
                            <Chart
                                options={chartOptions}
                                series={processedEnergyData.series}
                                type="line"
                                height={420}
                            />
                        )}
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
                        {loading ? (
                            <div>Loading...</div>
                        ) : error ? (
                            <div>Error: {error}</div>
                        ) : (
                            <Chart
                                options={chartOptions}
                                series={processedConsumptionData.series}
                                type="line"
                                height={420}
                            />
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
}

export default Analytics