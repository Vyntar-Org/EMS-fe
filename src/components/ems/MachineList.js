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
    Tooltip,
    useTheme,
    useMediaQuery,
    TextField,
    InputAdornment,
    Snackbar,
    Alert
} from '@mui/material';
import axios from 'axios';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { getMachineList, getActivePowerChart, getVoltageChart, getCurrentChart, getPowerFactorChart, getFrequencyChart } from '../../auth/MachineList';


const MachineList = ({ onSidebarToggle, sidebarVisible }) => {
    // Theme and Media Query for responsive detection
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [machineListData, setMachineListData] = useState(null);
    const [keyParameter, setKeyParameter] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // State for search
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        if (keyParameter === 'voltage') {
            // load voltage chart data
        } else if (keyParameter === 'current') {
            // load current chart data
        } else if (keyParameter === 'pf') {
            // load power factor chart data
        } else if (keyParameter === 'frequency') {
            // load frequency chart data
        }
    }, [keyParameter]);


    // Fetch machine list data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null); // Clear any previous errors

                // Fetch machine list concurrently
                const [machineListResponse] = await Promise.all([
                    getMachineList()
                ]);

                console.log('Machine list API response:', machineListResponse);

                // Set the data
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

        // Define CSV headers
        const headers = ['Machine Name', 'ID', 'Status', 'R-Volts', 'Y-Volts', 'B-Volts', 'R-Amps', 'Y-Amps', 'B-Amps', 'Active Power (kW)', 'PF', 'Frequency (Hz)', 'Today (kWh)', 'MTD (kWh)', 'Last Updated'];

        // Helper to check status
        const isWithinTimeLimit = (lastTs) => {
            if (!lastTs) return false;
            const lastTime = new Date(lastTs);
            const currentTime = new Date();
            const timeDiff = (currentTime - lastTime) / (1000 * 60);
            return timeDiff <= 15;
        };

        // Map data to CSV rows
        const rows = filteredMachines.map(machine => {
            const isOnline = isWithinTimeLimit(machine.latest.last_ts);
            const latest = machine.latest || {};
            const energy = machine.energy || {};

            // Conditional values logic (replicating the card logic)
            const getConditionalValue = (value) => {
                // Assuming we want to show the actual value in CSV regardless of online status for reporting purposes,
                // or we can hide it. Usually, reports show what the sensor says.
                // However, to match the card's "0" behavior for offline:
                // if (!isOnline) return 0; 
                // For now, let's return the raw value or 0.
                return (!isOnline && !['acte_im', 'today', 'mtd'].includes(key)) ? 0 : (value || 0);
            };

            return [
                machine.name || 'N/A',
                machine.slave_id || 'N/A',
                isOnline ? 'Online' : 'Offline',
                (latest.rv || 0).toFixed(2),
                (latest.yv || 0).toFixed(2),
                (latest.bv || 0).toFixed(2),
                (latest.ir || 0).toFixed(1),
                (latest.iy || 0).toFixed(1),
                (latest.ib || 0).toFixed(1),
                (latest.actpr_t || 0).toFixed(2),
                (latest.pf_t || 0).toFixed(2),
                (latest.fq || 0).toFixed(2),
                (energy.today || 0).toFixed(1),
                (energy.mtd || 0).toFixed(1),
                machine.latest?.last_ts ? new Date(machine.latest.last_ts).toLocaleString() : 'N/A'
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `machine_list_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // State for modal visibility
    const [chartModalOpen, setChartModalOpen] = useState(false);
    // State for selected floor
    const [selectedFloor, setSelectedFloor] = useState('Common');
    // State for individual card phase selections
    const [cardPhaseSelections, setCardPhaseSelections] = useState({});
    // State for chart type
    const [chartType, setChartType] = useState('activePower');
    // State for active power chart data
    const [activePowerData, setActivePowerData] = useState([]);
    // State for voltage chart data
    const [voltageData, setVoltageData] = useState([]);
    // State for current chart data
    const [currentData, setCurrentData] = useState([]);
    // State for power factor chart data
    const [powerFactorData, setPowerFactorData] = useState([]);
    // State for frequency chart data
    const [frequencyData, setFrequencyData] = useState([]);

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
                formatter: function (val) {
                    return val;
                },
            },
            tickAmount: 6,
            tooltip: {
                enabled: false,
                formatter: function (val) {
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
            style: {
                fontSize: '12px',
            },
            shared: true,
            intersect: false,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                let originalDate = '';
                let currentData = [];

                if (chartType === 'voltage') {
                    currentData = voltageData;
                } else if (chartType === 'current') {
                    currentData = currentData;
                } else if (chartType === 'powerFactor') {
                    currentData = powerFactorData;
                } else if (chartType === 'frequency') {
                    currentData = frequencyData;
                } else {
                    currentData = activePowerData;
                }

                if (currentData && currentData.length > 0 && currentData[dataPointIndex]) {
                    const item = currentData[dataPointIndex];
                    const timestamp = item?.timestamp || '';
                    if (timestamp) {
                        const date = new Date(timestamp);
                        originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                    }
                }

                let tooltipContent = `<div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                <div style="font-weight: bold; margin-bottom: 8px; color: lightgray; font-size: 14px; padding: 10px; background-color: #f4f7f6">${originalDate}</div>`;

                w.globals.seriesNames.forEach((name, index) => {
                    const value = series[index][dataPointIndex];
                    const color = ['#E34D4D', '#F8C537', '#4A90E2', '#EF4444', '#8B5CF6', '#2563EB'][index % 6];
                    tooltipContent += `
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
                        <span style="flex: 1; color: #333; font-size: 12px;">${name}:</span>
                        <span style="font-weight: bold; color: #333; margin-left: 5px; font-size: 12px;">${value}</span>
                    </div>`;
                });

                tooltipContent += '</div>';
                return tooltipContent;
            }
        },
        legend: {
            show: true,
        },
    };

    const formatTimestampForTooltip = (timestamp) => {
        if (!timestamp) return 'N/A';

        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }

            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Error';
        }
    };

    // Function to fetch active power chart data
    const fetchActivePowerData = async (slaveId) => {
        try {
            const response = await getActivePowerChart(slaveId);

            if (response.success) {
                setActivePowerData(response.data.data);
                return response.data.data;
            } else {
                console.error('Failed to fetch active power data:', response.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching active power data:', error);
            return [];
        }
    };

    // Function to fetch voltage chart data
    const fetchVoltageData = async (slaveId) => {
        try {
            const response = await getVoltageChart(slaveId);

            if (response.success) {
                setVoltageData(response.data.data);
                return response.data.data;
            } else {
                console.error('Failed to fetch voltage data:', response.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching voltage data:', error);
            return [];
        }
    };

    // Function to fetch current chart data
    const fetchCurrentData = async (slaveId) => {
        try {
            const response = await getCurrentChart(slaveId);

            if (response.success) {
                setCurrentData(response.data.data);
                return response.data.data;
            } else {
                console.error('Failed to fetch current data:', response.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching current data:', error);
            return [];
        }
    };

    // Function to fetch power factor chart data
    const fetchPowerFactorData = async (slaveId) => {
        try {
            const response = await getPowerFactorChart(slaveId);

            if (response.success) {
                setPowerFactorData(response.data.data);
                return response.data.data;
            } else {
                console.error('Failed to fetch power factor data:', response.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching power factor data:', error);
            return [];
        }
    };

    // Function to fetch frequency chart data
    const fetchFrequencyData = async (slaveId) => {
        try {
            const response = await getFrequencyChart(slaveId);

            if (response.success) {
                setFrequencyData(response.data.data);
                return response.data.data;
            } else {
                console.error('Failed to fetch frequency data:', response.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching frequency data:', error);
            return [];
        }
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

    // Chart series based on selected chart type
    const getCurrentChartSeries = () => {
        if (chartType === 'activePower') {
            const activePowerValues = activePowerData.map(item => item.value);
            return [{
                name: `${selectedFloor} Active Power`,
                data: activePowerValues,
                color: '#4A90E2'
            }];
        } else if (chartType === 'voltage') {
            return [
                {
                    name: 'R-Voltage',
                    data: voltageData.map(item => item.rv),
                    color: '#E34D4D'
                },
                {
                    name: 'Y-Voltage',
                    data: voltageData.map(item => item.yv),
                    color: '#F8C537'
                },
                {
                    name: 'B-Voltage',
                    data: voltageData.map(item => item.bv),
                    color: '#4A90E2'
                }
            ];
        } else if (chartType === 'current') {
            return [
                {
                    name: 'R-Current',
                    data: currentData.map(item => item.i_r),
                    color: '#E34D4D'
                },
                {
                    name: 'Y-Current',
                    data: currentData.map(item => item.i_y),
                    color: '#F8C537'
                },
                {
                    name: 'B-Current',
                    data: currentData.map(item => item.i_b),
                    color: '#4A90E2'
                }
            ];
        } else if (chartType === 'powerFactor') {
            const powerFactorValues = powerFactorData.map(item => item.value);
            return [{
                name: `${selectedFloor} Power Factor`,
                data: powerFactorValues,
                color: '#E34D4D'
            }];
        } else if (chartType === 'frequency') {
            const frequencyValues = frequencyData.map(item => item.value);
            return [{
                name: `${selectedFloor} Frequency`,
                data: frequencyValues,
                color: '#E34D4D'
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
        floorTitle: {
            fontSize: '16px',
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
            flexDirection: {
                xs: 'column',
                sm: 'row'
            },
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
    };

    const chartNameMapping = {
        activePower: 'Active Power',
        voltage: 'Voltage',
        current: 'Current',
        powerFactor: 'Power Factor',
        frequency: 'Frequency',
        keyParameters: 'Key Parameters',
    };
    const chartName = chartNameMapping[chartType] || 'Active Power';


    // Function to render a floor card
    const renderFloorCard = (machine) => {
        if (!machine) return null;

        const isWithinTimeLimit = (lastTs) => {
            if (!lastTs) return false;

            const lastTime = new Date(lastTs);
            const currentTime = new Date();
            const timeDiff = (currentTime - lastTime) / (1000 * 60);

            return timeDiff <= 15;
        };

        const isOnline = isWithinTimeLimit(machine.latest.last_ts);
        const latest = machine.latest || {};
        const energy = machine.energy || {};

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

        const getConditionalStatus = (isOnline) => {
            if (conditionalLatest.actpr_t > 1 && isOnline) {
                return 'Online';
            } else {
                return 'Offline';
            }
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
                        <Typography style={styles.floorTitle}>
                            {machine.name}
                        </Typography>

                        {/* Responsive Online Status Box */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                                // Mobile specific changes
                                ...(isMobile && {
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }),
                            }}
                        >
                            <Typography style={{ fontSize: '11px', color: getConditionalStatus(isOnline) === 'Online' ? '#30b44a' : '#e34d4d', border: '1px solid ' + (getConditionalStatus(isOnline) === 'Online' ? '#30b44a' : '#e34d4d'), padding: '2px 6px', borderRadius: '4px' }}>
                                {getConditionalStatus(isOnline)}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937', marginLeft: '10px' }}>
                                    {conditionalLatest.acte_im?.toFixed(1)} kWh
                                </Typography>
                                <Tooltip
                                    title={`${formatTimestampForTooltip(machine.latest?.last_ts)}`}
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
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <AccessTimeIcon sx={{ fontSize: '14px', ml: 0.5 }} />
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>

                    {/* Phase Data Table */}
                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold' }}>Phase</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>V</TableCell>
                                    <TableCell align="right" style={{ ...styles.tableCell, fontWeight: 'bold' }}>A</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseR }}></Box>
                                            Phase R
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.rv?.toFixed(2)}</TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.ir?.toFixed(1)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseY }}></Box>
                                            Phase Y
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.yv?.toFixed(2)}</TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.iy?.toFixed(1)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={styles.tableCell}>
                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box style={{ ...styles.phaseDot, ...styles.phaseB }}></Box>
                                            Phase B
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.bv?.toFixed(2)}</TableCell>
                                    <TableCell align="right" style={styles.tableCell}>{conditionalLatest.ib?.toFixed(1)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Metrics Row */}
                    <Box style={{ ...styles.metricsRow, marginTop: '0px', display: 'flex', justifyContent: 'space-between' }}>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Active power</Typography>
                            <Typography style={styles.metricValue}>{conditionalLatest.actpr_t?.toFixed(2)} kw</Typography>
                        </Box>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Power factor</Typography>
                            <Typography style={styles.metricValue}>{conditionalLatest.pf_t} PF</Typography>
                        </Box>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Frequency</Typography>
                            <Typography style={styles.metricValue}>{conditionalLatest.fq} Hz</Typography>
                        </Box>
                    </Box>

                    {/* Energy Consumed and MTD */}
                    <Box style={{ ...styles.metricsRow, marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <Box style={styles.metricItem}>
                            <Typography style={styles.metricLabel}>Today</Typography>
                            <Typography style={styles.metricValue}>{conditionalEnergy.today?.toFixed(1)} kWh</Typography>
                        </Box>
                        <Box style={styles.metricItem}>
                            <Typography style={{ ...styles.metricLabel, marginLeft: '15px' }}>MTD</Typography>
                            <Typography style={{ ...styles.metricValue, marginLeft: '15px' }}>{conditionalEnergy.mtd?.toFixed(1)} kWh</Typography>
                        </Box>
                        <Box style={{ marginTop: 'auto' }}>
                            <Button
                                variant="contained"
                                style={styles.chartButton}
                                onClick={async () => {
                                    setSelectedFloor(machine.name);
                                    setChartType('activePower');
                                    setChartModalOpen(true);

                                    const selectedMachine = machineListData?.data?.machines?.find(
                                        m => m.name === machine.name
                                    );
                                    if (selectedMachine) {
                                        await fetchActivePowerData(selectedMachine.slave_id);
                                    }
                                }}
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
                    placeholder="Search machines..."
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

            {/* Custom Grid Container for responsive cards */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
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
                        <Box>
                            <Typography id="chart-modal-title" variant="h6" component="h2" sx={{ fontSize: { xs: '16px', sm: '18px', md: '20px' } }}>
                                {selectedFloor} - {chartType === 'keyParameters' ? chartName : `Last 6 hours ${chartName} data`}
                            </Typography>
                            <Box sx={{ marginTop: '10px' }}>
                                <Tabs
                                    value={chartType === 'activePower' ? 0 : 1}
                                    onChange={async (event, newValue) => {
                                        if (newValue === 0) {
                                            setChartType('activePower');
                                            const selectedMachine = machineListData?.data?.machines?.find(
                                                machine => machine.name === selectedFloor
                                            );
                                            if (selectedMachine) {
                                                await fetchActivePowerData(selectedMachine.slave_id);
                                            }
                                        }
                                    }}
                                    sx={{
                                        minHeight: '36px',
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: '#2F6FB0',
                                        },
                                        '& .MuiTab-root': {
                                            minHeight: '36px',
                                            fontSize: { xs: '12px', sm: '14px' },
                                            textTransform: 'none',
                                            fontWeight: chartType === 'activePower' ? 600 : 400,
                                            padding: { xs: '6px 10px', sm: '6px 16px' },
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
                                        onClick={async () => {
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
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: { xs: '10px', sm: '40px' },
                                width: { xs: '100%', sm: 'auto' }
                            }}>
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, height: '32px' }}>
                                    <Select
                                        value={keyParameter}
                                        onChange={async (e) => {
                                            const selectedValue = e.target.value;
                                            setKeyParameter(selectedValue);

                                            if (selectedValue === 'voltage') {
                                                setChartType('voltage');
                                                const selectedMachine = machineListData?.data?.machines?.find(
                                                    m => m.name === selectedFloor
                                                );
                                                if (selectedMachine) {
                                                    await fetchVoltageData(selectedMachine.slave_id);
                                                }
                                            } else if (selectedValue === 'current') {
                                                setChartType('current');
                                                const selectedMachine = machineListData?.data?.machines?.find(
                                                    m => m.name === selectedFloor
                                                );
                                                if (selectedMachine) {
                                                    await fetchCurrentData(selectedMachine.slave_id);
                                                }
                                            } else if (selectedValue === 'pf') {
                                                setChartType('powerFactor');
                                                const selectedMachine = machineListData?.data?.machines?.find(
                                                    m => m.name === selectedFloor
                                                );
                                                if (selectedMachine) {
                                                    await fetchPowerFactorData(selectedMachine.slave_id);
                                                }
                                            } else if (selectedValue === 'frequency') {
                                                setChartType('frequency');
                                                const selectedMachine = machineListData?.data?.machines?.find(
                                                    m => m.name === selectedFloor
                                                );
                                                if (selectedMachine) {
                                                    await fetchFrequencyData(selectedMachine.slave_id);
                                                }
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
                                        <MenuItem value="voltage" sx={{ fontSize: '13px', minHeight: '32px' }}>Voltage (V)</MenuItem>
                                        <MenuItem value="current" sx={{ fontSize: '13px', minHeight: '32px' }}>Current (A)</MenuItem>
                                        <MenuItem value="pf" sx={{ fontSize: '13px', minHeight: '32px' }}>Power Factor (PF)</MenuItem>
                                        <MenuItem value="frequency" sx={{ fontSize: '13px', minHeight: '32px' }}>Frequency (Hz)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
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
                        {chartType === 'keyParameters' ? (
                            <Box sx={{ textAlign: 'center', padding: { xs: '50px', sm: '100px' } }}>
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
        </Box>
    );
};

export default MachineList;