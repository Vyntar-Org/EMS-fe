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
import { fetchFireSafetySlaves, fetchFireSafetyAnalytics } from '../../auth/fire-safety/FireSafetyAnalyticsApi';

// Updated parameter options to match the API response
const parameterOptions = [
    { value: "temperature", label: "Temperature (°C)" },
    { value: "water_level", label: "Water Level" },
];

const FireSafetyAnalytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    // Initialize with default dates - 7 days ago to today
    const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'day'));
    const [filterEndDate, setFilterEndDate] = useState(dayjs());
    const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
    const [devices, setDevices] = useState(['all']); // Initialize with 'all' as default
    const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const [error, setError] = useState(null); // Error state for API calls
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
            paddingRight: { xs: '5px', sm: '15px' },    
            paddingLeft: { xs: '5px', sm: '15px' },
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
        // Chart container styles with toolbar fixes
        chartContainer: {
            width: '100%',
            overflow: 'visible',
            '& .apexcharts-toolbar': {
                display: 'flex !important',
                alignItems: 'center !important',
                gap: '4px !important',
                padding: '4px 8px !important',
                background: 'transparent !important',
                border: 'none !important',
                marginTop: {xs: '40px', sm: '0px', md:'0px'}
            },
            '& .apexcharts-menu': {
                minWidth: '140px',
            },
            '& .apexcharts-menu-item': {
                padding: '6px 12px',
                fontSize: '12px',
            },
            // Hide the default download icon SVG and show only the menu icon
            '& .apexcharts-toolbar .apexcharts-download-icon svg': {
                display: 'none !important',
            },
            '& .apexcharts-toolbar .apexcharts-download-icon': {
                '&::after': {
                    content: '""',
                    display: 'block',
                    width: '16px',
                    height: '14px',
                    background: `repeating-linear-gradient(
                        to bottom,
                        #666,
                        #666 2px,
                        transparent 2px,
                        transparent 4px
                    )`,
                    borderRadius: '2px',
                    marginTop: '1px',
                    cursor: 'pointer',
                }
            }
        }
    };

    // Initialize devices from API
    useEffect(() => {
        const loadSlaves = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetchFireSafetySlaves();
                
                if (response.success && response.data?.slaves) {
                    setDeviceObjects(response.data.slaves);
                    const deviceNames = response.data.slaves.map(device => device.slave_name);
                    setDevices(['all', ...deviceNames]);
                    
                    // Set default device to the first one (not 'all')
                    if (response.data.slaves.length > 0) {
                        setFilterDevice(response.data.slaves[0].slave_name);
                    }
                } else {
                    setError('Failed to load fire safety slaves');
                }
            } catch (err) {
                console.error('Error loading slaves:', err);
                setError('Failed to load fire safety slaves: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadSlaves();
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
        // Reset to default dates
        setFilterStartDate(dayjs().subtract(1, 'day'));
        setFilterEndDate(dayjs());
        setSearchClicked(false); // Reset search state
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

    // Fetch analytics data when search is clicked
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (searchClicked && filterDevice && filterDevice !== 'all' && filterStartDate && filterEndDate) {
                try {
                    setLoading(true);
                    setError(null);
                    
                    // Find the device ID based on the device name
                    const selectedDevice = deviceObjects.find(device => device.slave_name === filterDevice);
                    if (!selectedDevice) {
                        throw new Error('Device not found');
                    }

                    // Default to all parameters if none selected
                    const params = selectedParameter.length > 0 ? selectedParameter : ['temperature', 'water_level'];

                    // Fetch analytics data from API
                    const response = await fetchFireSafetyAnalytics(
                        selectedDevice.slave_id,
                        params,
                        filterStartDate.toDate(),
                        filterEndDate.toDate()
                    );

                    if (response.success && response.data) {
                        setFilteredChartData(response.data);
                    } else {
                        throw new Error(response.message || 'Failed to fetch analytics data');
                    }
                } catch (err) {
                    console.error('Error fetching analytics data:', err);
                    setError(err.message || 'Failed to fetch analytics data');
                    setFilteredChartData([]);
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
                    setLoading(true);
                    setError(null);
                    
                    // Find the device ID based on the device name
                    const selectedDevice = deviceObjects.find(device => device.slave_name === compareDevice);
                    if (!selectedDevice) {
                        throw new Error('Comparison device not found');
                    }

                    // Default to all parameters if none selected
                    const params = selectedParameter2.length > 0 ? selectedParameter2 : ['temperature', 'water_level'];

                    // Fetch analytics data from API
                    const response = await fetchFireSafetyAnalytics(
                        selectedDevice.slave_id,
                        params,
                        filterStartDate.toDate(),
                        filterEndDate.toDate()
                    );

                    if (response.success && response.data) {
                        setCompareChartData(response.data);
                    } else {
                        throw new Error(response.message || 'Failed to fetch comparison data');
                    }
                } catch (err) {
                    console.error('Error fetching comparison data:', err);
                    setError(err.message || 'Failed to fetch comparison data');
                    setCompareChartData([]);
                } finally {
                    setLoading(false);
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
                    setLoading(true);
                    setError(null);
                    
                    // Find the device ID based on the device name
                    const selectedDevice = deviceObjects.find(device => device.slave_name === compareDevice2);
                    if (!selectedDevice) {
                        throw new Error('Second comparison device not found');
                    }

                    // Default to all parameters if none selected
                    const params = selectedParameter3.length > 0 ? selectedParameter3 : ['temperature', 'water_level'];

                    // Fetch analytics data from API
                    const response = await fetchFireSafetyAnalytics(
                        selectedDevice.slave_id,
                        params,
                        filterStartDate.toDate(),
                        filterEndDate.toDate()
                    );

                    if (response.success && response.data) {
                        setCompareChartData2(response.data);
                    } else {
                        throw new Error(response.message || 'Failed to fetch second comparison data');
                    }
                } catch (err) {
                    console.error('Error fetching second comparison data:', err);
                    setError(err.message || 'Failed to fetch second comparison data');
                    setCompareChartData2([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCompareData2();
    }, [compareMode2, compareDevice2, filterStartDate, filterEndDate, selectedParameter3, deviceObjects]);

    // Process the filtered chart data to create chart series and categories
    const processedFilteredData = React.useMemo(() => {
        console.log('Processing filtered chart data:', filteredChartData);
        console.log('Selected parameter:', selectedParameter);

        // Handle API response structure - data might be in filteredChartData.data
        const chartData = filteredChartData?.data || filteredChartData;
        
        if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
            console.log('No filtered chart data available');
            return { series: [], categories: [] };
        }

        console.log('Chart data length:', chartData.length);
        console.log('First data item:', chartData[0]);

        // Process the filtered data to extract timestamps and values
        const categories = chartData.map(item => {
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
            : ['temperature', 'water_level']; // Default to all parameters

        console.log('Parameters to process:', parametersToProcess);

        parametersToProcess.forEach(param => {
            // Extract values from the filtered data based on selected parameter and format to 2 decimal places
            const values = chartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'water_level':
                            value = parseFloat(item.water_level) || 0;
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
            if (chartData.length > 0) {
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
        console.log('Series length:', series.length);
        console.log('Categories length:', categories.length);

        // Validate data before returning
        if (series.length === 0 || categories.length === 0) {
            console.log('Warning: Empty series or categories');
            return { series: [], categories: [] };
        }
        
        // Ensure all series have the same length as categories
        const validSeries = series.map(s => ({
            ...s,
            data: s.data.slice(0, categories.length)
        }));
        
        console.log('Final processed data:', { series: validSeries, categories });
        
        return { series: validSeries, categories };
    }, [filteredChartData, filterDevice, selectedParameter]);

    // Process the comparison chart data to create chart series and categories
    const processedCompareData = React.useMemo(() => {
        // Handle API response structure - data might be in compareChartData.data
        const chartData = compareChartData?.data || compareChartData;
        
        if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
            return { series: [], categories: [] };
        }

        // Process the comparison data to extract timestamps and values
        const categories = chartData.map(item => {
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
            : ['temperature', 'water_level']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the comparison data based on selected parameter and format to 2 decimal places
            const values = chartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'water_level':
                            value = parseFloat(item.water_level) || 0;
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
            if (chartData.length > 0) {
                const parameterLabel = param
                    ? parameterOptions.find(opt => opt.value === param)?.label || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : compareDevice;
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        // Validate data before returning
        if (series.length === 0 || categories.length === 0) {
            console.log('Warning: Empty comparison series or categories');
            return { series: [], categories: [] };
        }
        
        // Ensure all series have the same length as categories
        const validSeries = series.map(s => ({
            ...s,
            data: s.data.slice(0, categories.length)
        }));
        
        return { series: validSeries, categories };
    }, [compareChartData, compareDevice, selectedParameter2, filterDevice2]);

    // Process the second comparison chart data to create chart series and categories
    const processedCompareData2 = React.useMemo(() => {
        // Handle API response structure - data might be in compareChartData2.data
        const chartData = compareChartData2?.data || compareChartData2;
        
        if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
            return { series: [], categories: [] };
        }

        // Process the second comparison data to extract timestamps and values
        const categories = chartData.map(item => {
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
            : ['temperature', 'water_level']; // Default to all parameters

        parametersToProcess.forEach(param => {
            // Extract values from the second comparison data based on selected parameter and format to 2 decimal places
            const values = chartData.map((item, index) => {
                let value = 0;

                // If a specific parameter is selected, use that field
                if (param) {
                    switch (param) {
                        case 'temperature':
                            value = parseFloat(item.temperature) || 0;
                            break;
                        case 'water_level':
                            value = parseFloat(item.water_level) || 0;
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
            if (chartData.length > 0) {
                const parameterLabel = param
                    ? parameterOptions.find(opt => opt.value === param)?.label || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : compareDevice2;
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        // Validate data before returning
        if (series.length === 0 || categories.length === 0) {
            console.log('Warning: Empty second comparison series or categories');
            return { series: [], categories: [] };
        }
        
        // Ensure all series have the same length as categories
        const validSeries = series.map(s => ({
            ...s,
            data: s.data.slice(0, categories.length)
        }));
        
        return { series: validSeries, categories };
    }, [compareChartData2, compareDevice2, selectedParameter3, filterDevice3]);

    // Debug useEffect to monitor state changes
    useEffect(() => {
        console.log('=== State Debug Info ===');
        console.log('searchClicked:', searchClicked);
        console.log('filteredChartData:', filteredChartData);
        console.log('filteredChartData.data:', filteredChartData?.data);
        console.log('filteredChartData.data.length:', filteredChartData?.data?.length);
        console.log('filteredChartData length:', filteredChartData?.length);
        console.log('processedFilteredData:', processedFilteredData);
        console.log('processedFilteredData.series:', processedFilteredData.series);
        console.log('processedFilteredData.series.length:', processedFilteredData.series?.length);
        console.log('processedFilteredData.categories.length:', processedFilteredData.categories?.length);
        console.log('selectedParameter:', selectedParameter);
        console.log('========================');
    }, [searchClicked, filteredChartData, processedFilteredData, selectedParameter]);

    // Define colors for each series to match the dots in the image
    const seriesColors = ['#d32f2f', '#1976d2', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

    // Dynamic chart configuration function
    const getChartOptions = (currentProcessedData, currentData) => {
        // Handle API response structure - data might be in currentData.data
        const chartData = currentData?.data || currentData;
        
        return {
            chart: {
                type: 'line',
                height: 420,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,     // This shows the menu button (required for menu to work)
                        selection: false,   // Hide selection tool
                        zoom: true,         // Magnifying glass icon
                        zoomin: true,       // Circle with plus icon
                        zoomout: true,      // Circle with minus icon
                        pan: true,          // Hand icon
                        reset: true,        // House icon
                        customIcons: []     // Remove any custom icons
                    },
                    autoSelected: 'zoom'
                },
                zoom: {
                    enabled: true,
                    type: 'x',
                    autoScaleYaxis: false,
                    zoomedArea: {
                        fill: {
                            color: '#90CAF9',
                            opacity: 0.4
                        },
                        stroke: {
                            color: '#0D47A1',
                            opacity: 0.8,
                            width: 1
                        }
                    }
                },
                pan: {
                    enabled: true,
                    type: 'x',
                    autoScaleYaxis: false
                },
                animations: {
                    enabled: false
                },
                background: '#FFFFFF',
            },
            // Export configuration - controls what appears in the menu dropdown
            export: {
                enabled: true,
                csv: {
                    filename: 'fire-safety-analytics',
                    columnDelimiter: ',',
                    headerCategory: 'category',
                    headerValue: 'value',
                    dateFormatter: function(timestamp) {
                        return new Date(timestamp).toDateString();
                    }
                },
                svg: {
                    filename: 'fire-safety-analytics',
                },
                png: {
                    filename: 'fire-safety-analytics',
                }
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
                tickAmount: Math.min(6, currentProcessedData.categories.length),
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

                    if (chartData && chartData.length > 0 && dataPointIndex < chartData.length) {
                        // For filtered data, use timestamp from chartData
                        const item = chartData[dataPointIndex];
                        const timestamp = item?.timestamp || item?.created_at || item?.date || '';
                        if (timestamp) {
                            const date = new Date(timestamp);
                            originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                        }
                    }

                    // Build the tooltip content
                    let tooltipContent = `<div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 14px; padding: 10px; background-color: #f4f7f6">${originalDate}</div>`;

                    // Add each series with its color dot and value
                    w.globals.seriesNames.forEach((name, index) => {
                        const value = series[index][dataPointIndex];
                        const color = seriesColors[index % seriesColors.length];
                        
                        tooltipContent += `
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
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
                        {/* Loading indicator */}
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Loading data...
                                </Typography>
                            </Box>
                        )}
                        
                        {/* Error message */}
                        {error && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                <Typography variant="body2" color="error">
                                    Error: {error}
                                </Typography>
                            </Box>
                        )}
                        
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
                                        disabled={loading}
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
                                        disabled={loading}
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
                                            disabled={loading}
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
                                            disabled={loading}
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
                                        disabled={loading}
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
                                            setSelectedParameter([]);
                                            setSelectedParameter2([]);
                                            setSelectedParameter3([]);
                                            setFilterDevice2('all');
                                            setFilterDevice3('all');
                                            setCompareParameter('');
                                            setCompareParameter2('');
                                            setError(null);
                                        }}
                                        disabled={loading}
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
                            </Box>
                        </Box>
                        {searchClicked ? (
                            processedFilteredData.series.length > 0 && processedFilteredData.categories.length > 0 ? (
                                <>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', md: 'row' }, // Changed sm to md
                                        justifyContent: 'space-between', 
                                        alignItems: { xs: 'flex-start', md: 'center' }, // Changed sm to md
                                        mb: 1,
                                        gap: { xs: 1, md: 0 } // Changed sm to md
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
                                                : (filterDevice !== 'all' ? `${filterDevice}` : 'Fire Safety Analytics')}
                                        </Typography>
                                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}> {/* Changed sm to md */}
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', md: 'row' }, // Changed sm to md
                                                gap: { xs: 1, md: 2 }, 
                                                alignItems: { xs: 'stretch', md: 'center' } 
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
                                                            mr: { md: 1 }, // Changed sm to md
                                                            width: { xs: '100%', md: 'auto' } // Changed sm to md
                                                        }}
                                                    >
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl 
                                                        size="small" 
                                                        sx={{ 
                                                            minWidth: { xs: '100%', md: 300 }, // Changed sm to md
                                                            width: { xs: '100%', md: 'auto' }
                                                        }}
                                                    >
                                                        <InputLabel>Select Device to Compare</InputLabel>
                                                        <Select
                                                            value={compareDevice}
                                                            label="Select Device to Compare"
                                                            onChange={(e) => {
                                                                setCompareDevice(e.target.value);
                                                                setCompareMode(true);
                                                            }}
                                                            disabled={loading}
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
                                    {/* Main Chart */}
                                    <Box sx={styles.chartContainer}>
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
                                    {compareMode && compareDevice && processedCompareData.series.length > 0 && (
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
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', md: 'row' }, // Changed sm to md
                                                justifyContent: 'flex-end',
                                                gap: { xs: 1, md: 0 }, // Changed sm to md
                                                mb: 2
                                            }}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: { xs: 'column', md: 'row' }, // Changed sm to md
                                                    gap: { xs: 1, md: 2 }, 
                                                    alignItems: { xs: 'stretch', md: 'center' }, // Changed sm to md
                                                    width: { xs: '100%', md: 'auto' } // Changed sm to md
                                                }}>
                                                    <FormControl 
                                                        size="small" 
                                                        sx={{ 
                                                            minWidth: { xs: '100%', md: 300 }, // Changed sm to md
                                                            width: { xs: '100%', md: 'auto' }
                                                        }}
                                                    >
                                                        <InputLabel>Select Device</InputLabel>
                                                        <Select
                                                            value={compareDevice}
                                                            label="Select Device"
                                                            onChange={(e) => {
                                                                setCompareDevice(e.target.value);
                                                                setCompareMode(true);
                                                            }}
                                                            disabled={loading}
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
                                                            minWidth: { xs: '100%', md: 200 }, // Changed sm to md
                                                            mr: { md: 1 }, // Changed sm to md
                                                            width: { xs: '100%', md: 'auto' } // Changed sm to md
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
                                                            }}
                                                            label="Select Parameters"
                                                            disabled={loading}
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
                                                                width: { xs: '100%', md: 'auto' } // Changed sm to md
                                                            }}
                                                        >
                                                            Cancel Compare
                                                        </Button>
                                                    ) : (
                                                        <FormControl 
                                                            size="small" 
                                                            sx={{ 
                                                                minWidth: { xs: '100%', md: 300 }, // Changed sm to md
                                                                width: { xs: '100%', md: 'auto' }
                                                            }}
                                                        >
                                                            <InputLabel>Select Second Device to Compare</InputLabel>
                                                            <Select
                                                                value={compareDevice2}
                                                                label="Select Second Device to Compare"
                                                                onChange={(e) => {
                                                                    setCompareDevice2(e.target.value);
                                                                    setCompareMode2(true);
                                                                }}
                                                                disabled={loading}
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
                                            {/* Comparison Chart 1 */}
                                            <Box sx={styles.chartContainer}>
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
                                        </Box>
                                    )}
                                    {compareMode2 && compareDevice2 && processedCompareData2.series.length > 0 && (
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
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', md: 'row' }, // Changed sm to md
                                                gap: { xs: 1, md: 2 }, // Changed sm to md
                                                justifyContent: 'flex-end',
                                                mb: 2
                                            }}>
                                                <FormControl 
                                                    size="small" 
                                                    sx={{ 
                                                        minWidth: { xs: '100%', md: 300 }, // Changed sm to md
                                                        width: { xs: '100%', md: 'auto' }
                                                    }}
                                                >
                                                    <InputLabel>Select Device</InputLabel>
                                                    <Select
                                                        value={compareDevice2}
                                                        label="Select Device"
                                                        onChange={(e) => {
                                                            setCompareDevice2(e.target.value);
                                                            setCompareMode2(true);
                                                        }}
                                                        disabled={loading}
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
                                                        minWidth: { xs: '100%', md: 200 }, // Changed sm to md
                                                        width: { xs: '100%', md: 'auto' }
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
                                                        }}
                                                        label="Select Parameters"
                                                        disabled={loading}
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
                                            {/* Comparison Chart 2 */}
                                            <Box sx={styles.chartContainer}>
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
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <div></div>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
}

export default FireSafetyAnalytics;