import React, { useState } from 'react';
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
    Button
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
import ShowChartIcon from '@mui/icons-material/ShowChart';

const FuelDashboard = ({ onSidebarToggle, sidebarVisible }) => {
    const [fuelPositivity, setFuelPositivity] = useState(26.0);
    const truncateText = (text, length = 9) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // Static data instead of API calls
    const [dashboardData] = useState({
        devices: { total: 4, online: 4, offline: 0 },
        fuel_consumption: {
            mtd: { value: 1250.5, cost: 12500.50 },
            today: { value: 45.8, cost: 458.00 },
            yesterday: { value: 52.3, cost: 523.00 },
            unit: 'Ltrs.'
        },
        carbon_footprints: {
            main: 875.35,
            backup: 0,
            green: 0,
            unit: 'tCO2'
        }
    });

    const [generatorList] = useState([
        { id: 1, name: 'DG 1500 KVA', status: 'online' },
        { id: 2, name: 'DG 625 KVA', status: 'online' },
        { id: 3, name: 'Mother Tank', status: 'online' },
        { id: 4, name: 'DG 380 KVA', status: 'online' }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenerator, setSelectedGenerator] = useState(generatorList[0]);
    const [activeChart, setActiveChart] = useState('bar'); // 'line' or 'bar'

    // Static daily fuel consumption data (13 days)
    const [dailyFuelData] = useState([
        { day: '1/2', consumption: 75 },
        { day: '3/2', consumption: 65 },
        { day: '5/2', consumption: 85 },
        { day: '7/2', consumption: 70 },
        { day: '9/2', consumption: 92 },
        { day: '11/2', consumption: 82 },
        { day: '13/2', consumption: 100 }
    ]);

    // Function to handle generator selection
    const handleGeneratorSelect = (generator) => {
        setSelectedGenerator(generator);
        console.log('Selected generator:', generator.name);
    };

    // Extract data from static data
    const generatorsData = dashboardData?.devices || { total: 0, online: 0, offline: 0 };
    const fuelConsumption = dashboardData?.fuel_consumption || 0;
    const fuelConsumptionUnit = dashboardData?.fuel_consumption?.unit || 'Ltrs.';
    const carbonFootprints = dashboardData?.carbon_footprints || 0;

    // Helper function to calculate appropriate y-axis values based on data range
    const calculateYAxis = (data) => {
        if (data.length === 0) {
            return { min: 0, max: 120, tickAmount: 5, stepSize: 24 };
        }

        const maxValue = Math.max(...data);

        // For fuel consumption, we want to show 0, 25, 50, 75, 100, 125, etc.
        // So we'll round up to the nearest 25
        const max = Math.ceil(maxValue / 25) * 25;

        return {
            min: 0,
            max: max < 25 ? 25 : max,
            tickAmount: max / 25 + 1,
            stepSize: 25
        };
    };

    // Dynamic chart configuration for daily fuel consumption - BAR CHART
    const dailyFuelBarOptions = {
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
                columnWidth: '35%',
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
            categories: dailyFuelData.length > 0
                ? dailyFuelData.map(item => item.day)
                : ['-'],
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: 'Date',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        yaxis: {
            min: 0,
            max: calculateYAxis(dailyFuelData.map(item => item.consumption)).max,
            tickAmount: calculateYAxis(dailyFuelData.map(item => item.consumption)).tickAmount,
            stepSize: calculateYAxis(dailyFuelData.map(item => item.consumption)).stepSize,
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' },
                formatter: (val) => val
            },
            axisBorder: { show: false },
            title: {
                text: 'Fuel Consumed (Ltrs.)',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: dailyFuelData.length > 0,
            theme: 'light',
            style: { fontSize: '12px' },
            y: {
                formatter: function (val) {
                    return `${val} Ltrs.`;
                }
            }
        },
        legend: {
            show: false
        },
        colors: ['#0156a6'] // Blue for fuel consumption
    };

    // Dynamic chart configuration for daily fuel consumption - LINE CHART
    const dailyFuelLineOptions = {
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
            categories: dailyFuelData.length > 0
                ? dailyFuelData.map(item => item.day)
                : ['-'],
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: 'Date',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        yaxis: {
            min: 0,
            max: calculateYAxis(dailyFuelData.map(item => item.consumption)).max,
            tickAmount: calculateYAxis(dailyFuelData.map(item => item.consumption)).tickAmount,
            stepSize: calculateYAxis(dailyFuelData.map(item => item.consumption)).stepSize,
            labels: {
                style: { colors: '#6B7280', fontSize: '12px' },
                formatter: (val) => val
            },
            axisBorder: { show: false },
            title: {
                text: 'Fuel Consumed (Ltrs.)',
                style: { color: '#6B7280', fontSize: '12px' }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: dailyFuelData.length > 0,
            theme: 'light',
            style: { fontSize: '12px' },
            y: {
                formatter: function (val) {
                    return `${val} Ltrs.`;
                }
            }
        },
        legend: {
            show: false
        },
        colors: ['#0156a6'] // Blue for fuel consumption
    };

    const dailyFuelSeries = [
        {
            name: 'Fuel Consumption',
            data: dailyFuelData.length > 0
                ? dailyFuelData.map(item => item.consumption)
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
        PaddingLeft: '100px',
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

    // Define styles based on the provided requirements
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

    // Calculate responsive card widths based on sidebar visibility
    const getCardWidth = () => {
        if (sidebarVisible) {
            return '176px'; // Smaller width when sidebar is visible
        }
        return '247px'; // Original width when sidebar is hidden
    };

    // Donut chart options for fuel station status
    const donutOptions = {
        chart: {
            type: 'donut',
            height: 250,
            background: 'transparent',
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1F2937'
                        }
                    }
                }
            }
        },
        labels: ['Online - 4', 'Offline - 0'],
        colors: ['#16A34A', '#DC2626'],
        dataLabels: {
            enabled: false
        },
        legend: {
            offsetY: 20,
            offsetX: -40,
            position: 'right',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 700,
        },
        tooltip: {
            theme: 'light',
            style: { fontSize: '12px' }
        }
    };

    const donutSeries = [generatorsData.online, generatorsData.offline];

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Main Layout Container */}
            <Box sx={{
                display: 'flex',
                height: '100%',
                // padding: '20px',
                gap: '20px'
            }}>
                {/* Left Column - Fuel Station Status and Generator List */}
                <Box sx={{
                    width: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {/* Fuel Station Status Card */}
                    <Card sx={{
                        ...cardStyle1,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '200px'
                    }}>
                        <Typography
                            sx={{ ...titleStyle1, textAlign: 'left', width: '100%' }} mb={2}>
                            Fuel Station
                        </Typography>

                        <Chart
                            options={donutOptions}
                            series={donutSeries}
                            type="donut"
                            height={250}
                            width={300}
                        />
                    </Card>

                    {/* Generator List Card */}
                    <Card sx={{
                        ...cardStyle1,
                        padding: '20px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Typography sx={titleStyle1}></Typography>
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {generatorList.map((generator) => (
                                <Box
                                    key={generator.id}
                                    sx={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: selectedGenerator?.id === generator.id ? '#E3F2FD' : '#F9FAFB',
                                        border: selectedGenerator?.id === generator.id ? '2px solid #0156a6' : '1px solid #E5E7EB',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#F3F4F6',
                                            border: '1px solid #0156a6'
                                        }
                                    }}
                                    onClick={() => handleGeneratorSelect(generator)}
                                >
                                    <ShowChartIcon sx={{ color: '#a855f7', fontSize: 28 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {generator.name}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Box>

                {/* Right Column - Fuel Consumption Chart */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Card sx={{
                        ...cardStyle1,
                        padding: '20px',
                        height: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: '40px'
                    }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography sx={titleStyle1}>{selectedGenerator.name}, February 2026</Typography>
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
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Chart
                                options={activeChart === 'bar' ? dailyFuelBarOptions : dailyFuelLineOptions}
                                series={dailyFuelSeries}
                                type={activeChart}
                                height={400}
                                width={800}
                            />
                        </Box>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default FuelDashboard;