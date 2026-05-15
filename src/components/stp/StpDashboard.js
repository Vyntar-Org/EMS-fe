import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Snackbar,
    useTheme,
    useMediaQuery,
    Badge
} from '@mui/material';
import Chart from 'react-apexcharts';
import MenuIcon from '@mui/icons-material/Menu';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Import API functions (you'll need to create these)
// import { fetchSTPDashboardData, fetchLatestTimestamp } from '../../auth/stp/STPDashboardApi';

const STPDashboard = ({ onSidebarToggle, sidebarVisible }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    // State management
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    
    // Device status state
    const [deviceStatus, setDeviceStatus] = useState('Running');
    const [latestTimestamp, setLatestTimestamp] = useState('');
    const [isOnline, setIsOnline] = useState(true);

    // Metric states (these would come from API)
    const [intakeTotal, setIntakeTotal] = useState(3500);
    const [treatedWater, setTreatedWater] = useState(3500);
    
    // Gauge values
    const [phValue, setPhValue] = useState(7.2);
    const [tdsValue, setTdsValue] = useState(450);
    const [codValue, setCodValue] = useState(250);
    const [bodValue, setBodValue] = useState(120);
    const [tssValue, setTssValue] = useState(80);

    // Blower performance metrics
    const [runHours, setRunHours] = useState(1540);
    const [temperature, setTemperature] = useState(55);
    const [pressure, setPressure] = useState(2.8);
    const [power, setPower] = useState(3.9);
    const [rpm, setRpm] = useState(1250);

    // Chart data states
    const [historicalTrendsData, setHistoricalTrendsData] = useState([]);
    const [blowerUsageData, setBlowerUsageData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    // Fetch latest timestamp and device status
    useEffect(() => {
        const fetchTimestamp = async () => {
            try {
                // Replace with actual API call
                // const response = await fetchLatestTimestamp();
                
                // Simulated response for now
                const now = new Date();
                const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const day = now.getDate().toString().padStart(2, '0');
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const month = monthNames[now.getMonth()];
                const year = now.getFullYear();
                
                setLatestTimestamp(`Last updated : ${time} | ${day}-${month}-${year}`);
                setIsOnline(true);
                setDeviceStatus('Running');
            } catch (err) {
                console.error('Error fetching timestamp:', err);
                setIsOnline(false);
                setDeviceStatus('Offline');
            }
        };

        fetchTimestamp();
        const interval = setInterval(fetchTimestamp, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Replace with actual API call
                // const response = await fetchSTPDashboardOverview();
                
                // Simulated data loading
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Set mock data (replace with actual API data)
                setDashboardData({
                    intake_total: 3500,
                    treated_water: 3500,
                    ph: 7.2,
                    tds: 450,
                    cod: 250,
                    bod: 120,
                    tss: 80,
                    run_hours: 1540,
                    temperature: 55,
                    pressure: 2.8,
                    power: 3.9,
                    rpm: 1250
                });

                // Load chart data
                loadChartData();
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

    // Load chart data
    const loadChartData = () => {
        try {
            setChartLoading(true);

            // Mock historical trends data
            const historicalData = [
                { date: 'Mon', ph: 7.1, tds: 440, cod: 245, bod: 115 },
                { date: 'Tue', ph: 7.3, tds: 455, cod: 255, bod: 122 },
                { date: 'Wed', ph: 7.0, tds: 448, cod: 248, bod: 118 },
                { date: 'Thu', ph: 7.2, tds: 452, cod: 252, bod: 121 },
                { date: 'Fri', ph: 7.4, tds: 458, cod: 258, bod: 125 },
                { date: 'Sat', ph: 7.1, tds: 445, cod: 242, bod: 117 },
                { date: 'Sun', ph: 7.2, tds: 450, cod: 250, bod: 120 }
            ];
            setHistoricalTrendsData(historicalData);

            // Mock blower usage data
            const usageData = [
                { day: 'Mon', hours: 22, power: 85.5 },
                { day: 'Tue', hours: 24, power: 92.3 },
                { day: 'Wed', hours: 23, power: 88.7 },
                { day: 'Thu', hours: 24, power: 94.1 },
                { day: 'Fri', hours: 22, power: 86.2 },
                { day: 'Sat', hours: 20, power: 78.9 },
                { day: 'Sun', hours: 21, power: 82.4 }
            ];
            setBlowerUsageData(usageData);
        } catch (err) {
            console.error('Error loading chart data:', err);
            setSnackbarMessage('Failed to load chart data: ' + err.message);
            setSnackbarOpen(true);
        } finally {
            setChartLoading(false);
        }
    };

    // Gauge Chart Configuration
    const getGaugeOptions = (title, min, max, unit) => ({
        chart: {
            type: 'radialBar',
            height: 200,
            toolbar: { show: false }
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    size: '60%',
                    background: 'transparent'
                },
                track: {
                    background: '#E5E7EB',
                    strokeWidth: '97%',
                    margin: 5
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: '10px',
                        color: '#6B7280',
                        offsetY: -10
                    },
                    value: {
                        show: true,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#1F2937',
                        offsetY: - 1,
                        formatter: function (val) {
                            return val;
                        }
                    }
                }
            }
        },
        labels: [title],
        colors: ['#0156a6']
    });

    // pH Gauge Options
    const phGaugeOptions = getGaugeOptions('pH', 0, 14, '');
    const tdsGaugeOptions = getGaugeOptions('TDS', 0, 1000, 'ppm');
    const codGaugeOptions = getGaugeOptions('COD', 0, 500, 'mg/L');
    const bodGaugeOptions = getGaugeOptions('BOD', 0, 300, 'mg/L');
    const tssGaugeOptions = getGaugeOptions('TSS', 0, 200, 'mg/L');

    // Historical Trends Line Chart Options
    const historicalTrendsOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: false },
            background: 'transparent'
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        markers: {
            size: 4
        },
        grid: {
            strokeDashArray: 4,
            borderColor: 'transparent',
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true, color: '#E5E7EB' } }
        },
        xaxis: {
            categories: historicalTrendsData.map(item => item.date),
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '12px',
            labels: { colors: ['#6B7280'] }
        },
        tooltip: {
            enabled: true,
            theme: 'light'
        },
        colors: ['#0156a6', '#10B981', '#F59E0B', '#EF4444']
    };

    const historicalTrendsSeries = [
        { name: 'pH', data: historicalTrendsData.map(item => item.ph) },
        { name: 'TDS', data: historicalTrendsData.map(item => item.tds) },
        { name: 'COD', data: historicalTrendsData.map(item => item.cod) },
        { name: 'BOD', data: historicalTrendsData.map(item => item.bod) }
    ];

    // Blower Usage Column Chart Options
    const blowerUsageOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
                dataLabels: { position: 'top' }
            }
        },
        grid: {
            strokeDashArray: 4,
            borderColor: 'transparent',
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true, color: '#E5E7EB' } }
        },
        xaxis: {
            categories: blowerUsageData.map(item => item.day),
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
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            title: {
                text: 'Hours / Power %',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '12px',
            labels: { colors: ['#6B7280'] }
        },
        colors: ['#0156a6', '#10B981']
    };

    const blowerUsageSeries = [
        { name: 'Run Hours', data: blowerUsageData.map(item => item.hours) },
        { name: 'Power Usage (%)', data: blowerUsageData.map(item => item.power) }
    ];

    // Card styles
    const cardStyle = {
        borderRadius: '16px',
        boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        backgroundColor: '#FFFFFF',
        height: '70%'
    };

    const metricCardStyle = {
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50%',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.15)'
        }
    };

    const titleStyle = {
        fontSize: '16px',
        fontWeight: 600,
        color: '#1F2937',
        fontFamily: 'sans-serif'
    };

    const metricHeadingStyle = {
        fontSize: '13px',
        fontWeight: 500,
        color: '#6B7280',
        fontFamily: 'sans-serif',
        marginBottom: '8px'
    };

    const metricValueStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0156a6',
        fontFamily: 'sans-serif'
    };

    const metricUnitStyle = {
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'sans-serif',
        marginTop: '4px'
    };

    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '87vh',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            padding: '10px',
            backgroundColor: '#F9FAFB'
        },
        navbar: {
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !dashboardData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h6" color="error">Error: {error}</Typography>
            </Box>
        );
    }

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Navbar */}
            {/* <Box sx={styles.navbar}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IconButton onClick={onSidebarToggle} sx={{ color: '#374151' }}>
                        <MenuIcon />
                    </IconButton>
                    <img 
                        src="/static/images/Vyntax_Logo.png" 
                        alt="Vyntar Logo" 
                        style={{ height: '40px' }} 
                    />
                    <Box sx={{ ml: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1F2937', lineHeight: 1.2 }}>
                            STP Monitoring Dashboard
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 300 }}>
                            Live Plant Performance Overview
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '4px' }}>
                        <FiberManualRecordIcon sx={{ color: isOnline ? '#62CD62' : '#E74C3C', fontSize: '12px' }} />
                        <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: isOnline ? '#62CD62' : '#E74C3C' }}>
                            {deviceStatus}
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 300 }}>
                        {latestTimestamp}
                    </Typography>
                </Box>
            </Box> */}

            {/* Main Content */}
            {!loading && !error && dashboardData && (
                <>
                    {/* Top Row: Metrics Cards + Gauges */}
                    <Grid container spacing={2} sx={{  }}>
                        {/* Intake Total Card */}
                        <Grid item xs={12} sm={6} md={2}>
                            <Card sx={{ ...metricCardStyle, width: '100%' }}>
                                <CardContent sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                                        Intake Total
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                        (Waste Water)
                                    </Typography>
                                    <Typography sx={metricValueStyle}>
                                        {intakeTotal.toLocaleString()}
                                    </Typography>
                                    <Typography sx={metricUnitStyle}>
                                        L/m²/day
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Gauge Charts Container */}
                        <Grid item xs={12} sm={12} md={8}>
                            <Card sx={{...cardStyle, marginLeft:'35px'}}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-around', 
                                        flexWrap: 'wrap',
                                        gap: 2 
                                    }}>
                                        {/* pH Gauge */}
                                        <Box sx={{ textAlign: 'center', minWidth: '140px', marginTop: '-20px' }}>
                                            <Typography sx={metricHeadingStyle}>pH</Typography>
                                            <Chart
                                                options={phGaugeOptions}
                                                series={[phValue]}
                                                type="radialBar"
                                                height={100}
                                                width="180"
                                            />
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>mg/L</Typography>
                                        </Box>

                                        {/* TDS Gauge */}
                                        <Box sx={{ textAlign: 'center', minWidth: '140px', marginTop: '-20px'  }}>
                                            <Typography sx={metricHeadingStyle}>TDS</Typography>
                                            <Chart
                                                options={tdsGaugeOptions}
                                                series={[tdsValue]}
                                                type="radialBar"
                                                height={100}
                                                width="180"
                                            />
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>ppm</Typography>
                                        </Box>

                                        {/* COD Gauge */}
                                        <Box sx={{ textAlign: 'center', minWidth: '140px', marginTop: '-20px'  }}>
                                            <Typography sx={metricHeadingStyle}>COD</Typography>
                                            <Chart
                                                options={codGaugeOptions}
                                                series={[codValue]}
                                                type="radialBar"
                                                height={100}
                                                width="180"
                                            />
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>mg/L</Typography>
                                        </Box>

                                        {/* BOD Gauge */}
                                            <Box sx={{ textAlign: 'center', minWidth: '140px', marginTop: '-20px'  }}>
                                                <Typography sx={metricHeadingStyle}>BOD</Typography>
                                            <Chart
                                                options={bodGaugeOptions}
                                                series={[bodValue]}
                                                type="radialBar"
                                                height={100}
                                                width="180"
                                            />
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>mg/L</Typography>
                                        </Box>

                                        {/* TSS Gauge */}
                                        <Box sx={{ textAlign: 'center', minWidth: '140px', marginTop: '-20px'  }}>
                                            <Typography sx={metricHeadingStyle}>TSS</Typography>
                                            <Chart
                                                options={tssGaugeOptions}
                                                series={[tssValue]}
                                                type="radialBar"
                                                height={100}
                                                width="180"
                                            />
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>mg/L</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Treated Water Card */}
                        <Grid item xs={12} sm={6} md={2}>
                            <Card sx={{ ...metricCardStyle, width: '100%', marginLeft: '-5px' }}>
                                <CardContent sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                                        Treated Water
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                        (Out)
                                    </Typography>
                                    <Typography sx={metricValueStyle}>
                                        {treatedWater.toLocaleString()}
                                    </Typography>
                                    <Typography sx={metricUnitStyle}>
                                        L/m²/day
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Blower Performance Row */}
                    <Grid container spacing={2} sx={{ marginTop: '-50px'}}>
                        <Grid item xs={12}>
                            <Card sx={{ ...cardStyle, minHeight: '150px'}}>
                                <CardContent sx={{ p: 5 }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-around', 
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: "145px"
                                    }}>
                                        {/* Heading */}
                                        <Box sx={{ minWidth: '120px', textAlign: { xs: 'center', md: 'left' } }}>
                                            <Typography sx={{ ...metricHeadingStyle, fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                                                Blower Performance
                                            </Typography>
                                        </Box>

                                        {/* Run Hours */}
                                        <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
                                            <Typography sx={metricHeadingStyle}>Run Hours</Typography>
                                            <Typography sx={{ ...metricValueStyle, fontSize: '20px' }}>
                                                {runHours.toLocaleString()}
                                            </Typography>
                                            <Typography sx={metricUnitStyle}>hr</Typography>
                                        </Box>

                                        {/* Temperature */}
                                        <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
                                            <Typography sx={metricHeadingStyle}>Temperature</Typography>
                                            <Typography sx={{ ...metricValueStyle, fontSize: '20px' }}>
                                                {temperature}
                                            </Typography>
                                            <Typography sx={metricUnitStyle}>°C</Typography>
                                        </Box>

                                        {/* Pressure */}
                                        <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
                                            <Typography sx={metricHeadingStyle}>Pressure</Typography>
                                            <Typography sx={{ ...metricValueStyle, fontSize: '20px' }}>
                                                {pressure}
                                            </Typography>
                                            <Typography sx={metricUnitStyle}>bar</Typography>
                                        </Box>

                                        {/* Power */}
                                        <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
                                            <Typography sx={metricHeadingStyle}>Power</Typography>
                                            <Typography sx={{ ...metricValueStyle, fontSize: '20px' }}>
                                                {power}
                                            </Typography>
                                            <Typography sx={metricUnitStyle}>KW</Typography>
                                        </Box>

                                        {/* RPM & Status */}
                                        <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
                                            <Typography sx={metricHeadingStyle}>RPM</Typography>
                                            <Typography sx={{ ...metricValueStyle, fontSize: '20px' }}>
                                                {rpm.toLocaleString()}
                                            </Typography>
                                            <Badge 
                                                badgeContent={deviceStatus}
                                                color={isOnline ? 'success' : 'error'}
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts Row */}
                    <Grid container spacing={2}>
                        {/* Historical Trends Chart */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ ...cardStyle, minHeight: '300px', width: '143.5%', marginTop:'10px' }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography sx={{ ...titleStyle, mb: 2 }}>
                                        Historical Trends
                                    </Typography>
                                    <Box sx={{ position: 'relative' }}>
                                        {chartLoading && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(255,255,255,0.8)',
                                                zIndex: 10,
                                                borderRadius: '8px'
                                            }}>
                                                <CircularProgress />
                                            </Box>
                                        )}
                                        <Chart
                                            options={historicalTrendsOptions}
                                            series={historicalTrendsSeries}
                                            type="line"
                                            height={200}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Blower Usage Chart */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ ...cardStyle, minHeight: '300px', width: '88.5%', marginLeft: '200px', marginTop:'10px' }}>
                                <CardContent sx={{height: '100%' }}>
                                    <Typography sx={{ ...titleStyle, mb: 2 }}>
                                        Blower Usage
                                    </Typography>
                                    <Box sx={{ position: 'relative' }}>
                                        {chartLoading && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(255,255,255,0.8)',
                                                zIndex: 10,
                                                borderRadius: '8px'
                                            }}>
                                                <CircularProgress />
                                            </Box>
                                        )}
                                        <Chart
                                            options={blowerUsageOptions}
                                            series={blowerUsageSeries}
                                            type="bar"
                                            height={200}
                                            width='140%'
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            />
        </Box>
    );
};

// Add IconButton import at the top
import IconButton from '@mui/material/IconButton';

export default STPDashboard;