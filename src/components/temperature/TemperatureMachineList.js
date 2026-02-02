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
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import { getTemperatureMachineList } from '../../auth/temperature/TemperatureMachineListApi';

const TemperatureMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock chart data
    const generateMockChartData = (type, hours = 6) => {
        const data = [];
        const now = new Date();
        
        for (let i = hours; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            const entry = { timestamp: timestamp.toISOString() };
            
            if (type === 'activePower') {
                entry.value = 8 + Math.random() * 8; // 8-16 kW
            } else if (type === 'voltage') {
                entry.rv = 228 + Math.random() * 6; // 228-234 V
                entry.yv = 228 + Math.random() * 6;
                entry.bv = 228 + Math.random() * 6;
            } else if (type === 'current') {
                entry.i_r = 8 + Math.random() * 8; // 8-16 A
                entry.i_y = 8 + Math.random() * 8;
                entry.i_b = 8 + Math.random() * 8;
            } else if (type === 'powerFactor') {
                entry.value = 0.9 + Math.random() * 0.09; // 0.9-0.99 PF
            } else if (type === 'frequency') {
                entry.value = 49.8 + Math.random() * 0.4; // 49.8-50.2 Hz
            }
            
            data.push(entry);
        }
        
        return data;
    };

    // Fetch temperature machine list data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null); // Clear any previous errors

                const response = await getTemperatureMachineList();
                console.log('Temperature machine list API response:', response);

                // Set the data
                setMachineListData(response);
                console.log('Temperature machine list data set:', response);

            } catch (err) {
                console.error('Error fetching temperature machine list data:', err);
                setError(err.message || 'An error occurred while fetching temperature machine list data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // State variables
    const [machineListData, setMachineListData] = useState(null);
    const [keyParameter, setKeyParameter] = useState('');
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('Common');
    const [chartType, setChartType] = useState('activePower');
    const [activePowerData, setActivePowerData] = useState(generateMockChartData('activePower'));
    const [voltageData, setVoltageData] = useState(generateMockChartData('voltage'));
    const [currentData, setCurrentData] = useState(generateMockChartData('current'));
    const [powerFactorData, setPowerFactorData] = useState(generateMockChartData('powerFactor'));
    const [frequencyData, setFrequencyData] = useState(generateMockChartData('frequency'));

    // Chart options
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
            borderColor: '#E5E7EB',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
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
            categories: chartType === 'voltage' ? 
                voltageData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) :
                chartType === 'current' ?
                    currentData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) :
                chartType === 'powerFactor' ?
                    powerFactorData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) :
                chartType === 'frequency' ?
                    frequencyData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) :
                    activePowerData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })),
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '11px',
                },
                rotate: -45,
                formatter: function(val) {
                    return val;
                },
            },
            tickAmount: 6,
            tooltip: {
                enabled: true,
                formatter: function(val) {
                    return new Date(val).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                    });
                }
            }
        },
        yaxis: {
            title: {
                text: chartType === 'voltage' ? 'V' : (chartType === 'current' ? 'A' : (chartType === 'powerFactor' ? 'PF' : (chartType === 'frequency' ? 'Hz' : 'kW'))),
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
            },
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: {
                format: 'dd/MM/yyyy HH:mm',
            },
        },
        legend: {
            show: true,
        },
    };

    // Chart series based on selected chart type
    const getCurrentChartSeries = () => {
        if (chartType === 'activePower') {
            const activePowerValues = activePowerData.map(item => item.value);
            return [{
                name: `${selectedFloor} Active Power`,
                data: activePowerValues
            }];
        } else if (chartType === 'voltage') {
            return [
                {
                    name: 'R-Voltage',
                    data: voltageData.map(item => item.rv),
                    color: '#E34D4D' // Red
                },
                {
                    name: 'Y-Voltage',
                    data: voltageData.map(item => item.yv),
                    color: '#F8C537' // Yellow
                },
                {
                    name: 'B-Voltage',
                    data: voltageData.map(item => item.bv),
                    color: '#4A90E2' // Blue
                }
            ];
        } else if (chartType === 'current') {
            return [
                {
                    name: 'R-Current',
                    data: currentData.map(item => item.i_r),
                    color: '#E34D4D' // Red
                },
                {
                    name: 'Y-Current',
                    data: currentData.map(item => item.i_y),
                    color: '#F8C537' // Yellow
                },
                {
                    name: 'B-Current',
                    data: currentData.map(item => item.i_b),
                    color: '#4A90E2' // Blue
                }
            ];
        } else if (chartType === 'powerFactor') {
            const powerFactorValues = powerFactorData.map(item => item.value);
            return [{
                name: `${selectedFloor} Power Factor`,
                data: powerFactorValues,
                color: '#9C27B0' // Purple
            }];
        } else if (chartType === 'frequency') {
            const frequencyValues = frequencyData.map(item => item.value);
            return [{
                name: `${selectedFloor} Frequency`,
                data: frequencyValues,
                color: '#FF9800' // Orange
            }];
        } else if (chartType === 'keyParameters') {
            return [
                {
                    name: 'Voltage',
                    data: [230, 232, 228, 231, 229, 233, 230, 228, 231, 229, 232, 230]
                },
                {
                    name: 'Current',
                    data: [10.5, 10.8, 10.2, 10.6, 10.4, 10.9, 10.5, 10.3, 10.7, 10.4, 10.8, 10.6]
                },
                {
                    name: 'Power Factor',
                    data: [0.95, 0.96, 0.94, 0.95, 0.97, 0.96, 0.95, 0.94, 0.96, 0.95, 0.97, 0.96]
                }
            ];
        }
        
        const activePowerValues = activePowerData.map(item => item.value);
        return [{
            name: `${selectedFloor} Active Power`,
            data: activePowerValues
        }];
    };
        
    const chartSeries = getCurrentChartSeries();

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
        hierarchyContainer: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        hierarchyBox: {
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '4px',
            border: '1px solid #E5E7EB',
            minWidth: '120px',
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
            paddingTop: '10px',
            borderTop: '1px solid #E5E7EB',
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
            justifyContent: 'space-around',
            gap: '20px 0px'
        },
        gridItem: {
            width: '30%',
            marginBottom: '15px',
        },
        tableCell: {
            padding: '4px 8px',
            fontSize: '12px',
        },
    };

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
                    return '-'; // Return dash for all other fields when offline
                }
            }
        };

        // Determine which fields are allowed when offline
        // For temperature sensors, we'll use the actual temperature, humidity, and battery values
        const conditionalLatest = {
            acte_im: getConditionalValue(latest.acte_im, true), // Temperature value - allowed when offline
            rv: getConditionalValue(latest.rv, true),       // Temperature value - allowed when offline
            ir: getConditionalValue(latest.ir, true),       // Humidity value - allowed when offline
            yv: getConditionalValue(latest.yv, true),       // Another temperature value - allowed when offline
            iy: getConditionalValue(latest.iy, true),       // Another humidity value - allowed when offline
            bv: getConditionalValue(latest.bv, true),       // Battery value - allowed when offline
            ib: getConditionalValue(latest.ib, true),       // Battery value - allowed when offline
            actpr_t: getConditionalValue(latest.actpr_t, true), // Temperature value - allowed when offline
            pf_t: getConditionalValue(latest.pf_t, false),
            fq: getConditionalValue(latest.fq, false),
        };

        const conditionalEnergy = {
            today: getConditionalValue(energy.today, true), // Allowed when offline
            mtd: getConditionalValue(energy.mtd, true), // Allowed when offline
        };

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
                        <Typography style={styles.floorTitle}>
                            {machine.name}
                        </Typography>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937', marginLeft: '10px' }}>
                                {conditionalLatest.acte_im?.toFixed(1)} kWh
                            </Typography>
                        </Box>
                    </Box>

                    {/* Phase Data Table */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={styles.phaseTableHeader}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Parameter</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>A</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseR }}></Box>
                                            Temperature
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.rv?.toFixed(2)} °C</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseY }}></Box>
                                            Humidity
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.iy?.toFixed(1)} H</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseB }}></Box>
                                            Battery
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.bv?.toFixed(2)} V</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        );
    };

    // Render loading or error state
    if (loading) {
        return (
            <Box style={{...styles.mainContent, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Typography>Loading temperature data...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box style={{...styles.mainContent, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (!machineListData || !machineListData.data || !machineListData.data.machines) {
        return (
            <Box style={{...styles.mainContent, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Typography>No temperature data available.</Typography>
            </Box>
        );
    }

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
                                {selectedFloor} - Last 6 hours power data
                            </Typography>
                            <Box style={{ marginTop: '10px' }}>
                                <Tabs 
                                    value={chartType === 'activePower' ? 0 : 1}
                                    onChange={(event, newValue) => {
                                        if (newValue === 0) {
                                            setChartType('activePower');
                                            setActivePowerData(generateMockChartData('activePower'));
                                        }
                                    }}
                                    sx={{
                                        minHeight: '36px',
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: '#2F6FB0',
                                        },
                                        '& .MuiTab-root': {
                                            minHeight: '36px',
                                            fontSize: '14px',
                                            textTransform: 'none',
                                            fontWeight: chartType === 'activePower' ? 600 : 400,
                                        }
                                    }}
                                >
                                    <Tab 
                                        label="Active Power" 
                                        sx={{
                                            color: chartType === 'activePower' ? '#2F6FB0' : '#6B7280',
                                            '&.Mui-selected': {
                                                color: '#2F6FB0',
                                            }
                                        }}
                                    />
                                    <Tab 
                                        label="Key Parameters" 
                                        onClick={() => {
                                            setChartType('keyParameters');
                                        }}
                                        sx={{
                                            color: chartType === 'keyParameters' ? '#2F6FB0' : '#6B7280',
                                            '&.Mui-selected': {
                                                color: '#2F6FB0',
                                            }
                                        }}
                                    />
                                </Tabs>
                            </Box>
                        </Box>
                        {['keyParameters', 'voltage', 'current', 'powerFactor', 'frequency'].includes(chartType) && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 120, height: '32px' }}>
                                    <Select
                                        value={keyParameter}
                                        onChange={(e) => {
                                            const selectedValue = e.target.value;
                                            setKeyParameter(selectedValue);
                                                                    
                                            if (selectedValue === 'voltage') {
                                                setChartType('voltage');
                                                setVoltageData(generateMockChartData('voltage'));
                                            } else if (selectedValue === 'current') {
                                                setChartType('current');
                                                setCurrentData(generateMockChartData('current'));
                                            } else if (selectedValue === 'pf') {
                                                setChartType('powerFactor');
                                                setPowerFactorData(generateMockChartData('powerFactor'));
                                            } else if (selectedValue === 'frequency') {
                                                setChartType('frequency');
                                                setFrequencyData(generateMockChartData('frequency'));
                                            }
                                        }}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <span style={{ color: '#9CA3AF' }}>Key Parameters</span>;
                                            }
                                            return selected === 'voltage'
                                                ? 'Voltage (V)'
                                                : selected === 'current'
                                                    ? 'Current (A)'
                                                    : selected === 'pf'
                                                        ? 'Power Factor (PF)'
                                                        : 'Frequency (Hz)';
                                        }}
                                        sx={{
                                            height: '32px',
                                            backgroundColor: '#ffffff',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#2F6FB0',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#2F6FB0',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#2F6FB0',
                                            },
                                            '& .MuiSelect-select': {
                                                padding: '4px 12px',
                                            }
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontSize: '13px', minHeight: '32px' }}>
                                            Key Parameters
                                        </MenuItem>
                                        <MenuItem value="voltage" sx={{ fontSize: '13px', minHeight: '32px' }}>Voltage (V)</MenuItem>
                                        <MenuItem value="current" sx={{ fontSize: '13px', minHeight: '32px' }}>Current (A)</MenuItem>
                                        <MenuItem value="pf" sx={{ fontSize: '13px', minHeight: '32px' }}>Power Factor (PF)</MenuItem>
                                        <MenuItem value="frequency" sx={{ fontSize: '13px', minHeight: '32px' }}>Frequency (Hz)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                        <IconButton
                            style={styles.closeButton}
                            onClick={() => setChartModalOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box id="chart-modal-description">
                        {chartType === 'keyParameters' ? (
                            <Box sx={{ textAlign: 'center', padding: '100px' }}>
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
        </Box>
    );
};

export default TemperatureMachineList;
