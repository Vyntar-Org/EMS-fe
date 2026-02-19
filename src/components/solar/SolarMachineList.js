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
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Mock data for solar machine list
const mockSolarMachineListData = {
    data: {
        machines: [
            {
                slave_id: 1,
                name: "VAM",
                no: "S001",
                status: "ONLINE",
                location: "Solar Plant - Area A",
                last_ts: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
                latest: {
                    flow_rate: 45.2,
                    inlet_temperature: 60,
                    outlet_temperature: 80
                },
                energy: {
                    today: 120.5,
                    mtd: 3615.2
                },
                totalizer: {
                    value: 1250.75,
                    timestamp: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
                }
            },
            {
                slave_id: 2,
                name: "Tower1",
                no: "S002",
                status: "ONLINE",
                location: "Solar Plant - Area B",
                last_ts: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
                latest: {
                    flow_rate: 52.8,
                    inlet_temperature: 110,
                    outlet_temperature: 100
                },
                energy: {
                    today: 145.8,
                    mtd: 4374.0
                },
                totalizer: {
                    value: 1380.25,
                    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago,
                }
            },
            {
                slave_id: 3,
                name: "Tower2",
                no: "S003",
                status: "OFFLINE",
                location: "Solar Plant - Area C",
                last_ts: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
                latest: {
                    flow_rate: 48.5,
                    inlet_temperature: 110,
                    outlet_temperature: 100
                },
                energy: {
                    today: 95.3,
                    mtd: 2859.0
                },
                totalizer: {
                    value: 1120.50,
                    timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago,
                }
            }
        ]
    }
};

// Function to generate mock trend data for solar machines
const generateMockSolarTrendData = (parameter) => {
    const data = [];
    const now = new Date();
    let baseValue;

    // Set base value based on parameter
    switch (parameter) {
        case 'flow_rate':
            baseValue = 50;
            break;
        case 'inlet_temperature':
            baseValue = 90;
            break;
        case 'outlet_temperature':
            baseValue = 95;
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

const SolarMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'flow_rate':
                return 'm³/hr';
            case 'inlet_temperature':
                return '°C';
            case 'outlet_temperature':
                return '°C';
            default:
                return '';
        }
    };

    // Get parameter label
    const getParameterLabel = (parameter) => {
        switch (parameter) {
            case 'flow_rate':
                return 'Flow Rate';
            case 'inlet_temperature':
                return 'Inlet Temperature';
            case 'outlet_temperature':
                return 'Outlet Temperature';
            default:
                return 'Value';
        }
    };

    // State variables
    const [solarMachineListData] = useState(mockSolarMachineListData);
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('flow_rate');

    // Function to fetch trend data (using mock data)
    const fetchTrendData = (slaveId, parameter) => {
        const mockData = generateMockSolarTrendData(parameter);
        setTrendData(mockData);
        return mockData;
    };

    // Function to format timestamp for tooltip - showing date and time
    const formatTimestampForTooltip = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
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
            size: 0,
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

        // Get machine type specific parameters
        const getMachineTypeParams = (machineName) => {
            switch (machineName) {
                case 'VAM':
                    return {
                        param1: 'VAM Inlet Temperature',
                        param2: 'VAM Outlet Temperature',
                        param1Unit: '°C',
                        param2Unit: '°C',
                        param1Value: latest.inlet_temperature,
                        param2Value: latest.outlet_temperature
                    };
                case 'Tower1':
                    return {
                        param1: 'Tower 1 Inlet Temperature',
                        param2: 'Tower 1 Outlet Temperature',
                        param1Unit: '°C',
                        param2Unit: '°C',
                        param1Value: latest.inlet_temperature,
                        param2Value: latest.outlet_temperature
                    };
                case 'Tower2':
                    return {
                        param1: 'Tower 2 Inlet Temperature',
                        param2: 'Tower 2 Outlet Temperature',
                        param1Unit: '°C',
                        param2Unit: '°C',
                        param1Value: latest.inlet_temperature,
                        param2Value: latest.outlet_temperature
                    };
                default:
                    return {
                        param1: 'Parameter 1',
                        param2: 'Parameter 2',
                        param1Unit: '',
                        param2Unit: '',
                        param1Value: 0,
                        param2Value: 0
                    };
            }
        };

        const machineParams = getMachineTypeParams(machine.name);

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
                            {/* The Text Container */}
                            <div>
                                {/* Main Title */}
                                <Typography style={styles.floorTitle}>
                                    {machine.name}
                                </Typography>
                            </div>
                        </div>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                                <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
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

                    {/* Temperature Data Table */}
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
                                {/* Flow Rate */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <WaterDropIcon fontSize="10px" color="primary" />
                                            Flow Rate
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machine.latest?.flow_rate || 0).toFixed(1)} m³/hr
                                    </TableCell>
                                </TableRow>

                                {/* Parameter 1 (Inlet Temperature) */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="error" />
                                            {machineParams.param1}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machineParams.param1Value || 0).toFixed(1)} {machineParams.param1Unit}
                                    </TableCell>
                                </TableRow>

                                {/* Parameter 2 (Outlet Temperature) */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="warning" />
                                            {machineParams.param2}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machineParams.param2Value || 0).toFixed(1)} {machineParams.param2Unit}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />

                    {/* MTD and Trend Button */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5
                    }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                                MTD : {(machine.energy?.mtd || 0).toFixed(1)} kWh
                            </Typography> */}
                        </Box>
                        <Box style={{ ...styles.metricsRow, display: 'flex', justifyContent: 'right' }}>
                            <Button
                                variant="contained"
                                style={styles.chartButton}
                                onClick={async () => {
                                    setSelectedFloor(machine.name);
                                    setChartModalOpen(true);

                                    // Find the selected machine by name to get its slave_id
                                    const selectedMachine = solarMachineListData?.data?.machines?.find(
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
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Custom Grid Container for 2 cards per row */}
            <Box style={styles.gridContainer}>
                {solarMachineListData?.data?.machines?.map((machine, index) => (
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
                                            const selectedMachine = solarMachineListData?.data?.machines?.find(
                                                m => m.name === selectedFloor
                                            );
                                            if (selectedMachine) {
                                                await fetchTrendData(selectedMachine.slave_id, newParameter);
                                            }
                                        }}
                                        label="Parameter"
                                    >
                                        <MenuItem value="flow_rate">Flow Rate</MenuItem>
                                        <MenuItem value="inlet_temperature">Inlet Temperature</MenuItem>
                                        <MenuItem value="outlet_temperature">Outlet Temperature</MenuItem>
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

export default SolarMachineList;