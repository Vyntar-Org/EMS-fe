import React, { useState } from 'react';
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
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';

const CompressorMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // State variables
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // --- Dummy Data Generation ---
    const generateDummyMachines = () => {
        return [
            {
                slave_id: 'COMP_001',
                name: 'COMPRESSOR 1',
                status: 'ONLINE',
                last_ts: new Date().toISOString(),
                latest_downtime: {
                    start_time: '2023-10-25 14:30',
                    end_time: '2023-10-25 15:45',
                    duration: '1h 15m'
                },
                downtime_history: [
                    { start_time: '2023-10-25 14:30', end_time: '2023-10-25 15:45', duration: '1h 15m' },
                    { start_time: '2023-10-25 02:00', end_time: '2023-10-25 02:30', duration: '0h 30m' }
                ]
            },
            {
                slave_id: 'COMP_002',
                name: 'COMPRESSOR 2',
                status: 'OFFLINE',
                last_ts: new Date(Date.now() - 1000000).toISOString(),
                latest_downtime: {
                    start_time: '2023-10-27 09:00',
                    end_time: '2023-10-27 12:00',
                    duration: '3h 00m'
                },
                downtime_history: [
                    { start_time: '2023-10-27 09:00', end_time: '2023-10-27 12:00', duration: '3h 00m' }
                ]
            },
            {
                slave_id: 'COMP_003',
                name: 'COMPRESSOR 3',
                status: 'ONLINE',
                last_ts: new Date().toISOString(),
                latest_downtime: {
                    start_time: '2023-10-20 11:00',
                    end_time: '2023-10-20 11:30',
                    duration: '0h 30m'
                },
                downtime_history: []
            },
        ];
    };

    const [compressorMachineListData] = useState({ data: { machines: generateDummyMachines() } });

    // --- Updated Trend Data Generation for Connectivity ---
    // Generates 1 for Online, 0 for Offline
    const generateDummyTrendData = () => {
        const data = [];
        const now = new Date();
        // Generate data for last 24 hours (hourly)
        for (let i = 23; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
            // Random status: 80% chance online, 20% offline
            const status = Math.random() > 0.2 ? 1 : 0; 
            
            data.push({
                x: timestamp.getTime(), // Timestamp for x-axis
                y: status // 1 or 0
            });
        }
        return data;
    };

    const fetchTrendData = (slaveId) => {
        setTrendData(generateDummyTrendData());
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
    };

    // --- Chart Options for Connectivity (Online/Offline) ---
    const chartOptions = {
        chart: {
            type: 'area', // Area chart looks good for status
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
            background: '#FFFFFF',
        },
        stroke: {
            curve: 'stepline', // Stepline is best for On/Off status
            width: 2,
            colors: ['#30b44a'] // Green for the line
        },
        fill: {
            type: 'solid',
            colors: ['#30b44a'], // Green fill
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
            min: -0.1, // Give a little padding
            max: 1.1,
            tickAmount: 2,
            labels: {
                style: { colors: '#6B7280', fontSize: '11px' },
                formatter: function(val) {
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
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
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

    // Chart series
    const chartSeries = [{
        name: 'Connectivity',
        data: trendData
    }];

    // Function to render a floor card
    const renderFloorCard = (machine) => {
        if (!machine) return null;

        const isOnline = machine.status === 'ONLINE';

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
                    {/* Header */}
                    <Box style={styles.commonHeader}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box>
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
                    <Divider sx={{ mb: 1 }} />

                    {/* Table 1: Latest Downtime */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={styles.phaseTableHeader}>
                                    <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                        Latest Downtime
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>Start Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>End Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>Duration</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.start_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.end_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.latest_downtime?.duration || '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Table 2: Downtime (Last 24h) */}
                    <TableContainer style={{ ...styles.phaseTable, marginTop: '16px' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={styles.phaseTableHeader}>
                                    <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                        Downtime (Last 24h)
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>Start Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>End Time</TableCell>
                                    <TableCell style={styles.tableCell} sx={{color: '#1F2937', fontWeight: 600}}>Duration</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {machine.downtime_history && machine.downtime_history.length > 0 ? (
                                    machine.downtime_history.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell style={styles.tableCell}>{item.start_time}</TableCell>
                                            <TableCell style={styles.tableCell}>{item.end_time}</TableCell>
                                            <TableCell style={styles.tableCell}>{item.duration}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} style={{ ...styles.tableCell, textAlign: 'center' }}>
                                            No downtime recorded
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Divider sx={{ my: 1 }} />

                    {/* Trend Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={() => {
                                setSelectedFloor(machine.name);
                                setChartModalOpen(true);
                                fetchTrendData(machine.slave_id);
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
                {compressorMachineListData?.data?.machines?.map((machine, index) => (
                    <Box
                        key={machine.slave_id || index}
                        sx={{
                            width: { xs: '100%', sm: 'calc(50% - 15px)', md: 'calc(33.33% - 35px)' },
                        }}
                    >
                        {renderFloorCard(machine)}
                    </Box>
                ))}
            </Box>

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
                    {trendData.length > 0 ? (
                        <Chart options={chartOptions} series={chartSeries} type="area" height={300} />
                    ) : (
                        <Alert severity="info">No data available</Alert>
                    )}
                </Box>
            </Modal>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
        </Box>
    );
};

export default CompressorMachineList;