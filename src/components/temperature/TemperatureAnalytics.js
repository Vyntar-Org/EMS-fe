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
import { getTemperatureSlaves, getTemperatureAnalytics } from '../../auth/temperature/TemperatureAnalyticsApi';

// Updated parameter options to match the API response
const parameterOptions = [
    { value: "temperature", label: "Temperature (°C)" },
    { value: "humidity", label: "Humidity (RH)" },
    { value: "battery", label: "Battery (V)" },
];

const TemperatureAnalytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
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

    // Fetch devices from API
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await getTemperatureSlaves();
                if (response.success && response.data.slaves) {
                    // Store full device objects for ID mapping
                    setDeviceObjects(response.data.slaves);
                    // Transform the slave list to the format expected by the dropdown
                    const deviceNames = response.data.slaves.map(slave => slave.slave_name);
                    setDevices(['all', ...deviceNames]); // Add 'all' as the first option
                }
            } catch (error) {
                console.error('Error fetching devices:', error);
                // Fallback to dummy devices if API fails
                const dummyDevices = [
                    { id: 7, slave_name: 'Compliance Room' },
                    { id: 8, slave_name: 'Executive Room' },
                    { id: 9, slave_name: 'Production Area' },
                    { id: 10, slave_name: 'IT Cabin' }
                ];
                setDeviceObjects(dummyDevices);
                const deviceNames = dummyDevices.map(slave => slave.slave_name);
                setDevices(['all', ...deviceNames]);
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

    // Fetch analytics data from API when search is clicked
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (searchClicked && filterDevice && filterDevice !== 'all' && filterStartDate && filterEndDate) {
                try {
                    setLoading(true);

                    // Find the device ID based on the device name
                    console.log('Looking for device:', filterDevice);
                    console.log('Available devices:', deviceObjects);
                    const selectedDevice = deviceObjects.find(device => device.slave_name === filterDevice);
                    console.log('Found device:', selectedDevice);
                    if (!selectedDevice) {
                        setError(`Device '${filterDevice}' not found in device list`);
                        console.error('Device not found. Filter device:', filterDevice, 'Device objects:', deviceObjects);
                        return;
                    }

                    // Format dates for API
                    const formattedStartDate = dayjs(filterStartDate).format('YYYY-MM-DD HH:mm:ss');
                    const formattedEndDate = dayjs(filterEndDate).format('YYYY-MM-DD HH:mm:ss');

                    // Default to all parameters if none selected
                    const params = selectedParameter.length > 0 ? selectedParameter : ['temperature', 'humidity', 'battery'];

                    console.log('Fetching analytics with params:', {
                        slave_id: selectedDevice.slave_id,
                        parameters: params,
                        from_datetime: formattedStartDate,
                        to_datetime: formattedEndDate
                    });

                    // Fetch analytics data
                    const response = await getTemperatureAnalytics(
                        selectedDevice.slave_id,
                        params,
                        formattedStartDate,
                        formattedEndDate
                    );

                    console.log('API Response:', response);

                    if (response.success && response.data.data) {
                        setFilteredChartData(response.data.data);
                        setError(null);
                    } else {
                        setError('Failed to fetch analytics data');
                    }
                } catch (err) {
                    console.error('Error fetching analytics data:', err);
                    setError(err.message || 'Failed to fetch analytics data');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAnalyticsData();
    }, [searchClicked, filterDevice, filterStartDate, filterEndDate, selectedParameter, deviceObjects]);

    // Fetch comparison data when compare mode is active
    useEffect(() => {
        const fetchCompareData = async () => {
            if (compareMode && compareDevice && filterStartDate && filterEndDate) {
                try {
                    // Find the device ID based on the device name
                    console.log('Looking for compare device:', compareDevice);
                    console.log('Available devices:', deviceObjects);
                    const selectedDevice = deviceObjects.find(device => device.slave_name === compareDevice);
                    console.log('Found compare device:', selectedDevice);
                    if (!selectedDevice) {
                        console.error('Comparison device not found. Compare device:', compareDevice, 'Device objects:', deviceObjects);
                        return;
                    }

                    // Format dates for API
                    const formattedStartDate = dayjs(filterStartDate).format('YYYY-MM-DD HH:mm:ss');
                    const formattedEndDate = dayjs(filterEndDate).format('YYYY-MM-DD HH:mm:ss');

                    // Default to all parameters if none selected
                    const params = selectedParameter2.length > 0 ? selectedParameter2 : ['temperature', 'humidity', 'battery'];

                    // Fetch analytics data
                    const response = await getTemperatureAnalytics(
                        selectedDevice.slave_id,
                        params,
                        formattedStartDate,
                        formattedEndDate
                    );

                    if (response.success && response.data.data) {
                        setCompareChartData(response.data.data);
                    } else {
                        console.error('Failed to fetch comparison data');
                    }
                } catch (err) {
                    console.error('Error fetching comparison data:', err);
                }
            }
        };

        fetchCompareData();
    }, [compareMode, compareDevice, filterStartDate, filterEndDate, selectedParameter2, deviceObjects]);

    // Fetch second comparison data when second compare mode is active
    useEffect(() => {
        const fetchCompareData2 = async () => {
            if (compareMode2 && compareDevice2 && filterStartDate && filterEndDate) {
                try {
                    // Find the device ID based on the device name
                    console.log('Looking for second compare device:', compareDevice2);
                    console.log('Available devices:', deviceObjects);
                    const selectedDevice = deviceObjects.find(device => device.slave_name === compareDevice2);
                    console.log('Found second compare device:', selectedDevice);
                    if (!selectedDevice) {
                        console.error('Second comparison device not found. Compare device2:', compareDevice2, 'Device objects:', deviceObjects);
                        return;
                    }

                    // Format dates for API
                    const formattedStartDate = dayjs(filterStartDate).format('YYYY-MM-DD HH:mm:ss');
                    const formattedEndDate = dayjs(filterEndDate).format('YYYY-MM-DD HH:mm:ss');

                    // Default to all parameters if none selected
                    const params = selectedParameter3.length > 0 ? selectedParameter3 : ['temperature', 'humidity', 'battery'];

                    // Fetch analytics data
                    const response = await getTemperatureAnalytics(
                        selectedDevice.slave_id,
                        params,
                        formattedStartDate,
                        formattedEndDate
                    );

                    if (response.success && response.data.data) {
                        setCompareChartData2(response.data.data);
                    } else {
                        console.error('Failed to fetch second comparison data');
                    }
                } catch (err) {
                    console.error('Error fetching second comparison data:', err);
                }
            }
        };

        fetchCompareData2();
    }, [compareMode2, compareDevice2, filterStartDate, filterEndDate, selectedParameter3, deviceObjects]);

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
            : ['temperature', 'humidity', 'battery']; // Default to all parameters

        console.log('Parameters to process:', parametersToProcess);

        parametersToProcess.forEach(param => {
            // Extract values from the filtered data based on selected parameter and format to 2 decimal places
            const values = filteredChartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'humidity':
                            value = parseFloat(item.humidity) || 0;
                            break;
                        case 'battery':
                            value = parseFloat(item.battery) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (temperature)
                    value = parseFloat(item.temperature) || 0;
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
            : ['temperature', 'humidity', 'battery']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the comparison data based on selected parameter and format to 2 decimal places
            const values = compareChartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'humidity':
                            value = parseFloat(item.humidity) || 0;
                            break;
                        case 'battery':
                            value = parseFloat(item.battery) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (temperature)
                    value = parseFloat(item.temperature) || 0;
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
            : ['temperature', 'humidity', 'battery']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the second comparison data based on selected parameter and format to 2 decimal places
            const values = compareChartData2.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'humidity':
                            value = parseFloat(item.humidity) || 0;
                            break;
                        case 'battery':
                            value = parseFloat(item.battery) || 0;
                            break;
                        default:
                            value = 0;
                    }
                } else {
                    // If no parameter selected, use the default logic (temperature)
                    value = parseFloat(item.temperature) || 0;
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
        <Box style={styles.mainContent} id="main-content">
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
                                <FormControl size="small" sx={{ minWidth: 200, mr: 1 }}>
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
                                        <MenuItem value="all">
                                            <Checkbox checked={selectedParameter.length === 0} />
                                            <ListItemText primary="All Parameters" />
                                        </MenuItem>
                                        {parameterOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox checked={selectedParameter.indexOf(option.value) > -1} />
                                                <ListItemText primary={option.label} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                        open={openStart}
                                        onOpen={() => setOpenStart(true)}
                                        onClose={() => setOpenStart(false)}
                                        value={dayjs.isDayjs(filterStartDate) ? filterStartDate : null}
                                        onChange={(newValue) => setFilterStartDate(newValue)}
                                        format="DD/MM/YYYY hh:mm A"
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                sx: { minWidth: 220, mr: 2, borderRadius: 2 },
                                                onClick: () => setOpenStart(true), // 🔥 input click opens picker
                                            },
                                        }}
                                    />
                                </LocalizationProvider>


                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                        open={openEnd}
                                        onOpen={() => setOpenEnd(true)}
                                        onClose={() => setOpenEnd(false)}
                                        value={
                                            filterEndDate
                                                ? dayjs.isDayjs(filterEndDate)
                                                    ? filterEndDate
                                                    : dayjs(filterEndDate)
                                                : null
                                        }
                                        onChange={(newValue) => setFilterEndDate(newValue)}
                                        format="DD/MM/YYYY hh:mm A"
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                sx: { minWidth: 220, mr: 2, borderRadius: 2 },
                                                onClick: () => setOpenEnd(true), // 🔥 input click opens picker
                                            },
                                        }}
                                    />
                                </LocalizationProvider>


                                <Button
                                    variant="contained"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    sx={{
                                        backgroundColor: '#0156a6',
                                        '&:hover': {
                                            backgroundColor: '#166aa0',
                                        },
                                        minWidth: 'auto',
                                        width: '32px', // Smaller width
                                        height: '32px', // Smaller height
                                        padding: '6px', // Even smaller padding
                                        borderRadius: '4px', // Square with rounded corners
                                        '& .MuiButton-startIcon': {
                                            margin: 0,
                                        }
                                    }}
                                >
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => {
                                        handleResetFilters();
                                        setSelectedParameter([]); // Reset main chart parameter
                                        setSelectedParameter2([]); // Reset first comparison parameter
                                        setSelectedParameter3([]); // Reset second comparison parameter
                                        setFilterDevice2('all'); // Reset first comparison machine
                                        setFilterDevice3('all'); // Reset second comparison machine
                                        setCompareParameter(''); // Reset first comparison parameter
                                        setCompareParameter2(''); // Reset second comparison parameter
                                    }}
                                    sx={{
                                        borderColor: '#6c757d',
                                        color: '#6c757d',
                                        '&:hover': {
                                            borderColor: '#5a6268',
                                            color: '#5a6268',
                                        },
                                        minWidth: 'auto',
                                        width: '32px', // Smaller width
                                        height: '32px', // Smaller height
                                        padding: '4px', // Even smaller padding
                                        borderRadius: '4px',
                                        '& .MuiButton-startIcon': {
                                            margin: 0,
                                        }
                                    }}
                                >
                                </Button>
                            </Box>
                        </Box>
                        {loading ? (
                            <div></div>
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
                                            {Array.isArray(selectedParameter) && selectedParameter.length > 0
                                                ? `${filterDevice} - ${selectedParameter.length > 1
                                                    ? `${selectedParameter.length} Parameters Selected`
                                                    : parameterOptions.find(opt => opt.value === selectedParameter[0])?.label || selectedParameter[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                : (filterDevice !== 'all' ? `${filterDevice}` : 'Temperature Analytics')}
                                        </Typography>
                                        <Box>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}></Box>
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
                                                {Array.isArray(selectedParameter2) && selectedParameter2.length > 0
                                                    ? `${compareDevice} - ${selectedParameter2.length > 1
                                                        ? `${selectedParameter2.length} Parameters Selected`
                                                        : parameterOptions.find(opt => opt.value === selectedParameter2[0])?.label || selectedParameter2[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                    : compareDevice}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <FormControl size="small" sx={{ minWidth: 300 }}>
                                                        <InputLabel>Select Machine</InputLabel>
                                                        <Select
                                                            value={compareDevice}
                                                            label="Select Machine"
                                                            onChange={(e) => {
                                                                setCompareDevice(e.target.value);
                                                                // Set compare mode to true when machine is selected
                                                                setCompareMode(true);
                                                            }}
                                                        >
                                                            {devices.map((device) => (
                                                                <MenuItem key={device} value={device}>
                                                                    {device === 'all' ? 'Select Machine' : device}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl size="small" sx={{ minWidth: 200, mr: 1 }}>
                                                        <InputLabel>Select Parameters</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={selectedParameter2}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                // If "All Parameters" is selected, clear all other selections
                                                                if (value.includes('all')) {
                                                                    setSelectedParameter2([]);
                                                                } else {
                                                                    // Remove "all" from selection if other items are selected
                                                                    const filteredValue = value.filter(item => item !== 'all');
                                                                    setSelectedParameter2(filteredValue);
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
                                                            <MenuItem value="all">
                                                                <Checkbox checked={selectedParameter2.length === 0} />
                                                                <ListItemText primary="All Parameters" />
                                                            </MenuItem>
                                                            {parameterOptions.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    <Checkbox checked={selectedParameter2.indexOf(option.value) > -1} />
                                                                    <ListItemText primary={option.label} />
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
                                                {Array.isArray(selectedParameter3) && selectedParameter3.length > 0
                                                    ? `${compareDevice2} - ${selectedParameter3.length > 1
                                                        ? `${selectedParameter3.length} Parameters Selected`
                                                        : parameterOptions.find(opt => opt.value === selectedParameter3[0])?.label || selectedParameter3[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                    : compareDevice2}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                <FormControl size="small" sx={{ minWidth: 300 }}>
                                                    <InputLabel>Select Machine</InputLabel>
                                                    <Select
                                                        value={compareDevice2}
                                                        label="Select Machine"
                                                        onChange={(e) => {
                                                            setCompareDevice2(e.target.value);
                                                            // Set compare mode to true when machine is selected
                                                            setCompareMode2(true);
                                                        }}
                                                    >
                                                        {devices.map((device) => (
                                                            <MenuItem key={device} value={device}>
                                                                {device === 'all' ? 'Select Machine' : device}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                                    <InputLabel>Select Parameters</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={selectedParameter3}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            // If "All Parameters" is selected, clear all other selections
                                                            if (value.includes('all')) {
                                                                setSelectedParameter3([]);
                                                            } else {
                                                                // Remove "all" from selection if other items are selected
                                                                const filteredValue = value.filter(item => item !== 'all');
                                                                setSelectedParameter3(filteredValue);
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
                                                        <MenuItem value="all">
                                                            <Checkbox checked={selectedParameter3.length === 0} />
                                                            <ListItemText primary="All Parameters" />
                                                        </MenuItem>
                                                        {parameterOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                <Checkbox checked={selectedParameter3.indexOf(option.value) > -1} />
                                                                <ListItemText primary={option.label} />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
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
        </Box>
    )
}

export default TemperatureAnalytics;