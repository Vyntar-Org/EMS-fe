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
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';

const MachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Sample data based on the image
    const [meterData] = useState({
        isOnline: true,
        valueKWH: 1267.6,
        phases: {
            R: { voltage: 244.76, current: 15.2 },
            Y: { voltage: 244.66, current: 15.1 },
            B: { voltage: 247.35, current: 15.3 }
        },
        activePower: 11.72,
        powerFactor: 0.93,
        energyConsumed: 1267.6,
        mtd: 0 // Month-To-Date placeholder
    });

    // State for modal visibility
    const [chartModalOpen, setChartModalOpen] = useState(false);
    // State for selected floor
    const [selectedFloor, setSelectedFloor] = useState('Common');
    // State for individual card phase selections
    const [cardPhaseSelections, setCardPhaseSelections] = useState({});

    // Define floor names
    const floorNames = ['Common', 'First Floor', 'Ground Floor', 'Second Floor', 'Terrace', 'Third Floor'];

    // Chart data for Kw Consumption over last 8/12 hours
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
            colors: ['#2F6FB0'],
        },
        markers: {
            size: 4,
            colors: ['#2F6FB0'],
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
                text: 'hours',
                style: {
                    color: '#6B7280',
                    fontSize: '12px',
                },
            },
            categories: Array.from({ length: 12 }, (_, i) => i + 1),
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '11px',
                },
            },
        },
        yaxis: {
            title: {
                text: 'Kw',
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
        },
        legend: {
            show: false,
        },
    };

    // Phase-specific data
    const getPhaseData = (phase) => {
        const baseData = {
            R: [10.5, 11.2, 11.8, 11.5, 11.9, 12.1, 11.7, 11.4, 11.6, 11.3, 11.8, 11.72],
            Y: [9.8, 10.5, 11.1, 10.8, 11.2, 11.4, 11.0, 10.7, 10.9, 10.6, 11.1, 11.0],
            B: [11.2, 11.9, 12.5, 12.2, 12.6, 12.8, 12.4, 12.1, 12.3, 12.0, 12.5, 12.4]
        };
        return baseData[phase] || baseData.R;
    };

    // Chart series using the selected floor's phase selection
    const getCurrentChartSeries = () => [{
        name: `${cardPhaseSelections[selectedFloor] || ''} Consumption`,
        data: getPhaseData(cardPhaseSelections[selectedFloor] || 'R')
    }];
    
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
            gap: '20px'
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
    const renderFloorCard = (floorName) => {
        // Generate slightly different data for each floor
        const floorData = {
            ...meterData,
            valueKWH: meterData.valueKWH + Math.random() * 100 - 50,
            activePower: meterData.activePower + Math.random() * 2 - 1,
            energyConsumed: meterData.energyConsumed + Math.random() * 100 - 50,
            phases: {
                R: { 
                    voltage: meterData.phases.R.voltage + Math.random() * 2 - 1, 
                    current: meterData.phases.R.current + Math.random() * 0.5 - 0.25 
                },
                Y: { 
                    voltage: meterData.phases.Y.voltage + Math.random() * 2 - 1, 
                    current: meterData.phases.Y.current + Math.random() * 0.5 - 0.25 
                },
                B: { 
                    voltage: meterData.phases.B.voltage + Math.random() * 2 - 1, 
                    current: meterData.phases.B.current + Math.random() * 0.5 - 0.25 
                }
            }
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
                            {floorName}
                        </Typography>
                        <Box style={styles.onlineStatus}>
                            <Box style={floorData.isOnline ? styles.onlineIndicator : styles.offlineIndicator}></Box>
                            <Typography style={{ fontSize: '11px', color: floorData.isOnline ? '#30b44a' : '#e34d4d' }}>
                                {floorData.isOnline ? 'Online' : 'Offline'}
                            </Typography>
                            <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937', marginLeft: '10px' }}>
                                {floorData.valueKWH.toFixed(1)} kWH
                            </Typography>
                        </Box>
                    </Box>

                    {/* Phase Indicators */}
                    {/* <Box style={{ display: 'flex', marginBottom: '8px' }}>
                        <Box 
                            style={{
                                ...styles.phaseIndicator,
                                cursor: 'pointer',
                                backgroundColor: cardPhaseSelections[floorName] === 'R' ? '#f0f0f0' : 'transparent',
                                padding: '3px',
                                borderRadius: '4px'
                            }}
                            onClick={() => setCardPhaseSelections(prev => ({ ...prev, [floorName]: 'R' }))}
                        >
                            <Box style={{ ...styles.phaseDot, ...styles.phaseR }}></Box>
                            <Typography style={{ fontSize: '12px', fontWeight: cardPhaseSelections[floorName] === 'R' ? 'bold' : 'normal' }}>
                               Phase R
                            </Typography>
                        </Box>
                        <Box 
                            style={{
                                ...styles.phaseIndicator,
                                cursor: 'pointer',
                                backgroundColor: cardPhaseSelections[floorName] === 'Y' ? '#f0f0f0' : 'transparent',
                                padding: '3px',
                                borderRadius: '4px'
                            }}
                            onClick={() => setCardPhaseSelections(prev => ({ ...prev, [floorName]: 'Y' }))}
                        >
                            <Box style={{ ...styles.phaseDot, ...styles.phaseY }}></Box>
                            <Typography style={{ fontSize: '12px', fontWeight: cardPhaseSelections[floorName] === 'Y' ? 'bold' : 'normal' }}>
                                Phase Y
                            </Typography>
                        </Box>
                        <Box 
                            style={{
                                ...styles.phaseIndicator,
                                cursor: 'pointer',
                                backgroundColor: cardPhaseSelections[floorName] === 'B' ? '#f0f0f0' : 'transparent',
                                padding: '3px',
                                borderRadius: '4px'
                            }}
                            onClick={() => setCardPhaseSelections(prev => ({ ...prev, [floorName]: 'B' }))}
                        >
                            <Box style={{ ...styles.phaseDot, ...styles.phaseB }}></Box>
                            <Typography style={{ fontSize: '12px', fontWeight: cardPhaseSelections[floorName] === 'B' ? 'bold' : 'normal' }}>
                                Phase B
                            </Typography>
                        </Box>
                    </Box> */}

                    {/* Phase Data Table */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={styles.phaseTableHeader}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Phase</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>V</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>A</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(floorData.phases).map(([phase, data]) => (
                                    <TableRow key={phase}>
                                        <TableCell style={styles.tableCell}>
                                            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Box style={{ ...styles.phaseDot, ...(phase === 'R' ? styles.phaseR : phase === 'Y' ? styles.phaseY : styles.phaseB) }}></Box>
                                                Phase {phase}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" style={styles.tableCell}>{data.voltage.toFixed(2)}</TableCell>
                                        <TableCell align="right" style={styles.tableCell}>{data.current.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Metrics Row */}
                    <Box style={{ ...styles.metricsRow, marginTop: '0px' }}>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Active power</Typography>
                            <Typography style={styles.metricValue}>{floorData.activePower.toFixed(2)} kw</Typography>
                        </Box>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Power factor</Typography>
                            <Typography style={styles.metricValue}>{floorData.powerFactor} Pf</Typography>
                        </Box>
                    </Box>

                    {/* Energy Consumed and MTD */}
                    <Box style={{ ...styles.metricsRow, marginTop: '8px' }}>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Energy consumed</Typography>
                            <Typography style={styles.metricValue}>{floorData.energyConsumed.toFixed(1)} kWH</Typography>
                        </Box>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>MTD</Typography>
                            <Typography style={styles.metricValue}>1254 kWh</Typography>
                        </Box>
                    </Box>
                    <Box style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={() => {
                                setSelectedFloor(floorName);
                                setChartModalOpen(true);
                            }}
                        >
                            Trend ({cardPhaseSelections[floorName] || 'R'})
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Header with Title and Hierarchy Selection */}
            <Box style={styles.headerContainer}>
                <Box>
                    <Typography
                        variant="h6"
                        className="logs-title"
                        style={{
                            color: '#0F2A44',
                            fontWeight: 600,
                            fontFamily: 'sans-serif',
                            marginTop: '-5px'
                        }}
                    >
                        <span
                            onClick={onSidebarToggle}
                            style={{
                                fontSize: '14px',
                                lineHeight: 1,
                                marginLeft: '-2px',
                                fontWeight: '400',
                                display: 'inline-block',
                                cursor: 'pointer',
                                marginRight: '8px',
                                userSelect: 'none',
                                color: '#007bff'
                            }}
                        >
                            <i className={`fa ${sidebarVisible ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                        </span>
                        Machine List
                    </Typography>
                </Box>
            </Box>

            {/* Custom Grid Container for 2 cards per row */}
            <Box style={styles.gridContainer}>
                {floorNames.map((floorName, index) => (
                    <Box style={styles.gridItem} key={index}>
                        {renderFloorCard(floorName)}
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
                        <Typography id="chart-modal-title" variant="h6" component="h2">
                            {selectedFloor} - Consumption over last 12 hours
                        </Typography>
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

export default MachineList;