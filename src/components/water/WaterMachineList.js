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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpeedIcon from '@mui/icons-material/Speed';
import OpacityIcon from '@mui/icons-material/Opacity';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import API functions
import { getWaterMachineList, getWaterMachineTrend } from '../../auth/water/WaterMachineListApi';

const WaterMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // ✅ NEW: Truncate helper
    const truncateText = (text, length = 15) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'consumption':
                return 'KLD';
            case 'flow_rate':
                return 'm³/h';
            case 'totalizer':
                return 'L';
            default:
                return '';
        }
    };

    // Get parameter label
    const getParameterLabel = (parameter) => {
        switch (parameter) {
            case 'consumption':
                return 'Consumption';
            case 'flow_rate':
                return 'Flow Rate';
            case 'totalizer':
                return 'Totalizer';
            default:
                return 'Value';
        }
    };

    // State variables
    const [searchTerm, setSearchTerm] = useState('');
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('Common');
    const [chartType, setChartType] = useState('consumption');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('flow_rate');
    const [machineListData, setMachineListData] = useState({ data: { machines: [] } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Fetch machine list on component mount
    useEffect(() => {
        const fetchMachineList = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getWaterMachineList();
                setMachineListData(response);
            } catch (err) {
                console.error('Error fetching machine list:', err);
                setError(err.message || 'Failed to fetch machine list');
                setSnackbarMessage(err.message || 'Failed to fetch machine list');
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMachineList();
    }, []);

    // Filter machines based on search term
    const filteredMachines = machineListData?.data?.machines?.filter(machine => {
        const term = searchTerm.toLowerCase();
        return (
            machine.slave_name.toLowerCase().includes(term) ||
            (machine.location && machine.location.toLowerCase().includes(term))
        );
    }) || [];

    // Function to handle CSV download
    const handleDownload = () => {
        if (filteredMachines.length === 0) {
            setSnackbarMessage('No data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = ['Machine Name', 'Location', 'Consumption (KLD)', 'Rate of Flow (m³/h)', 'MTD (KLD)', 'Totalizer (m³)', 'Status'];

        const rows = filteredMachines.map(machine => {
            const rateOfFlow = machine.rate_of_flow || 0;
            const isOnline = rateOfFlow > 0;
            return [
                machine.slave_name || 'N/A',
                machine.location || 'N/A',
                (machine.consumption || 0).toFixed(2),
                (machine.rate_of_flow || 0).toFixed(2),
                (machine.mtd || 0).toFixed(2),
                (machine.totalizer || 0).toFixed(2),
                isOnline ? 'Online' : 'Offline'
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `water_machines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to fetch trend data
    const fetchTrendData = async (slaveId, parameter) => {
        try {
            setTrendLoading(true);
            const response = await getWaterMachineTrend(slaveId);
            setTrendData(response.data.data);
            return response.data.data;
        } catch (err) {
            console.error('Error fetching trend data:', err);
            setSnackbarMessage(err.message || 'Failed to fetch trend data');
            setSnackbarOpen(true);
            throw err;
        } finally {
            setTrendLoading(false);
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
            backgroundColor: '#E34D4D',
        },
        phaseY: {
            backgroundColor: '#F8C537',
        },
        phaseB: {
            backgroundColor: '#4A90E2',
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
            whiteSpace: 'nowrap',       // ✅ NEW
            overflow: 'hidden',          // ✅ NEW
            textOverflow: 'ellipsis',    // ✅ NEW
            maxWidth: '100%',           // ✅ NEW
            display: 'block',            // ✅ NEW
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
            cursor: 'pointer',
            verticalAlign: 'middle',
        },
        parameterIcon: {
            fontSize: '14px',
            marginRight: '5px',
            color: '#2F6FB0',
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

        // ✅ NEW: Check if name exceeds 15 chars for tooltip
        const isNameTruncated = machine.slave_name && machine.slave_name.length > 24;
        const displayName = truncateText(machine.slave_name, 24);

        const rateOfFlow = machine.rate_of_flow || 0;
        const isOnline = rateOfFlow > 0;

        const latest = machine.latest || {};
        const energy = machine.energy || {};
        const totalizer = machine.totalizer || {};

        const getConditionalValue = (value, isAllowedField = false) => {
            if (isOnline) {
                return value;
            } else {
                if (isAllowedField) {
                    return value;
                } else {
                    return 0;
                }
            }
        };

        const conditionalLatest = {
            acte_im: getConditionalValue(latest.acte_im, true),
            temperature: getConditionalValue(latest.temperature, false),
            water: getConditionalValue(latest.water, false),
            actpr_t: getConditionalValue(latest.actpr_t, false),
            pf_t: getConditionalValue(latest.pf_t, false),
            fq: getConditionalValue(latest.fq, false),
        };

        const conditionalEnergy = {
            today: getConditionalValue(energy.today, true),
            mtd: getConditionalValue(energy.mtd, true),
        };

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
                                        title={machine.slave_name}
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
                            <Typography style={{
                                fontSize: '11px',
                                color: isOnline ? '#30b44a' : '#e34d4d',
                                border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'),
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: { xs: '0', sm: '10px' }, marginTop: { xs: '5px', sm: '0' } }}>
                                <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                                    {machine.totalizer || 0} m³
                                </Typography>

                                <Tooltip
                                    title={formatTimestampForTooltip(machine.latest_ts)}
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
                                </Tooltip>

                            </Box>
                        </Box>
                    </Box>

                    {/* Temperature/Water Data Table */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{
                                    ...styles.phaseTableHeader,
                                    backgroundColor: isOnline ? 'transparent' : '#f5f5f5'
                                }}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Parameter</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Location */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOnIcon style={styles.parameterIcon} />
                                            Location
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {machine.location || 'N/A'}
                                    </TableCell>
                                </TableRow>

                                {/* Consumption */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <OpacityIcon style={styles.parameterIcon} />
                                            Consumption
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machine.consumption || 0).toFixed(1)} KLD
                                    </TableCell>
                                </TableRow>

                                {/* Rate of Flow */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon style={styles.parameterIcon} />
                                            Rate of Flow
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {(machine.rate_of_flow || 0).toFixed(1)} m³/h
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
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                                MTD : {(machine.mtd || 0).toFixed(1)} KLD
                            </Typography>
                        </Box>
                        <Box style={{ ...styles.metricsRow, display: 'flex', justifyContent: 'right', marginTop: 0 }}>
                            <Button
                                variant="contained"
                                style={styles.chartButton}
                                onClick={async () => {
                                    setSelectedFloor(machine.slave_name);
                                    setChartType('consumption');
                                    setChartModalOpen(true);

                                    const selectedMachine = machineListData?.data?.machines?.find(
                                        m => m.slave_name === machine.slave_name
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

                    {/* Custom Grid Container */}
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

                    {/* Chart Modal */}
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
                                ) : (
                                    <Chart
                                        options={chartOptions}
                                        series={chartSeries}
                                        type="line"
                                        height={350}
                                    />
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
                </>
            )}
        </Box>
    );
};

export default WaterMachineList;