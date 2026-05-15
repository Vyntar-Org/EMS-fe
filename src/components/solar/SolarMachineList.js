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
    TextField,
    InputAdornment,
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import API functions
import { getSolarMachineList, getSolarMachineTrend } from '../../auth/solar/SolarMachineListApi';

const SolarMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // ✅ NEW: Truncate helper
    const truncateText = (text, length = 15) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // State variables
    const [searchTerm, setSearchTerm] = useState('');
    const [solarMachineListData, setSolarMachineListData] = useState({ data: { machines: [] } });
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('instant_flow');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Fetch solar machine list on component mount
    useEffect(() => {
        fetchSolarMachineList();
    }, []);

    // Helper: Sanitize data to remove sensor errors (Scientific notation like e+25)
    const sanitizeTrendData = (data, parameter) => {
        return data.map(item => {
            const val = parseFloat(item.value);

            if (isNaN(val) || Math.abs(val) > 100000) {
                return { ...item, value: null };
            }
            return item;
        });
    };

    // ✅ NEW: Check if machine is online based on instant_flow
    const isMachineOnline = (machine) => {
        const instantFlow = machine.latest?.instant_flow;
        // If instant_flow is null, undefined, or 0, machine is offline
        // If instant_flow is greater than 0, machine is online
        return instantFlow !== null && instantFlow !== undefined && instantFlow > 1;
    };

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

    // Filter machines based on search term
    const filteredMachines = solarMachineListData?.data?.machines?.filter(machine => {
        const term = searchTerm.toLowerCase();
        return (
            machine.name.toLowerCase().includes(term) ||
            machine.slave_id.toString().includes(term)
        );
    }) || [];

    // Function to handle CSV download
    const handleDownload = () => {
        if (filteredMachines.length === 0) {
            setSnackbarMessage('No data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = ['Machine Name', 'Status', 'Instant Flow (m³/hr)', 'Flow Temp (°C)', 'Pressure (bar)', 'Inlet Temp (°C)', 'Outlet Temp (°C)', 'Last Updated'];

        const rows = filteredMachines.map(machine => {
            // ✅ CHANGED: Use isMachineOnline based on instant_flow
            const isOnline = isMachineOnline(machine);

            return [
                machine.name || 'N/A',
                isOnline ? 'Online' : 'Offline',
                (machine.latest?.instant_flow || 0).toFixed(2),
                (machine.latest?.flow_temperature || 0).toFixed(2),
                (machine.latest?.pressure || 0).toFixed(2),
                (machine.latest?.inlet_temperature || 0).toFixed(2),
                (machine.latest?.outlet_temperature || 0).toFixed(2),
                machine.last_ts ? new Date(machine.last_ts).toLocaleString() : 'N/A'
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `solar_machines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to fetch trend data
    const fetchTrendData = async (slaveId, parameter) => {
        try {
            setTrendLoading(true);
            const response = await getSolarMachineTrend(slaveId, parameter, 6);
            if (response.success && response.data && response.data.data) {
                const cleanedData = sanitizeTrendData(response.data.data, parameter);
                setTrendData(cleanedData);
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
            case 'instant_flow':
                return 'm³/hr';
            case 'flow_temperature':
                return '°C';
            case 'pressure':
                return 'bar';
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
            case 'instant_flow':
                return 'Instant Flow';
            case 'flow_temperature':
                return 'Flow Temperature';
            case 'pressure':
                return 'Pressure';
            case 'inlet_temperature':
                return 'Inlet Temperature';
            case 'outlet_temperature':
                return 'Outlet Temperature';
            default:
                return 'Value';
        }
    };

    // Function to format timestamp for tooltip
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
            padding: '10px',
            boxSizing: 'border-box',
        },
        headerContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px',
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
            marginBottom: '5px',
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
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            display: 'block',
        },
        gridContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            marginLeft: '0',
            padding: '0 10px',
        },
        gridItem: {
            width: '100%',
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
        offlineValueText: {
            color: '#000000de',
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
                    if (val === null || val === undefined) return '-';
                    if (Math.abs(val) > 10000) {
                        return val.toExponential(2);
                    }
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
                if (!item || item.value === null) return '';

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

        // ✅ CHANGED: Check online status based on instant_flow
        const isOnline = isMachineOnline(machine);
        const latest = machine.latest || {};
        const energy = machine.energy || {};
        const totalizer = machine.totalizer || {};

        // ✅ NEW: Check if name exceeds 15 chars for tooltip
        const isNameTruncated = machine.name && machine.name.length > 24;
        const displayName = truncateText(machine.name, 24);

        return (
            <Card style={styles.floorCard}>
                <CardContent style={{
                    ...styles.commonSection,
                    ...(isOnline ? {
                        background: 'linear-gradient(42deg, rgba(255, 255, 255, 1) 0%, rgba(87, 199, 133, 0.72) 94%)',
                        backgroundColor: 'transparent',
                    } : {
                        backgroundColor: '#FFFFFF',
                    }),
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flexGrow: 1
                }}>
                    <Box style={styles.commonHeader}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box>
                                {/* ✅ CHANGED: Tooltip only when name is truncated */}
                                {isNameTruncated ? (
                                    <Tooltip
                                        title={machine.name}
                                        placement="top"
                                        arrow
                                        enterTouchDelay={0}
                                        leaveTouchDelay={3000}
                                        componentsProps={{
                                            tooltip: {
                                                sx: {
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                },
                                            },
                                        }}
                                    >
                                        <Typography style={styles.floorTitle}>
                                            {displayName}
                                        </Typography>
                                    </Tooltip>
                                ) : (
                                    <Typography style={styles.floorTitle}>
                                        {displayName}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box style={styles.onlineStatus}>
                            {/* ✅ CHANGED: Status badge based on instant_flow */}
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: { xs: '0', sm: '0px' }, marginTop: { xs: '5px', sm: '0' } }}>
                                {/* <Tooltip
                                    title={formatTimestampForTooltip(machine.last_ts)}
                                    placement="top"
                                    arrow
                                    enterTouchDelay={0}
                                    leaveTouchDelay={3000}
                                    componentsProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: '12px',
                                            },
                                        },
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <AccessTimeIcon style={styles.clockIcon} />
                                    </Box>
                                </Tooltip> */}
                            </Box>
                        </Box>
                    </Box>
                    <Typography style={{ ...styles.floorTitle, fontSize: '12px', fontWeight: 'bold', color: 'rgb(82 93 108)' }}>
                        {formatTimestampForTooltip(machine.last_ts)}
                    </Typography>

                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Parameter</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Instant Flow */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <WaterDropIcon fontSize="10px" color="primary" />
                                            Instant Flow
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}></TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        <span style={!isOnline ? styles.offlineValueText : {}}>
                                            {(machine.latest?.instant_flow || 0).toFixed(2)} m³/hr
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* Flow Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="info" />
                                            Flow Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}></TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        <span style={!isOnline ? styles.offlineValueText : {}}>
                                            {(machine.latest?.flow_temperature || 0).toFixed(2)} °C
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* Pressure */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon fontSize="10px" color="secondary" />
                                            Pressure
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}></TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        <span style={!isOnline ? styles.offlineValueText : {}}>
                                            {(machine.latest?.pressure || 0).toFixed(2)} kPa
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* Inlet Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="error" />
                                            {displayName} Inlet Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}></TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        <span style={!isOnline ? styles.offlineValueText : {}}>
                                            {(machine.latest?.inlet_temperature || 0).toFixed(2)} °C
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* Outlet Temperature */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DeviceThermostatIcon fontSize="10px" color="warning" />
                                            {displayName} Outlet Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}></TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        <span style={!isOnline ? styles.offlineValueText : {}}>
                                            {(machine.latest?.outlet_temperature || 0).toFixed(2)} °C
                                        </span>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />

                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}></Box>
                        <Box style={{ ...styles.metricsRow, display: 'flex', justifyContent: 'right', marginTop: 0 }}>
                            <Button
                                variant="contained"
                                style={styles.chartButton}
                                onClick={async () => {
                                    setSelectedFloor(machine.name);
                                    setChartModalOpen(true);

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
                <>
                    {/* Header with Search and Download */}
                    <Box sx={styles.headerContainer}>
                        <TextField
                            placeholder="Search Devices..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: { xs: '100%', sm: '300px' },
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                marginLeft: { sm: '18px', md: '30px' },
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleDownload}
                            sx={{
                                minWidth: '40px',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                borderColor: '#2F6FB0',
                                color: '#fff',
                                backgroundColor: '#2F6FB0',
                                padding: 0,
                                marginRight: '10px',
                                '& .MuiButton-startIcon': {
                                    margin: 0,
                                },
                                '&:hover': {
                                    borderColor: '#1E4A7C',
                                    backgroundColor: '#1E4A7C',
                                    color: '#fff',
                                },
                            }}
                        >
                        </Button>
                    </Box>

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
                        {filteredMachines.length > 0 ? (
                            filteredMachines.map((machine, index) => (
                                <Box
                                    key={machine.slave_id || index}
                                    sx={{
                                        width: {
                                            xs: '100%',
                                            sm: 'calc(50% - 15px)',
                                            md: 'calc(33.33% - 35px)'
                                        },
                                    }}
                                >
                                    {renderFloorCard(machine)}
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 5, color: '#888' }}>
                                No machines found matching your search.
                            </Box>
                        )}
                    </Box>
                </>
            )}

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

                                            const selectedMachine = solarMachineListData?.data?.machines?.find(
                                                m => m.name === selectedFloor
                                            );
                                            if (selectedMachine) {
                                                await fetchTrendData(selectedMachine.slave_id, newParameter);
                                            }
                                        }}
                                        label="Parameter"
                                    >
                                        <MenuItem value="instant_flow">Instant Flow</MenuItem>
                                        <MenuItem value="flow_temperature">Flow Temperature</MenuItem>
                                        <MenuItem value="pressure">Pressure</MenuItem>
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