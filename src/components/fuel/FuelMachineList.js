import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
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
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Mock data for machine list
const mockMachineListData = {
    data: {
        machines: [
            {
                slave_id: 1,
                name: "DG 1500 KVA",
                status: "Online",
                fuelLevel: 70.91,
                consumed: 0,
                refilled: 0,
                temperature: 25,
                fuelCapacity: 780,
                lastActivity: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
                last_ts: new Date(Date.now() - 5 * 60000).toISOString()
            },
            {
                slave_id: 2,
                name: "DG 380 KVA",
                status: "Online",
                fuelLevel: 53,
                consumed: 0,
                refilled: 0,
                temperature: 24,
                fuelCapacity: 583,
                lastActivity: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
                last_ts: new Date(Date.now() - 10 * 60000).toISOString()
            },
            {
                slave_id: 3,
                name: "DG 625 KVA",
                status: "Online",
                fuelLevel: 37.36,
                consumed: 0,
                refilled: 0,
                temperature: 24,
                fuelCapacity: 411,
                lastActivity: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
                last_ts: new Date(Date.now() - 15 * 60000).toISOString()
            },
            {
                slave_id: 4,
                name: "Mother Tank",
                status: "Online",
                fuelLevel: 38.7,
                consumed: 0,
                refilled: 0,
                temperature: 29,
                fuelCapacity: 1548,
                lastActivity: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
                last_ts: new Date(Date.now() - 20 * 60000).toISOString()
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
        case 'consumed':
            baseValue = 15; // Base value for consumed fuel in liters
            break;
        case 'refilled':
            baseValue = 25; // Base value for refilled fuel in liters
            break;
        case 'temperature':
            baseValue = 25; // Base value for temperature in Celsius
            break;
        case 'fuelCapacity':
            baseValue = 50; // Base value for fuel level in percentage
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

        // Ensure values stay within reasonable bounds
        let finalValue = value;
        if (parameter === 'temperature') {
            finalValue = Math.max(20, Math.min(35, value)); // Temperature between 20-35°C
        } else if (parameter === 'fuelCapacity') {
            finalValue = Math.max(20, Math.min(80, value)); // Fuel level between 20-80%
        } else if (parameter === 'consumed' || parameter === 'refilled') {
            finalValue = Math.max(0, value); // Non-negative values
        }

        data.push({
            timestamp: timestamp.toISOString(),
            value: parseFloat(finalValue.toFixed(2))
        });
    }

    return data;
};

const FuelMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'consumed':
                return 'L';
            case 'refilled':
                return 'L';
            case 'temperature':
                return '°C';
            case 'fuelCapacity':
                return '%';
            default:
                return '';
        }
    };

    // Get parameter label
    const getParameterLabel = (parameter) => {
        switch (parameter) {
            case 'consumed':
                return 'Consumed';
            case 'refilled':
                return 'Refilled';
            case 'temperature':
                return 'Temperature';
            case 'fuelCapacity':
                return 'Fuel Level';
            default:
                return 'Value';
        }
    };

    // Get fuel level color based on percentage
    const getFuelLevelColor = (level) => {
        if (level > 60) return '#4caf50'; // Green
        if (level > 30) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    // State variables
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('Common');
    const [chartType, setChartType] = useState('consumed');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('consumed');
    const [machineListData] = useState(mockMachineListData);

    // Function to fetch trend data (now using mock data)
    const fetchTrendData = (slaveId, parameter) => {
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
        commonSection: {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        commonHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
        },
        onlineStatus: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        onlineIndicator: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#30b44a',
        },
        offlineIndicator: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#e34d4d',
        },
        phaseTable: {
            marginTop: '8px',
        },
        phaseTableHeader: {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
        },
        metricsRow: {
            marginTop: '12px',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
        },
        metricItem: {
            display: 'flex',
            flexDirection: 'column',
        },
        metricLabel: {
            fontSize: '11px',
            color: '#6B7280',
            marginBottom: '2px',
        },
        metricValue: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
        },
        graphCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        graphTitle: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '10px',
        },
        phaseIndicator: {
            display: 'flex',
            alignItems: 'center',
            marginRight: '10px',
        },
        phaseDot: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            marginRight: '4px',
        },
        phaseR: {
            backgroundColor: '#E34D4D', // Red
        },
        phaseY: {
            backgroundColor: '#F8C537', // Yellow
        },
        phaseB: {
            backgroundColor: '#4A90E2', // Blue
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
        chartButton: {
            backgroundColor: '#2F6FB0',
            color: 'white',
            '&:hover': {
                backgroundColor: '#1E4A7C',
            },
            marginTop: 'auto',
            alignSelf: 'flex-start',
            padding: '6px 12px',
            fontSize: '12px',
        },
        floorCard: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        floorTitle: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#1F2937',
        },
        gridContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'left',
            gap: '20px 50px',
            marginLeft: '30px'
        },
        gridItem: {
            width: '30%',
            marginBottom: '15px',
        },
        tableCell: {
            padding: '4px 8px',
            fontSize: '12px',
        },
        clockIcon: {
            fontSize: '16px',
            marginLeft: '5px',
            cursor: 'pointer',
            color: '#6B7280',
            verticalAlign: 'middle',
        },
        progressBar: {
            height: '8px',
            borderRadius: '4px',
            marginTop: '4px',
            backgroundColor: '#e0e0e0',
            width: '100%',
            position: 'relative',
        },
        progressFill: {
            height: '100%',
            borderRadius: '4px',
            backgroundColor: '#4caf50',
        },
        fuelLevelContainer: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // marginBottom: '8px',
        },
        fuelLevelText: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
        },
        fuelLevelHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px',
        },
        fuelLevelLabel: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
        },
        fuelLevelValue: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
        },
        fuelLevelBarContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        fuelLevelTitle: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#333',
        },
        percentageLabel: {
            fontSize: '12px',
            color: '#666',
            minWidth: '30px',
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
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #2F6FB0; margin-right: 8px;"></span>
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

    // Function to render a floor card
    const renderFloorCard = (machine) => {
        if (!machine) return null;

        // Check if the last timestamp is within the last 15 minutes
        const isWithinTimeLimit = (lastTs) => {
            if (!lastTs) return false;

            const lastTime = new Date(lastTs);
            const currentTime = new Date();
            const timeDiff = (currentTime - lastTime) / (1000 * 60); // Difference in minutes

            return timeDiff <= 15; // Within 15 minutes
        };

        const isOnline = machine.status === 'ONLINE' || isWithinTimeLimit(machine.last_ts);
        const latest = machine.latest || {};
        const energy = machine.energy || {};
        const totalizer = machine.totalizer || {};

        // Apply the conditional logic for values
        const getConditionalValue = (value, isAllowedField = false) => {
            if (isOnline) {
                // If online, return the actual value
                return value;
            } else {
                // If offline (more than 15 mins old), only show specific fields
                if (isAllowedField) {
                    return value;
                } else {
                    return 0; // Return 0 for all other fields
                }
            }
        };

        // Determine which fields are allowed when offline
        const conditionalLatest = {
            acte_im: getConditionalValue(latest.acte_im, true), // Allowed when offline
            temperature: getConditionalValue(latest.temperature, false),
            water: getConditionalValue(latest.water, false),
            actpr_t: getConditionalValue(latest.actpr_t, false),
            pf_t: getConditionalValue(latest.pf_t, false),
            fq: getConditionalValue(latest.fq, false),
        };

        const conditionalEnergy = {
            today: getConditionalValue(energy.today, true), // Allowed when offline
            mtd: getConditionalValue(energy.mtd, true), // Allowed when offline
        };

        // Calculate fuel level percentage
        const fuelLevelPercentage = (machine.fuelLevel / machine.fuelCapacity) * 100;

        return (
            <Card style={styles.floorCard}>
                <CardContent style={{
                    ...styles.commonSection,
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flexGrow: 1
                }}>
                    <Box style={styles.commonHeader}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {/* 2. The Text Container */}
                            <div>
                                {/* Main Title */}
                                <Typography style={styles.floorTitle}>
                                    {machine.name}
                                </Typography>

                                {/* Subtitle/Number */}
                                {/* <span style={{ fontSize: '13px', fontWeight: 'normal', color: "#6b7280" }}>
                                    {machine.no}
                                </span> */}
                            </div>
                        </div>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937', marginLeft: '10px' }}>
                                    {machine.last_ts
                                        ? new Date(machine.last_ts).toLocaleString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })
                                        : 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Fuel Level Progress Bar - Moved Above Table */}
                    <Box style={styles.fuelLevelContainer}>
                        <Box style={styles.fuelLevelHeader}>
                            <Typography style={styles.fuelLevelTitle}><LocalGasStationIcon fontSize="10px" color="black" /> Fuel Level</Typography>
                            <Typography style={styles.fuelLevelValue}>{machine.fuelLevel}%</Typography>
                        </Box>
                        <Box style={styles.fuelLevelBarContainer}>
                            <Typography variant="body2" style={styles.percentageLabel}>0%</Typography>
                            <Box style={styles.progressBar}>
                                <Box
                                    style={{
                                        ...styles.progressFill,
                                        width: `${machine.fuelLevel}%`,
                                        backgroundColor: getFuelLevelColor(machine.fuelLevel),
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" style={styles.percentageLabel}>100%</Typography>
                        </Box>
                        <Typography variant="body2" style={{ fontSize: '12px', color: '#666' }}>
                            {machine.fuelCapacity} Ltrs
                        </Typography>
                    </Box>

                    {/* Temperature/Water Data Table */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={styles.phaseTableHeader}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Parameter</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocalGasStationIcon  fontSize="10px" color="black" /> Consumed
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {machine.consumed || 0} Ltrs
                                    </TableCell>
                                </TableRow>

                                {/* Humidity */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AddCircleOutlineIcon fontSize="10px" color="black" /> Refilled
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {machine.refilled || 0} Ltrs
                                    </TableCell>
                                </TableRow>

                                {/* Battery */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="black" /> Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {machine.temperature} °C
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocalFireDepartmentOutlinedIcon sx={{ color: 'black', fontSize: '10px' }} /> Fuel Level
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {machine.fuelCapacity} Ltrs
                                    </TableCell>
                                </TableRow>
                            </TableBody>

                        </Table>
                    </TableContainer>
                    <Divider />
                    <Box style={{ ...styles.metricsRow, marginTop: '10px', display: 'flex', justifyContent: 'right' }}>
                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={async () => {
                                setSelectedFloor(machine.name);
                                setChartType('consumed');
                                setChartModalOpen(true);

                                // Find the selected machine by name to get its slave_id
                                const selectedMachine = machineListData?.data?.machines?.find(
                                    m => m.name === machine.name
                                );
                                if (selectedMachine) {
                                    await fetchTrendData(selectedMachine.slave_id, selectedParameter);
                                }
                            }}
                            sx={{ height: '30px', minWidth: '60px' }}
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
            {/* Custom Grid Container for 2 cards per row */}
            <Box style={styles.gridContainer}>
                {machineListData?.data?.machines?.map((machine, index) => (
                    <Box style={styles.gridItem} key={machine.slave_id || index}>
                        {renderFloorCard(machine)}
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
                                {selectedFloor} - Last 6 hours {getParameterLabel(selectedParameter)} data
                            </Typography>
                            <Box style={{ marginTop: '10px' }}>
                                <FormControl size="small" sx={{ minWidth: 200, marginBottom: 2 }}>
                                    <InputLabel>Parameter</InputLabel>
                                    <Select
                                        value={selectedParameter}
                                        onChange={async (e) => {
                                            const newParameter = e.target.value;
                                            setSelectedParameter(newParameter);

                                            // Find the selected machine by name to get its slave_id
                                            const selectedMachine = machineListData?.data?.machines?.find(
                                                m => m.name === selectedFloor
                                            );
                                            if (selectedMachine) {
                                                await fetchTrendData(selectedMachine.slave_id, newParameter);
                                            }
                                        }}
                                        label="Parameter"
                                    >
                                        <MenuItem value="consumed">Consumed</MenuItem>
                                        <MenuItem value="refilled">Refilled</MenuItem>
                                        <MenuItem value="temperature">Temperature</MenuItem>
                                        <MenuItem value="fuelCapacity">Fuel Level</MenuItem>
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