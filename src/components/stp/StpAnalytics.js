import React, { useState, useEffect } from 'react'
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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

const StpAnalytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'day'));
    const [filterEndDate, setFilterEndDate] = useState(dayjs());
    const [searchClicked, setSearchClicked] = useState(false);
    const [devices, setDevices] = useState(['all']);
    const [deviceObjects, setDeviceObjects] = useState([]);
    const [filterDevice2, setFilterDevice2] = useState('all');
    const [filterDevice3, setFilterDevice3] = useState('all');
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);
    
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareLoading2, setCompareLoading2] = useState(false);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

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
        tableCard: {
            backgroundColor: '#fff',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            padding: { xs: '10px', sm: '15px' },
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
        },
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
            },
            '& .apexcharts-menu': { minWidth: '140px' },
            '& .apexcharts-menu-item': { padding: '6px 12px', fontSize: '12px' },
            '& .apexcharts-toolbar .apexcharts-download-icon svg': { display: 'none !important' },
            '& .apexcharts-toolbar .apexcharts-download-icon': {
                '&::after': {
                    content: '""',
                    display: 'block',
                    width: '16px',
                    height: '14px',
                    background: `repeating-linear-gradient(to bottom, #666, #666 2px, transparent 2px, transparent 4px)`,
                    borderRadius: '2px',
                    marginTop: '1px',
                    cursor: 'pointer',
                }
            }
        }
    };

    // Initialize Mock Devices
    useEffect(() => {
        const mockDevices = [
            { slave_id: 1, slave_name: 'Water Inlet' },
            { slave_id: 2, slave_name: 'Water Outlet' }
        ];
        
        setDeviceObjects(mockDevices);
        const deviceNames = mockDevices.map(device => device.slave_name);
        setDevices(['all', ...deviceNames]);
        setFilterDevice(mockDevices[0].slave_name);
        setLoading(false);
    }, []);

    // Function to generate Mock Analytics Data
    const fetchAnalyticsData = async (deviceName, startDate, endDate) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const selectedDevice = deviceObjects.find(device => device.slave_name === deviceName);
        if (!selectedDevice) {
            throw new Error(`Device '${deviceName}' not found`);
        }

        const data = [];
        let current = dayjs(startDate);
        const end = dayjs(endDate);

        while (current.isBefore(end)) {
            const entry = {
                timestamp: current.format('YYYY-MM-DD HH:mm:ss'),
                // Generate random values for flow_rate
                flow_rate: Math.floor(Math.random() * 100) + 800, 
            };
            data.push(entry);
            current = current.add(1, 'hour');
        }
        
        return data;
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
            setError(null);
            
            // Fetch data for Flow Rate only
            const analyticsData = await fetchAnalyticsData(filterDevice, filterStartDate, filterEndDate);
            setFilteredChartData(analyticsData);
            
            if (compareMode && compareDevice) {
                setCompareLoading(true);
                try {
                    const compareData = await fetchAnalyticsData(compareDevice, filterStartDate, filterEndDate);
                    setCompareChartData(compareData);
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
                    const compareData2 = await fetchAnalyticsData(compareDevice2, filterStartDate, filterEndDate);
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
            setError(err.message || 'Failed to fetch analytics data. Please try again later.');
            setSnackbarMessage(err.message || 'Failed to fetch analytics data. Please try again later.');
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
        setFilterDevice2('all');
        setFilterDevice3('all');
        setFilteredChartData([]);
        setCompareChartData([]);
        setCompareChartData2([]);
        setError(null);
    };

    const [filteredChartData, setFilteredChartData] = useState([]);
    const [compareMode, setCompareMode] = useState(false);
    const [compareDevice, setCompareDevice] = useState('');
    const [compareChartData, setCompareChartData] = useState([]);
    const [compareMode2, setCompareMode2] = useState(false);
    const [compareDevice2, setCompareDevice2] = useState('');
    const [compareChartData2, setCompareChartData2] = useState([]);

    // Handle comparison device selection
    const handleCompareDeviceChange = async (deviceName) => {
        setCompareDevice(deviceName);
        setCompareMode(true);
        
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading(true);
            try {                
                const compareData = await fetchAnalyticsData(deviceName, filterStartDate, filterEndDate);
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
        
        if (searchClicked && filteredChartData.length > 0) {
            setCompareLoading2(true);
            try {                
                const compareData2 = await fetchAnalyticsData(deviceName, filterStartDate, filterEndDate);
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

    // Process the filtered chart data (Fixed to Flow Rate)
    const processedFilteredData = React.useMemo(() => {
        if (!filteredChartData || !Array.isArray(filteredChartData) || filteredChartData.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = filteredChartData.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];

        const values = filteredChartData.map((item) => {
            return parseFloat((item.flow_rate || 0).toFixed(2));
        });

        if (filteredChartData.length > 0) {
            series.push({
                name: 'Flow Rate (m³/h)',
                data: values
            });
        }

        return { series, categories };
    }, [filteredChartData, filterDevice]);

    // Process the comparison chart data (Fixed to Flow Rate)
    const processedCompareData = React.useMemo(() => {
        if (!compareChartData || !Array.isArray(compareChartData) || compareChartData.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = compareChartData.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];
        
        const values = compareChartData.map((item) => {
            return parseFloat((item.flow_rate || 0).toFixed(2));
        });

        if (compareChartData.length > 0) {
            series.push({
                name: 'Flow Rate (m³/h)',
                data: values
            });
        }

        return { series, categories };
    }, [compareChartData, compareDevice, filterDevice2]);

    // Process the second comparison chart data (Fixed to Flow Rate)
    const processedCompareData2 = React.useMemo(() => {
        if (!compareChartData2 || !Array.isArray(compareChartData2) || compareChartData2.length === 0) {
            return { series: [], categories: [] };
        }

        const categories = compareChartData2.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            if (timestamp) {
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })}`;
            }
            return 'N/A';
        });

        const series = [];
        
        const values = compareChartData2.map((item) => {
            return parseFloat((item.flow_rate || 0).toFixed(2));
        });

        if (compareChartData2.length > 0) {
            series.push({
                name: 'Flow Rate (m³/h)',
                data: values
            });
        }

        return { series, categories };
    }, [compareChartData2, compareDevice2, filterDevice3]);

    const seriesColors = ['#d32f2f', '#1976d2', '#F59E0B', '#EF4444', '#8B5CF6', '#2563EB'];

    // Dynamic chart configuration function
    const getChartOptions = (currentProcessedData, currentData) => {
        return {
            chart: {
                type: 'line',
                height: 420,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                        customIcons: []
                    },
                    autoSelected: 'zoom'
                },
                zoom: {
                    enabled: true,
                    type: 'x',
                    autoScaleYaxis: false,
                    zoomedArea: {
                        fill: { color: '#90CAF9', opacity: 0.4 },
                        stroke: { color: '#0D47A1', opacity: 0.8, width: 1 }
                    }
                },
                background: '#FFFFFF',
            },
            stroke: { width: 2, curve: 'smooth' },
            markers: { size: 0 },
            xaxis: {
                categories: currentProcessedData.categories,
                labels: { style: { colors: '#6B7280', fontSize: '12px' }, show: true, rotate: -45, rotateAlways: true },
                tickAmount: 6,
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                min: 0,
                tickAmount: 6,
                labels: {
                    style: { colors: '#6B7280', fontSize: '12px' },
                    formatter: function (value) {
                        return value !== undefined && value !== null && !isNaN(value) ? parseFloat(value).toFixed(2) : value;
                    }
                },
                axisBorder: { show: false }
            },
            grid: {
                borderColor: '#E5E7EB',
                opacity: 1,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: false } },
                padding: { top: 20, right: 20, bottom: 20, left: 20 }
            },
            dataLabels: { enabled: false },
            tooltip: {
                enabled: true,
                style: { fontSize: '12px' },
                shared: true,
                intersect: false,
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    let originalDate = '';
                    if (currentData && currentData.length > 0) {
                        if (searchClicked) {
                            const item = currentData[dataPointIndex];
                            const timestamp = item?.timestamp || item?.created_at || item?.date || '';
                            if (timestamp) {
                                const date = new Date(timestamp);
                                originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                            }
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
            legend: { show: true, position: 'top', fontSize: '12px', labels: { colors: '#6B7280' } },
            colors: seriesColors,
            fill: { type: 'solid' },
            theme: { mode: 'light' }
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

                                        {/* Parameter Select Removed */}

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
                                                    '&:hover': { backgroundColor: '#1E4A7C' },
                                                    minWidth: 'auto',
                                                    width: { xs: 'auto', sm: '32px' },
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '6px' },
                                                    borderRadius: '4px',
                                                    '& .MuiButton-startIcon': { margin: { sm: 0 } }
                                                }}
                                            >   
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<RefreshIcon />}
                                                onClick={() => { handleResetFilters(); }}
                                                sx={{
                                                    borderColor: '#6c757d',
                                                    color: '#6c757d',
                                                    '&:hover': { borderColor: '#5a6268', color: '#5a6268' },
                                                    minWidth: 'auto',
                                                    width: { xs: 'auto', sm: '32px' },
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '4px' },
                                                    borderRadius: '4px',
                                                    '& .MuiButton-startIcon': { margin: { sm: 0 } }
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
                                <Box style={styles.loadingContainer}><CircularProgress /></Box>
                            ) : processedFilteredData.series.length > 0 ? (
                                <>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 1, gap: { xs: 1, md: 0 } }}>
                                        <Typography gutterBottom sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#50342c', mb: 0 }}>
                                            {`${filterDevice} - Flow Rate (m³/h)`}
                                        </Typography>
                                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, md: 2 }, alignItems: { xs: 'stretch', md: 'center' } }}>
                                                {compareMode ? (
                                                    <Button variant="outlined" size="small" onClick={() => setCompareMode(false)} sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#b71c1c', color: '#b71c1c' }, mr: { md: 1 }, width: { xs: '100%', md: 'auto' } }}>
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 300 }, width: { xs: '100%', md: 'auto' } }}>
                                                        <InputLabel>Select Device to Compare</InputLabel>
                                                        <Select value={compareDevice} label="Select Device to Compare" onChange={(e) => handleCompareDeviceChange(e.target.value)}>
                                                            {devices.filter(device => device !== 'all' && device !== filterDevice && device !== compareDevice2).map((device) => (
                                                                <MenuItem key={device} value={device}>{device}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                    {/* Main Chart */}
                                    <Box sx={styles.chartContainer}>
                                        <Chart options={getChartOptions(processedFilteredData, filteredChartData)} series={processedFilteredData.series} type="line" height={420} width="100%" />
                                    </Box>
                                    {compareMode && compareDevice && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography gutterBottom sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#50342c', mb: 1 }}>
                                                {`${compareDevice} - Flow Rate (m³/h)`}
                                            </Typography>
                                            {compareLoading ? (
                                                <Box style={styles.loadingContainer}><CircularProgress /></Box>
                                            ) : processedCompareData.series.length > 0 ? (
                                                <>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'flex-end', gap: { xs: 1, md: 0 }, mb: 2 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, md: 2 }, alignItems: { xs: 'stretch', md: 'center' }, width: { xs: '100%', md: 'auto' } }}>
                                                            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 300 }, width: { xs: '100%', md: 'auto' } }}>
                                                                <InputLabel>Select Device</InputLabel>
                                                                <Select value={compareDevice} label="Select Device" onChange={(e) => handleCompareDeviceChange(e.target.value)}>
                                                                    {devices.map((device) => (
                                                                        <MenuItem key={device} value={device}>{device === 'all' ? 'Select Device' : device}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>

                                                            {compareMode2 ? (
                                                                <Button variant="outlined" size="small" onClick={() => setCompareMode2(false)} sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#b71c1c', color: '#b71c1c' }, width: { xs: '100%', md: 'auto' } }}>
                                                                    Cancel Compare
                                                                </Button>
                                                            ) : (
                                                                <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 300 }, width: { xs: '100%', md: 'auto' } }}>
                                                                    <InputLabel>Select Second Device to Compare</InputLabel>
                                                                    <Select value={compareDevice2} label="Select Second Device to Compare" onChange={(e) => handleCompareDevice2Change(e.target.value)}>
                                                                        {devices.filter(device => device !== 'all' && device !== filterDevice && device !== compareDevice).map((device) => (
                                                                            <MenuItem key={device} value={device}>{device}</MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                </FormControl>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    {/* Comparison Chart 1 */}
                                                    <Box sx={styles.chartContainer}>
                                                        <Chart options={getChartOptions(processedCompareData, compareChartData)} series={processedCompareData.series} type="line" height={420} width="100%" />
                                                    </Box>
                                                </>
                                            ) : (
                                                <Alert severity="info" sx={{ m: 2 }}>No data available for comparison</Alert>
                                            )}
                                        </Box>
                                    )}
                                    {compareMode2 && compareDevice2 && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography gutterBottom sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#50342c', mb: 1 }}>
                                                {`${compareDevice2} - Flow Rate (m³/h)`}
                                            </Typography>
                                            {compareLoading2 ? (
                                                <Box style={styles.loadingContainer}><CircularProgress /></Box>
                                            ) : processedCompareData2.series.length > 0 ? (
                                                <>
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, md: 2 }, justifyContent: 'flex-end', mb: 2 }}>
                                                        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 300 }, width: { xs: '100%', md: 'auto' } }}>
                                                            <InputLabel>Select Device</InputLabel>
                                                            <Select value={compareDevice2} label="Select Device" onChange={(e) => handleCompareDevice2Change(e.target.value)}>
                                                                {devices.map((device) => (
                                                                    <MenuItem key={device} value={device}>{device === 'all' ? 'Select Device' : device}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                    {/* Comparison Chart 2 */}
                                                    <Box sx={styles.chartContainer}>
                                                        <Chart options={getChartOptions(processedCompareData2, compareChartData2)} series={processedCompareData2.series} type="line" height={420} width="100%" />
                                                    </Box>
                                                </>
                                            ) : (
                                                <Alert severity="info" sx={{ m: 2 }}>No data available for comparison</Alert>
                                            )}
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Alert severity="info" sx={{ m: 2 }}>No data available for the selected period</Alert>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </Box>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
        </Box>
    )
}

export default StpAnalytics;