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
    ListItemText,
    CircularProgress,
    Alert,
    Snackbar,
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

// Import API functions
import { getSolarSlaves, getSolarAnalytics } from '../../auth/solar/SolarAnalyticsApi';

// Updated parameter options for solar analytics
const parameterOptions = [
    { value: "flowrate", label: "Flow Rate (m³/hr)" },
    { value: "inlet_temperature", label: "Inlet Temperature (°C)" },
    { value: "outlet_temperature", label: "Outlet Temperature (°C)" }
];

const SolarAnalytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('');
    // Initialize with default dates - 7 days ago to today
    const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'day'));
    const [filterEndDate, setFilterEndDate] = useState(dayjs());
    const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
    const [devices, setDevices] = useState(['all']); // Initialize with 'all' as default
    const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs
    const [selectedParameter, setSelectedParameter] = useState([]); // State for main chart parameter selection (array for multi-select)
    const [selectedParameter2, setSelectedParameter2] = useState([]); // State for first comparison chart parameter selection (array for multi-select)
    const [selectedParameter3, setSelectedParameter3] = useState([]); // State for second comparison chart parameter selection (array for multi-select)
    const [compareParameter, setCompareParameter] = useState(''); // State for first comparison chart parameter selection
    const [compareParameter2, setCompareParameter2] = useState(''); // State for second comparison chart parameter selection
    const [filterDevice2, setFilterDevice2] = useState('all'); // State for first comparison chart machine selection
    const [filterDevice3, setFilterDevice3] = useState('all'); // State for second comparison chart machine selection
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);
    
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareLoading2, setCompareLoading2] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const filteredValue = 'all';
    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '86.4vh',
            backgroundColor: '#f4f7f6',
            fontFamily: '"Ubuntu", sans-serif',
            fontSize: '14px',
            color: '#5A5A5A',
            marginBottom: '20px',
            padding: { xs: '5px', sm: '0' },
            boxSizing: 'border-box',
        },
        container: {
            padding: { xs: '5px', sm: '0' },
        },
        blockHeader: {
            padding: { xs: '5px 0', sm: '10px 0' },
        },
        headerTitle: {
            margin: '0',
            fontSize: { xs: '18px', sm: '24px' },
            fontWeight: '400',
            color: '#515151',
        },
        tableCard: {
            backgroundColor: '#fff',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            padding: { xs: '10px', sm: '15px' },
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
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
        },
    };

    // Fetch devices on component mount
    useEffect(() => {
        fetchDevices();
    }, []);

    // Function to fetch devices
    const fetchDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            const slaves = await getSolarSlaves();
            setDeviceObjects(slaves);
            const deviceNames = slaves.map(device => device.slave_name);
            setDevices(['all', ...deviceNames]);
            
            // Set default device to the first one (not 'all')
            if (slaves.length > 0) {
                setFilterDevice(slaves[0].slave_name);
            }
        } catch (err) {
            console.error('Error fetching devices:', err);
            setError(err.message || 'Failed to fetch devices');
            setSnackbarMessage(err.message || 'Failed to fetch devices');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch analytics data for a specific device
    const fetchAnalyticsData = async (deviceName, parameters, startDate, endDate) => {
        try {
            // Find the device ID based on the device name
            const selectedDevice = deviceObjects.find(device => device.slave_name === deviceName);
            if (!selectedDevice) {
                throw new Error('Device not found');
            }

            // Default to all parameters if none selected
            const params = parameters.length > 0 ? parameters : ['flowrate', 'inlet_temperature', 'outlet_temperature'];
            
            // Format dates for API
            const fromDateTime = startDate.format('YYYY-MM-DD HH:mm:ss');
            const toDateTime = endDate.format('YYYY-MM-DD HH:mm:ss');
            
            // Fetch analytics data
            const analyticsData = await getSolarAnalytics(selectedDevice.slave_id, params, fromDateTime, toDateTime);
            return analyticsData;
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            throw err;
        }
    };

    // Handle search button click
    const handleSearch = async () => {
        if (!filterDevice || filterDevice === 'all') {
            setSnackbarMessage('Please select a device');
            setSnackbarOpen(true);
            return;
        }
        if (!filterStartDate) {
            setSnackbarMessage('Please select a start date');
            setSnackbarOpen(true);
            return;
        }
        if (!filterEndDate) {
            setSnackbarMessage('Please select an end date');
            setSnackbarOpen(true);
            return;
        }
        
        try {
            setDataLoading(true);
            setSearchClicked(true);
            
            // Fetch analytics data for the main device
            const analyticsData = await fetchAnalyticsData(
                filterDevice, 
                selectedParameter, 
                filterStartDate, 
                filterEndDate
            );
            setFilteredChartData(analyticsData);
            
            // If comparison mode is active, fetch comparison data
            if (compareMode && compareDevice) {
                setCompareLoading(true);
                try {
                    const compareData = await fetchAnalyticsData(
                        compareDevice, 
                        selectedParameter2, 
                        filterStartDate, 
                        filterEndDate
                    );
                    setCompareChartData(compareData);
                } catch (err) {
                    console.error('Error fetching comparison data:', err);
                    setSnackbarMessage(err.message || 'Failed to fetch comparison data');
                    setSnackbarOpen(true);
                } finally {
                    setCompareLoading(false);
                }
            }
            
            // If second comparison mode is active, fetch second comparison data
            if (compareMode2 && compareDevice2) {
                setCompareLoading2(true);
                try {
                    const compareData2 = await fetchAnalyticsData(
                        compareDevice2, 
                        selectedParameter3, 
                        filterStartDate, 
                        filterEndDate
                    );
                    setCompareChartData2(compareData2);
                } catch (err) {
                    console.error('Error fetching second comparison data:', err);
                    setSnackbarMessage(err.message || 'Failed to fetch second comparison data');
                    setSnackbarOpen(true);
                } finally {
                    setCompareLoading2(false);
                }
            }
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setSnackbarMessage(err.message || 'Failed to fetch analytics data');
            setSnackbarOpen(true);
        } finally {
            setDataLoading(false);
        }
    };

    // Function to reset all filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterDevice(deviceObjects.length > 0 ? deviceObjects[0].slave_name : '');
        // Reset to default dates
        setFilterStartDate(dayjs().subtract(1, 'day'));
        setFilterEndDate(dayjs());
        setSearchClicked(false); // Reset search state
        setSelectedParameter([]); // Reset main chart parameter
        setSelectedParameter2([]); // Reset first comparison parameter
        setSelectedParameter3([]); // Reset second comparison parameter
        setFilterDevice2('all'); // Reset first comparison machine
        setFilterDevice3('all'); // Reset second comparison machine
        setCompareParameter(''); // Reset first comparison parameter
        setCompareParameter2(''); // Reset second comparison parameter
        setFilteredChartData([]); // Clear chart data
        setCompareChartData([]); // Clear comparison chart data
        setCompareChartData2([]); // Clear second comparison chart data
        setError(null); // Clear error
    };

    const [parameters, setParameters] = React.useState([]);
    const [totalActiveEnergyData, setTotalActiveEnergyData] = useState([]);
    const [consumptionData, setConsumptionData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]); // State for filtered chart data
    const [compareMode, setCompareMode] = useState(false); // Track if compare mode is active
    const [compareDevice, setCompareDevice] = useState(''); // Selected device for comparison
    const [compareChartData, setCompareChartData] = useState([]); // Chart data for comparison device
    const [compareMode2, setCompareMode2] = useState(false); // Track if second compare mode is active
    const [compareDevice2, setCompareDevice2] = useState(''); // Selected device for second comparison
    const [compareChartData2, setCompareChartData2] = useState([]); // Chart data for second comparison device

    // Handle comparison device selection
    const handleCompareDeviceChange = async (deviceName) => {
        setCompareDevice(deviceName);
        setCompareMode(true);
        
        // If main data is already loaded, fetch comparison data immediately
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading(true);
            try {
                const compareData = await fetchAnalyticsData(
                    deviceName, 
                    selectedParameter2, 
                    filterStartDate, 
                    filterEndDate
                );
                setCompareChartData(compareData);
            } catch (err) {
                console.error('Error fetching comparison data:', err);
                setSnackbarMessage(err.message || 'Failed to fetch comparison data');
                setSnackbarOpen(true);
            } finally {
                setCompareLoading(false);
            }
        }
    };

    // Handle second comparison device selection
    const handleCompareDevice2Change = async (deviceName) => {
        setCompareDevice2(deviceName);
        setCompareMode2(true);
        
        // If main data is already loaded, fetch comparison data immediately
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading2(true);
            try {
                const compareData2 = await fetchAnalyticsData(
                    deviceName, 
                    selectedParameter3, 
                    filterStartDate, 
                    filterEndDate
                );
                setCompareChartData2(compareData2);
            } catch (err) {
                console.error('Error fetching second comparison data:', err);
                setSnackbarMessage(err.message || 'Failed to fetch second comparison data');
                setSnackbarOpen(true);
            } finally {
                setCompareLoading2(false);
            }
        }
    };

    // Process the filtered chart data to create chart series and categories
    const processedFilteredData = React.useMemo(() => {
        console.log('Processing filtered chart data:', filteredChartData);
        console.log('Selected parameter:', selectedParameter);

        if (!filteredChartData || !Array.isArray(filteredChartData) || filteredChartData.length === 0) {
            console.log('No filtered chart data available');
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

        // Handle multiple selected parameters
        const parametersToProcess = Array.isArray(selectedParameter) && selectedParameter.length > 0
            ? selectedParameter
            : ['flowrate', 'inlet_temperature', 'outlet_temperature']; // Default to all parameters

        console.log('Parameters to process:', parametersToProcess);

        parametersToProcess.forEach(param => {
            // Extract values from the filtered data based on selected parameter and format to 2 decimal places
            const values = filteredChartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'flowrate':
                            value = parseFloat(item.flowrate) || 0;
                            break;
                        case 'inlet_temperature':
                            value = parseFloat(item.inlet_temperature) || 0;
                            break;
                        case 'outlet_temperature':
                            value = parseFloat(item.outlet_temperature) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (flowrate)
                    value = parseFloat(item.flowrate) || 0;
                }

                // Format to 2 decimal places
                return parseFloat(value.toFixed(2));
            });

            // Always create a series if we have data, even if all values are 0
            if (filteredChartData.length > 0) {
                const parameterLabel = param
                    ? parameterOptions.find(opt => opt.value === param)?.label || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : filterDevice;
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        console.log('Processed series:', series);
        console.log('Processed categories:', categories);

        return { series, categories };
    }, [filteredChartData, filterDevice, selectedParameter]);

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

        // Handle multiple selected parameters
        const parametersToProcess = Array.isArray(selectedParameter2) && selectedParameter2.length > 0
            ? selectedParameter2
            : ['flowrate', 'inlet_temperature', 'outlet_temperature']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the comparison data based on selected parameter and format to 2 decimal places
            const values = compareChartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'flowrate':
                            value = parseFloat(item.flowrate) || 0;
                            break;
                        case 'inlet_temperature':
                            value = parseFloat(item.inlet_temperature) || 0;
                            break;
                        case 'outlet_temperature':
                            value = parseFloat(item.outlet_temperature) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (flowrate)
                    value = parseFloat(item.flowrate) || 0;
                }

                // Format to 2 decimal places
                return parseFloat(value.toFixed(2));
            });

            // Always create a series if we have data, even if all values are 0
            if (compareChartData.length > 0) {
                const parameterLabel = param
                    ? parameterOptions.find(opt => opt.value === param)?.label || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : compareDevice;
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        return { series, categories };
    }, [compareChartData, compareDevice, selectedParameter2, filterDevice2]);

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

        // Handle multiple selected parameters
        const parametersToProcess = Array.isArray(selectedParameter3) && selectedParameter3.length > 0
            ? selectedParameter3
            : ['flowrate', 'inlet_temperature', 'outlet_temperature']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the second comparison data based on selected parameter and format to 2 decimal places
            const values = compareChartData2.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'flowrate':
                            value = parseFloat(item.flowrate) || 0;
                            break;
                        case 'inlet_temperature':
                            value = parseFloat(item.inlet_temperature) || 0;
                            break;
                        case 'outlet_temperature':
                            value = parseFloat(item.outlet_temperature) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (flowrate)
                    value = parseFloat(item.flowrate) || 0;
                }

                // Format to 2 decimal places
                return parseFloat(value.toFixed(2));
            });

            // Always create a series if we have data, even if all values are 0
            if (compareChartData2.length > 0) {
                const parameterLabel = param
                    ? parameterOptions.find(opt => opt.value === param)?.label || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : compareDevice2;
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        return { series, categories };
    }, [compareChartData2, compareDevice2, selectedParameter3, filterDevice3]);

    // Debug useEffect to monitor state changes
    useEffect(() => {
        console.log('=== State Debug Info ===');
        console.log('searchClicked:', searchClicked);
        console.log('filteredChartData:', filteredChartData);
        console.log('filteredChartData.length:', filteredChartData?.length);
        console.log('processedFilteredData:', processedFilteredData);
        console.log('processedFilteredData.series:', processedFilteredData.series);
        console.log('processedFilteredData.series.length:', processedFilteredData.series?.length);
        console.log('selectedParameter:', selectedParameter);
        console.log('========================');
    }, [searchClicked, filteredChartData, processedFilteredData, selectedParameter]);

    // Define colors for each series to match the dots in the image
    const seriesColors = ['#d32f2f', '#1976d2', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

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
                    show: true,
                    rotate: -45,
                    rotateAlways: true,
                },
                tickAmount: 6,
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
                    formatter: function (value) {
                        // Format y-axis values to 2 decimal places
                        if (value !== undefined && value !== null && !isNaN(value)) {
                            return parseFloat(value).toFixed(2);
                        }
                        return value;
                    }
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
                        show: false
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
        <Box sx={styles.mainContent} id="main-content">
            <Box sx={styles.container}>
                <Card sx={styles.tableCard}>
                    <CardContent sx={{ p: { xs: 1, sm: 1 } }}>
                        <Box className="logs-header">
                            <Box 
                                className="logs-filters"
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    flexWrap: 'wrap',
                                    gap: { xs: 2, sm: 2 },
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                }}
                            >
                                {loading ? (
                                    <Box style={styles.loadingContainer}>
                                        <CircularProgress />
                                    </Box>
                                ) : error ? (
                                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                                ) : (
                                    <>
                                        {/* Machine Select */}
                                        <FormControl 
                                            size="small" 
                                            sx={{ 
                                                minWidth: { xs: '100%', sm: 300 },
                                                order: { xs: 1, sm: 1 }
                                            }}
                                        >
                                            <InputLabel>Select Device</InputLabel>
                                            <Select
                                                value={filterDevice}
                                                label="Select Device"
                                                onChange={(e) => setFilterDevice(e.target.value)}
                                            >
                                                {devices.map((device) => (
                                                    <MenuItem key={device} value={device}>
                                                        {device === 'all' ? 'Select Device' : device}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Parameters Select */}
                                        <FormControl 
                                            size="small" 
                                            sx={{ 
                                                minWidth: { xs: '100%', sm: 200 }, 
                                                mr: { sm: 1 },
                                                order: { xs: 2, sm: 2 }
                                            }}
                                        >
                                            <InputLabel>Select Parameters</InputLabel>
                                            <Select
                                                multiple
                                                value={selectedParameter}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // If "All Parameters" is selected, clear all other selections
                                                    if (value.includes('all')) {
                                                        setSelectedParameter([]);
                                                    } else {
                                                        // Remove "all" from selection if other items are selected
                                                        const filteredValue = value.filter(item => item !== 'all');
                                                        setSelectedParameter(filteredValue);
                                                    }
                                                }}
                                                label="Select Parameters"
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                                                        {selected.slice(0, 2).map((value) => (
                                                            <Chip
                                                                key={value}
                                                                label={parameterOptions.find(p => p.value === value)?.label || value.replace(/_/g, ' ')}
                                                                size="small"
                                                                sx={{
                                                                    height: '20px',
                                                                    fontSize: '10px',
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            />
                                                        ))}
                                                        {selected.length > 2 && (
                                                            <Chip
                                                                label={`+${selected.length - 2} more`}
                                                                size="small"
                                                                sx={{
                                                                    height: '20px',
                                                                    fontSize: '10px',
                                                                    backgroundColor: '#0156a6',
                                                                    color: '#fff',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                                MenuProps={
                                                    {
                                                        PaperProps: {
                                                            style: { maxHeight: 300, width: 250 },
                                                        },
                                                    }
                                                }
                                            >
                                                {parameterOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value} sx={{
                                                        py: 0.2,
                                                        px: 1,
                                                        minHeight: '32px',
                                                    }}>
                                                        <Checkbox checked={selectedParameter.indexOf(option.value) > -1}
                                                            sx={{
                                                                p: 0.5,
                                                                mr: 0.5,
                                                                transform: "scale(0.8)",
                                                                '& .MuiSvgIcon-root': { fontSize: 20 }
                                                            }} />
                                                        <ListItemText primary={option.label} primaryTypographyProps={{
                                                            fontSize: '12px',
                                                            lineHeight: 1.2
                                                        }}
                                                            secondaryTypographyProps={{
                                                                fontSize: '10px',
                                                                color: 'text.secondary'
                                                            }} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Date Pickers Row */}
                                        <Box 
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: { xs: 2, sm: 2 },
                                                order: { xs: 3, sm: 3 },
                                                width: { xs: '100%', sm: 'auto' }
                                            }}
                                        >
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    open={openStart}
                                                    onOpen={() => setOpenStart(true)}
                                                    onClose={() => setOpenStart(false)}
                                                    value={filterStartDate}
                                                    onChange={(newValue) => setFilterStartDate(newValue)}
                                                    format="DD/MM/YYYY hh:mm A"
                                                    slotProps={{
                                                        textField: {
                                                            size: 'small',
                                                            sx: { 
                                                                minWidth: { xs: '100%', sm: 220 }, 
                                                                mr: { sm: 2 }, 
                                                                borderRadius: 2 
                                                            },
                                                            onClick: () => setOpenStart(true),
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>

                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    open={openEnd}
                                                    onOpen={() => setOpenEnd(true)}
                                                    onClose={() => setOpenEnd(false)}
                                                    value={filterEndDate}
                                                    onChange={(newValue) => setFilterEndDate(newValue)}
                                                    format="DD/MM/YYYY hh:mm A"
                                                    slotProps={{
                                                        textField: {
                                                            size: 'small',
                                                            sx: { 
                                                                minWidth: { xs: '100%', sm: 220 }, 
                                                                mr: { sm: 2 }, 
                                                                borderRadius: 2 
                                                            },
                                                            onClick: () => setOpenEnd(true),
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Box>

                                        {/* Buttons Row */}
                                        <Box 
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 1,
                                                order: { xs: 4, sm: 4 },
                                                justifyContent: { xs: 'flex-start', sm: 'flex-start' }
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                startIcon={<SearchIcon />}
                                                onClick={handleSearch}
                                                sx={{
                                                    backgroundColor: '#2F6FB0',
                                                    '&:hover': {
                                                        backgroundColor: '#1E4A7C',
                                                    },
                                                    minWidth: 'auto',
                                                    width: { xs: 'auto', sm: '32px' },
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '6px' },
                                                    borderRadius: '4px',
                                                    '& .MuiButton-startIcon': {
                                                        margin: { sm: 0 },
                                                    }
                                                }}
                                            >   
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<RefreshIcon />}
                                                onClick={() => {
                                                    handleResetFilters();
                                                }}
                                                sx={{
                                                    borderColor: '#6c757d',
                                                    color: '#6c757d',
                                                    '&:hover': {
                                                        borderColor: '#5a6268',
                                                        color: '#5a6268',
                                                    },
                                                    minWidth: 'auto',
                                                    width: { xs: 'auto', sm: '32px' },
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '4px' },
                                                    borderRadius: '4px',
                                                    '& .MuiButton-startIcon': {
                                                        margin: { sm: 0 },
                                                    }
                                                }}
                                            >
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                        {searchClicked ? (
                            dataLoading ? (
                                <Box style={styles.loadingContainer}>
                                    <CircularProgress />
                                </Box>
                            ) : processedFilteredData.series.length > 0 ? (
                                <>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        justifyContent: 'space-between', 
                                        alignItems: { xs: 'flex-start', sm: 'center' }, 
                                        mb: 1,
                                        gap: { xs: 1, sm: 0 }
                                    }}>
                                        <Typography
                                            gutterBottom
                                            sx={{
                                                fontSize: { xs: '12px', sm: '14px' },
                                                fontWeight: 'bold',
                                                color: '#50342c',
                                                mb: 0
                                            }}
                                        >
                                            {Array.isArray(selectedParameter) && selectedParameter.length > 0
                                                ? `${filterDevice} - ${selectedParameter.length > 1
                                                    ? `${selectedParameter.length} Parameters Selected`
                                                    : parameterOptions.find(opt => opt.value === selectedParameter[0])?.label || selectedParameter[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                : (filterDevice !== 'all' ? `${filterDevice}` : 'Solar Analytics')}
                                        </Typography>
                                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: { xs: 1, sm: 2 }, 
                                                alignItems: { xs: 'stretch', sm: 'center' } 
                                            }}>
                                                {compareMode ? (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => setCompareMode(false)}
                                                        sx={{
                                                            borderColor: '#d32f2f',
                                                            color: '#d32f2f',
                                                            '&:hover': {
                                                                borderColor: '#b71c1c',
                                                                color: '#b71c1c',
                                                            },
                                                            mr: { sm: 1 },
                                                            width: { xs: '100%', sm: 'auto' }
                                                        }}
                                                    >
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl 
                                                        size="small" 
                                                        sx={{ 
                                                            minWidth: { xs: '100%', sm: 300 },
                                                            width: { xs: '100%', sm: 'auto' }
                                                        }}
                                                    >
                                                        <InputLabel>Select Device to Compare</InputLabel>
                                                        <Select
                                                            value={compareDevice}
                                                            label="Select Device to Compare"
                                                            onChange={(e) => handleCompareDeviceChange(e.target.value)}
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
                                    </Box>
                                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                                        <Chart
                                            options={getChartOptions(
                                                processedFilteredData,
                                                filteredChartData
                                            )}
                                            series={processedFilteredData.series}
                                            type="line"
                                            height={420}
                                            width="100%"
                                        />
                                    </Box>
                                    {compareMode && compareDevice && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography
                                                gutterBottom
                                                sx={{
                                                    fontSize: { xs: '12px', sm: '14px' },
                                                    fontWeight: 'bold',
                                                    color: '#50342c',
                                                    mb: 1
                                                }}
                                            >
                                                {Array.isArray(selectedParameter2) && selectedParameter2.length > 0
                                                    ? `${compareDevice} - ${selectedParameter2.length > 1
                                                        ? `${selectedParameter2.length} Parameters Selected`
                                                        : parameterOptions.find(opt => opt.value === selectedParameter2[0])?.label || selectedParameter2[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                    : compareDevice}
                                            </Typography>
                                            {compareLoading ? (
                                                <Box style={styles.loadingContainer}>
                                                    <CircularProgress />
                                                </Box>
                                            ) : processedCompareData.series.length > 0 ? (
                                                <>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        justifyContent: 'flex-end',
                                                        gap: { xs: 1, sm: 0 },
                                                        mb: 2
                                                    }}>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            flexDirection: { xs: 'column', sm: 'row' },
                                                            gap: { xs: 1, sm: 2 }, 
                                                            alignItems: { xs: 'stretch', sm: 'center' },
                                                            width: { xs: '100%', sm: 'auto' }
                                                        }}>
                                                            <FormControl 
                                                                size="small" 
                                                                sx={{ 
                                                                    minWidth: { xs: '100%', sm: 300 },
                                                                    width: { xs: '100%', sm: 'auto' }
                                                                }}
                                                            >
                                                                <InputLabel>Select Device</InputLabel>
                                                                <Select
                                                                    value={compareDevice}
                                                                    label="Select Device"
                                                                    onChange={(e) => handleCompareDeviceChange(e.target.value)}
                                                                >
                                                                    {devices.map((device) => (
                                                                        <MenuItem key={device} value={device}>
                                                                            {device === 'all' ? 'Select Device' : device}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl 
                                                                size="small" 
                                                                sx={{ 
                                                                    minWidth: { xs: '100%', sm: 200 }, 
                                                                    mr: { sm: 1 },
                                                                    width: { xs: '100%', sm: 'auto' }
                                                                }}
                                                            >
                                                                <InputLabel>Select Parameters</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={selectedParameter2}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (value.includes('all')) {
                                                                            setSelectedParameter2([]);
                                                                        } else {
                                                                            const filteredValue = value.filter(item => item !== 'all');
                                                                            setSelectedParameter2(filteredValue);
                                                                        }
                                                                        
                                                                        if (compareMode && compareDevice && searchClicked) {
                                                                            setCompareLoading(true);
                                                                            fetchAnalyticsData(
                                                                                compareDevice, 
                                                                                filteredValue.length > 0 ? filteredValue : ['flowrate', 'inlet_temperature', 'outlet_temperature'], 
                                                                                filterStartDate, 
                                                                                filterEndDate
                                                                            ).then(data => {
                                                                                setCompareChartData(data);
                                                                            }).catch(err => {
                                                                                console.error('Error updating comparison data:', err);
                                                                                setSnackbarMessage(err.message || 'Failed to update comparison data');
                                                                                setSnackbarOpen(true);
                                                                            }).finally(() => {
                                                                                setCompareLoading(false);
                                                                            });
                                                                        }
                                                                    }}
                                                                    label="Select Parameters"
                                                                    renderValue={(selected) => (
                                                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                                                                            {selected.slice(0, 2).map((value) => (
                                                                                <Chip
                                                                                    key={value}
                                                                                    label={parameterOptions.find(p => p.value === value)?.label || value.replace(/_/g, ' ')}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: '20px',
                                                                                        fontSize: '10px',
                                                                                        textTransform: 'capitalize'
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                            {selected.length > 2 && (
                                                                                <Chip
                                                                                    label={`+${selected.length - 2} more`}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: '20px',
                                                                                        fontSize: '10px',
                                                                                        backgroundColor: '#0156a6',
                                                                                        color: '#fff',
                                                                                        fontWeight: 'bold'
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    )}
                                                                    MenuProps={
                                                                        {
                                                                            PaperProps: {
                                                                                style: { maxHeight: 300, width: 250 },
                                                                            },
                                                                        }
                                                                    }
                                                                >
                                                                    {parameterOptions.map((option) => (
                                                                        <MenuItem key={option.value} value={option.value}
                                                                            sx={{
                                                                                py: 0.2,
                                                                                px: 1,
                                                                                minHeight: '32px',
                                                                            }}>
                                                                            <Checkbox checked={selectedParameter2.indexOf(option.value) > -1}
                                                                                sx={{
                                                                                    p: 0.5,
                                                                                    mr: 0.5,
                                                                                    transform: "scale(0.8)",
                                                                                    '& .MuiSvgIcon-root': { fontSize: 20 }
                                                                                }} />
                                                                            <ListItemText primary={option.label}
                                                                                primaryTypographyProps={{
                                                                                    fontSize: '12px',
                                                                                    lineHeight: 1.2
                                                                                }}
                                                                                secondaryTypographyProps={{
                                                                                    fontSize: '10px',
                                                                                    color: 'text.secondary'
                                                                                }} />
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>

                                                            {compareMode2 ? (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() => setCompareMode2(false)}
                                                                    sx={{
                                                                        borderColor: '#d32f2f',
                                                                        color: '#d32f2f',
                                                                        '&:hover': {
                                                                            borderColor: '#b71c1c',
                                                                            color: '#b71c1c',
                                                                        },
                                                                        width: { xs: '100%', sm: 'auto' }
                                                                    }}
                                                                >
                                                                    Cancel Compare
                                                                </Button>
                                                            ) : (
                                                                <FormControl 
                                                                    size="small" 
                                                                    sx={{ 
                                                                        minWidth: { xs: '100%', sm: 300 },
                                                                        width: { xs: '100%', sm: 'auto' }
                                                                    }}
                                                                >
                                                                    <InputLabel>Select Second Device to Compare</InputLabel>
                                                                    <Select
                                                                        value={compareDevice2}
                                                                        label="Select Second Device to Compare"
                                                                        onChange={(e) => handleCompareDevice2Change(e.target.value)}
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
                                                    </Box>
                                                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                                                        <Chart
                                                            options={getChartOptions(
                                                                processedCompareData,
                                                                compareChartData
                                                            )}
                                                            series={processedCompareData.series}
                                                            type="line"
                                                            height={420}
                                                            width="100%"
                                                        />
                                                    </Box>
                                                </>
                                            ) : (
                                                <Alert severity="info" sx={{ m: 2 }}>No data available for comparison</Alert>
                                            )}
                                        </Box>
                                    )}
                                    {compareMode2 && compareDevice2 && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography
                                                gutterBottom
                                                sx={{
                                                    fontSize: { xs: '12px', sm: '14px' },
                                                    fontWeight: 'bold',
                                                    color: '#50342c',
                                                    mb: 1
                                                }}
                                            >
                                                {Array.isArray(selectedParameter3) && selectedParameter3.length > 0
                                                    ? `${compareDevice2} - ${selectedParameter3.length > 1
                                                        ? `${selectedParameter3.length} Parameters Selected`
                                                        : parameterOptions.find(opt => opt.value === selectedParameter3[0])?.label || selectedParameter3[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                    : compareDevice2}
                                            </Typography>
                                            {compareLoading2 ? (
                                                <Box style={styles.loadingContainer}>
                                                    <CircularProgress />
                                                </Box>
                                            ) : processedCompareData2.series.length > 0 ? (
                                                <>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        gap: { xs: 1, sm: 2 },
                                                        justifyContent: 'flex-end',
                                                        mb: 2
                                                    }}>
                                                        <FormControl 
                                                            size="small" 
                                                            sx={{ 
                                                                minWidth: { xs: '100%', sm: 300 },
                                                                width: { xs: '100%', sm: 'auto' }
                                                            }}
                                                        >
                                                            <InputLabel>Select Device</InputLabel>
                                                            <Select
                                                                value={compareDevice2}
                                                                label="Select Device"
                                                                onChange={(e) => handleCompareDevice2Change(e.target.value)}
                                                            >
                                                                {devices.map((device) => (
                                                                    <MenuItem key={device} value={device}>
                                                                        {device === 'all' ? 'Select Device' : device}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                        <FormControl 
                                                            size="small" 
                                                            sx={{ 
                                                                minWidth: { xs: '100%', sm: 200 },
                                                                width: { xs: '100%', sm: 'auto' }
                                                            }}
                                                        >
                                                            <InputLabel>Select Parameters</InputLabel>
                                                            <Select
                                                                multiple
                                                                value={selectedParameter3}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (value.includes('all')) {
                                                                        setSelectedParameter3([]);
                                                                    } else {
                                                                        const filteredValue = value.filter(item => item !== 'all');
                                                                        setSelectedParameter3(filteredValue);
                                                                    }
                                                                    
                                                                    if (compareMode2 && compareDevice2 && searchClicked) {
                                                                        setCompareLoading2(true);
                                                                        fetchAnalyticsData(
                                                                            compareDevice2, 
                                                                            filteredValue.length > 0 ? filteredValue : ['flowrate', 'inlet_temperature', 'outlet_temperature'], 
                                                                            filterStartDate, 
                                                                            filterEndDate
                                                                        ).then(data => {
                                                                            setCompareChartData2(data);
                                                                        }).catch(err => {
                                                                            console.error('Error updating second comparison data:', err);
                                                                            setSnackbarMessage(err.message || 'Failed to update second comparison data');
                                                                            setSnackbarOpen(true);
                                                                        }).finally(() => {
                                                                            setCompareLoading2(false);
                                                                        });
                                                                    }
                                                                }}
                                                                label="Select Parameters"
                                                                renderValue={(selected) => (
                                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                                                                        {selected.slice(0, 2).map((value) => (
                                                                            <Chip
                                                                                key={value}
                                                                                label={parameterOptions.find(p => p.value === value)?.label || value.replace(/_/g, ' ')}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: '20px',
                                                                                    fontSize: '10px',
                                                                                    textTransform: 'capitalize'
                                                                                }}
                                                                            />
                                                                        ))}
                                                                        {selected.length > 2 && (
                                                                            <Chip
                                                                                label={`+${selected.length - 2} more`}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: '20px',
                                                                                    fontSize: '10px',
                                                                                    backgroundColor: '#0156a6',
                                                                                    color: '#fff',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                )}
                                                                MenuProps={
                                                                    {
                                                                        PaperProps: {
                                                                            style: { maxHeight: 300, width: 250 },
                                                                        },
                                                                    }
                                                                }
                                                            >
                                                                {parameterOptions.map((option) => (
                                                                    <MenuItem key={option.value} value={option.value}
                                                                        sx={{
                                                                            py: 0.2,
                                                                            px: 1,
                                                                            minHeight: '32px',
                                                                        }}>
                                                                        <Checkbox checked={selectedParameter3.indexOf(option.value) > -1}
                                                                            sx={{
                                                                                p: 0.5,
                                                                                mr: 0.5,
                                                                                transform: "scale(0.8)",
                                                                                '& .MuiSvgIcon-root': { fontSize: 20 }
                                                                            }} />
                                                                        <ListItemText primary={option.label}
                                                                            primaryTypographyProps={{
                                                                                fontSize: '12px',
                                                                                lineHeight: 1.2
                                                                            }}
                                                                            secondaryTypographyProps={{
                                                                                fontSize: '10px',
                                                                                color: 'text.secondary'
                                                                            }} />
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                                                        <Chart
                                                            options={getChartOptions(
                                                                processedCompareData2,
                                                                compareChartData2
                                                            )}
                                                            series={processedCompareData2.series}
                                                            type="line"
                                                            height={420}
                                                            width="100%"
                                                        />
                                                    </Box>
                                                </>
                                            ) : (
                                                <Alert severity="info" sx={{ m: 2 }}>No data available for comparison</Alert>
                                            )}
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Alert severity="info" sx={{ m: 2 }}>No data available for the selected parameters and date range</Alert>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    )
}

export default SolarAnalytics;