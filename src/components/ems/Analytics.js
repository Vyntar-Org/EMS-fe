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
    Divider,
    CircularProgress,
    Alert,
    Snackbar
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
import { getEnergyAnalytics, getDevices } from '../../auth/AnalyticsApi';

const Analytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'day'));
    const [filterEndDate, setFilterEndDate] = useState(dayjs());
    const [searchClicked, setSearchClicked] = useState(false);
    const [devices, setDevices] = useState(['all']);
    const [deviceObjects, setDeviceObjects] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState([]);
    const [selectedParameter2, setSelectedParameter2] = useState([]);
    const [selectedParameter3, setSelectedParameter3] = useState([]);
    const [compareDevice, setCompareDevice] = useState('');
    const [compareDevice2, setCompareDevice2] = useState('');
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareLoading2, setCompareLoading2] = useState(false);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [compareMode, setCompareMode] = useState(false);
    const [compareChartData, setCompareChartData] = useState([]);
    const [compareMode2, setCompareMode2] = useState(false);
    const [compareChartData2, setCompareChartData2] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);

    // Define parameter categories with their associated parameters
    const parameterCategories = {
        'Timestamp': {
            parameters: ['timestamp'],
            label: 'Timestamp'
        },
        'Active power': {
            parameters: ['actpr_t'],
            label: 'Active Power (kW)'
        },
        'Apparent power': {
            parameters: ['apppr_t'],
            label: 'Apparent Power (kVA)'
        },
        'Energy': {
            parameters: ['acte_im', 'reacte_im'],
            label: 'Energy'
        },
        'Power factor': {
            parameters: ['pf_t'],
            label: 'Power Factor'
        },
        'Frequency': {
            parameters: ['fq'],
            label: 'Frequency (Hz)'
        },
        'Voltage (Line to Neutral)': {
            parameters: ['rv', 'yv', 'bv'],
            label: 'Voltage (Line to Neutral)'
        },
        'Voltage (Line to Line)': {
            parameters: ['ry_v', 'yb_v', 'br_v', 'avg_l_l_v'],
            label: 'Voltage (Line to Line)'
        },
        'Current': {
            parameters: ['i_b', 'i_r', 'i_y', 'avg_i'],
            label: 'Current (A)'
        }
    };

    // Get all available parameters for easy reference
    const allParameters = Object.values(parameterCategories).flatMap(category => category.parameters);

    // Parameter label mapping for display
    const parameterLabels = {
        'timestamp': 'Timestamp',
        'actpr_t': 'Active Power (kW)',
        'apppr_t': 'Apparent Power (kVA)',
        'acte_im': 'Active Energy Import (kWh)',
        'reacte_im': 'Reactive Energy Import (kVArh)',
        'pf_t': 'Power Factor',
        'fq': 'Frequency (Hz)',
        'rv': 'R Phase Voltage (V)',
        'yv': 'Y Phase Voltage (V)',
        'bv': 'B Phase Voltage (V)',
        'ry_v': 'R-Y Voltage (V)',
        'yb_v': 'Y-B Voltage (V)',
        'br_v': 'B-R Voltage (V)',
        'avg_l_l_v': 'Avg Line-to-Line Voltage (V)',
        'i_b': 'B Phase Current (A)',
        'i_r': 'R Phase Current (A)',
        'i_y': 'Y Phase Current (A)',
        'avg_i': 'Average Current (A)'
    };

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
            padding: { xs: '0px', sm: '0' },
        },
        blockHeader: {
            padding: { xs: '0px 0', sm: '10px 0' },
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
        // Chart container styles
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
                marginTop: {xs: '220px', sm: '100px', md:'70px'}
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

    // Fetch devices from API
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);
                const slaves = await getDevices();
                setDeviceObjects(slaves);
                const deviceNames = slaves.map(slave => slave.slave_name);
                setDevices(['all', ...deviceNames]);
                
                if (slaves.length > 0) {
                    setFilterDevice(slaves[0].slave_name);
                }
            } catch (error) {
                console.error('Error fetching devices:', error);
                setError(error.message || 'Failed to fetch devices');
                setSnackbarMessage(error.message || 'Failed to fetch devices');
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    // Function to fetch analytics data for a specific device
    const fetchAnalyticsData = async (slaveId, parameters, startDate, endDate) => {
        try {
            const fromDatetime = dayjs(startDate).format('YYYY-MM-DD HH:mm:ss');
            const toDatetime = dayjs(endDate).format('YYYY-MM-DD HH:mm:ss');
            const data = await getEnergyAnalytics(slaveId, parameters, fromDatetime, toDatetime);
            return data;
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
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
            
            const selectedDevice = deviceObjects.find(device => device.slave_name === filterDevice);
            if (!selectedDevice) {
                setError(`Device '${filterDevice}' not found`);
                return;
            }
            
            const params = selectedParameter.length > 0 ? selectedParameter : allParameters;
            
            const data = await fetchAnalyticsData(
                selectedDevice.slave_id,
                params,
                filterStartDate,
                filterEndDate
            );
            
            setFilteredChartData(data);
            
            if (compareMode && compareDevice) {
                setCompareLoading(true);
                try {
                    const compareDeviceObj = deviceObjects.find(device => device.slave_name === compareDevice);
                    if (compareDeviceObj) {
                        const compareParams = selectedParameter2.length > 0 ? selectedParameter2 : allParameters;
                        const compareData = await fetchAnalyticsData(
                            compareDeviceObj.slave_id,
                            compareParams,
                            filterStartDate,
                            filterEndDate
                        );
                        setCompareChartData(compareData);
                    }
                } catch (err) {
                    console.error('Error fetching comparison data:', err);
                    setSnackbarMessage(err.message || 'Failed to fetch comparison data');
                    setSnackbarOpen(true);
                } finally {
                    setCompareLoading(false);
                }
            }
            
            if (compareMode2 && compareDevice2) {
                setCompareLoading2(true);
                try {
                    const compareDevice2Obj = deviceObjects.find(device => device.slave_name === compareDevice2);
                    if (compareDevice2Obj) {
                        const compareParams2 = selectedParameter3.length > 0 ? selectedParameter3 : allParameters;
                        const compareData2 = await fetchAnalyticsData(
                            compareDevice2Obj.slave_id,
                            compareParams2,
                            filterStartDate,
                            filterEndDate
                        );
                        setCompareChartData2(compareData2);
                    }
                } catch (err) {
                    console.error('Error fetching second comparison data:', err);
                    setSnackbarMessage(err.message || 'Failed to fetch second comparison data');
                    setSnackbarOpen(true);
                } finally {
                    setCompareLoading2(false);
                }
            }
        } catch (error) {
            setError(error.message || 'Failed to fetch analytics data');
            setSnackbarMessage(error.message || 'Failed to fetch analytics data');
            setSnackbarOpen(true);
        } finally {
            setDataLoading(false);
        }
    };

    // Function to reset all filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterDevice(deviceObjects.length > 0 ? deviceObjects[0].slave_name : 'all');
        setFilterStartDate(dayjs().subtract(1, 'day'));
        setFilterEndDate(dayjs());
        setSearchClicked(false);
        setSelectedParameter([]);
        setSelectedParameter2([]);
        setSelectedParameter3([]);
        setCompareDevice('');
        setCompareDevice2('');
        setCompareMode(false);
        setCompareMode2(false);
        setFilteredChartData([]);
        setCompareChartData([]);
        setCompareChartData2([]);
    };

    // Handle comparison device selection
    const handleCompareDeviceChange = async (deviceName) => {
        setCompareDevice(deviceName);
        setCompareMode(true);
        
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading(true);
            try {
                const compareDeviceObj = deviceObjects.find(device => device.slave_name === deviceName);
                if (compareDeviceObj) {
                    const compareParams = selectedParameter2.length > 0 ? selectedParameter2 : allParameters;
                    const compareData = await fetchAnalyticsData(
                        compareDeviceObj.slave_id,
                        compareParams,
                        filterStartDate,
                        filterEndDate
                    );
                    setCompareChartData(compareData);
                }
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
        
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading2(true);
            try {
                const compareDevice2Obj = deviceObjects.find(device => device.slave_name === deviceName);
                if (compareDevice2Obj) {
                    const compareParams2 = selectedParameter3.length > 0 ? selectedParameter3 : allParameters;
                    const compareData2 = await fetchAnalyticsData(
                        compareDevice2Obj.slave_id,
                        compareParams2,
                        filterStartDate,
                        filterEndDate
                    );
                    setCompareChartData2(compareData2);
                }
            } catch (err) {
                console.error('Error fetching second comparison data:', err);
                setSnackbarMessage(err.message || 'Failed to fetch second comparison data');
                setSnackbarOpen(true);
            } finally {
                setCompareLoading2(false);
            }
        }
    };

    // Process the filtered chart data
    const processedFilteredData = React.useMemo(() => {
        if (!filteredChartData || !Array.isArray(filteredChartData) || filteredChartData.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = filteredChartData.map(item => {
            const timestamp = item.timestamp;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];
        const parametersToProcess = Array.isArray(selectedParameter) && selectedParameter.length > 0
            ? selectedParameter
            : allParameters;

        parametersToProcess.forEach(param => {
            const values = filteredChartData.map((item) => {
                let value = 0;
                if (param) {
                    value = parseFloat(item[param]) || 0;
                } else {
                    value = parseFloat(item.ry_v) || 0;
                }
                return parseFloat(value.toFixed(2));
            });

            if (filteredChartData.length > 0) {
                const parameterLabel = parameterLabels[param] || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        return { series, categories };
    }, [filteredChartData, filterDevice, selectedParameter]);

    // Process the comparison chart data
    const processedCompareData = React.useMemo(() => {
        if (!compareChartData || !Array.isArray(compareChartData) || compareChartData.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = compareChartData.map(item => {
            const timestamp = item.timestamp;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];
        const parametersToProcess = Array.isArray(selectedParameter2) && selectedParameter2.length > 0
            ? selectedParameter2
            : allParameters;

        parametersToProcess.forEach(param => {
            const values = compareChartData.map((item) => {
                let value = 0;
                if (param) {
                    value = parseFloat(item[param]) || 0;
                } else {
                    value = parseFloat(item.ry_v) || 0;
                }
                return parseFloat(value.toFixed(2));
            });

            if (compareChartData.length > 0) {
                const parameterLabel = parameterLabels[param] || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        return { series, categories };
    }, [compareChartData, compareDevice, selectedParameter2]);

    // Process the second comparison chart data
    const processedCompareData2 = React.useMemo(() => {
        if (!compareChartData2 || !Array.isArray(compareChartData2) || compareChartData2.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = compareChartData2.map(item => {
            const timestamp = item.timestamp;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];
        const parametersToProcess = Array.isArray(selectedParameter3) && selectedParameter3.length > 0
            ? selectedParameter3
            : allParameters;

        parametersToProcess.forEach(param => {
            const values = compareChartData2.map((item) => {
                let value = 0;
                if (param) {
                    value = parseFloat(item[param]) || 0;
                } else {
                    value = parseFloat(item.ry_v) || 0;
                }
                return parseFloat(value.toFixed(2));
            });

            if (compareChartData2.length > 0) {
                const parameterLabel = parameterLabels[param] || param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                series.push({
                    name: parameterLabel,
                    data: values
                });
            }
        });

        return { series, categories };
    }, [compareChartData2, compareDevice2, selectedParameter3]);

    // Define colors for each series
    const seriesColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

    // Dynamic chart configuration function
    const getChartOptions = (currentProcessedData, currentData) => {
        return {
            chart: {
                type: 'line',
                height: 420,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,     // This shows the menu button (required for menu to work)
                        selection: false,   // Hide selection tool (not in reference image)
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
                    filename: 'energy-analytics',
                    columnDelimiter: ',',
                    headerCategory: 'category',
                    headerValue: 'value',
                    dateFormatter: function(timestamp) {
                        return new Date(timestamp).toDateString();
                    }
                },
                svg: {
                    filename: 'energy-analytics',
                },
                png: {
                    filename: 'energy-analytics',
                }
            },
            stroke: {
                width: 2,
                curve: 'smooth'
            },
            markers: {
                size: 0
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
                shared: true,
                intersect: false,
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    let originalDate = '';

                    if (currentData && currentData.length > 0) {
                        const item = currentData[dataPointIndex];
                        const timestamp = item?.timestamp || '';
                        if (timestamp) {
                            const date = new Date(timestamp);
                            originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                        }
                    }

                    let tooltipContent = `<div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="font-weight: bold; margin-bottom: 8px; color: lightgray; font-size: 14px; padding: 10px; background-color: #f4f7f6">${originalDate}</div>`;

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
                show: true,
                position: 'top',
                fontSize: '12px',
                labels: {
                    colors: '#6B7280'
                }
            },
            colors: seriesColors,
            fill: {
                type: 'solid'
            },
            theme: {
                mode: 'light'
            }
        };
    };

    // Handle parameter category selection
    const handleParameterChange = (event, setSelectedParam) => {
        const value = event.target.value;
        
        if (value.includes('all_categories')) {
            if (selectedParameter.length === allParameters.length) {
                setSelectedParam([]);
            } else {
                setSelectedParam([...allParameters]);
            }
        } else {
            const selectedParameters = [];
            value.forEach(category => {
                if (parameterCategories[category]) {
                    selectedParameters.push(...parameterCategories[category].parameters);
                }
            });
            
            setSelectedParam(selectedParameters);
        }
    };

    // Check if all parameters from all categories are selected
    const isAllParametersSelected = (selectedParam) => {
        return selectedParam.length === allParameters.length;
    };

    // Get selected categories based on selected parameters
    const getSelectedCategories = (selectedParam) => {
        const categories = [];
        Object.entries(parameterCategories).forEach(([categoryName, categoryData]) => {
            const allCategoryParamsSelected = categoryData.parameters.every(param => 
                selectedParam.includes(param)
            );
            if (allCategoryParamsSelected) {
                categories.push(categoryName);
            }
        });
        return categories;
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
                                                minWidth: { xs: '100%', sm: 300 }, 
                                                mr: { sm: 2 },
                                                order: { xs: 2, sm: 2 }
                                            }}
                                        >
                                            <InputLabel>Select Parameters</InputLabel>
                                            <Select
                                                multiple
                                                value={getSelectedCategories(selectedParameter)}
                                                onChange={(e) => handleParameterChange(e, setSelectedParameter)}
                                                label="Select Parameters"
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                                                        {isAllParametersSelected(selectedParameter) ? (
                                                            <Chip
                                                                label="All Categories"
                                                                size="small"
                                                                sx={{ height: '20px', fontSize: '10px' }}
                                                            />
                                                        ) : (
                                                            selected.slice(0, 2).map((value) => (
                                                                <Chip
                                                                    key={value}
                                                                    label={parameterCategories[value]?.label || value}
                                                                    size="small"
                                                                    sx={{
                                                                        height: '20px',
                                                                        fontSize: '10px'
                                                                    }}
                                                                />
                                                            ))
                                                        )}

                                                        {!isAllParametersSelected(selectedParameter) && selected.length > 2 && (
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
                                                {Object.entries(parameterCategories).map(([categoryKey, categoryData]) => (
                                                    <MenuItem key={categoryKey} value={categoryKey} sx={{
                                                        py: 0.2,
                                                        px: 1,
                                                        minHeight: '32px',
                                                    }}>
                                                        <Checkbox 
                                                            checked={categoryData.parameters.every(param => selectedParameter.includes(param))} 
                                                            sx={{
                                                                p: 0.5,
                                                                mr: 0.5,
                                                                transform: "scale(0.8)",
                                                                '& .MuiSvgIcon-root': { fontSize: 20 }
                                                            }} 
                                                        />
                                                        <ListItemText 
                                                            primary={categoryData.label} 
                                                            primaryTypographyProps={{
                                                                fontSize: '12px',
                                                                lineHeight: 1.2
                                                            }}
                                                            secondaryTypographyProps={{
                                                                fontSize: '10px',
                                                                color: 'text.secondary'
                                                            }}
                                                        />
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
                                                    backgroundColor: '#0156a6',
                                                    '&:hover': {
                                                        backgroundColor: '#166aa0',
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
                                                onClick={handleResetFilters}
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
                                        flexDirection: { xs: 'column', md: 'row' },
                                        justifyContent: 'space-between', 
                                        alignItems: { xs: 'flex-start', md: 'center' }, 
                                        mb: 1,
                                        gap: { xs: 1, md: 0 }
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
                                                    : parameterLabels[selectedParameter[0]] || selectedParameter[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                                                : (filterDevice !== 'all' ? `${filterDevice}` : 'Energy Analytics')}
                                        </Typography>
                                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', md: 'row' },
                                                gap: { xs: 1, md: 2 }, 
                                                alignItems: { xs: 'stretch', md: 'center' }
                                            }}>
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
                                                            mr: { md: 1 },
                                                            width: { xs: '100%', md: 'auto' }
                                                        }}
                                                    >
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl 
                                                        size="small" 
                                                        sx={{ 
                                                            minWidth: { xs: '100%', md: 300 },
                                                            width: { xs: '100%', md: 'auto' }
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
                                                        : parameterLabels[selectedParameter2[0]] || selectedParameter2[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
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
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        justifyContent: 'flex-end',
                                                        gap: { xs: 1, md: 0 },
                                                        mb: 2
                                                    }}>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            flexDirection: { xs: 'column', md: 'row' },
                                                            gap: { xs: 1, md: 2 }, 
                                                            alignItems: { xs: 'stretch', md: 'center' },
                                                            width: { xs: '100%', md: 'auto' }
                                                        }}>
                                                            <FormControl 
                                                                size="small" 
                                                                sx={{ 
                                                                    minWidth: { xs: '100%', md: 300 },
                                                                    width: { xs: '100%', md: 'auto' }
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
                                                                    minWidth: { xs: '100%', md: 300 },
                                                                    mr: { md: 1 },
                                                                    width: { xs: '100%', md: 'auto' }
                                                                }}
                                                            >
                                                                <InputLabel>Select Parameters</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={getSelectedCategories(selectedParameter2)}
                                                                    onChange={(e) => {
                                                                        handleParameterChange(e, setSelectedParameter2);
                                                                        
                                                                        if (compareMode && compareDevice && searchClicked) {
                                                                            setCompareLoading(true);
                                                                            
                                                                            const selectedParameters = [];
                                                                            e.target.value.forEach(category => {
                                                                                if (parameterCategories[category]) {
                                                                                    selectedParameters.push(...parameterCategories[category].parameters);
                                                                                }
                                                                            });
                                                                            
                                                                            const params = selectedParameters.length > 0 ? selectedParameters : allParameters;
                                                                            
                                                                            fetchAnalyticsData(
                                                                                deviceObjects.find(d => d.slave_name === compareDevice)?.slave_id,
                                                                                params,
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
                                                                            {isAllParametersSelected(selectedParameter2) ? (
                                                                                <Chip
                                                                                    label="All Categories"
                                                                                    size="small"
                                                                                    sx={{ height: '20px', fontSize: '10px' }}
                                                                                />
                                                                            ) : (
                                                                                selected.slice(0, 2).map((value) => (
                                                                                    <Chip
                                                                                        key={value}
                                                                                        label={parameterCategories[value]?.label || value}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            height: '20px',
                                                                                            fontSize: '10px'
                                                                                        }}
                                                                                    />
                                                                                ))
                                                                            )}

                                                                            {!isAllParametersSelected(selectedParameter2) && selected.length > 2 && (
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
                                                                    
                                                                    {Object.entries(parameterCategories).map(([categoryKey, categoryData]) => (
                                                                        <MenuItem key={categoryKey} value={categoryKey} sx={{
                                                                            py: 0.2,
                                                                            px: 1,
                                                                            minHeight: '32px',
                                                                        }}>
                                                                            <Checkbox 
                                                                                checked={categoryData.parameters.every(param => selectedParameter2.includes(param))} 
                                                                                sx={{
                                                                                    p: 0.5,
                                                                                    mr: 0.5,
                                                                                    transform: "scale(0.8)",
                                                                                    '& .MuiSvgIcon-root': { fontSize: 20 }
                                                                                }} 
                                                                            />
                                                                            <ListItemText 
                                                                                primary={categoryData.label} 
                                                                                primaryTypographyProps={{
                                                                                    fontSize: '12px',
                                                                                    lineHeight: 1.2
                                                                                }}
                                                                                secondaryTypographyProps={{
                                                                                    fontSize: '10px',
                                                                                    color: 'text.secondary'
                                                                                }}
                                                                            />
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
                                                                        },
                                                                        width: { xs: '100%', md: 'auto' }
                                                                    }}
                                                                >
                                                                    Cancel Compare
                                                                </Button>
                                                            ) : (
                                                                <FormControl 
                                                                    size="small" 
                                                                    sx={{ 
                                                                        minWidth: { xs: '100%', md: 300 },
                                                                        width: { xs: '100%', md: 'auto' }
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
                                                        : parameterLabels[selectedParameter3[0]] || selectedParameter3[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
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
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        gap: { xs: 1, md: 2 },
                                                        justifyContent: 'flex-end',
                                                        mb: 2
                                                    }}>
                                                        <FormControl 
                                                            size="small" 
                                                            sx={{ 
                                                                minWidth: { xs: '100%', md: 300 },
                                                                width: { xs: '100%', md: 'auto' }
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
                                                                minWidth: { xs: '100%', md: 300 },
                                                                width: { xs: '100%', md: 'auto' }
                                                            }}
                                                        >
                                                            <InputLabel>Select Parameters</InputLabel>
                                                            <Select
                                                                multiple
                                                                value={getSelectedCategories(selectedParameter3)}
                                                                onChange={(e) => {
                                                                    handleParameterChange(e, setSelectedParameter3);
                                                                
                                                                    if (compareMode2 && compareDevice2 && searchClicked) {
                                                                        setCompareLoading2(true);
                                                                    
                                                                        const selectedParameters = [];
                                                                        e.target.value.forEach(category => {
                                                                            if (parameterCategories[category]) {
                                                                                selectedParameters.push(...parameterCategories[category].parameters);
                                                                            }
                                                                        });
                                                                    
                                                                        const params = selectedParameters.length > 0 ? selectedParameters : allParameters;
                                                                    
                                                                        fetchAnalyticsData(
                                                                            deviceObjects.find(d => d.slave_name === compareDevice2)?.slave_id,
                                                                            params,
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
                                                                        {isAllParametersSelected(selectedParameter3) ? (
                                                                            <Chip
                                                                                label="All Categories"
                                                                                size="small"
                                                                                sx={{ height: '20px', fontSize: '10px' }}
                                                                            />
                                                                        ) : (
                                                                            selected.slice(0, 2).map((value) => (
                                                                                <Chip
                                                                                    key={value}
                                                                                    label={parameterCategories[value]?.label || value}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: '20px',
                                                                                        fontSize: '10px'
                                                                                    }}
                                                                                />
                                                                            ))
                                                                        )}

                                                                        {!isAllParametersSelected(selectedParameter3) && selected.length > 2 && (
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
                                                                
                                                                {Object.entries(parameterCategories).map(([categoryKey, categoryData]) => (
                                                                    <MenuItem key={categoryKey} value={categoryKey} sx={{
                                                                        py: 0.2,
                                                                        px: 1,
                                                                        minHeight: '32px',
                                                                    }}>
                                                                        <Checkbox 
                                                                            checked={categoryData.parameters.every(param => selectedParameter3.includes(param))} 
                                                                            sx={{
                                                                                p: 0.5,
                                                                                mr: 0.5,
                                                                                transform: "scale(0.8)",
                                                                                '& .MuiSvgIcon-root': { fontSize: 20 }
                                                                            }} 
                                                                        />
                                                                        <ListItemText 
                                                                            primary={categoryData.label} 
                                                                            primaryTypographyProps={{
                                                                                fontSize: '12px',
                                                                                lineHeight: 1.2
                                                                            }}
                                                                            secondaryTypographyProps={{
                                                                                fontSize: '10px',
                                                                                color: 'text.secondary'
                                                                            }}
                                                                        />
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

export default Analytics;