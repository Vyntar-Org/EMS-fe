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
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { getTotalActiveEnergy7Days, getConsumption7Days } from '../auth/AnalyticsApi';
import { getSlaveList, getDeviceLogs } from '../auth/LogsApi';

const Analytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
    const [devices, setDevices] = useState(['all']); // Initialize with 'all' as default
    const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs

    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '86.4vh',
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
            // padding: '10px 0',
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
            // marginTop: '10px',
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

    // Fetch device list from API on component mount
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const slaveList = await getSlaveList();
                // Store full device objects for ID mapping
                setDeviceObjects(slaveList);
                // Transform the slave list to the format expected by the dropdown
                const deviceNames = slaveList.map(slave => slave.name);
                setDevices(['all', ...deviceNames]); // Add 'all' as the first option
            } catch (err) {
                console.error('Error fetching devices:', err);
                // Keep the default 'all' option if there's an error
                setDevices(['all']);
            }
        };

        fetchDevices();
    }, []);

    // Handle search button click
    const handleSearch = () => {
        if (!filterDevice || filterDevice === 'all') {
            alert('Please select a device');
            return;
        }
        if (!filterStartDate) {
            alert('Please select a start date');
            return;
        }
        if (!filterEndDate) {
            alert('Please select an end date');
            return;
        }
        setSearchClicked(true);
    };

    // Function to reset all filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterDevice('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setSearchClicked(false); // Reset search state
    };
    const [parameters, setParameters] = React.useState([]);
    const [totalActiveEnergyData, setTotalActiveEnergyData] = useState([]);
    const [consumptionData, setConsumptionData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]); // State for filtered chart data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [compareMode, setCompareMode] = useState(false); // Track if compare mode is active
    const [compareDevice, setCompareDevice] = useState(''); // Selected device for comparison
    const [compareChartData, setCompareChartData] = useState([]); // Chart data for comparison device
    const [compareMode2, setCompareMode2] = useState(false); // Track if second compare mode is active
    const [compareDevice2, setCompareDevice2] = useState(''); // Selected device for second comparison
    const [compareChartData2, setCompareChartData2] = useState([]); // Chart data for second comparison device

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

    // Fetch filtered chart data when search is clicked
    useEffect(() => {
        const fetchFilteredData = async () => {
            if (searchClicked && filterDevice && filterDevice !== 'all' && filterStartDate && filterEndDate) {
                try {
                    setLoading(true);
                        
                    // Find the selected device object to get its ID
                    const selectedDeviceObj = deviceObjects.find(device => device.name === filterDevice);
                    if (!selectedDeviceObj) {
                        console.error('Selected device not found in device list');
                        setError('Selected device not found');
                        return;
                    }
                        
                    // Format dates properly for API request
                    const formatDateTime = (date) => {
                        if (!date) return '';
                        // Check if it's a dayjs object
                        if (typeof date.format === 'function') {
                            return date.format('YYYY-MM-DD HH:mm:ss');
                        }
                        // If it's a regular Date object
                        if (date instanceof Date) {
                            return date.toISOString().slice(0, 19).replace('T', ' ');
                        }
                        // If it's already a string, return as is
                        return date;
                    };
                        
                    const startDate = formatDateTime(filterStartDate);
                    const endDate = formatDateTime(filterEndDate);
                        
                    const slaveId = selectedDeviceObj.id; // Use the actual ID from the device object
                        
                    // Fetch filtered data based on selected device and date range
                    const deviceLogs = await getDeviceLogs(slaveId, startDate, endDate);
                    setFilteredChartData(deviceLogs);
                    setError(null);
                } catch (err) {
                    console.error('Error fetching filtered analytics data:', err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            }
        };
            
        fetchFilteredData();
    }, [searchClicked, filterDevice, filterStartDate, filterEndDate, deviceObjects]);
    
    // Fetch comparison chart data when compare device is selected
    useEffect(() => {
        const fetchCompareData = async () => {
            if (compareMode && compareDevice && filterStartDate && filterEndDate) {
                try {
                    // Find the selected compare device object to get its ID
                    const selectedDeviceObj = deviceObjects.find(device => device.name === compareDevice);
                    if (!selectedDeviceObj) {
                        console.error('Selected compare device not found in device list');
                        return;
                    }
                        
                    // Format dates properly for API request
                    const formatDateTime = (date) => {
                        if (!date) return '';
                        // Check if it's a dayjs object
                        if (typeof date.format === 'function') {
                            return date.format('YYYY-MM-DD HH:mm:ss');
                        }
                        // If it's a regular Date object
                        if (date instanceof Date) {
                            return date.toISOString().slice(0, 19).replace('T', ' ');
                        }
                        // If it's already a string, return as is
                        return date;
                    };
                        
                    const startDate = formatDateTime(filterStartDate);
                    const endDate = formatDateTime(filterEndDate);
                        
                    const slaveId = selectedDeviceObj.id; // Use the actual ID from the device object
                        
                    // Fetch filtered data based on selected device and date range
                    const deviceLogs = await getDeviceLogs(slaveId, startDate, endDate);
                    setCompareChartData(deviceLogs);
                } catch (err) {
                    console.error('Error fetching comparison analytics data:', err);
                }
            }
        };
            
        fetchCompareData();
    }, [compareMode, compareDevice, filterStartDate, filterEndDate, deviceObjects]);
    
    // Fetch second comparison chart data when second compare device is selected
    useEffect(() => {
        const fetchCompareData2 = async () => {
            if (compareMode2 && compareDevice2 && filterStartDate && filterEndDate) {
                try {
                    // Find the selected compare device object to get its ID
                    const selectedDeviceObj = deviceObjects.find(device => device.name === compareDevice2);
                    if (!selectedDeviceObj) {
                        console.error('Selected second compare device not found in device list');
                        return;
                    }
                        
                    // Format dates properly for API request
                    const formatDateTime = (date) => {
                        if (!date) return '';
                        // Check if it's a dayjs object
                        if (typeof date.format === 'function') {
                            return date.format('YYYY-MM-DD HH:mm:ss');
                        }
                        // If it's a regular Date object
                        if (date instanceof Date) {
                            return date.toISOString().slice(0, 19).replace('T', ' ');
                        }
                        // If it's already a string, return as is
                        return date;
                    };
                        
                    const startDate = formatDateTime(filterStartDate);
                    const endDate = formatDateTime(filterEndDate);
                        
                    const slaveId = selectedDeviceObj.id; // Use the actual ID from the device object
                        
                    // Fetch filtered data based on selected device and date range
                    const deviceLogs = await getDeviceLogs(slaveId, startDate, endDate);
                    setCompareChartData2(deviceLogs);
                } catch (err) {
                    console.error('Error fetching second comparison analytics data:', err);
                }
            }
        };
            
        fetchCompareData2();
    }, [compareMode2, compareDevice2, filterStartDate, filterEndDate, deviceObjects]);

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

    // Process the filtered chart data to create chart series and categories
    const processedFilteredData = React.useMemo(() => {
        if (!filteredChartData || !Array.isArray(filteredChartData) || filteredChartData.length === 0) {
            return { series: [], categories: [] };
        }
            
        // Process the filtered data to extract timestamps and values
        const categories = filteredChartData.map(item => {
            // Format timestamp for x-axis - date and month only
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });
            
        // Create series for the filtered data
        const series = [];
            
        // Extract values from the filtered data
        const values = filteredChartData.map(item => {
            if (item.acte_im !== undefined) return parseFloat(item.acte_im) || 0;
            if (item.value !== undefined) return parseFloat(item.value) || 0;
            if (item.total_act_energy !== undefined) return parseFloat(item.total_act_energy) || 0;
            if (item.energy_value !== undefined) return parseFloat(item.energy_value) || 0;
            return 0;
        });
            
        if (values.some(val => val !== 0)) {
            series.push({
                name: filterDevice,
                data: values
            });
        }
            
        return { series, categories };
    }, [filteredChartData, filterDevice]);
    
    // Process the comparison chart data to create chart series and categories
    const processedCompareData = React.useMemo(() => {
        if (!compareChartData || !Array.isArray(compareChartData) || compareChartData.length === 0) {
            return { series: [], categories: [] };
        }
            
        // Process the comparison data to extract timestamps and values
        const categories = compareChartData.map(item => {
            // Format timestamp for x-axis - date and month only
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });
            
        // Create series for the comparison data
        const series = [];
            
        // Extract values from the comparison data
        const values = compareChartData.map(item => {
            if (item.acte_im !== undefined) return parseFloat(item.acte_im) || 0;
            if (item.value !== undefined) return parseFloat(item.value) || 0;
            if (item.total_act_energy !== undefined) return parseFloat(item.total_act_energy) || 0;
            if (item.energy_value !== undefined) return parseFloat(item.energy_value) || 0;
            return 0;
        });
            
        if (values.some(val => val !== 0)) {
            series.push({
                name: compareDevice,
                data: values
            });
        }
            
        return { series, categories };
    }, [compareChartData, compareDevice]);
    
    // Process the second comparison chart data to create chart series and categories
    const processedCompareData2 = React.useMemo(() => {
        if (!compareChartData2 || !Array.isArray(compareChartData2) || compareChartData2.length === 0) {
            return { series: [], categories: [] };
        }
            
        // Process the second comparison data to extract timestamps and values
        const categories = compareChartData2.map(item => {
            // Format timestamp for x-axis - date and month only
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });
            
        // Create series for the second comparison data
        const series = [];
            
        // Extract values from the second comparison data
        const values = compareChartData2.map(item => {
            if (item.acte_im !== undefined) return parseFloat(item.acte_im) || 0;
            if (item.value !== undefined) return parseFloat(item.value) || 0;
            if (item.total_act_energy !== undefined) return parseFloat(item.total_act_energy) || 0;
            if (item.energy_value !== undefined) return parseFloat(item.energy_value) || 0;
            return 0;
        });
            
        if (values.some(val => val !== 0)) {
            series.push({
                name: compareDevice2,
                data: values
            });
        }
            
        return { series, categories };
    }, [compareChartData2, compareDevice2]);

    // Define colors for each series to match the dots in the image
    const seriesColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

    // Dynamic chart configuration function
    const getChartOptions = (currentProcessedData, currentData) => {
        return {
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
                categories: currentProcessedData.categories,
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
                    // Get the original date from the data based on search state
                    let originalDate = '';

                    if (currentData && currentData.length > 0) {
                        if (searchClicked) {
                            // For filtered data, use timestamp from filteredChartData
                            const item = currentData[dataPointIndex];
                            const timestamp = item?.timestamp || item?.created_at || item?.date || '';
                            if (timestamp) {
                                const date = new Date(timestamp);
                                originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                            }
                        } else {
                            // For default data, use the original logic
                            originalDate = currentData[0]?.data[dataPointIndex]?.date || '';
                        }
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
    };


    return (
        <Box style={styles.mainContent} id="main-content">
            {/* <Box style={styles.blockHeader} className="block-header mb-1">
                <Grid container>
                    <Grid item lg={5} md={8} xs={12}>
                        <Typography
                            variant="h6"
                            className="logs-title"
                            style={{
                                // marginBottom: '-10px',
                                color: '#0F2A44',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                                 marginLeft: '5px',
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
            </Box> */}

            <Box style={styles.container}>
                <Card style={styles.tableCard}>
                    <CardContent sx={{ p: 1 }}>
                        <Box className="logs-header">
                            <Box className="logs-filters">
                                <FormControl size="small" sx={{ minWidth: 300 }}>
                                    <InputLabel>Select Machine</InputLabel>
                                    <Select
                                        value={filterDevice}
                                        label="Select Machine"
                                        onChange={(e) => setFilterDevice(e.target.value)}
                                    >
                                        {devices.map((device) => (
                                            <MenuItem key={device} value={device}>
                                                {device === 'all' ? 'Select Machine' : device}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                        value={dayjs.isDayjs(filterStartDate) ? filterStartDate : null}
                                        onChange={(newValue) => setFilterStartDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                sx: {
                                                    minWidth: 220,
                                                    mr: 2,
                                                    borderRadius: 2,
                                                },
                                            },
                                        }}
                                        format="DD/MM/YYYY hh:mm A"
                                    />
                                </LocalizationProvider>

                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                        value={filterEndDate ? (dayjs.isDayjs(filterEndDate) ? filterEndDate : dayjs(filterEndDate)) : null}
                                        onChange={(newValue) => setFilterEndDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                sx: {
                                                    minWidth: 220,
                                                    mr: 2,
                                                    borderRadius: 2,
                                                },
                                            },
                                        }}
                                        format="DD/MM/YYYY hh:mm A"
                                    />
                                </LocalizationProvider>

                                <Button
                                    variant="contained"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    sx={{
                                        backgroundColor: '#0156a6', // Blue color to match the image
                                        '&:hover': {
                                            backgroundColor: '#166aa0', // Darker blue on hover
                                        },
                                        mr: 1
                                    }}
                                >
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleResetFilters}
                                    sx={{
                                        borderColor: '#6c757d',
                                        color: '#6c757d',
                                        '&:hover': {
                                            borderColor: '#5a6268',
                                            color: '#5a6268',
                                        }
                                    }}
                                >
                                </Button>
                            </Box>
                        </Box>
                        {loading ? (
                            <div>Loading...</div>
                        ) : error ? (
                            <div>Error: {error}</div>
                        ) : searchClicked ? (
                            processedFilteredData.series.length > 0 ? (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            gutterBottom
                                            sx={{
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#50342c',
                                                mb: 0
                                            }}
                                        >
                                            {filterDevice !== 'all' ? `${filterDevice}` : 'Total Active Energy (Last 7 Days)'}
                                        </Typography>
                                        <Box>
                                            {compareMode ? (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setCompareMode(false)}
                                                    sx={{
                                                        borderColor: '#0156a6',
                                                        color: '#0156a6',
                                                        '&:hover': {
                                                            borderColor: '#166aa0',
                                                            color: '#166aa0',
                                                        },
                                                        mr: 1
                                                    }}
                                                >
                                                    Cancel Compare
                                                </Button>
                                            ) : (
                                                <FormControl size="small" sx={{ minWidth: 300 }}>
                                                    <InputLabel>Select Machine to Compare</InputLabel>
                                                    <Select
                                                        value={compareDevice}
                                                        label="Select Machine to Compare"
                                                        onChange={(e) => {
                                                            setCompareDevice(e.target.value);
                                                            setCompareMode(true);
                                                        }}
                                                    >
                                                        {devices.filter(device => device !== 'all' && device !== filterDevice && device !== compareDevice2).map((device) => (
                                                            <MenuItem key={device} value={device}>
                                                                {device}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Box>
                                    </Box>
                                    <Chart
                                        options={getChartOptions(
                                            processedFilteredData,
                                            filteredChartData
                                        )}
                                        series={processedFilteredData.series}
                                        type="line"
                                        height={420}
                                    />
                                    {compareMode && compareDevice && processedCompareData.series.length > 0 && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography
                                                gutterBottom
                                                sx={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#50342c',
                                                    mb: 1
                                                }}
                                            >
                                                {compareDevice}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                {compareMode2 ? (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => setCompareMode2(false)}
                                                        sx={{
                                                            borderColor: '#0156a6',
                                                            color: '#0156a6',
                                                            '&:hover': {
                                                                borderColor: '#166aa0',
                                                                color: '#166aa0',
                                                            }
                                                        }}
                                                    >
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl size="small" sx={{ minWidth: 300 }}>
                                                        <InputLabel>Select Second Machine to Compare</InputLabel>
                                                        <Select
                                                            value={compareDevice2}
                                                            label="Select Second Machine to Compare"
                                                            onChange={(e) => {
                                                                setCompareDevice2(e.target.value);
                                                                setCompareMode2(true);
                                                            }}
                                                        >
                                                            {devices.filter(device => device !== 'all' && device !== filterDevice && device !== compareDevice).map((device) => (
                                                                <MenuItem key={device} value={device}>
                                                                    {device}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </Box>
                                            <Chart
                                                options={getChartOptions(
                                                    processedCompareData,
                                                    compareChartData
                                                )}
                                                series={processedCompareData.series}
                                                type="line"
                                                height={420}
                                            />
                                        </Box>
                                    )}
                                    {compareMode2 && compareDevice2 && processedCompareData2.series.length > 0 && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography
                                                gutterBottom
                                                sx={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#50342c',
                                                    mb: 1
                                                }}
                                            >
                                                {compareDevice2}
                                            </Typography>
                                            <Chart
                                                options={getChartOptions(
                                                    processedCompareData2,
                                                    compareChartData2
                                                )}
                                                series={processedCompareData2.series}
                                                type="line"
                                                height={420}
                                            />
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <div>No data available for the selected filters</div>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </Box>
            {/* <Box style={styles.container}>
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
            </Box> */}
        </Box>
    )
}

export default Analytics