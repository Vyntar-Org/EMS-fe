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

// Updated parameter options for Connectivity analytics
const parameterOptions = [
    { value: "connectivity_status", label: "Connectivity History" }
];

const CompressorAnalytics = ({ onSidebarToggle, sidebarVisible }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('');
    // Initialize with default dates - 1 day ago to today
    const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'day'));
    const [filterEndDate, setFilterEndDate] = useState(dayjs());
    const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
    const [devices, setDevices] = useState(['all']); // Initialize with 'all' as default
    const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs
    const [selectedParameter, setSelectedParameter] = useState(['connectivity_status']); // State for main chart parameter selection
    const [selectedParameter2, setSelectedParameter2] = useState(['connectivity_status']); // State for comparison charts
    const [selectedParameter3, setSelectedParameter3] = useState(['connectivity_status']); // State for comparison charts
    const [filterDevice2, setFilterDevice2] = useState('all'); 
    const [filterDevice3, setFilterDevice3] = useState('all'); 
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

    // Fetch dummy devices on component mount
    useEffect(() => {
        fetchDevices();
    }, []);

    // Function to load dummy devices
    const fetchDevices = () => {
        try {
            setLoading(true);
            // Dummy Compressor device data
            const slaves = [
                { slave_id: 'COMP_001', slave_name: 'COMPRESSOR 1' },
                { slave_id: 'COMP_002', slave_name: 'COMPRESSOR 2' },
                { slave_id: 'COMP_003', slave_name: 'COMPRESSOR 3' },
            ];
            
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
        } finally {
            setLoading(false);
        }
    };

    // Function to generate dummy connectivity data (Online/Offline)
    const fetchAnalyticsData = async (deviceName, parameters, startDate, endDate) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const selectedDevice = deviceObjects.find(device => device.slave_name === deviceName);
        if (!selectedDevice) {
            throw new Error('Device not found');
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const diffMinutes = end.diff(start, 'minute');
        
        // Determine interval (generate point every ~15 mins for dummy data)
        const interval = 15;
        
        const data = [];
        let current = start;

        while (current.isBefore(end)) {
            const point = {
                timestamp: current.toISOString(),
                // Generate 1 for Online, 0 for Offline (80% chance online)
                connectivity_status: Math.random() > 0.2 ? 1 : 0
            };

            data.push(point);
            current = current.add(interval, 'minute');
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
        if (!filterStartDate || !filterEndDate) {
            setSnackbarMessage('Please select date range');
            setSnackbarOpen(true);
            return;
        }
        
        try {
            setDataLoading(true);
            setSearchClicked(true);
            
            const analyticsData = await fetchAnalyticsData(
                filterDevice, 
                selectedParameter, 
                filterStartDate, 
                filterEndDate
            );
            setFilteredChartData(analyticsData);
            
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
                } finally {
                    setCompareLoading(false);
                }
            }
            
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
        setFilterStartDate(dayjs().subtract(1, 'day'));
        setFilterEndDate(dayjs());
        setSearchClicked(false);
        setSelectedParameter(['connectivity_status']);
        setSelectedParameter2(['connectivity_status']);
        setSelectedParameter3(['connectivity_status']);
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
                const compareData = await fetchAnalyticsData(
                    deviceName, 
                    selectedParameter2, 
                    filterStartDate, 
                    filterEndDate
                );
                setCompareChartData(compareData);
            } catch (err) {
                console.error('Error fetching comparison data:', err);
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
                const compareData2 = await fetchAnalyticsData(
                    deviceName, 
                    selectedParameter3, 
                    filterStartDate, 
                    filterEndDate
                );
                setCompareChartData2(compareData2);
            } catch (err) {
                console.error('Error fetching second comparison data:', err);
            } finally {
                setCompareLoading2(false);
            }
        }
    };

    // Process the filtered chart data for Connectivity (Datetime Series)
    const processedFilteredData = React.useMemo(() => {
        if (!filteredChartData || !Array.isArray(filteredChartData) || filteredChartData.length === 0) {
            return { series: [] };
        }

        // Map data to [timestamp, value] format for ApexCharts datetime axis
        const seriesData = filteredChartData.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            return [new Date(timestamp).getTime(), item.connectivity_status];
        });

        return { 
            series: [{
                name: 'Connectivity',
                data: seriesData
            }]
        };
    }, [filteredChartData]);

    // Process the comparison chart data
    const processedCompareData = React.useMemo(() => {
        if (!compareChartData || !Array.isArray(compareChartData) || compareChartData.length === 0) {
            return { series: [] };
        }

        const seriesData = compareChartData.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            return [new Date(timestamp).getTime(), item.connectivity_status];
        });

        return { 
            series: [{
                name: 'Connectivity',
                data: seriesData
            }]
        };
    }, [compareChartData]);

    // Process the second comparison chart data
    const processedCompareData2 = React.useMemo(() => {
        if (!compareChartData2 || !Array.isArray(compareChartData2) || compareChartData2.length === 0) {
            return { series: [] };
        }

        const seriesData = compareChartData2.map(item => {
            const timestamp = item.timestamp || item.created_at || item.date;
            return [new Date(timestamp).getTime(), item.connectivity_status];
        });

        return { 
            series: [{
                name: 'Connectivity',
                data: seriesData
            }]
        };
    }, [compareChartData2]);

    // Chart configuration for Connectivity
    const getChartOptions = (currentProcessedData, currentData) => {
        return {
            chart: {
                type: 'area',
                height: 420,
                toolbar: { show: true },
                zoom: { enabled: true },
                background: '#FFFFFF',
            },
            stroke: {
                width: 2,
                curve: 'stepline' // Step line is perfect for On/Off status
            },
            fill: {
                type: 'solid',
                opacity: 0.2,
                colors: ['#30b44a'] // Green fill
            },
            colors: ['#30b44a'], // Green line
            dataLabels: { enabled: false },
            xaxis: {
                type: 'datetime',
                title: {
                    text: 'Time',
                    style: { color: '#6B7280', fontSize: '12px' },
                },
                labels: {
                    style: { colors: '#6B7280', fontSize: '11px' },
                    datetimeUTC: false
                },
            },
            yaxis: {
                title: {
                    text: 'Status',
                    style: { color: '#6B7280', fontSize: '12px' },
                },
                min: -0.1,
                max: 1.1,
                tickAmount: 2,
                labels: {
                    style: { colors: '#6B7280', fontSize: '12px' },
                    formatter: function(val) {
                        if (val >= 0.9) return 'Online';
                        if (val <= 0.1) return 'Offline';
                        return '';
                    }
                },
            },
            grid: {
                borderColor: '#E5E7EB',
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
            },
            tooltip: {
                enabled: true,
                theme: 'light',
                x: { format: 'dd MMM yyyy HH:mm' },
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const dataPoint = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                    const date = new Date(dataPoint[0]);
                    const formattedDate = date.toLocaleString();
                    const value = dataPoint[1];
                    const statusText = value === 1 ? 'Online' : 'Offline';
                    const statusColor = value === 1 ? '#30b44a' : '#e34d4d';

                    return `<div style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 12px;">${formattedDate}</div>
                        <div style="display: flex; align-items: center;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; margin-right: 8px;"></span>
                            <span style="flex: 1; color: #333; font-size: 12px;">Status:</span>
                            <span style="font-weight: bold; color: ${statusColor}; margin-left: 5px; font-size: 12px;">${statusText}</span>
                        </div>
                    </div>`;
                }
            },
            legend: { show: false },
            markers: {
                size: 0,
                hover: { size: 5 }
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

                                        {/* Parameters Select (Hidden or Static since only 1 option) */}
                                        {/* Keeping the control for consistency in UI layout if needed, or could be removed */}
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
                                                onChange={(e) => setSelectedParameter(e.target.value)}
                                                label="Select Parameters"
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip key="conn" label="Connectivity History" size="small" />
                                                    </Box>
                                                )}
                                            >
                                                {parameterOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        <Checkbox checked={selectedParameter.indexOf(option.value) > -1} />
                                                        <ListItemText primary={option.label} />
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
                                                    '&:hover': { backgroundColor: '#1E4A7C' },
                                                    minWidth: 'auto',
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '6px' },
                                                    borderRadius: '4px',
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
                                                    '&:hover': { borderColor: '#5a6268', color: '#5a6268' },
                                                    minWidth: 'auto',
                                                    height: '32px',
                                                    padding: { xs: '6px 16px', sm: '4px' },
                                                    borderRadius: '4px',
                                                }}
                                            >
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                        
                        {/* Chart Display Area */}
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
                                        mb: 1, mt: 2,
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
                                            {filterDevice} - Connectivity History
                                        </Typography>
                                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                {compareMode ? (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => setCompareMode(false)}
                                                        sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
                                                    >
                                                        Cancel Compare
                                                    </Button>
                                                ) : (
                                                    <FormControl size="small" sx={{ minWidth: 300 }}>
                                                        <InputLabel>Select Device to Compare</InputLabel>
                                                        <Select
                                                            value={compareDevice}
                                                            label="Select Device to Compare"
                                                            onChange={(e) => handleCompareDeviceChange(e.target.value)}
                                                        >
                                                            {devices.filter(device => device !== 'all' && device !== filterDevice).map((device) => (
                                                                <MenuItem key={device} value={device}>{device}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                                        <Chart
                                            options={getChartOptions(processedFilteredData, filteredChartData)}
                                            series={processedFilteredData.series}
                                            type="area"
                                            height={420}
                                            width="100%"
                                        />
                                    </Box>

                                    {/* Comparison Charts */}
                                    {compareMode && compareDevice && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography gutterBottom sx={{ fontSize: '14px', fontWeight: 'bold', color: '#50342c', mb: 1 }}>
                                                {compareDevice} - Connectivity History
                                            </Typography>
                                            {compareLoading ? (
                                                <CircularProgress />
                                            ) : processedCompareData.series.length > 0 ? (
                                                <Box sx={{ width: '100%', overflow: 'auto' }}>
                                                    <Chart
                                                        options={getChartOptions(processedCompareData, compareChartData)}
                                                        series={processedCompareData.series}
                                                        type="area"
                                                        height={420}
                                                        width="100%"
                                                    />
                                                </Box>
                                            ) : (
                                                <Alert severity="info">No data available for comparison</Alert>
                                            )}
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Alert severity="info" sx={{ m: 2 }}>No data available for the selected date range</Alert>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    )
}

export default CompressorAnalytics;