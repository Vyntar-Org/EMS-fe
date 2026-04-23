import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Modal,
    IconButton,
    Divider,
    Alert,
    Snackbar,
    Tooltip,
    TextField,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import API functions
import { getCompressorMachineList, getCompressorMachineTrend } from '../../auth/compressor/MachineListApi';

const CompressorMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // State variables
    const [searchTerm, setSearchTerm] = useState('');
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [machineListData, setMachineListData] = useState({ data: { machines: [] } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);

    // ✅ NEW: State for downtime detail popup
    const [downtimePopupOpen, setDowntimePopupOpen] = useState(false);
    const [downtimePopupTitle, setDowntimePopupTitle] = useState('');
    const [downtimePopupData, setDowntimePopupData] = useState([]);

    // ✅ NEW: Truncate helper
    const truncateText = (text, length = 15) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    // Fetch machine list on component mount
    useEffect(() => {
        const fetchMachineList = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getCompressorMachineList();
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
            machine.slave_id.toString().toLowerCase().includes(term)
        );
    }) || [];

    // Function to handle CSV download
    const handleDownload = () => {
        if (filteredMachines.length === 0) {
            setSnackbarMessage('No data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = ['Machine Name', 'ID', 'Status', 'Last Downtime Start', 'Last Downtime End', 'Duration', 'Last Updated'];

        const rows = filteredMachines.map(machine => {
            const date = machine.last_updated ? new Date(machine.last_updated).toLocaleString() : 'N/A';
            return [
                machine.slave_name || 'N/A',
                machine.slave_id || 'N/A',
                machine.status || 'N/A',
                machine.latest_downtime?.start_time || '-',
                machine.latest_downtime?.end_time || '-',
                machine.latest_downtime?.duration || '-',
                date
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `compressor_machines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to fetch trend data
    const fetchTrendData = async (slaveId) => {
        try {
            setTrendLoading(true);
            const response = await getCompressorMachineTrend(slaveId);
            const transformedData = response.data.data.map(item => ({
                timestamp: item.start,
                value: item.status
            }));
            setTrendData(transformedData);
            return transformedData;
        } catch (err) {
            console.error('Error fetching trend data:', err);
            setSnackbarMessage(err.message || 'Failed to fetch trend data');
            setSnackbarOpen(true);
            throw err;
        } finally {
            setTrendLoading(false);
        }
    };

    // ✅ Helper: Parse duration string to total minutes
    const parseDurationToMinutes = (durationStr) => {
        if (!durationStr) return 0;

        const hMatch = durationStr.match(/(-?\d+)\s*h/);
        const mMatch = durationStr.match(/(-?\d+)\s*m/);
        if (hMatch && mMatch) {
            return parseInt(hMatch[1]) * 60 + parseInt(mMatch[1]);
        }

        const timeMatch = durationStr.match(/(-?\d+):(\d+)(?::(\d+))?/);
        if (timeMatch) {
            return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        }

        const num = parseInt(durationStr);
        if (!isNaN(num)) return num;

        return 0;
    };

    // ✅ Helper: Format total minutes to "XX h XX m"
    const formatMinutesToDuration = (totalMinutes) => {
        const isNegative = totalMinutes < 0;
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        const sign = isNegative ? '-' : '';
        return `${sign}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    };

    // ✅ NEW: Open downtime detail popup
    const openDowntimePopup = (title, data) => {
        setDowntimePopupTitle(title);
        setDowntimePopupData(data);
        setDowntimePopupOpen(true);
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
        phaseTable: {
            marginTop: '8px',
        },
        phaseTableHeader: {
            backgroundColor: '#f5f5f5',
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
        tableCell: {
            padding: '6px 8px',
            fontSize: '11px',
            borderBottom: '1px solid #eee',
        },
        chartButton: {
            backgroundColor: '#2F6FB0',
            color: 'white',
            '&:hover': { backgroundColor: '#1E4A7C' },
            marginTop: 'auto',
            alignSelf: 'flex-start',
            padding: '6px 12px',
            fontSize: '12px',
        },
        clockIcon: {
            fontSize: '16px',
            cursor: 'pointer',
            verticalAlign: 'middle',
        },
    };

    // Chart Options for Connectivity
    const chartOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
            background: '#FFFFFF',
        },
        stroke: {
            curve: 'stepline',
            width: 2,
            colors: ['#30b44a']
        },
        fill: {
            type: 'solid',
            colors: ['#30b44a'],
            opacity: 0.2
        },
        dataLabels: {
            enabled: false
        },
        grid: {
            borderColor: '#ebe5e5',
            strokeDashArray: 0,
        },
        xaxis: {
            type: 'datetime',
            title: {
                text: 'Time',
                style: { color: '#6B7280', fontSize: '12px' },
            },
            labels: {
                style: { colors: '#6B7280', fontSize: '11px' },
                datetimeUTC: false
            },
        },
        yaxis: {
            title: {
                text: 'Status',
                style: { color: '#6B7280', fontSize: '12px' },
            },
            min: -0.1,
            max: 1.1,
            tickAmount: 2,
            labels: {
                style: { colors: '#6B7280', fontSize: '11px' },
                formatter: function (val) {
                    if (val >= 0.9) return 'Online';
                    if (val <= 0.1) return 'Offline';
                    return '';
                }
            },
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: { format: 'dd MMM HH:mm' },
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const dataPoint = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const date = new Date(dataPoint.x);
                const formattedDate = date.toLocaleString();
                const value = dataPoint.y;
                const statusText = value === 1 ? 'Online' : 'Offline';
                const statusColor = value === 1 ? '#30b44a' : '#e34d4d';

                return `<div style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 12px;">${formattedDate}</div>
                    <div style="display: flex; align-items: center;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; margin-right: 8px;"></span>
                        <span style="flex: 1; color: #333; font-size: 12px;">Status:</span>
                        <span style="font-weight: bold; color: ${statusColor}; margin-left: 5px; font-size: 12px;">${statusText}</span>
                    </div>
                </div>`;
            }
        },
        legend: {
            show: false
        }
    };

    const chartSeries = [{
        name: 'Connectivity',
        data: trendData.map(item => ({
            x: new Date(item.timestamp).getTime(),
            y: item.value
        }))
    }];

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

    // Function to render a floor card
    const renderFloorCard = (machine) => {
        if (!machine) return null;

        const isOnline = machine.status === 'ONLINE';

        // ✅ NEW: Check if name exceeds 15 chars for tooltip
        const isNameTruncated = machine.slave_name && machine.slave_name.length > 24;
        const displayName = truncateText(machine.slave_name, 24);

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
                    {/* Header */}
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
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: { xs: '0', sm: '0px' }, marginTop: { xs: '5px', sm: '0' } }}>
                                <Tooltip
                                    title={formatTimestampForTooltip(machine.last_updated)}
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
                    <Divider sx={{ mb: 1 }} />

                    {/* Table 1: Latest Downtime */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                    <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                        Latest Downtime
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell style={styles.tableCell} sx={{ color: '#1F2937', fontWeight: 600 }}>Start Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{ color: '#1F2937', fontWeight: 600 }}>End Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{ color: '#1F2937', fontWeight: 600 }}>Duration</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.start_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.end_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.duration || '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* ✅ CHANGED: Downtime History - Summary format with clickable rows */}
                    <Box style={{ ...styles.phaseTable, marginTop: '16px' }}>
                        <Typography style={{
                            ...styles.tableCell,
                            fontWeight: 'bold',
                            backgroundColor: isOnline ? 'transparent' : '#f5f5f5',
                            borderTopLeftRadius: '4px',
                            borderTopRightRadius: '4px',
                            display: 'block'
                        }}>
                            Downtime History
                        </Typography>

                        {(() => {
                            const now = new Date();
                            const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

                            const downtimes24h = machine.downtime_24h || [];

                            // Filter last 8 hours from the 24h array
                            const last8hDowntimes = downtimes24h.filter(item => {
                                if (!item.start_time) return false;
                                try {
                                    return new Date(item.start_time) >= eightHoursAgo;
                                } catch {
                                    return false;
                                }
                            });

                            // Calculate total durations
                            const totalMinutes24h = downtimes24h.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0);
                            const totalMinutes8h = last8hDowntimes.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0);

                            return (
                                <Box>
                                    {/* ✅ Last 8 hours row - CLICKABLE */}
                                    <Box
                                        onClick={() => {
                                            if (last8hDowntimes.length > 0) {
                                                openDowntimePopup(
                                                    `${machine.slave_name} - Last 8 Hours Downtime`,
                                                    last8hDowntimes
                                                );
                                            }
                                        }}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: '6px',
                                            px: '8px',
                                            borderBottom: '1px solid #eee',
                                            cursor: last8hDowntimes.length > 0 ? 'pointer' : 'default',
                                            '&:hover': last8hDowntimes.length > 0 ? {
                                                backgroundColor: 'rgba(47, 111, 176, 0.08)',
                                            } : {},
                                            transition: 'background-color 0.2s ease',
                                        }}
                                    >
                                        <Typography style={{ ...styles.tableCell, borderBottom: 'none', fontSize: '12px', color: '#6B7280' }}>
                                            Last 8 hours
                                        </Typography>
                                        <Typography style={{ ...styles.tableCell, borderBottom: 'none', fontSize: '12px', fontWeight: 600, color: last8hDowntimes.length > 0 ? '#2F6FB0' : '#1F2937' }}>
                                            {last8hDowntimes.length} times ({formatMinutesToDuration(totalMinutes8h)})
                                        </Typography>
                                    </Box>

                                    {/* ✅ Last 24 hours row - CLICKABLE */}
                                    <Box
                                        onClick={() => {
                                            if (downtimes24h.length > 0) {
                                                openDowntimePopup(
                                                    `${machine.slave_name} - Last 24 Hours Downtime`,
                                                    downtimes24h
                                                );
                                            }
                                        }}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: '6px',
                                            px: '8px',
                                            borderBottomLeftRadius: '4px',
                                            borderBottomRightRadius: '4px',
                                            cursor: downtimes24h.length > 0 ? 'pointer' : 'default',
                                            '&:hover': downtimes24h.length > 0 ? {
                                                backgroundColor: 'rgba(47, 111, 176, 0.08)',
                                            } : {},
                                            transition: 'background-color 0.2s ease',
                                        }}
                                    >
                                        <Typography style={{ ...styles.tableCell, borderBottom: 'none', fontSize: '12px', color: '#6B7280' }}>
                                            Last 24 hours
                                        </Typography>
                                        <Typography style={{ ...styles.tableCell, borderBottom: 'none', fontSize: '12px', fontWeight: 600, color: downtimes24h.length > 0 ? '#2F6FB0' : '#1F2937' }}>
                                            {downtimes24h.length} times ({formatMinutesToDuration(totalMinutes24h)})
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })()}
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Trend Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={async () => {
                                setSelectedFloor(machine.slave_name);
                                setChartModalOpen(true);
                                await fetchTrendData(machine.slave_id);
                            }}
                        >
                            TREND
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box style={styles.mainContent}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
                <>
                    {/* Header with Search and Download */}
                    <Box sx={styles.headerContainer}>
                        <TextField
                            placeholder="Search compressors..."
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
                                        width: { xs: '100%', sm: 'calc(50% - 15px)', md: 'calc(33.33% - 35px)' },
                                    }}
                                >
                                    {renderFloorCard(machine)}
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 5, color: '#888' }}>
                                No compressors found matching your search.
                            </Box>
                        )}
                    </Box>

                    {/* Trend Modal */}
                    <Modal
                        open={chartModalOpen}
                        onClose={() => setChartModalOpen(false)}
                    >
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', md: '60%' }, bgcolor: 'background.paper', borderRadius: '8px', boxShadow: 24, p: 4,
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">{selectedFloor} - Connectivity History</Typography>
                                <IconButton onClick={() => setChartModalOpen(false)}><CloseIcon /></IconButton>
                            </Box>
                            {trendLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                                    <CircularProgress />
                                </Box>
                            ) : trendData.length > 0 ? (
                                <Chart options={chartOptions} series={chartSeries} type="area" height={300} />
                            ) : (
                                <Alert severity="info">No data available</Alert>
                            )}
                        </Box>
                    </Modal>

                    {/* ✅ NEW: Downtime Detail Popup Modal */}
                    <Modal
                        open={downtimePopupOpen}
                        onClose={() => setDowntimePopupOpen(false)}
                    >
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: '500px', md: '600px' },
                            bgcolor: 'background.paper',
                            borderRadius: '12px',
                            boxShadow: 24,
                            p: 0,
                            overflow: 'hidden',
                        }}>
                            {/* Modal Header */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: 3,
                                py: 2,
                                backgroundColor: '#F8F9FA',
                                borderBottom: '1px solid #E5E7EB',
                            }}>
                                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                                    {downtimePopupTitle}
                                </Typography>
                                <IconButton
                                    onClick={() => setDowntimePopupOpen(false)}
                                    sx={{ color: '#6B7280' }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Modal Body - Downtime Table */}
                            <Box sx={{ p: 3 }}>
                                {downtimePopupData.length > 0 ? (
                                    <>
                                        {/* ✅ FIX: maxHeight set to show exactly 5 rows, rest scrolls */}
                                        <TableContainer sx={{
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            borderRadius: '8px',
                                            border: '1px solid #E5E7EB',
                                            maxHeight: '240px',
                                            overflowY: 'auto',
                                            scrollbarWidth: 'thin',
                                            '&::-webkit-scrollbar': {
                                                width: '6px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                backgroundColor: '#F3F4F6',
                                                borderRadius: '3px',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: '#CBD5E1',
                                                borderRadius: '3px',
                                                '&:hover': {
                                                    backgroundColor: '#94A3B8',
                                                },
                                            },
                                        }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: '#F3F4F6' }}>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>#</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>Start Time</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>End Time</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>Duration</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {downtimePopupData.map((item, index) => {
                                                        const isOngoing = !item.end_time;
                                                        return (
                                                            <TableRow
                                                                key={index}
                                                                sx={{
                                                                    '&:hover': { backgroundColor: '#F9FAFB' },
                                                                    backgroundColor: isOngoing ? '#FFF5F5' : 'inherit',
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                                                                    {index + 1}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '12px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                                                                    {item.start_time || '-'}
                                                                </TableCell>
                                                                <TableCell sx={{
                                                                    fontSize: '12px',
                                                                    color: isOngoing ? '#EF4444' : '#1F2937',
                                                                    fontWeight: isOngoing ? 600 : 400,
                                                                    borderBottom: '1px solid #F3F4F6',
                                                                }}>
                                                                    {item.end_time || (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <Box sx={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                backgroundColor: '#EF4444',
                                                                            }} />
                                                                            Ongoing
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{
                                                                    fontSize: '12px',
                                                                    color: isOngoing ? '#EF4444' : '#1F2937',
                                                                    fontWeight: isOngoing ? 600 : 400,
                                                                    borderBottom: '1px solid #F3F4F6',
                                                                }}>
                                                                    {item.duration || '-'}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        {/* ✅ Scroll indicator */}
                                        {downtimePopupData.length > 5 && (
                                            <Typography sx={{
                                                fontSize: '11px',
                                                color: '#9CA3AF',
                                                textAlign: 'right',
                                                mt: 0.5,
                                                fontStyle: 'italic',
                                            }}>
                                                Scroll to see all {downtimePopupData.length} records ↓
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 5 }}>
                                        <Typography sx={{ color: '#9CA3AF', fontSize: '14px' }}>
                                            No downtime records found
                                        </Typography>
                                    </Box>
                                )}

                                {/* Summary Footer - Always visible */}
                                {downtimePopupData.length > 0 && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        mt: 2,
                                        px: 1,
                                        py: 1.5,
                                        backgroundColor: '#F0F7FF',
                                        borderRadius: '8px',
                                        border: '1px solid #DBEAFE',
                                    }}>
                                        <Typography sx={{ fontSize: '13px', color: '#6B7280', mr: 2 }}>
                                            Total:
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E4A7C' }}>
                                            {downtimePopupData.length} times ({formatMinutesToDuration(
                                                downtimePopupData.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0)
                                            )})
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Modal>

                    <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
                </>
            )}
        </Box>
    );
};

export default CompressorMachineList;