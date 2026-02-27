import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Badge,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    InputAdornment,
    CircularProgress,
    Alert,
    Snackbar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Search,
    Power,
    FlashOn as FlashOnIcon,
    Dns as DnsIcon,
    Balance as BalanceIcon,
    Speed as SpeedIcon,
    Co2 as Co2Icon,
    BatteryFull as BatteryIcon,
    Power as PowerIcon,
    PaddingOutlined
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';

import { fetchWaterDashboardOverview, getWaterSlaveList } from '../../auth/water/WaterDashboardApi';

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
    const [activeChart, setActiveChart] = useState('bar'); // 'line' or 'bar'

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

                    // Update water positivity state
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
                // Keep the mock data as fallback
                setSlaveList([
                    { slave_id: 1, slave_name: 'Machine 1 - Production Line A' },
                    { slave_id: 2, slave_name: 'Machine 2 - Production Line B' },
                    { slave_id: 3, slave_name: 'Machine 3 - Production Line C' },
                    { slave_id: 4, slave_name: 'Machine 4 - Production Line D' },
                    { slave_id: 5, slave_name: 'Machine 5 - Production Line E' },
                    { slave_id: 6, slave_name: 'Machine 6 - Production Line F' },
                    { slave_id: 7, slave_name: 'Machine 7 - Production Line G' },
                    { slave_id: 8, slave_name: 'Machine 8 - Production Line H' }
                ]);
            } finally {
                setSlaveListLoading(false);
            }
        };

        fetchSlaveList();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    // Static hourly energy data
    const [hourlyEnergyData] = useState({
        hours: [
            '2023-06-01T06:00:00Z',
            '2023-06-01T07:00:00Z',
            '2023-06-01T08:00:00Z',
            '2023-06-01T09:00:00Z',
            '2023-06-01T10:00:00Z',
            '2023-06-01T11:00:00Z'
        ],
        consumption: [12, 19, 15, 25, 22, 30]
    });

    // Static weekly water consumption data (7 days)
    const [weeklyWaterData] = useState(() => {
        // Generate 30 days of data starting from 30 days ago
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            // Generate realistic water consumption data
            // Base target around 1200-1600 with some variation
            const baseTarget = 1400;
            const targetVariation = Math.random() * 400 - 200; // ±200 variation
            const target = Math.round(baseTarget + targetVariation);

            // Actual consumption is usually close to target but with more variation
            const actualVariation = Math.random() * 600 - 300; // ±300 variation
            const actual = Math.round(target + actualVariation);

            // Ensure values are positive and reasonable
            data.push({
                day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toISOString().split('T')[0], // YYYY-MM-DD format
                actual: Math.max(800, Math.min(2000, actual)), // Clamp between 800-2000
                target: Math.max(1000, Math.min(1600, target))  // Clamp between 1000-1600
            });
        }

        return data;
    });

    // Static peak demand data
    const [peakDemandData] = useState({
        timestamps: [
            '2023-06-01T06:00:00Z',
            '2023-06-01T08:00:00Z',
            '2023-06-01T10:00:00Z',
            '2023-06-01T12:00:00Z',
            '2023-06-01T14:00:00Z',
            '2023-06-01T16:00:00Z',
            '2023-06-01T18:00:00Z'
        ],
        values: [120, 145, 165, 180, 175, 160, 140]
    });

    // Function to handle slave selection (no API call)
    const handleSlaveSelect = (slave) => {
        setSelectedSlave(slave);
        console.log('Selected slave:', slave.slave_name);
    };

    // Extract data from static data
    const slavesData = dashboardData?.devices || { total: 0, online: 0, offline: 0 };
    const energyConsumption = dashboardData?.energy_consumption || 0;
    const energyConsumptionUnit = dashboardData?.energy_consumption?.unit || 'kWh';
    const carbonFootprints = dashboardData?.carbon_footprints || 0;

    // Use the static hourly energy data
    const hourlyData = hourlyEnergyData.hours;
    const hourlyValues = hourlyEnergyData.consumption;

    // Helper function to format as 'HH.MM'
    const formatDateTime = (hourString) => {
        if (!hourString) return '';
        const date = new Date(hourString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${hours}.${minutes}`;
    };

    // Format hours for x-axis categories
    const hourlyCategories = hourlyData.map(hourString => {
        return formatDateTime(hourString);
    });

    const shortNumber = (value) => {
        if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
        if (value >= 1e9) return (value / 1e9).toFixed(0) + "B";
        if (value >= 1e6) return (value / 1e6).toFixed(0) + "M";
        return value.toFixed(0);
    };

    // Helper function to format timestamp as HH:MM
    const formatTimestamp = (timestampString) => {
        if (!timestampString) return '';
        const date = new Date(timestampString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Helper function to calculate appropriate y-axis values based on data range
    const calculateYAxis = (actualData, targetData) => {
        if (actualData.length === 0 && targetData.length === 0) {
            return { min: 0, max: 3200, tickAmount: 5, stepSize: 800 };
        }

        const allValues = [...actualData, ...targetData];
        const maxValue = Math.max(...allValues);

        // For water consumption, we want to show 0, 800, 1600, 2400, 3200, etc.
        // So we'll round up to the nearest 800
        const max = Math.ceil(maxValue / 800) * 800;

        return {
            min: 0,
            max: max < 800 ? 800 : max,
            tickAmount: max / 800 + 1,
            stepSize: 800
        };
    };

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
            max: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).max,
            tickAmount: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).tickAmount,
            stepSize: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).stepSize,
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
            max: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).max,
            tickAmount: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).tickAmount,
            stepSize: calculateYAxis(
                weeklyWaterData.map(item => item.actual),
                weeklyWaterData.map(item => item.target)
            ).stepSize,
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

    const valueStyle = {
        fontSize: '28px',
        fontWeight: 700,
        color: '#1F2937',
        fontFamily: 'sans-serif'
    };

    const labelStyle = {
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'sans-serif'
    };

    const miniBoxStyle = {
        width: '64px',
        height: '48px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    };

    // Define styles based on the provided requirements
    const styles = {
        mainContent: {
            width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)',
            maxWidth: sidebarVisible ? '1600px' : '1800px',
            minHeight: '89vh',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            marginLeft: '8px',
        },
        header: {
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            marginBottom: '20px'
        },
        titleRow: {
            marginTop: '20px',
            marginBottom: '20px',
        },
        topCard: {
            height: '120px',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
        },
        chartCard: {
            borderRadius: '12px',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
            height: '100%',
        },
        alertsCard: {
            height: '460px',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
        }
    };

    // Calculate responsive card widths based on sidebar visibility
    const getCardWidth = () => {
        if (sidebarVisible) {
            return '176px'; // Smaller width when sidebar is visible
        }
        return '247px'; // Original width when sidebar is hidden
    };

    // Calculate responsive chart card widths based on sidebar visibility
    const getChartCardWidth = () => {
        if (sidebarVisible) {
            return '500px'; // Smaller width when sidebar is visible
        }
        return '247px'; // Original width when sidebar is hidden
    };
    const getChartCardWidth1 = () => {
        if (sidebarVisible) {
            return '670px'; // Smaller width when sidebar is visible
        }
        return '1100px'; // Original width when sidebar is hidden
    };

    // Calculate responsive alerts card width based on sidebar visibility
    const getAlertsCardWidth = () => {
        if (sidebarVisible) {
            return '150px'; // Smaller width when sidebar is visible
        }
        return '240px'; // Original width when sidebar is hidden
    };

    // Update card styles with dynamic width
    const responsiveCardStyle = {
        ...cardStyle,
        // Corrected Width Logic:
        // Mobile (xs): 2 cards per row. Gap is 10px. Total width 100%.
        // Each card = (100% - 10px) / 2 = calc(50% - 5px).
        // Using calc(50% - 10px) provides a safe buffer to ensure they fit side-by-side.
        width: {
            xs: 'calc(40% - 0px)',
            sm: 'calc(30% - 10px)',
            md: getCardWidth()
        },
        padding: {
            xs: '10px', // Reduced padding for mobile
            md: '16px'  // Original padding for desktop
        },
        marginLeft: {
            xs: '-20px',
            sm: '5px',
            md: '3px'
        },
        flexShrink: 0, // Prevent cards from shrinking
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
        }
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Loading indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error message */}
            {error && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Typography variant="h6" color="error">
                        Error: {error}
                    </Typography>
                </Box>
            )}

            {!loading && !error && dashboardData && (
                <>

                    {/* Top Summary Cards Row */}
                    <Box sx={{
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        paddingBottom: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        // width: '100%',
                        overflow: 'hidden'
                    }}>
                        {/* Updated Inner Box for responsiveness */}
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginLeft: { xs: '0px', md: '-35px' },
                            justifyContent: { xs: 'flex-start', md: 'center' },
                            // width: '100%'
                        }}>
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
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                            Yesterday {dashboardData.raw_water_inlet?.previous?.toFixed(1) || '0.0'} KLD
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Card 2: Raw Water Outlet */}
                            <Card sx={{ ...responsiveCardStyle, }}>
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
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                            Yesterday {dashboardData.raw_water_outlet?.previous?.toFixed(1) || '0.0'} KLD
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
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                            Yesterday {dashboardData.filter_water_outlet?.previous?.toFixed(1) || '0.0'} KLD
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
                                    <Box display="flex" justifyContent="center" mt="10px">
                                        <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                            Yesterday {dashboardData.drinking_ro?.previous?.toFixed(1) || '0.0'} KLD
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
                                        <Typography
                                            sx={{
                                                fontSize: '30px',
                                                fontWeight: 'bold',
                                                color: waterPositivity >= 0 ? '#16A34A' : '#DC2626' // Green for positive, red for negative
                                            }}
                                        >
                                            {waterPositivity >= 0 ? '' : ''}{waterPositivity.toFixed(1)} KLD
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center">
                                        <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                            Yesterday {dashboardData.water_positivity?.previous?.toFixed(1) || '0.0'} KLD
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
                                {/* Flex container to handle layout direction */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row', md: 'column' },
                                    gap: '10px',
                                    width: '100%'
                                }}>
                                    {/* Sewage Inlet Card */}
                                    <Card sx={{
                                        ...cardStyle1,
                                        width: {
                                            xs: '85%',
                                            sm: 'calc(100% - 7px)',
                                            md: getChartCardWidth()
                                        },
                                        // width: isTablet ? 150 : getChartCardWidth1(),
                                        height: '100px',
                                        padding: {
                                            xs: '20px',
                                            sm: '75px',
                                            md: '20px'
                                        },
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#fff',
                                            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        }
                                    }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <Typography sx={titleStyle}>Sewage Inlet</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center" mb="10px">
                                                <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                                    {dashboardData.sewage_inlet?.current?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center">
                                                <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                                    Yesterday {dashboardData.sewage_inlet?.previous?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Sewage Outlet Card */}
                                    <Card sx={{
                                        ...cardStyle1,
                                        width: {
                                            xs: '85%',
                                            sm: 'calc(100% - 7px)',
                                            md: getChartCardWidth()
                                        },
                                        // width: isTablet ? 150 : getChartCardWidth1(),
                                        height: '100px',
                                        padding: {
                                            xs: '20px',
                                            sm: '75px',
                                            md: '20px'
                                        },
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#fff',
                                            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        }
                                    }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <Typography sx={titleStyle}>Sewage Outlet</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center" mb="10px">
                                                <Typography sx={{ fontSize: '20px', color: '#0156a6', fontWeight: 'bold' }}>
                                                    {dashboardData.sewage_outlet?.current?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="center">
                                                <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                                    Yesterday {dashboardData.sewage_outlet?.previous?.toFixed(1) || '0.0'} KLD
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Total Stations Card */}
                                    <Card sx={
                                        {
                                            ...cardStyle1,
                                            width: {
                                                xs: '85%',
                                                sm: 'calc(100% - 7px)',
                                                md: getChartCardWidth()
                                            },
                                    // width: isTablet ? 150 : getChartCardWidth1(),
                                            height: '100px',
                                            padding: {
                                                xs: '20px',
                                                sm: '75px',
                                                md: '20px'
                                            },
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: '#fff',
                                                boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                                                transform: 'translateY(-2px)',
                                            }
                                        }}>
                                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box display="flex" alignItems="center" justifyContent="center">
                                                <LocalDrinkOutlinedIcon sx={{ color: '#0156a6', mr: 1, fontSize: '20px', }} />
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
                            {/* Updated Grid item to span full width on mobile/tablet */}
                            <Grid item xs={12} sm={12} md={12}>
                                <Card sx={{
                                    ...cardStyle1,
                                    // Responsive width: 100% on mobile/tablet, original fixed width on desktop
                                    // width: { xs: '85%', sm: '100%', md: getChartCardWidth1() },
                                    width: isMobile ? '85%' : isTablet ? '100%' : getChartCardWidth1(),
                                    // Dynamic height for mobile to accommodate stacked layout
                                    height: { xs: 'auto', md: '399px' },
                                    padding: {
                                        xs: '20px',
                                        sm: '56px',
                                        md: '20px'
                                    },
                                    marginLeft: { sm: '-54px', md: '0px' },
                                    marginBottom: '10px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: '#fff',
                                        boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                                        transform: 'translateY(-2px)',
                                    }
                                }}>
                                    <Grid container spacing={2}>
                                        {/* Left Column - Charts */}
                                        {/* Updated to stack on mobile/tablet (xs=12, sm=12) */}
                                        <Grid item xs={12} sm={12} md={8}>
                                            {/* Weekly Water Consumption Chart */}
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography sx={titleStyle1}>Weekly Water Consumption</Typography>
                                                    <Box display="flex" gap={1}>
                                                        <button
                                                            onClick={() => setActiveChart('bar')}
                                                            style={
                                                                {
                                                                    padding: '4px 12px',
                                                                    backgroundColor: activeChart === 'bar' ? '#0156a6' : '#e0e0e0',
                                                                    color: activeChart === 'bar' ? 'white' : '#333',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: activeChart === 'bar' ? 'bold' : 'normal',
                                                                    fontSize: '12px'
                                                                }
                                                            }
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveChart('line')}
                                                            style={
                                                                {
                                                                    padding: '4px 12px',
                                                                    backgroundColor: activeChart === 'line' ? '#0156a6' : '#e0e0e0',
                                                                    color: activeChart === 'line' ? 'white' : '#333',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: activeChart === 'line' ? 'bold' : 'normal',
                                                                    fontSize: '12px'
                                                                }
                                                            }
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                                            </svg>
                                                        </button>
                                                    </Box>
                                                </Box>
                                                {/* Changed width to "100%" for responsiveness */}
                                                <Chart
                                                    options={activeChart === 'bar' ? weeklyWaterBarOptions : weeklyWaterLineOptions}
                                                    series={weeklyWaterSeries}
                                                    type={activeChart}
                                                    height={350}
                                                    width={isMobile ? '100%' : isTablet ? 250 : 844}
                                                />
                                            </Box>
                                        </Grid>

                                        {/* Right Column - Alerts Panel */}
                                        {/* Updated to stack on mobile/tablet (xs=12, sm=12) */}
                                        <Grid item xs={12} sm={12} md={4} sx={{
                                            width: { xs: '100%', md: getAlertsCardWidth() },
                                            // width: isTablet ? '45%' : getChartCardWidth1(),
                                            padding: '10px',
                                            marginLeft: sidebarVisible ? '0px' : '0px',
                                            marginTop: { xs: '20px', md: '0px' } // Add margin top on mobile for spacing
                                        }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Search slaves..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                                sx={{
                                                    marginBottom: '8px',
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                        height: '40px'
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon />
                                                        </InputAdornment>
                                                    ),
                                                }}
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
                                                            <Tooltip
                                                                title={slave.slave_name}
                                                                placement="right"
                                                                arrow
                                                            >
                                                                <Box
                                                                    key={slave.slave_id}
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
                                                                            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                                                                            transform: 'translateY(-2px)',
                                                                            border: '1px solid #0a223e'
                                                                        }
                                                                    }}
                                                                    onClick={() => {
                                                                        console.log('Slave list item clicked:', slave.slave_name);
                                                                        handleSlaveSelect(slave);
                                                                    }}
                                                                >
                                                                    <Box sx={{ marginRight: '8px', color: '#444444', fontWeight: 'bold', marginTop: "10px" }}>
                                                                        <FlashOnIcon fontSize="small" />
                                                                    </Box>


                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '14px',
                                                                            color: '#444444',
                                                                            fontWeight: 'bold',
                                                                            fontFamily: 'ubuntu, sans-serif',
                                                                            cursor: 'pointer',
                                                                            flex: 1,
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            maxWidth: '90px',
                                                                            transition: 'all 0.3s ease',
                                                                        }}
                                                                    >
                                                                        {truncateText(slave.slave_name)}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        ))) : null}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Snackbar for notifications */}
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={6000}
                        onClose={() => setSnackbarOpen(false)}
                        message={snackbarMessage}
                    />
                </>
            )}
        </Box>
    );
};

export default WaterDashboard;