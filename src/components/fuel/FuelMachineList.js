import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Modal,
    IconButton,
    Tabs,
    Tab,
    Divider,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Mock data for fuel generators and tanks
const mockFuelData = {
    data: {
        generators: [
            {
                id: 1,
                name: "DG 1500 KVA",
                status: "Online",
                fuelLevel: 70.91,
                consumed: 0,
                refilled: 0,
                temperature: 25,
                fuelCapacity: 780,
                lastActivity: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
            },
            {
                id: 2,
                name: "DG 380 KVA",
                status: "Online",
                fuelLevel: 53,
                consumed: 0,
                refilled: 0,
                temperature: 24,
                fuelCapacity: 583,
                lastActivity: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
            },
            {
                id: 3,
                name: "DG 625 KVA",
                status: "Online",
                fuelLevel: 37.36,
                consumed: 0,
                refilled: 0,
                temperature: 24,
                fuelCapacity: 411,
                lastActivity: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
            },
            {
                id: 4,
                name: "Mother Tank",
                status: "Online",
                fuelLevel: 38.7,
                consumed: 0,
                refilled: 0,
                temperature: 29,
                fuelCapacity: 1548,
                lastActivity: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
            }
        ]
    }
};

// Function to generate mock trend data
const generateMockTrendData = (parameter) => {
    const data = [];
    const now = new Date();
    let baseValue;

    // Set base value based on parameter
    switch (parameter) {
        case 'fuelLevel':
            baseValue = 50;
            break;
        case 'consumed':
            baseValue = 10;
            break;
        case 'refilled':
            baseValue = 5;
            break;
        case 'temperature':
            baseValue = 25;
            break;
        default:
            baseValue = 0;
    }

    // Generate data points for the last 6 hours (one every 30 minutes)
    for (let i = 12; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 30 * 60000);
        // Add some random variation to the base value
        const variation = (Math.random() - 0.5) * baseValue * 0.2;
        const value = baseValue + variation;

        data.push({
            timestamp: timestamp.toISOString(),
            value: parseFloat(value.toFixed(2))
        });
    }

    return data;
};

const FuelMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'fuelLevel':
                return '%';
            case 'consumed':
                return 'Ltrs';
            case 'refilled':
                return 'Ltrs';
            case 'temperature':
                return '°C';
            default:
                return '';
        }
    };

    // Get parameter label
    const getParameterLabel = (parameter) => {
        switch (parameter) {
            case 'fuelLevel':
                return 'Fuel Level';
            case 'consumed':
                return 'Consumed';
            case 'refilled':
                return 'Refilled';
            case 'temperature':
                return 'Temperature';
            default:
                return 'Value';
        }
    };

    // State variables
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedGenerator, setSelectedGenerator] = useState(null);
    const [chartType, setChartType] = useState('fuelLevel');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('fuelLevel');
    const [fuelData] = useState(mockFuelData);

    // Function to fetch trend data (now using mock data)
    const fetchTrendData = (generatorId, parameter) => {
        const mockData = generateMockTrendData(parameter);
        setTrendData(mockData);
        return mockData;
    };

    // Function to format timestamp for tooltip - showing only time
    const formatTimestampForTooltip = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Define styles
    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '86.4vh',
            fontFamily: '"Ubuntu", sans-serif',
            fontSize: '14px',
            color: '#5A5A5A',
            marginBottom: '20px',
            marginLeft: '5px',
        },
        headerContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
        },
        title: {
            fontSize: '24px',
            fontWeight: 600,
            color: '#0F2A44',
            fontFamily: 'sans-serif',
        },
        generatorCard: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            minHeight: '400px', // Add minimum height for consistency
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
        },
        cardHeader: {
            // backgroundColor: '#0156a6',
            color: 'black',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        cardTitle: {
            fontSize: '18px',
            fontWeight: 600,
        },
        statusChip: {
            backgroundColor: 'white',
            border: '1px solid',
            color: '#30b44a',
            fontSize: '12px',
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: '4px',
        },
        cardContent: {
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
        },
        fuelLevelContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        fuelLevelHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        fuelLevelTitle: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
        },
        fuelLevelValue: {
            fontSize: '18px',
            fontWeight: 700,
            color: '#0156a6',
        },
        // NEW STYLE for the container of the bar and labels
        fuelLevelBarContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        // NEW STYLE for the percentage labels
        percentageLabel: {
            fontSize: '12px',
            color: '#666',
            minWidth: '35px', // Ensures alignment
            textAlign: 'center',
        },
        progressBar: {
            height: '10px',
            borderRadius: '5px',
            backgroundColor: '#e0e0e0',
            overflow: 'hidden',
            flex: 1, // Allows the bar to take up available space
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#0156a6', // Default color, can be overridden
        },
        metricsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
        },
        metricCard: {
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'left',
            justifyContent: 'left',
            transition: 'all 0.3s ease',
            '&:hover': {
                backgroundColor: '#e9ecef',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }
        },
        metricLabel: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#555',
            marginBottom: '4px',
            textAlign: 'left',
        },
        metricValue: {
            fontSize: '16px',
            fontWeight: 700,
            color: '#0156a6',
            textAlign: 'center',
        },
        metricUnit: {
            fontSize: '12px',
            color: '#666',
            marginLeft: '4px',
        },
        lastActivityContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid #e0e0e0',
        },
        lastActivityText: {
            fontSize: '12px',
            color: '#666',
        },
        trendButton: {
            backgroundColor: '#0156a6',
            color: 'white',
            '&:hover': {
                backgroundColor: '#014282',
            },
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '4px',
        },
        modal: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        modalPaper: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80%',
            overflow: 'auto',
            position: 'relative',
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
        },
        closeButton: {
            position: 'absolute',
            top: '10px',
            right: '10px',
        },
        // Add a responsive grid container style
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            // padding: '20px',
            '@media (max-width: 1200px)': {
                gridTemplateColumns: 'repeat(2, 1fr)',
            },
            '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr',
            },
        },
        gridItem: {
            display: 'flex',
            flexDirection: 'column',
        },
    };

    // Chart data for trend
    const chartOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
            background: '#FFFFFF',
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        markers: {
            size: 4,
        },
        grid: {
            borderColor: '#ebe5e5',
            strokeDashArray: 0,
            xaxis: {
                lines: {
                    show: false,
                },
            },
            yaxis: {
                lines: {
                    show: false,
                },
            },
        },
        xaxis: {
            title: {
                text: 'Time',
                style: {
                    color: '#6B7280',
                    fontSize: '12px',
                },
            },
            categories: trendData.map(item => {
                const date = new Date(item.timestamp);
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }),
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '11px',
                },
                rotate: -45,
                formatter: function (val) {
                    return val;
                },
            },
            tickAmount: 6,
        },
        yaxis: {
            title: {
                text: getParameterUnit(selectedParameter),
                style: {
                    color: '#6B7280',
                    fontSize: '12px',
                },
            },
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '11px',
                },
                formatter: function (val) {
                    return parseFloat(val).toFixed(2);
                }
            },
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: {
                format: 'dd/MM/yyyy HH:mm',
            },
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const item = trendData[dataPointIndex];
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();
                const value = series[0][dataPointIndex];

                return `<div style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 12px;">${formattedDate}</div>
                    <div style="display: flex; align-items: center;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #0156a6; margin-right: 8px;"></span>
                        <span style="flex: 1; color: #333; font-size: 12px;">${getParameterLabel(selectedParameter)}:</span>
                        <span style="font-weight: bold; color: #333; margin-left: 5px; font-size: 12px;">${value} ${getParameterUnit(selectedParameter)}</span>
                    </div>
                </div>`;
            }
        },
        legend: {
            show: true,
        },
    };

    // Chart series
    const chartSeries = [{
        name: getParameterLabel(selectedParameter),
        data: trendData.map(item => item.value)
    }];

    // Function to render a generator card
    const renderGeneratorCard = (generator) => {
        if (!generator) return null;

        // Format the last activity time
        const formatLastActivity = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        return (
            <Card style={styles.generatorCard}>
                <Box style={styles.cardHeader}>
                    <Typography style={styles.cardTitle}>{generator.name}</Typography>
                    <Chip
                        label={generator.status}
                        style={styles.statusChip}
                        size="small"
                    />
                </Box>
                <CardContent style={styles.cardContent}>
                    {/* Fuel Level Section - UPDATED */}
                    <Box style={styles.fuelLevelContainer}>
                        <Box style={styles.fuelLevelHeader}>
                            <Typography style={styles.fuelLevelTitle}><LocalGasStationIcon  fontSize="10px" color="black" /> Fuel Level</Typography>
                            <Typography style={styles.fuelLevelValue}>{generator.fuelLevel}%</Typography>
                        </Box>
                        <Box style={styles.fuelLevelBarContainer}>
                            <Typography variant="body2" style={styles.percentageLabel}>0%</Typography>
                            <Box style={styles.progressBar}>
                                <Box
                                    style={{
                                        ...styles.progressFill,
                                        width: `${generator.fuelLevel}%`,
                                        backgroundColor: '#4caf50', // Green color to match the image
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" style={styles.percentageLabel}>100%</Typography>
                        </Box>
                        <Typography variant="body2" style={{ fontSize: '12px', color: '#666' }}>
                            {generator.fuelCapacity} Ltrs
                        </Typography>
                    </Box>

                    {/* Metrics Cards Grid */}
                    <Box style={styles.metricsGrid}>
                        {/* Consumed Card */}
                        <Card style={styles.metricCard}>
                            <Typography style={styles.metricLabel}>
                                 <LocalGasStationIcon  fontSize="10px" color="black" /> Consumed</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography style={styles.metricValue}>
                                    {generator.consumed}
                                </Typography>
                                <Typography style={styles.metricUnit}>Ltrs</Typography>
                            </Box>
                        </Card>

                        {/* Refilled Card */}
                        <Card style={styles.metricCard}>
                            <Typography style={styles.metricLabel}>
                                 <AddCircleOutlineIcon fontSize="10px" color="black" /> Refilled</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography style={styles.metricValue}>
                                    {generator.refilled}
                                </Typography>
                                <Typography style={styles.metricUnit}>Ltrs</Typography>
                            </Box>
                        </Card>

                        {/* Temperature Card */}
                        <Card style={styles.metricCard}>
                            <Typography style={styles.metricLabel}>
                                 <DeviceThermostatIcon fontSize="10px" color="black" /> Temperature</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography style={styles.metricValue}>
                                    {generator.temperature}
                                </Typography>
                                <Typography style={styles.metricUnit}>°C</Typography>
                            </Box>
                        </Card>

                        {/* Fuel Level Card */}
                        <Card style={styles.metricCard}>
                            <Typography style={styles.metricLabel}><LocalFireDepartmentOutlinedIcon sx={{ color: 'black', fontSize: '10px' }} /> Fuel Level</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography style={styles.metricValue}>
                                    {generator.fuelCapacity}
                                </Typography>
                                <Typography style={styles.metricUnit}>Ltrs</Typography>
                            </Box>
                        </Card>
                    </Box>

                    {/* Last Activity and Trend Button */}
                    <Box style={styles.lastActivityContainer}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: '#666' }} />
                            <Typography style={styles.lastActivityText}>
                                {formatLastActivity(generator.lastActivity)}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            style={styles.trendButton}
                            // startIcon={<TrendingUpIcon />}
                            onClick={async () => {
                                setSelectedGenerator(generator.name);
                                setChartType('fuelLevel');
                                setChartModalOpen(true);
                                await fetchTrendData(generator.id, selectedParameter);
                            }}
                        >
                            Trend
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Grid Container for Generator Cards */}
            <Box style={styles.gridContainer}>
                {fuelData?.data?.generators?.map((generator) => (
                    <Box style={styles.gridItem} key={generator.id}>
                        {renderGeneratorCard(generator)}
                    </Box>
                ))}
            </Box>

            {/* Chart Modal */}
            <Modal
                open={chartModalOpen}
                onClose={() => setChartModalOpen(false)}
                aria-labelledby="chart-modal-title"
                aria-describedby="chart-modal-description"
                style={styles.modal}
            >
                <Box style={styles.modalPaper}>
                    <Box style={styles.modalHeader}>
                        <Box>
                            <Typography id="chart-modal-title" variant="h6" component="h2">
                                {selectedGenerator} - Last 6 hours {getParameterLabel(selectedParameter)} data
                            </Typography>
                            <Box style={{ marginTop: '10px' }}>
                                <FormControl size="small" sx={{ minWidth: 200, marginBottom: 2 }}>
                                    <InputLabel>Parameter</InputLabel>
                                    <Select
                                        value={selectedParameter}
                                        onChange={async (e) => {
                                            const newParameter = e.target.value;
                                            setSelectedParameter(newParameter);

                                            // Find the selected generator by name to get its id
                                            const selectedGen = fuelData?.data?.generators?.find(
                                                g => g.name === selectedGenerator
                                            );
                                            if (selectedGen) {
                                                await fetchTrendData(selectedGen.id, newParameter);
                                            }
                                        }}
                                        label="Parameter"
                                    >
                                        <MenuItem value="fuelLevel">Fuel Level</MenuItem>
                                        <MenuItem value="consumed">Consumed</MenuItem>
                                        <MenuItem value="refilled">Refilled</MenuItem>
                                        <MenuItem value="temperature">Temperature</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        <IconButton
                            style={styles.closeButton}
                            onClick={() => setChartModalOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box id="chart-modal-description">
                        <Chart
                            options={chartOptions}
                            series={chartSeries}
                            type="line"
                            height={350}
                        />
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default FuelMachineList;