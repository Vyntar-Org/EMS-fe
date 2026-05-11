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
    Tooltip,
    TextField,
    InputAdornment,
    Snackbar,
    Alert,
} from '@mui/material';
import axios from 'axios';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import { getTemperatureMachineList, getTemperatureMachineTrend } from '../../auth/temperature/TemperatureMachineListApi';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';


const TemperatureMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'temperature':
                return '°C';
            case 'humidity':
                return '%';
            case 'battery':
                return 'V';
            default:
                return '';
        }
    };

    // ✅ NEW: Get card background color based on temperature
    const getCardBackgroundColor = (temperature, isOnline) => {
        if (!isOnline) {
            return {
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)',
                borderColor: '#BDBDBD',
            };
        }

        if (temperature === null || temperature === undefined || isNaN(temperature)) {
            return {
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)',
                borderColor: '#BDBDBD',
            };
        }

        if (temperature >= 23 && temperature <= 25) {
            // Green - Normal range
            return {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(76, 175, 80, 0.25) 50%, rgba(76, 175, 80, 0.4) 100%)',
                // borderColor: '#4CAF50',
            };
        } else if (temperature > 25) {
            // Red - High temperature
            return {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(229, 57, 53, 0.25) 50%, rgba(229, 57, 53, 0.4) 100%)',
                // borderColor: '#E53935',
            };
        } else if (temperature < 23) {
            // Orange - Low temperature
            return {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 152, 0, 0.25) 50%, rgba(255, 152, 0, 0.4) 100%)',
                // borderColor: '#FF9800',
            };
        }

        return {
            background: '#FFFFFF',
            borderColor: '#E0E0E0',
        };
    };

    // ✅ NEW: Get status badge color based on temperature
    const getStatusBadgeStyle = (temperature, isOnline) => {
        if (!isOnline) {
            return {
                color: '#9E9E9E',
                borderColor: '#9E9E9E',
            };
        }

        if (temperature === null || temperature === undefined || isNaN(temperature)) {
            return {
                color: '#9E9E9E',
                borderColor: '#9E9E9E',
            };
        }

        if (temperature >= 23 && temperature <= 25) {
            return {
                color: '#2E7D32',
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
            };
        } else if (temperature > 25) {
            return {
                color: '#C62828',
                borderColor: '#E53935',
                backgroundColor: 'rgba(229, 57, 53, 0.1)',
            };
        } else if (temperature < 23) {
            return {
                color: '#E65100',
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
            };
        }

        return {
            color: '#5A5A5A',
            borderColor: '#5A5A5A',
        };
    };

    // ✅ NEW: Get temperature status text
    const getTemperatureStatusText = (temperature, isOnline) => {
        if (!isOnline) return 'Offline';

        if (temperature === null || temperature === undefined || isNaN(temperature)) {
            return 'No Data';
        }

        if (temperature >= 23 && temperature <= 25) {
            return 'Normal';
        } else if (temperature > 25) {
            return 'High';
        } else if (temperature < 23) {
            return 'Low';
        }

        return 'Unknown';
    };

    // ✅ NEW: Truncate helper
    const truncateText = (text, length = 15) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // State variables
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [machineListData, setMachineListData] = useState(null);
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('Common');
    const [chartType, setChartType] = useState('temperature');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('temperature');
    const [trendLoading, setTrendLoading] = useState(false);
    const [trendError, setTrendError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Fetch machine list data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const machineListResponse = await getTemperatureMachineList();
                console.log('Machine list API response:', machineListResponse);

                setMachineListData(machineListResponse);

            } catch (err) {
                console.error('Error fetching machine list data:', err);
                setError(err.message || 'An error occurred while fetching machine list data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter machines based on search term
    const filteredMachines = machineListData?.data?.machines?.filter(machine => {
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

        const headers = ['Machine Name', 'Status', 'Temperature (°C)', 'Temperature Status', 'Humidity (%)', 'Battery (V)', 'Last Updated'];

        const rows = filteredMachines.map(machine => {
            const isWithinTimeLimit = (lastTs) => {
                if (!lastTs) return false;
                const lastTime = new Date(lastTs);
                const currentTime = new Date();
                const timeDiff = (currentTime - lastTime) / (1000 * 60);
                return timeDiff <= 15;
            };
            const isOnline = machine.status === 'ONLINE' || isWithinTimeLimit(machine.last_ts);

            const temp = machine.latest?.rv ? machine.latest.rv.toFixed(2) : 'N/A';
            const tempStatus = machine.latest?.rv ? getTemperatureStatusText(machine.latest.rv, isOnline) : 'N/A';
            const hum = machine.latest?.iy ? machine.latest.iy.toFixed(1) : 'N/A';
            const bat = machine.latest?.bv ? machine.latest.bv.toFixed(2) : 'N/A';
            const date = machine.last_ts ? new Date(machine.last_ts).toLocaleString() : 'N/A';

            return [
                machine.name || 'N/A',
                isOnline ? 'Online' : 'Offline',
                temp,
                tempStatus,
                hum,
                bat,
                date
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `temperature_machines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to fetch trend data
    const fetchTrendData = async (slaveId, parameter) => {
        try {
            setTrendLoading(true);
            setTrendError(null);

            const response = await getTemperatureMachineTrend(slaveId, parameter);

            if (response.success) {
                setTrendData(response.data.data || []);
                return response.data.data || [];
            } else {
                throw new Error(response.message || 'Failed to fetch trend data');
            }
        } catch (err) {
            console.error('Error fetching trend data:', err);
            setTrendError(err.message || 'An error occurred while fetching trend data');
            return [];
        } finally {
            setTrendLoading(false);
        }
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
            backgroundColor: 'transparent',
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
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
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
            cursor: 'pointer',
            verticalAlign: 'middle',
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

    // Get parameter label
    const getParameterLabel = (parameter) => {
        switch (parameter) {
            case 'temperature':
                return 'Temperature';
            case 'humidity':
                return 'Humidity';
            case 'battery':
                return 'Battery';
            default:
                return 'Value';
        }
    };

    // Chart series
    const chartSeries = [{
        name: getParameterLabel(selectedParameter),
        data: trendData.map(item => item.value)
    }];

    // Function to render a floor card
    const renderFloorCard = (machine) => {
        if (!machine) return null;

        // ✅ Check if name exceeds 15 chars for tooltip
        const isNameTruncated = machine.name && machine.name.length > 24;
        const displayName = truncateText(machine.name, 24);

        const isWithinTimeLimit = (lastTs) => {
            if (!lastTs) return false;

            const lastTime = new Date(lastTs);
            const currentTime = new Date();
            const timeDiff = (currentTime - lastTime) / (1000 * 60);

            return timeDiff <= 15;
        };

        const isOnline = machine.status === 'ONLINE' || isWithinTimeLimit(machine.last_ts);
        const latest = machine.latest || {};
        const energy = machine.energy || {};

        // ✅ Get temperature value
        const temperatureValue = latest.rv;

        // ✅ Get card background color based on temperature
        const cardColors = getCardBackgroundColor(temperatureValue, isOnline);

        // ✅ Get status badge style
        const statusBadgeStyle = getStatusBadgeStyle(temperatureValue, isOnline);

        // ✅ Get temperature status text
        const temperatureStatus = getTemperatureStatusText(temperatureValue, isOnline);

        console.log(latest);

        const getConditionalValue = (value, isAllowedField = false) => {
            if (isOnline) {
                return value;
            } else {
                if (isAllowedField) {
                    return value;
                } else {
                    return value;
                }
            }
        };

        const conditionalLatest = {
            acte_im: getConditionalValue(latest.acte_im, true),
            rv: getConditionalValue(latest.rv, false),
            ir: getConditionalValue(latest.ir, false),
            yv: getConditionalValue(latest.yv, false),
            iy: getConditionalValue(latest.iy, false),
            bv: getConditionalValue(latest.bv, false),
            ib: getConditionalValue(latest.ib, false),
            actpr_t: getConditionalValue(latest.actpr_t, false),
            pf_t: getConditionalValue(latest.pf_t, false),
            fq: getConditionalValue(latest.fq, false),
        };

        const conditionalEnergy = {
            today: getConditionalValue(energy.today, true),
            mtd: getConditionalValue(energy.mtd, true),
        };

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

        return (
            <Card style={styles.floorCard}>
                <CardContent style={{
                    ...styles.commonSection,
                    background: cardColors.background,
                    border: `2px solid ${cardColors.borderColor}`,
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flexGrow: 1
                }}>
                    <Box style={styles.commonHeader}>
                        {/* ✅ Tooltip only when name is truncated */}
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
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
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

                    <Typography style={{ ...styles.floorTitle, fontSize: '12px', fontWeight: 'bold', color: 'rgb(82 93 108)' }}>
                        {formatTimestampForTooltip(machine.last_ts)}
                    </Typography>

                    {/* Temperature/Humidity/Battery Data Table */}
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
                                            <DeviceThermostatIcon fontSize="10px" color="error" />
                                            Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={{
                                        ...styles.tableCell,
                                        fontWeight: 600,
                                        color: temperatureValue !== null && temperatureValue !== undefined && !isNaN(temperatureValue) && isOnline
                                            ? (temperatureValue >= 23 && temperatureValue <= 25
                                                ? '#2E7D32'
                                                : temperatureValue > 25
                                                    ? '#C62828'
                                                    : '#E65100')
                                            : '#9E9E9E'
                                    }}>
                                        {conditionalLatest.rv?.toFixed(2)} °C
                                    </TableCell>
                                </TableRow>

                                {/* Humidity */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <WaterDropIcon fontSize="10px" color="primary" />
                                            Humidity
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {conditionalLatest.iy?.toFixed(1)} %
                                    </TableCell>
                                </TableRow>

                                {/* Battery */}
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BatteryStdIcon fontSize="10px" color="success" />
                                            Battery
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>
                                        {conditionalLatest.bv?.toFixed(2)} V
                                    </TableCell>
                                </TableRow>
                            </TableBody>

                        </Table>
                    </TableContainer>
                    <Box style={{ ...styles.metricsRow, marginTop: '8px', display: 'flex', justifyContent: 'right' }}>
                        <Box style={{ marginTop: 'auto' }}>
                            <Button
                                variant="contained"
                                style={styles.chartButton}
                                onClick={async () => {
                                    setSelectedFloor(machine.name);
                                    setChartType('temperature');
                                    setChartModalOpen(true);

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
                    </Box>

                </CardContent>
            </Card>
        );
    };

    return (
        <Box style={styles.mainContent} id="main-content">
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
                {loading && <Typography>Loading...</Typography>}
                {error && <Typography color="error">{error}</Typography>}
                {!loading && !error && filteredMachines.length > 0 ? (
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
                    !loading && !error && (
                        <Box sx={{ width: '100%', textAlign: 'center', py: 5, color: '#888' }}>
                            No machines found matching your search.
                        </Box>
                    )
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
                            <Box sx={{ marginTop: '10px' }}>
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, marginBottom: 2 }}>
                                    <InputLabel>Parameter</InputLabel>
                                    <Select
                                        value={selectedParameter}
                                        onChange={async (e) => {
                                            const newParameter = e.target.value;
                                            setSelectedParameter(newParameter);

                                            const selectedMachine = machineListData?.data?.machines?.find(
                                                m => m.name === selectedFloor
                                            );
                                            if (selectedMachine) {
                                                await fetchTrendData(selectedMachine.slave_id, newParameter);
                                            }
                                        }}
                                        label="Parameter"
                                    >
                                        <MenuItem value="temperature">Temperature</MenuItem>
                                        <MenuItem value="humidity">Humidity</MenuItem>
                                        <MenuItem value="battery">Battery</MenuItem>
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
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <Typography>Loading chart data...</Typography>
                            </Box>
                        ) : trendError ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <Typography color="error">{trendError}</Typography>
                            </Box>
                        ) : trendData.length > 0 ? (
                            <Chart
                                options={chartOptions}
                                series={chartSeries}
                                type="line"
                                height={350}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <Typography>No trend data available</Typography>
                            </Box>
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

export default TemperatureMachineList;