import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Alert,
    Snackbar,
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Import API functions
import { getSolarMachineList, getSolarMachineTrend } from '../../auth/solar/SolarMachineListApi';

const SolarMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // State variables
    const [solarMachineListData, setSolarMachineListData] = useState({ data: { machines: [] } });
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('flowrate');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Fetch solar machine list on component mount
    useEffect(() => {
        fetchSolarMachineList();
    }, []);

    // Function to fetch solar machine list
    const fetchSolarMachineList = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSolarMachineList();
            setSolarMachineListData(data);
        } catch (err) {
            console.error('Error fetching solar machine list:', err);
            setError(err.message || 'Failed to fetch solar machine data');
            setSnackbarMessage(err.message || 'Failed to fetch solar machine data');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch trend data
    const fetchTrendData = async (slaveId, parameter) => {
        try {
            setTrendLoading(true);
            const response = await getSolarMachineTrend(slaveId, parameter, 6);
            if (response.success && response.data && response.data.data) {
                setTrendData(response.data.data);
            } else {
                setTrendData([]);
                setSnackbarMessage('No trend data available');
                setSnackbarOpen(true);
            }
            return response.data.data;
        } catch (err) {
            console.error('Error fetching trend data:', err);
            setTrendData([]);
            setSnackbarMessage(err.message || 'Failed to fetch trend data');
            setSnackbarOpen(true);
            return [];
        } finally {
            setTrendLoading(false);
        }
    };

    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'flowrate':
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
            case 'flowrate':
                return 'Flow Rate';
            case 'inlet_temperature':
                return 'Inlet Temperature';
            case 'outlet_temperature':
                return 'Outlet Temperature';
            default:
                return 'Value';
        }
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

    // Define styles - UPDATED FOR MOBILE RESPONSIVENESS
    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '86.4vh',
            fontFamily: '"Ubuntu", sans-serif',
            fontSize: '14px',
            color: '#5A5A5A',
            marginBottom: '20px',
            marginLeft: '5px',
            padding: '10px',
            boxSizing: 'border-box',
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
            flexWrap: 'wrap',
            gap: '8px',
        },
        onlineStatus: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
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
        // UPDATED: Responsive grid container - using sx prop instead
        gridContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            marginLeft: '0',
            padding: '0 10px',
        },
        // UPDATED: Responsive grid item - using sx prop instead
        gridItem: {
            width: '100%', // Mobile: 1 card per row
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
            width: '95%',
            maxWidth: '800px',
            maxHeight: '90%',
            overflow: 'auto',
            position: 'relative',
            margin: '10px',
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexDirection: 'column',
            gap: '10px',
        },
        closeButton: {
            position: 'absolute',
            top: '10px',
            right: '10px',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* The Text Container */}
                            <Box>
                                {/* Main Title */}
                                <Typography style={styles.floorTitle}>
                                    {machine.name}
                                </Typography>
                            </Box>
                        </Box>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: { xs: '0', sm: '10px' }, marginTop: { xs: '5px', sm: '0' } }}>
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
                                        {(machine.latest?.flow_rate || 0).toFixed(2)} m³/hr
                                    </TableCell>
                                </TableRow>

                                {/* Inlet Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="error" />
                                            {machine.name} Inlet Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machine.latest?.inlet_temperature || 0).toFixed(2)} °C
                                    </TableCell>
                                </TableRow>

                                {/* Outlet Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="warning" />
                                            {machine.name} Outlet Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machine.latest?.outlet_temperature || 0).toFixed(2)} °C
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
                        py: 0.5,
                        // flexDirection: { xs: 'column', sm: 'row' },
                        // gap: { xs: 1, sm: 0 }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                                MTD : {(machine.energy?.mtd || 0).toFixed(1)} kWh
                            </Typography> */}
                        </Box>
                        <Box style={{ ...styles.metricsRow, display: 'flex', justifyContent: 'right', marginTop: 0 }}>
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
            {loading ? (
                <Box style={styles.loadingContainer}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
                /* Custom Grid Container - RESPONSIVE using sx prop */
                <Box 
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'left',
                        gap: { xs: '15px', sm: '20px', md: '20px 50px' },
                        padding: { xs: '0 5px', sm: '0 15px', md: '0 30px' },
                    }}
                >
                    {solarMachineListData?.data?.machines?.map((machine, index) => (
                        <Box 
                            key={machine.slave_id || index}
                            sx={{
                                width: { 
                                    xs: '100%',              // Mobile: 1 card per row
                                    sm: 'calc(50% - 15px)',  // Tablet: 2 cards per row
                                    md: 'calc(33.33% - 35px)' // Desktop: 3 cards per row
                                },
                                // marginBottom: '15px',
                                // '@media (min-width: 1200px)': {
                                //     width: 'calc(30% - 35px)'
                                // }
                            }}
                        >
                            {renderFloorCard(machine)}
                        </Box>
                    ))}
                </Box>
            )}

            {/* Chart Modal - RESPONSIVE */}
            <Modal
                open={chartModalOpen}
                onClose={() => setChartModalOpen(false)}
                aria-labelledby="chart-modal-title"
                aria-describedby="chart-modal-description"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box sx={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: { xs: '15px', sm: '20px' },
                    width: { xs: '95%', sm: '90%', md: '80%' },
                    maxWidth: '800px',
                    maxHeight: { xs: '95%', sm: '90%' },
                    overflow: 'auto',
                    position: 'relative',
                    margin: '10px',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'flex-start' },
                        marginBottom: '20px',
                        gap: '10px',
                        flexWrap: 'wrap',
                    }}>
                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Typography 
                                id="chart-modal-title" 
                                variant="h6" 
                                component="h2"
                                sx={{ fontSize: { xs: '16px', sm: '18px', md: '20px' } }}
                            >
                                {selectedFloor} - Last 6 hours {getParameterLabel(selectedParameter)} data
                            </Typography>
                            <Box sx={{ marginTop: '10px' }}>
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, marginBottom: 2 }}>
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
                                        <MenuItem value="flowrate">Flow Rate</MenuItem>
                                        <MenuItem value="inlet_temperature">Inlet Temperature</MenuItem>
                                        <MenuItem value="outlet_temperature">Outlet Temperature</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                            }}
                            onClick={() => setChartModalOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box id="chart-modal-description">
                        {trendLoading ? (
                            <Box style={styles.loadingContainer}>
                                <CircularProgress />
                            </Box>
                        ) : trendData.length > 0 ? (
                            <Chart
                                options={chartOptions}
                                series={chartSeries}
                                type="line"
                                height={350}
                            />
                        ) : (
                            <Alert severity="info">No trend data available</Alert>
                        )}
                    </Box>
                </Box>
            </Modal>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default SolarMachineList;