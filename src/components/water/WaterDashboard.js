import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    Snackbar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import Chart from 'react-apexcharts';
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';

// Import the API functions
import { fetchWaterDashboardOverview, getWaterSlaveList, fetchDailyConsumption } from '../../auth/water/WaterDashboardApi';

const WaterDashboard = ({ onSidebarToggle, sidebarVisible }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    const [waterPositivity, setWaterPositivity] = useState(26.0);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [slaveList, setSlaveList] = useState([]);
    const [slaveListLoading, setSlaveListLoading] = useState(false);
    const [selectedSlave, setSelectedSlave] = useState(null);
    const [activeChart, setActiveChart] = useState('bar');

    // State for chart data and loading
    const [weeklyWaterData, setWeeklyWaterData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    // Function to truncate text
    const truncateText = (text, length = 9) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWaterDashboardOverview();

                if (response.success && response.data) {
                    setDashboardData(response.data);
                    setWaterPositivity(response.data.water_positivity?.current || 0);
                } else {
                    setError('Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to fetch dashboard data: ' + err.message);
                setSnackbarMessage('Failed to fetch dashboard data: ' + err.message);
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch slave list from API
    useEffect(() => {
        const fetchSlaveList = async () => {
            try {
                setSlaveListLoading(true);
                const slaves = await getWaterSlaveList();
                setSlaveList(slaves);
            } catch (err) {
                console.error('Error fetching slave list:', err);
                setSnackbarMessage('Failed to fetch slave list: ' + err.message);
                setSnackbarOpen(true);
                // Fallback data
                setSlaveList([
                    { slave_id: 1, slave_name: 'Machine 1 - Production Line A' },
                    { slave_id: 2, slave_name: 'Machine 2 - Production Line B' },
                    { slave_id: 3, slave_name: 'Machine 3 - Production Line C' },
                ]);
            } finally {
                setSlaveListLoading(false);
            }
        };

        fetchSlaveList();
    }, []);

    // Effect to load default chart data for the first slave on page refresh
    useEffect(() => {
        // If slave list is loaded, not loading, and no slave is selected yet
        if (!slaveListLoading && slaveList.length > 0 && !selectedSlave) {
            handleSlaveSelect(slaveList[0]);
        }
    }, [slaveList, slaveListLoading]);

    // Function to handle slave selection
    const handleSlaveSelect = async (slave) => {
        setSelectedSlave(slave);
        setChartLoading(true);

        try {
            console.log('Fetching consumption for slave:', slave.slave_id);
            const response = await fetchDailyConsumption(slave.slave_id);

            if (response.success && response.data && response.data.data) {
                // Transform API data to match chart structure
                const formattedData = response.data.data.map(item => ({
                    day: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    fullDate: item.date,
                    actual: item.consumption || 0,
                    target: item.target || 0
                }));

                setWeeklyWaterData(formattedData);
            } else {
                setWeeklyWaterData([]);
            }
        } catch (err) {
            console.error('Error fetching daily consumption:', err);
            setSnackbarMessage('Failed to fetch consumption data: ' + err.message);
            setSnackbarOpen(true);
            setWeeklyWaterData([]);
        } finally {
            setChartLoading(false);
        }
    };

    // Logic to determine Y-Axis Max based on Slave ID
    // If slave_id is 1 or 4, max is 50. Otherwise, max is 100.
    // Logic to determine Y-Axis Max and Tick Amount based on Slave ID
    const getYAxisConfig = () => {
        // If slave_id is 1 or 4, max is 50. Otherwise, max is 100.
        const max = (selectedSlave && (selectedSlave.slave_id === 1 || selectedSlave.slave_id === 4)) ? 50 : 100;
        
        // To get steps of 10 (0, 10, 20...), tickAmount must be max / 10
        const tickAmount = max / 10;

        return { max, tickAmount };
    };

    const { max: yAxisMax, tickAmount: yAxisTickAmount } = getYAxisConfig();

    // Dynamic chart configuration for weekly water consumption - BAR CHART
    const weeklyWaterBarOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '80%',
                dataLabels: { position: 'top' }
            }
        },
        grid: {
            strokeDashArray: 4,
            borderColor: 'transparent',
            position: 'back',
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true, color: '#E5E7EB' } }
        },
        xaxis: {
            categories: weeklyWaterData.length > 0
                ? weeklyWaterData.map(item => item.day)
                : ['-'],
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: 'Day',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
         yaxis: {
            min: 0,
            max: yAxisMax,             // Uses 50 or 100
            tickAmount: yAxisTickAmount, // Uses 5 or 10 to create 0, 10, 20... steps
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' },
                formatter: (val) => val
            },
            axisBorder: { show: false },
            title: {
                text: 'Liters',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: weeklyWaterData.length > 0,
            theme: 'light',
            style: { fontSize: '12px' },
            y: {
                formatter: function (val) {
                    return `${val} Liters`;
                }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 0,
            fontSize: '12px',
            labels: {
                colors: ['#6B7280']
            }
        },
        colors: ['#0156a6', '#9CA3AF'] // Blue for actual, gray for target
    };

    // Dynamic chart configuration for weekly water consumption - LINE CHART
    const weeklyWaterLineOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true },
            zoom: { enabled: false }
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        markers: {
            size: 4,
            hover: {
                size: 6
            }
        },
        grid: {
            strokeDashArray: 4,
            borderColor: 'transparent',
            position: 'back',
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true, color: '#E5E7EB' } }
        },
        xaxis: {
            categories: weeklyWaterData.length > 0
                ? weeklyWaterData.map(item => item.day)
                : ['-'],
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: 'Day',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
         yaxis: {
            min: 0,
            max: yAxisMax,             // Uses 50 or 100
            tickAmount: yAxisTickAmount, // Uses 5 or 10
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' },
                formatter: (val) => val
            },
            axisBorder: { show: false },
            title: {
                text: 'Liters',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: weeklyWaterData.length > 0,
            theme: 'light',
            style: { fontSize: '12px' },
            y: {
                formatter: function (val) {
                    return `${val} Liters`;
                }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 0,
            fontSize: '12px',
            labels: {
                colors: ['#6B7280']
            }
        },
        colors: ['#0156a6', '#9CA3AF']
    };

    const weeklyWaterSeries = [
        {
            name: 'Actual Consumption',
            data: weeklyWaterData.length > 0
                ? weeklyWaterData.map(item => item.actual)
                : [0]
        },
        {
            name: 'Target',
            data: weeklyWaterData.length > 0
                ? weeklyWaterData.map(item => item.target)
                : [0]
        }
    ];

    // Card styles
    const cardStyle1 = {
        borderRadius: '16px',
        boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        backgroundColor: '#FFFFFF'
    };

    const titleStyle1 = {
        fontSize: '16px',
        fontWeight: 600,
        color: '#1F2937',
        fontFamily: 'sans-serif'
    };
    const cardStyle = {
        width: '200px',
        height: '100px',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column'
    };

    const titleStyle = {
        fontSize: '15px',
        fontWeight: 600,
        color: '#1F2937',
        fontFamily: 'sans-serif'
    };

    const styles = {
        mainContent: {
            width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)',
            maxWidth: sidebarVisible ? '1600px' : '1800px',
            minHeight: '89vh',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            marginLeft: '8px',
        }
    };

    const getCardWidth = () => sidebarVisible ? '176px' : '247px';
    const getChartCardWidth = () => sidebarVisible ? '500px' : '247px';
    const getChartCardWidth1 = () => sidebarVisible ? '670px' : '1100px';
    const getAlertsCardWidth = () => sidebarVisible ? '150px' : '240px';

    const responsiveCardStyle = {
        ...cardStyle,
        width: {
            xs: 'calc(40% - 0px)',
            sm: 'calc(30% - 10px)',
            md: getCardWidth()
        },
        padding: { xs: '10px', md: '16px' },
        marginLeft: { xs: '-20px', sm: '5px', md: '3px' },
        flexShrink: 0,
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h6" color="error">Error: {error}</Typography>
            </Box>
        );
    }

    return (
        <Box style={styles.mainContent} id="main-content">
            {!loading && !error && dashboardData && (
                <>
                    {/* Top Summary Cards Row */}
                    <Box sx={{ paddingLeft: '10px', paddingRight: '10px', paddingBottom: '10px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginLeft: { xs: '0px', md: '-35px' }, justifyContent: { xs: 'flex-start', md: 'center' } }}>
                            {/* Card 1: Raw Water Inlet */}
                            <Card sx={responsiveCardStyle}>
                                <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', fontSize: '17px', fontWeight: 600 }} />
                                        <Typography sx={titleStyle}>Raw Water Inlet</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                            {dashboardData.raw_water_inlet?.current?.toFixed(1) || '0.0'} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Card 2: Raw Water Outlet */}
                            <Card sx={{ ...responsiveCardStyle }}>
                                <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', fontSize: '17px', fontWeight: 600 }} />
                                        <Typography sx={titleStyle}>Raw Water Outlet</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                            {dashboardData.raw_water_outlet?.current?.toFixed(1) || '0.0'} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Card 3: Filter Water Outlet */}
                            <Card sx={responsiveCardStyle}>
                                <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <LocalFireDepartmentOutlinedIcon sx={{ color: '#0156a6', fontSize: '17px', fontWeight: 600 }} />
                                        <Typography sx={titleStyle}>Filter Water Outlet</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                            {dashboardData.filter_water_outlet?.current?.toFixed(1) || '0.0'} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Card 4: Drinking RO */}
                            <Card sx={responsiveCardStyle}>
                                <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <LocalDrinkOutlinedIcon sx={{ color: '#0156a6', fontSize: '17px', fontWeight: 600 }} />
                                    </Box>
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={titleStyle}>Drinking RO</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center">
                                        <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                            {dashboardData.drinking_ro?.current?.toFixed(1) || '0.0'} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Card 5: Water Positivity */}
                            <Card sx={responsiveCardStyle}>
                                <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center" mb="10px">
                                        <WaterDropOutlinedIcon sx={{ color: '#0156a6', fontSize: '17px', fontWeight: 600 }} />
                                    </Box>
                                    <Box display="flex" alignItems="center" justifyContent="center">
                                        <Typography sx={titleStyle}>Water Positivity</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center">
                                        <Typography sx={{ fontSize: '30px', fontWeight: 'bold', color: waterPositivity >= 0 ? '#16A34A' : '#DC2626' }}>
                                            {waterPositivity.toFixed(1)} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                    {/* Chart Section Layout */}
                    <Box sx={{ backgroundColor: '', padding: '0px', marginLeft: '-20px' }}>
                        <Grid container spacing={3} justifyContent="center" gap={'10px'}>
                            {/* Left Column - 2 Stacked Cards */}
                            <Grid item xs={12} sm={12} md={8}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'row', md: 'row', lg: 'column' }, gap: '10px', width: { xs: '92%', md: '100%', sm: '130%', lg: '100%' }, marginLeft: { xs: '0px', md: '0px', sm: '-100px', lg: '0px' }, padding: { xs: '0px', md: '0px', sm: '5px', lg: '0px' } }}>
                                    {/* Sewage Inlet Card */}
                                    <Card sx={{ ...cardStyle1, width: { xs: '85%', sm: 'calc(100% - 7px)', md: getChartCardWidth() }, height: '100px', padding: { xs: '20px', sm: '60px', md: '20px' }, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', } }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <Typography sx={titleStyle}>Sewage Inlet</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center" mb="10px">
                                                <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                                    {dashboardData.sewage_inlet?.current?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Sewage Outlet Card */}
                                    <Card sx={{ ...cardStyle1, width: { xs: '85%', sm: 'calc(100% - 7px)', md: getChartCardWidth() }, height: '100px', padding: { xs: '20px', sm: '60px', md: '20px' }, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', } }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <Typography sx={titleStyle}>Sewage Outlet</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center" mb="10px">
                                                <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                                    {dashboardData.sewage_outlet?.current?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Total Stations Card */}
                                    <Card sx={{ ...cardStyle1, width: { xs: '85%', sm: 'calc(100% - 7px)', md: getChartCardWidth() }, height: '100px', padding: { xs: '20px', sm: '60px', md: '20px' }, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', } }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <LocalDrinkOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '20px' }} />
                                            </Box>
                                            <Box display="flex" justifyContent="center" mt="10px">
                                                <Typography sx={titleStyle}>Total Stations</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center" mt="10px">
                                                <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                                    {dashboardData.total_stations || slaveList.length}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Grid>

                            {/* Right Column - Chart & Alerts Card */}
                            <Grid item xs={12} sm={12} md={12}>
                                <Card sx={{ ...cardStyle1, width: isMobile ? '85%' : isTablet ? '100%' : getChartCardWidth1(), height: { xs: 'auto', md: '399px' }, padding: { xs: '20px', sm: '28px', md: '20px', lg: '20px' }, marginLeft: { sm: '40px', md: '-20px', lg: '0px' }, marginBottom: '10px', transition: 'all 0.3s ease' }}>
                                    <Grid container spacing={2}>
                                        {/* Left Column - Charts */}
                                        <Grid item xs={12} sm={12} md={8}>
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography sx={titleStyle1}>
                                                        Monthly Water Consumption
                                                        {selectedSlave && <span style={{ fontSize: '14px', color: '#6B7280', marginLeft: '8px' }}>- {selectedSlave.slave_name}</span>}
                                                    </Typography>

                                                    {/* Updated Buttons with Icons */}
                                                    <Box display="flex" gap={1}>
                                                        <button
                                                            onClick={() => setActiveChart('bar')}
                                                            style={{
                                                                padding: '4px 12px',
                                                                backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0',
                                                                color: activeChart === 'bar' ? 'white' : '#333',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveChart('line')}
                                                            style={{
                                                                padding: '4px 12px',
                                                                backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0',
                                                                color: activeChart === 'line' ? 'white' : '#333',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                                            </svg>
                                                        </button>
                                                    </Box>
                                                </Box>

                                                {/* Chart Container with Loading Overlay */}
                                                <Box sx={{ width: { xs: '100%', sm: '240%', md: 570, lg: 844 }, position: 'relative' }}>
                                                    {chartLoading && (
                                                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                                                            <CircularProgress />
                                                        </Box>
                                                    )}
                                                    <Chart
                                                        options={activeChart === 'bar' ? weeklyWaterBarOptions : weeklyWaterLineOptions}
                                                        series={weeklyWaterSeries}
                                                        type={activeChart}
                                                        height={350}
                                                        width="100%"
                                                    />
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {/* Right Column - Alerts Panel */}
                                        <Grid item xs={12} sm={12} md={4} sx={{ width: { xs: '100%', md: getAlertsCardWidth() }, padding: '10px', marginLeft: sidebarVisible ? '0px' : '0px', marginTop: { xs: '20px', md: '0px' } }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Search slaves..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                                sx={{ marginBottom: '8px', '& .MuiOutlinedInput-root': { borderRadius: '8px', height: '40px' } }}
                                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }}
                                            />

                                            <Box sx={{ maxHeight: "340px", overflowY: "auto", scrollbarWidth: "thin" }}>
                                                {slaveListLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                                                        <CircularProgress size={24} />
                                                    </Box>
                                                ) : Array.isArray(slaveList) ? (
                                                    slaveList
                                                        .filter(slave => slave.slave_name && slave.slave_name.toLowerCase().includes(searchTerm))
                                                        .map((slave, index) => (
                                                            <Tooltip key={slave.slave_id} title={slave.slave_name} placement="right" arrow>
                                                                <Box
                                                                    sx={{
                                                                        height: '25px',
                                                                        padding: '10px 20px',
                                                                        borderRadius: '8px',
                                                                        marginBottom: '10px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        backgroundColor: selectedSlave?.slave_id === slave.slave_id ? '#E3F2FD' : (index % 2 === 0 ? '#F9FAFB' : '#FFFFFF'),
                                                                        border: selectedSlave?.slave_id === slave.slave_id ? '2px solid #E5E7EB' : '1px solid #E5E7EB',
                                                                        transition: 'all 0.3s ease',
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            backgroundColor: '#F3F4F6',
                                                                            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15)',
                                                                            transform: 'translateY(-2px)',
                                                                            border: '1px solid #0a223e'
                                                                        }
                                                                    }}
                                                                    onClick={() => handleSlaveSelect(slave)}
                                                                >
                                                                    <Box sx={{ marginRight: '8px', color: '#444444', fontWeight: 'bold', marginTop: "10px" }}>
                                                                        <FlashOnIcon fontSize="small" />
                                                                    </Box>
                                                                    <Typography sx={{ fontSize: '14px', color: '#444444', fontWeight: 'bold', fontFamily: 'ubuntu, sans-serif', cursor: 'pointer', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                                                                        {truncateText(slave.slave_name)}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        ))
                                                ) : null}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Snackbar for notifications */}
                    <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
                </>
            )}
        </Box>
    );
};

export default WaterDashboard;