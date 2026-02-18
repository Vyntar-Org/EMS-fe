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

const SolarMachineList = ({ onSidebarToggle, sidebarVisible }) => {
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
    };

    // State variables
    const [solarMachineListData] = useState(mockSolarMachineListData);

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

        // Get machine type specific parameters
        const getMachineTypeParams = (machineName) => {
            switch (machineName) {
                case 'VAM':
                    return {
                        param1: 'Inlet Temperature',
                        param2: 'Outlet Temperature',
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
                            {/* 2. The Text Container */}
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
                            <Box sx={{ display: 'flex', alignItems: 'center'}}>
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
        </Box>
    );
};

export default SolarMachineList;