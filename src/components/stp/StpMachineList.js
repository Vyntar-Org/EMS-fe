import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
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
    CircularProgress,
    Alert,
    Snackbar,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Mock API Response
const fetchMockApiData = () => {
    return {
        "device_uid": "VRT2526119",
        "device_name": "STP Plant 1",
        "last_updated": "2026-05-13 10:25:01",
        "cards": [
            {
                "slave_id": 1,
                "card_name": "Water Inlet",
                "slave_type": "FLOW_METER",
                "ui_card_type": "FLOW_CARD",
                "status": "ONLINE",
                "metrics": [
                    { "metric_key": "inlet_flowrate", "label": "Inlet Flow", "value": 873, "unit": "m3/hr" },
                    { "metric_key": "inlet_totalizer", "label": "Inlet Totalizer", "value": 83, "unit": "KL" },
                    { "metric_key": "today_consumption", "label": "Today Consumption", "value": 12, "unit": "KLD" },
                    { "metric_key": "monthly_consumption", "label": "Monthly Consumption", "value": 1234, "unit": "KLD" }
                ]
            },
            {
                "slave_id": 2,
                "card_name": "Water Outlet",
                "slave_type": "FLOW_METER",
                "ui_card_type": "FLOW_CARD",
                "status": "ONLINE",
                "metrics": [
                    { "metric_key": "outlet_flowrate", "label": "Outlet Flow", "value": 873, "unit": "m3/hr" },
                    { "metric_key": "outlet_totalizer", "label": "Outlet Totalizer", "value": 83, "unit": "KL" },
                    { "metric_key": "today_consumption", "label": "Today Consumption", "value": 12, "unit": "KLD" },
                    { "metric_key": "monthly_consumption", "label": "Monthly Consumption", "value": 1234, "unit": "KLD" }
                ]
            },
            {
                "slave_id": 3,
                "card_name": "pH Monitor",
                "slave_type": "QUALITY_SENSOR",
                "ui_card_type": "QUALITY_CARD",
                "status": "ONLINE",
                "metrics": [
                    { "metric_key": "ph", "label": "pH", "value": 7.18 }
                ]
            },
            {
                "slave_id": 4,
                "card_name": "TDS Monitor",
                "slave_type": "QUALITY_SENSOR",
                "ui_card_type": "QUALITY_CARD",
                "status": "ONLINE",
                "metrics": [
                    { "metric_key": "tds", "label": "TDS", "value": 234 }
                ]
            },
            {
                "slave_id": 5,
                "card_name": "Water Level Monitoring",
                "slave_type": "TANK",
                "ui_card_type": "TANK_CARD",
                "status": "ONLINE",
                "metrics": [
                    { "metric_key": "Level 1", "label": "Water Level 1", "value": "FULL" },
                    { "metric_key": "Motor 1 Status", "label": "Motor 1 Status", "value": "ON", "status_color": "GREEN" },
                    { "metric_key": "Level 2", "label": "Water Level 2", "value": "LOW" },
                    { "metric_key": "Motor 2 Status", "label": "Motor 2 Status", "value": "OFF", "status_color": "RED" }
                ]
            }
        ]
    };
};

// Mock Generator for Line Charts (Flow/Totalizer)
const generateMockTrendData = (type) => {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 36; i++) {
        const time = new Date(now.getTime() - (i * 10 * 60 * 1000));
        let value = parseFloat((Math.random() * 100).toFixed(2));
        if (type && type.includes('totalizer')) {
            value = parseFloat((Math.random() * 500 + 500).toFixed(2));
        }
        data.push({ timestamp: time.toISOString(), value });
    }
    return data.reverse();
};

// Mock Generator for Area Charts (Motors)
const generateMockMotorTrendData = () => {
    const now = new Date();
    const categories = [];
    const motor1Data = [];
    const motor2Data = [];

    for (let i = 0; i < 36; i++) {
        const time = new Date(now.getTime() - (i * 10 * 60 * 1000));
        categories.push(time.toISOString());
        
        // Random value between 0 and 100 for load or performance
        motor1Data.push(parseFloat((Math.random() * 100).toFixed(2)));
        motor2Data.push(parseFloat((Math.random() * 100).toFixed(2)));
    }
    
    return {
        categories: categories.reverse(),
        series: [
            { name: 'Motor 1', data: motor1Data.reverse() },
            { name: 'Motor 2', data: motor2Data.reverse() }
        ]
    };
};

const StpMachineList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [plantData, setPlantData] = useState(null);
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    
    // State for Line Charts (Flow/Totalizer)
    const [trendData, setTrendData] = useState([]);
    const [trendMetricKey, setTrendMetricKey] = useState(null);
    
    // State for Area Charts (Motors)
    const [tankTrendSeries, setTankTrendSeries] = useState([]);
    const [tankTrendCategories, setTankTrendCategories] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trendLoading, setTrendLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => { fetchPlantData(); }, []);

    const fetchPlantData = async () => {
        try {
            setLoading(true);
            setError(null);
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = fetchMockApiData();
            setPlantData(data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load plant data');
            setSnackbarMessage('Failed to load plant data');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const filteredCards = plantData?.cards?.filter(card => {
        const term = searchTerm.toLowerCase();
        return card.card_name.toLowerCase().includes(term);
    }) || [];

    const handleDownload = () => {
        if (!plantData || filteredCards.length === 0) {
            setSnackbarMessage('No data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = ['Card Name', 'Status', ...filteredCards.flatMap(c => c.metrics.map(m => m.label))];
        const rows = filteredCards.map(card => {
            return [
                card.card_name,
                card.status,
                ...card.metrics.map(m => `${m.value} ${m.unit || ''}`)
            ].join(',');
        });

        const metaRow = [`Device: ${plantData.device_name}`, `Updated: ${plantData.last_updated}`].join(',');
        const csvContent = [metaRow, headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${plantData.device_name}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleTrendClick = async (card) => {
        setSelectedCard(card);
        setChartModalOpen(true);
        setTrendLoading(true);

        // Reset states
        setTrendData([]);
        setTankTrendSeries([]);
        setTrendMetricKey(null);

        // Logic for TANK_CARD (Water Level Monitoring)
        if (card.ui_card_type === 'TANK_CARD') {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = generateMockMotorTrendData();
            setTankTrendSeries(mockData.series);
            setTankTrendCategories(mockData.categories);
        } 
        // Logic for FLOW_CARD (Inlet/Outlet)
        else {
            let defaultKey = null;
            if (card.card_name === 'Water Inlet') {
                defaultKey = 'inlet_flowrate';
            } else if (card.card_name === 'Water Outlet') {
                defaultKey = 'outlet_flowrate';
            }
            
            setTrendMetricKey(defaultKey);

            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = generateMockTrendData(defaultKey);
            setTrendData(mockData);
        }
        
        setTrendLoading(false);
    };

    const handleTrendParameterChange = async (event) => {
        const newKey = event.target.value;
        setTrendMetricKey(newKey);
        setTrendLoading(true);

        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = generateMockTrendData(newKey);
        setTrendData(mockData);
        setTrendLoading(false);
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    const styles = {
        mainContent: { width: '100%', minHeight: '86.4vh', fontFamily: '"Ubuntu", sans-serif', fontSize: '14px', color: '#5A5A5A', marginBottom: '20px', padding: '10px', boxSizing: 'border-box' },
        headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
        commonSection: { backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', height: '100%', display: 'flex', flexDirection: 'column' },
        commonHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '8px' },
        onlineStatus: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
        phaseTable: { marginTop: '8px' },
        phaseTableHeader: { backgroundColor: '#f5f5f5', fontWeight: 'bold' },
        floorCard: { height: '100%', display: 'flex', flexDirection: 'column' },
        floorTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block' },
        tableCell: { padding: '4px 8px', fontSize: '12px' },
        chartButton: { backgroundColor: '#2F6FB0', color: 'white', '&:hover': { backgroundColor: '#1E4A7C' }, padding: '6px 12px', fontSize: '12px' },
        loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' },
    };

    // --- Chart Configurations ---

    // 1. Line Chart Options (For Inlet/Outlet)
    const currentMetricDetails = selectedCard?.metrics.find(m => m.metric_key === trendMetricKey) || { label: 'Value', unit: '' };

    const lineChartOptions = {
        chart: { type: 'line', height: 350, toolbar: { show: true }, zoom: { enabled: true }, background: '#FFFFFF' },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
        xaxis: {
            categories: trendData.map(item => new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })),
            labels: { style: { fontSize: '11px' }, rotate: -45 }
        },
        yaxis: {
            title: { text: currentMetricDetails.unit, style: { fontSize: '12px', color: '#666' } },
            labels: { formatter: (val) => val.toFixed(2) }
        },
        tooltip: { enabled: true, theme: 'light' }
    };
    
    const lineChartSeries = [{
        name: currentMetricDetails.label,
        data: trendData.map(item => item.value)
    }];

    // 2. Area Chart Options (For Water Level Monitoring / Motors)
    const areaChartOptions = {
        chart: { type: 'area', height: 350, toolbar: { show: true }, zoom: { enabled: true }, background: '#FFFFFF' },
        stroke: { curve: 'stepline', width: 2 },
        dataLabels: { enabled: false },
        xaxis: {
            categories: tankTrendCategories.map(ts => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })),
            labels: { style: { fontSize: '11px' }, rotate: -45 }
        },
        yaxis: {
            title: { text: 'Load / Status', style: { fontSize: '12px', color: '#666' } },
            labels: { formatter: (val) => val.toFixed(0) }
        },
        tooltip: { enabled: true, theme: 'light' },
        legend: { position: 'top', horizontalAlign: 'center' },
        colors: ['#2E93fA', '#66DA26'] // Blue for Motor 1, Green for Motor 2
    };

    // --- Render Logic ---

    const renderCard = (card) => {
        const isOnline = card.status === 'ONLINE';
        const isTank = card.ui_card_type === 'TANK_CARD';

        const consumptionKeys = ['today_consumption', 'monthly_consumption'];
        const tableMetrics = card.metrics.filter(m => !consumptionKeys.includes(m.metric_key));
        const footerMetrics = card.metrics.filter(m => consumptionKeys.includes(m.metric_key));

        return (
            <Card key={card.slave_id} style={styles.floorCard}>
                <CardContent style={{
                    ...styles.commonSection,
                    ...(isOnline ? {
                        background: 'linear-gradient(42deg, rgba(255, 255, 255, 1) 0%, rgba(87, 199, 133, 0.72) 94%)',
                        backgroundColor: 'transparent',
                    } : { backgroundColor: '#FFFFFF' }),
                    padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1
                }}>
                    <Box style={styles.commonHeader}>
                        <Typography style={styles.floorTitle}>{card.card_name}</Typography>
                        <Box style={styles.onlineStatus}>
                            <Typography style={{ fontSize: '11px', color: isOnline ? '#30b44a' : '#e34d4d', border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {card.status}
                            </Typography>
                        </Box>
                    </Box>

                    <Typography style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgb(82 93 108)', mb: 1 }}>
                        {plantData?.last_updated ? formatTimestamp(plantData.last_updated) : 'N/A'}
                    </Typography>

                    {isTank ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexGrow: 1, alignItems: 'flex-start' }}>
                            {(() => {
                                const getMetric = (key) => card.metrics.find(m => m.metric_key === key);
                                const level1 = getMetric('Level 1');
                                const motor1 = getMetric('Motor 1 Status');
                                const level2 = getMetric('Level 2');
                                const motor2 = getMetric('Motor 2 Status');

                                const renderStatusChip = (metric) => {
                                    if (!metric) return null;
                                    const isOn = metric.value === 'ON' || metric.value === 'FULL';
                                    const color = metric.status_color === 'GREEN' ? '#2e7d32' : metric.status_color === 'RED' ? '#d32f2f' : isOn ? '#2e7d32' : '#e0e0e0';
                                    const textColor = (metric.status_color === 'GREEN' || isOn) ? 'white' : 'white';
                                    const isLevel = metric.metric_key.includes('Level');
                                    const bgColor = isLevel ? (metric.value === 'FULL' ? '#4f92d4' : '#d05353') : color;
                                    const fgColor = isLevel ? 'white' : textColor;

                                    return (
                                        <Chip
                                            label={metric.value || 'N/A'}
                                            size="small"
                                            style={{ backgroundColor: bgColor, color: fgColor, fontWeight: 'bold', height: '24px', fontSize: '11px' }}
                                        />
                                    );
                                };

                                return (
                                    <>
                                        <TableContainer sx={{ flex: 1 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                                        <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                                            <Typography noWrap variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>
                                                                Collection Tank / Motor
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell style={styles.tableCell}>Water Level</TableCell>
                                                        <TableCell align="right" style={styles.tableCell}></TableCell>
                                                        <TableCell align="right" style={styles.tableCell}>{renderStatusChip(level1)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell style={styles.tableCell}>Motor Status</TableCell>
                                                        <TableCell align="right" style={styles.tableCell}></TableCell>
                                                        <TableCell align="right" style={styles.tableCell}>{renderStatusChip(motor1)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

                                        <TableContainer sx={{ flex: 1 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                                        <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                                            <Typography noWrap variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>
                                                                Filter out / Motor
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell style={styles.tableCell}>Water Level</TableCell>
                                                        <TableCell align="right" style={styles.tableCell}></TableCell>
                                                        <TableCell align="right" style={styles.tableCell}>{renderStatusChip(level2)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell style={styles.tableCell}>Motor Status</TableCell>
                                                        <TableCell align="right" style={styles.tableCell}></TableCell>
                                                        <TableCell align="right" style={styles.tableCell}>{renderStatusChip(motor2)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </>
                                );
                            })()}
                        </Box>
                    ) : (
                        <>
                            <TableContainer style={styles.phaseTable}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                            <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Parameter</TableCell>
                                            <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}></TableCell>
                                            <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>Value</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tableMetrics.map((metric) => (
                                            <TableRow key={metric.metric_key}>
                                                <TableCell style={styles.tableCell}>{metric.label}</TableCell>
                                                <TableCell align="right" style={styles.tableCell}></TableCell>
                                                <TableCell align="right" style={styles.tableCell}>
                                                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                                        {metric.value} {metric.unit ? <span style={{ fontSize: '12px', color: '#666' }}>{metric.unit}</span> : ''}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    <Divider sx={{ mt: 'auto' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            {footerMetrics.map(metric => (
                                <Box key={metric.metric_key} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ fontSize: '13px', color: '#666', lineHeight: 1, mb: 1 }}>
                                        {metric.label}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px', lineHeight: 1.2, justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                                        {metric.value} <span style={{ fontSize: '10px', fontWeight: 'normal', marginLeft: '4px' }}> {metric.unit}</span>
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={() => handleTrendClick(card)}
                            sx={{ height: '30px', minWidth: '60px' }}
                        >
                            Trend
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    // Determine if the current modal needs the dropdown (Only for Inlet/Outlet)
    const showTrendDropdown = selectedCard?.card_name === 'Water Inlet' || selectedCard?.card_name === 'Water Outlet';
    // Check if it's the Tank Card
    const isTankTrend = selectedCard?.ui_card_type === 'TANK_CARD';

    return (
        <Box style={styles.mainContent} id="main-content">
            {loading ? (
                <Box style={styles.loadingContainer}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
                <>
                    <Box sx={styles.headerContainer}>
                        <TextField
                            placeholder="Search Cards..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }}
                            sx={{ width: { xs: '100%', sm: '300px' }, backgroundColor: '#fff', borderRadius: '4px' }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleDownload}
                            sx={{ minWidth: '40px', width: '40px', height: '40px', borderRadius: '50%', borderColor: '#2F6FB0', color: '#fff', backgroundColor: '#2F6FB0', padding: 0, '&:hover': { backgroundColor: '#1E4A7C' } }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'left', gap: { xs: '15px', sm: '20px', md: '20px 50px' } }}>
                        {filteredCards.map((card) => (
                            <Box key={card.slave_id} sx={{ width: { xs: '100%', sm: 'calc(50% - 15px)', md: 'calc(33.33% - 35px)' } }}>
                                {renderCard(card)}
                            </Box>
                        ))}
                    </Box>
                </>
            )}

            <Modal open={chartModalOpen} onClose={() => setChartModalOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', width: '90%', maxWidth: '800px', maxHeight: '90%', overflow: 'auto', position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="h6">{selectedCard?.card_name} - Trend</Typography>
                            
                            {/* Dropdown for Inlet/Outlet Only */}
                            {showTrendDropdown && (
                                <FormControl size="small" sx={{ mt: 2, minWidth: 150 }}>
                                    <InputLabel id="trend-param-label">Parameter</InputLabel>
                                    <Select
                                        labelId="trend-param-label"
                                        value={trendMetricKey || ''}
                                        label="Parameter"
                                        onChange={handleTrendParameterChange}
                                    >
                                        {selectedCard?.card_name === 'Water Inlet' && [
                                            <MenuItem key="flow" value="inlet_flowrate">Flow</MenuItem>,
                                            <MenuItem key="total" value="inlet_totalizer">Totalizer</MenuItem>
                                        ]}
                                        {selectedCard?.card_name === 'Water Outlet' && [
                                            <MenuItem key="flow" value="outlet_flowrate">Flow</MenuItem>,
                                            <MenuItem key="total" value="outlet_totalizer">Totalizer</MenuItem>
                                        ]}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                        <IconButton onClick={() => setChartModalOpen(false)}><CloseIcon /></IconButton>
                    </Box>
                    
                    {trendLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {/* Area Chart for Tank Card */}
                            {isTankTrend && tankTrendSeries.length > 0 && (
                                <Chart 
                                    options={areaChartOptions} 
                                    series={tankTrendSeries} 
                                    type="area" 
                                    height={350} 
                                />
                            )}

                            {/* Line Chart for Flow Cards */}
                            {!isTankTrend && trendData.length > 0 && (
                                <Chart 
                                    options={lineChartOptions} 
                                    series={lineChartSeries} 
                                    type="line" 
                                    height={350} 
                                />
                            )}
                        </>
                    )}
                </Box>
            </Modal>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
        </Box>
    );
};

export default StpMachineList;