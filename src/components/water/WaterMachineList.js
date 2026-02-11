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
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';

// Mock data for machine list
const mockMachineListData = {
    data: {
        machines: [
            {
                slave_id: 1,
                name: "Flow Meter 1",
                no: "S001",
                status: "ONLINE",
                location: "Building A - Floor 1",
                last_ts: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
                latest: {
                    consumption: 24.5,
                    flow_rate: 65.2
                },
                energy: {
                    today: 120.5,
                    mtd: 3615.2
                }
            },
            {
                slave_id: 2,
                name: "Flow Meter 2",
                no: "S002",
                status: "ONLINE",
                location: "Building A - Floor 2",
                last_ts: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
                latest: {
                    consumption: 28.3,
                    flow_rate: 70.5
                },
                energy: {
                    today: 145.8,
                    mtd: 4374.0
                }
            },
            {
                slave_id: 3,
                name: "Flow Meter 3",
                no: "S003",
                status: "OFFLINE",
                location: "Building B - Floor 1",
                last_ts: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
                latest: {
                    consumption: 22.1,
                    flow_rate: 60.8
                },
                energy: {
                    today: 95.3,
                    mtd: 2859.0
                }
            },
            {
                slave_id: 4,
                name: "Flow Meter 4",
                no: "S004",
                status: "ONLINE",
                location: "Building B - Floor 2",
                last_ts: new Date(Date.now() - 1 * 60000).toISOString(), // 1 minute ago
                latest: {
                    consumption: 25.7,
                    flow_rate: 68.3
                },
                energy: {
                    today: 132.6,
                    mtd: 3978.0
                }
            },
            {
                slave_id: 5,
                name: "Flow Meter 5",
                no: "S005",
                status: "ONLINE",
                location: "Building C - Floor 1",
                last_ts: new Date(Date.now() - 8 * 60000).toISOString(), // 8 minutes ago
                latest: {
                    consumption: 26.2,
                    flow_rate: 66.7
                },
                energy: {
                    today: 118.9,
                    mtd: 3567.0
                }
            },
            {
                slave_id: 6,
                name: "Flow Meter 6",
                no: "S006",
                status: "ONLINE",
                location: "Building C - Floor 2",
                last_ts: new Date(Date.now() - 3 * 60000).toISOString(), // 3 minutes ago
                latest: {
                    consumption: 18.5,
                    flow_rate: 55.2
                },
                energy: {
                    today: 210.4,
                    mtd: 6312.0
                }
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
        case 'temperature':
            baseValue = 25;
            break;
        case 'water':
            baseValue = 65;
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

const WaterMachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Get parameter unit
    const getParameterUnit = (parameter) => {
        switch (parameter) {
            case 'temperature':
                return '°C';
            case 'water':
                return 'kPa';
            default:
                return '';
        }
    };

    // State variables
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState('Common');
    const [chartType, setChartType] = useState('temperature');
    const [trendData, setTrendData] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState('temperature');
    const [machineListData] = useState(mockMachineListData);

    // Function to fetch trend data (now using mock data)
    const fetchTrendData = (slaveId, parameter) => {
        const mockData = generateMockTrendData(parameter);
        setTrendData(mockData);
        return mockData;
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
                            {/* 1. The Green Square Icon */}
                            <div style={{
                                width: '25px',
                                height: '25px',
                                backgroundColor: '#10b981', // A nice modern green
                                borderRadius: '5px',
                                marginRight: '10px', // Space between icon and text
                                flexShrink: 0. // Prevents the icon from shrinking
                            }}></div>

                            {/* 2. The Text Container */}
                            <div>
                                {/* Main Title */}
                                <Typography style={styles.floorTitle}>
                                    {machine.name}
                                </Typography>

                                {/* Subtitle/Number */}
                                <span style={{ fontSize: '13px', fontWeight: 'normal', color: "#6b7280" }}>
                                    {machine.no}
                                </span>
                            </div>
                        </div>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
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

                    {/* Temperature/Water Data Table */}
                    <Box>
                        {/* Location */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6b7280' }}>
                                Location :
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {machine.location || 'N/A'}
                            </Typography>
                            {/* <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                </Typography> */}
                        </Box>

                        {/* Consumption */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6b7280' }}>
                                Consumption :
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {(machine.latest?.consumption || 0).toFixed(1)} KLD
                            </Typography>
                            {/* <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                </Typography> */}
                        </Box>

                        {/* Rate of Flow */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5,
                            marginBottom: '10px'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6b7280' }}>
                                Rate of Flow :
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {(machine.latest?.flow_rate || 0).toFixed(1)} CLm
                            </Typography>
                            {/* <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                </Typography> */}
                        </Box>
                        <Divider sx={{ marginBottom: '10px' }} />

                        {/* MTD */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'right',
                            alignItems: 'center',
                            py: 0.5
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6b7280', marginRight: "10px" }}>
                                MTD :
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {(machine.energy?.mtd || 0).toFixed(1)} KLD
                            </Typography>
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
                {machineListData?.data?.machines?.map((machine, index) => (
                    <Box style={styles.gridItem} key={machine.slave_id || index}>
                        {renderFloorCard(machine)}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default WaterMachineList;