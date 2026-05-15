import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
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
    Chip,
    Tabs,
    Tab,
} from '@mui/material';
import Chart from 'react-apexcharts';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IdleIcon from '@mui/icons-material/HourglassEmpty';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
    getCompressorMachineList,
    getCompressorMachineTrend,
    getCompressorDowntimeHistory,
} from '../../auth/compressor/MachineListApi';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const parseDowntimeDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (!parts) return null;
    return new Date(
        parseInt(parts[3]),
        parseInt(parts[2]) - 1,
        parseInt(parts[1]),
        parseInt(parts[4]),
        parseInt(parts[5])
    ).getTime();
};

const parseFlexibleDate = (dateStr) => {
    if (!dateStr) return null;
    const nativeTs = new Date(dateStr).getTime();
    if (!isNaN(nativeTs) && nativeTs > 0) return nativeTs;
    return parseDowntimeDate(dateStr);
};

const TabPanel = memo(({ children, value, index }) => (
    <Box
        role="tabpanel"
        sx={{
            py: 2,
            height: '100%',
            overflow: 'hidden',
            display: value === index ? 'block' : 'none',
        }}
    >
        {children}
    </Box>
));
TabPanel.displayName = 'TabPanel';

const MemoizedTrendChart = memo(({ options, series, height, loading, noDataMessage, chartType = 'area' }) => {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height || 300 }}>
                <CircularProgress />
            </Box>
        );
    }
    if (series && series[0]?.data?.length > 0) {
        return <Chart options={options} series={series} type={chartType} height={height || 300} />;
    }
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height || 300 }}>
            <Alert severity="info" sx={{ width: '100%' }}>{noDataMessage || 'No data available'}</Alert>
        </Box>
    );
}, (prevProps, nextProps) => {
    const prevDataLength = prevProps.series?.[0]?.data?.length || 0;
    const nextDataLength = nextProps.series?.[0]?.data?.length || 0;

    if (prevProps.loading !== nextProps.loading) return false;
    if (prevProps.chartType !== nextProps.chartType) return false;
    if (prevProps.height !== nextProps.height) return false;
    if (prevDataLength !== nextDataLength) return false;

    if (prevDataLength > 0 && nextDataLength > 0) {
        const prevFirst = prevProps.series[0].data[0];
        const nextFirst = nextProps.series[0].data[0];
        const prevLast = prevProps.series[0].data[prevDataLength - 1];
        const nextLast = nextProps.series[0].data[nextDataLength - 1];

        const prevFirstY = Array.isArray(prevFirst?.y) ? JSON.stringify(prevFirst.y) : prevFirst?.y;
        const nextFirstY = Array.isArray(nextFirst?.y) ? JSON.stringify(nextFirst.y) : nextFirst?.y;
        const prevLastY = Array.isArray(prevLast?.y) ? JSON.stringify(prevLast.y) : prevLast?.y;
        const nextLastY = Array.isArray(nextLast?.y) ? JSON.stringify(nextLast.y) : nextLast?.y;

        if (prevFirst?.x !== nextFirst?.x || prevFirstY !== nextFirstY) return false;
        if (prevLast?.x !== nextLast?.x || prevLastY !== nextLastY) return false;
    }

    return true;
});

MemoizedTrendChart.displayName = 'MemoizedTrendChart';

const CompressorMachineList = ({ onSidebarToggle, sidebarVisible }) => {
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

    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [nextRefreshCountdown, setNextRefreshCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
    const refreshIntervalRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const isChartModalOpenRef = useRef(false);

    const [downtimePopupOpen, setDowntimePopupOpen] = useState(false);
    const [downtimePopupTitle, setDowntimePopupTitle] = useState('');
    const [downtimePopupData, setDowntimePopupData] = useState([]);

    const [stoppageModalOpen, setStoppageModalOpen] = useState(false);
    const [stoppageModalTitle, setStoppageModalTitle] = useState('');
    const [stoppageModalTimeRange, setStoppageModalTimeRange] = useState('');
    const [stoppageActiveTab, setStoppageActiveTab] = useState(0);
    const [derivedStoppages, setDerivedStoppages] = useState([]);
    const [downtimeMeta, setDowntimeMeta] = useState(null);
    const [downtimeLoading, setDowntimeLoading] = useState(false);
    const [downtimeWindow, setDowntimeWindow] = useState(null);

    const derivedStoppagesRef = useRef([]);
    useEffect(() => {
        derivedStoppagesRef.current = derivedStoppages;
    }, [derivedStoppages]);

    useEffect(() => {
        isChartModalOpenRef.current = chartModalOpen || stoppageModalOpen;
    }, [chartModalOpen, stoppageModalOpen]);

    const truncateText = (text, length = 15) =>
        text.length > length ? text.slice(0, length) + '...' : text;

    const fetchMachineList = async (isSilent = false) => {
        try {
            if (!isSilent) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);
            const response = await getCompressorMachineList();
            setMachineListData(response);
            setLastRefreshTime(new Date());
            setNextRefreshCountdown(REFRESH_INTERVAL_MS / 1000);
        } catch (err) {
            console.error('Error fetching machine list:', err);
            if (!isSilent || !machineListData?.data?.machines?.length) {
                setError(err.message || 'Failed to fetch machine list');
                setSnackbarMessage(err.message || 'Failed to fetch machine list');
                setSnackbarOpen(true);
            }
        } finally {
            if (!isSilent) {
                setLoading(false);
            } else {
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        fetchMachineList(false);

        refreshIntervalRef.current = setInterval(() => {
            fetchMachineList(true);
        }, REFRESH_INTERVAL_MS);

        countdownIntervalRef.current = setInterval(() => {
            setNextRefreshCountdown(prev => {
                if (prev <= 1) return REFRESH_INTERVAL_MS / 1000;
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleManualRefresh = () => {
        if (refreshing) return;
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        fetchMachineList(true);

        refreshIntervalRef.current = setInterval(() => {
            fetchMachineList(true);
        }, REFRESH_INTERVAL_MS);

        countdownIntervalRef.current = setInterval(() => {
            setNextRefreshCountdown(prev => {
                if (prev <= 1) return REFRESH_INTERVAL_MS / 1000;
                return prev - 1;
            });
        }, 1000);
    };

    const formatCountdown = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const filteredMachines = machineListData?.data?.machines?.filter(machine => {
        const term = searchTerm.toLowerCase();
        return (
            machine.slave_name.toLowerCase().includes(term) ||
            machine.slave_id.toString().toLowerCase().includes(term) ||
            (machine.compressor_no && machine.compressor_no.toLowerCase().includes(term))
        );
    }) || [];

    const handleDownload = () => {
        if (filteredMachines.length === 0) {
            setSnackbarMessage('No data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = [
            'Machine Name', 'Compressor No', 'Status', 'Since',
            'Last Stoppage Start', 'Last Stoppage End', 'Duration',
            'Stoppages (8h)', 'Stoppage Duration (8h)',
            'Stoppages (24h)', 'Stoppage Duration (24h)', 'Last Updated',
        ];

        const rows = filteredMachines.map(machine => {
            const date = machine.current_status?.last_updated
                ? new Date(machine.current_status.last_updated).toLocaleString()
                : 'N/A';
            return [
                machine.slave_name || 'N/A',
                machine.compressor_no || 'N/A',
                machine.current_status?.status || 'N/A',
                machine.current_status?.since_display || 'N/A',
                machine.last_stoppage?.start_time || '-',
                machine.last_stoppage?.end_time || '-',
                machine.last_stoppage?.duration || '-',
                machine.history_8h?.count ?? 0,
                machine.history_8h?.total_duration || '-',
                machine.history_24h?.count ?? 0,
                machine.history_24h?.total_duration || '-',
                date,
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

    // ─── Download handler for stoppage table in modal ───
    const handleStoppageTableDownload = () => {
        if (derivedStoppages.length === 0) {
            setSnackbarMessage('No stoppage data to download');
            setSnackbarOpen(true);
            return;
        }

        const headers = ['#', 'Start Time', 'End Time', 'Duration'];

        const rows = derivedStoppages.map((item, index) => {
            const isOngoing = item.isOngoing;
            const endDisplay = isOngoing ? 'Ongoing' : (item.end_time || '-');
            // const status = isOngoing ? 'Ongoing' : 'Completed';
            return [
                index + 1,
                `"${item.start_time || '-'}"`,
                `"${endDisplay}"`,
                `"${item.duration || '-'}"`,
                // status,
            ].join(',');
        });

        const totalCount = downtimeMeta?.count ?? derivedStoppages.length;
        const totalDuration = downtimeMeta?.total_downtime
            ?? formatMinutesToDuration(Math.round(derivedStoppages.reduce((sum, item) => sum + (item.durationSeconds || 0), 0) / 60));

        rows.push('');
        rows.push(`"Total Stoppages:",${totalCount},,`);
        rows.push(`"Total Duration:","${totalDuration}",,`);

        const cleanTitle = (stoppageModalTitle || 'stoppage').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').slice(0, 50);

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const fetchTrendData = async (slaveId) => {
        try {
            setTrendLoading(true);
            const response = await getCompressorMachineTrend(slaveId);
            const transformedData = response.data.data.map(item => ({
                timestamp: item.start,
                value: item.status,
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

    const parseDurationToMinutes = (durationStr) => {
        if (!durationStr) return 0;
        const hMatch = durationStr.match(/(-?\d+)\s*h/);
        const mMatch = durationStr.match(/(-?\d+)\s*m/);
        if (hMatch && mMatch) return parseInt(hMatch[1]) * 60 + parseInt(mMatch[1]);
        const timeMatch = durationStr.match(/(-?\d+):(\d+)(?::(\d+))?/);
        if (timeMatch) return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        const num = parseInt(durationStr);
        if (!isNaN(num)) return num;
        return 0;
    };

    const formatMinutesToDuration = (totalMinutes) => {
        const isNegative = totalMinutes < 0;
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        const sign = isNegative ? '-' : '';
        return `${sign}${String(hours).padStart(2, '0')} hr ${String(minutes).padStart(2, '0')} m`;
    };

    const formatDateTime = (date) => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
    };

    const formatTimestampForTooltip = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });
    };

    const openDowntimePopup = (title, data) => {
        setDowntimePopupTitle(title);
        setDowntimePopupData(data);
        setDowntimePopupOpen(true);
    };

    const handleStoppageClick = async (machine, hours) => {
        setStoppageModalTitle(`${machine.slave_name} — Last ${hours} hrs`);
        setStoppageModalTimeRange('Loading...');
        setStoppageActiveTab(0);
        setDerivedStoppages([]);
        setDowntimeMeta(null);
        setDowntimeWindow(null);
        setDowntimeLoading(true);
        setStoppageModalOpen(true);

        try {
            const res = await getCompressorDowntimeHistory(machine.slave_id, hours);

            if (res.meta?.window) {
                setStoppageModalTimeRange(`${res.meta.window.from} — ${res.meta.window.to}`);
                setDowntimeWindow(res.meta.window);
            } else {
                const now = new Date();
                const fromTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
                const fallbackRange = `${formatDateTime(fromTime)} - ${formatDateTime(now)}`;
                setStoppageModalTimeRange(fallbackRange);
                setDowntimeWindow({ from: fromTime.toISOString(), to: now.toISOString() });
            }

            if (res.data?.periods) {
                const mapped = res.data.periods.map(p => ({
                    start_time: p.start_time,
                    end_time: p.end_time,
                    duration: p.duration,
                    durationSeconds: p.duration_seconds,
                    isOngoing: p.ongoing || false,
                }));
                setDerivedStoppages(mapped);
            }

            if (res.meta?.summary) {
                setDowntimeMeta(res.meta.summary);
            }
        } catch (err) {
            console.error('Downtime history fetch failed:', err);
            setSnackbarMessage(err.message || 'Failed to fetch downtime history');
            setSnackbarOpen(true);
            const now = new Date();
            const fromTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
            setStoppageModalTimeRange(`${formatDateTime(fromTime)} - ${formatDateTime(now)}`);
            setDowntimeWindow(null);
            setDerivedStoppages([]);
        } finally {
            setDowntimeLoading(false);
        }
    };

    const handleChartModalClose = () => {
        setChartModalOpen(false);
        isChartModalOpenRef.current = false;
    };

    const handleStoppageModalClose = () => {
        setStoppageModalOpen(false);
        isChartModalOpenRef.current = false;
        setDowntimeWindow(null);
    };

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
        phaseTable: { marginTop: '8px' },
        phaseTableHeader: { backgroundColor: '#f5f5f5' },
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

    const chartOptions = useRef({
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
            background: '#FFFFFF',
            animations: {
                enabled: false,
                dynamicAnimation: {
                    enabled: false,
                },
            },
        },
        stroke: {
            curve: 'stepline',
            width: 2,
            colors: ['#30b44a'],
        },
        fill: {
            type: 'solid',
            colors: ['#30b44a'],
            opacity: 0.2,
        },
        dataLabels: { enabled: false },
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
                datetimeUTC: false,
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
                },
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
                return `<div style="padding:10px;background-color:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight:bold;margin-bottom:8px;color:#333;font-size:12px;">${formattedDate}</div>
                    <div style="display:flex;align-items:center;">
                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${statusColor};margin-right:8px;"></span>
                        <span style="flex:1;color:#333;font-size:12px;">Status:</span>
                        <span style="font-weight:bold;color:${statusColor};margin-left:5px;font-size:12px;">${statusText}</span>
                    </div>
                </div>`;
            },
        },
        legend: { show: false },
    }).current;

    const chartSeries = useMemo(() => [{
        name: 'Connectivity',
        data: trendData.map(item => ({
            x: new Date(item.timestamp).getTime(),
            y: item.value,
        })),
    }], [trendData]);

    const downtimeWindowRef = useRef(null);
    useEffect(() => {
        downtimeWindowRef.current = downtimeWindow;
    }, [downtimeWindow]);

    const downtimeChartOptions = useRef({
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
            background: '#FFFFFF',
            animations: {
                enabled: false,
                dynamicAnimation: {
                    enabled: false,
                },
            },
        },
        stroke: {
            curve: 'stepline',
            width: 2,
            colors: ['#30b44a'],
        },
        fill: {
            type: 'solid',
            colors: ['#30b44a'],
            opacity: 0.2,
        },
        dataLabels: { enabled: false },
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
                datetimeUTC: false,
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
                },
            },
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: { format: 'dd MMM HH:mm' },
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const dataPoint = w.globals.initialSeries[seriesIndex]?.data[dataPointIndex];
                if (!dataPoint) return '';

                const date = new Date(dataPoint.x);
                const formattedDate = date.toLocaleString();
                const value = dataPoint.y;
                const statusText = value === 1 ? 'Online' : 'Offline';
                const statusColor = value === 1 ? '#30b44a' : '#e34d4d';

                const stoppages = derivedStoppagesRef.current;

                let durationText = '';
                let isOngoing = false;
                if (value === 0) {
                    const ts = dataPoint.x;
                    const match = stoppages.find(p => {
                        const sTs = parseDowntimeDate(p.start_time);
                        return sTs !== null && Math.abs(sTs - ts) < 2000;
                    });
                    if (match) {
                        durationText = match.duration || '';
                        isOngoing = match.isOngoing || false;
                    }
                }

                return `<div style="padding:10px;background-color:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight:bold;margin-bottom:8px;color:#333;font-size:12px;">${formattedDate}</div>
                    <div style="display:flex;align-items:center;">
                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${statusColor};margin-right:8px;"></span>
                        <span style="flex:1;color:#333;font-size:12px;">Status:</span>
                        <span style="font-weight:bold;color:${statusColor};margin-left:5px;font-size:12px;">${statusText}</span>
                    </div>
                    ${value === 0 && durationText ? `<div style="display:flex;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid #f0f0f0;">
                        <span style="flex:1;color:#333;font-size:12px;">Duration:</span>
                        <span style="font-weight:bold;color:#e34d4d;margin-left:5px;font-size:12px;">${durationText}</span>
                    </div>` : ''}
                    ${isOngoing ? `<div style="margin-top:6px;text-align:right;"><span style="display:inline-block;font-size:9px;color:#e34d4d;font-weight:700;background:#fae8e8;padding:2px 8px;border-radius:4px;letter-spacing:0.5px;">● ONGOING</span></div>` : ''}
                </div>`;
            },
        },
        legend: { show: false },
    }).current;

    const downtimeChartRef = useRef(null);

    useEffect(() => {
        if (!downtimeWindow?.from || !downtimeWindow?.to) return;
        const fromTs = parseFlexibleDate(downtimeWindow.from);
        const toTs = parseFlexibleDate(downtimeWindow.to);
        if (fromTs == null || toTs == null || isNaN(fromTs) || isNaN(toTs)) return;

        if (downtimeChartRef.current?.chart?.updateOptions) {
            downtimeChartRef.current.chart.updateOptions({
                xaxis: {
                    min: fromTs,
                    max: toTs,
                },
            });
        }
    }, [downtimeWindow]);

    const generateTimelineData = useMemo(() => {
        if (!downtimeWindow?.from || !downtimeWindow?.to || derivedStoppages.length === 0) {
            return [];
        }

        const fromTs = parseFlexibleDate(downtimeWindow.from);
        const toTs = parseFlexibleDate(downtimeWindow.to);

        if (fromTs == null || toTs == null || isNaN(fromTs) || isNaN(toTs)) return [];

        const sorted = [...derivedStoppages]
            .map((p, idx) => ({
                ...p,
                originalIndex: idx,
                startTs: parseDowntimeDate(p.start_time),
                endTs: p.end_time ? parseDowntimeDate(p.end_time) : null,
            }))
            .filter(p => p.startTs != null && !isNaN(p.startTs))
            .sort((a, b) => a.startTs - b.startTs);

        if (sorted.length === 0) return [];

        const points = [];

        points.push({ x: fromTs, y: 1 });

        for (const stop of sorted) {
            points.push({ x: stop.startTs, y: 0 });

            if (stop.endTs != null && !isNaN(stop.endTs)) {
                points.push({ x: stop.endTs, y: 1 });
            }
        }

        const lastStop = sorted[sorted.length - 1];
        if (lastStop.endTs == null || isNaN(lastStop.endTs)) {
            points.push({ x: toTs, y: 0 });
        } else {
            points.push({ x: toTs, y: 1 });
        }

        return points;
    }, [derivedStoppages, downtimeWindow]);

    const downtimeChartSeries = useMemo(() => [{
        name: 'Connectivity',
        data: generateTimelineData,
    }], [generateTimelineData]);

    const renderFloorCard = (machine) => {
        if (!machine) return null;

        const isOnline = machine.current_status?.status === 'ONLINE';
        const isNameTruncated = machine.slave_name && machine.slave_name.length > 24;
        const displayName = truncateText(machine.slave_name, 24);

        const stoppageCount8h = machine.history_8h?.count ?? 0;
        const stoppageCount24h = machine.history_24h?.count ?? 0;
        const stoppageDuration8h = machine.history_8h?.total_duration || '-';
        const stoppageDuration24h = machine.history_24h?.total_duration || '-';

        return (
            <Card style={styles.floorCard}>
                <CardContent
                    style={{
                        ...styles.commonSection,
                        ...(isOnline
                            ? {
                                background: 'linear-gradient(42deg, rgba(255,255,255,1) 0%, rgba(87,199,133,0.72) 94%)',
                                backgroundColor: 'transparent',
                            }
                            : { backgroundColor: '#FFFFFF' }),
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        flexGrow: 1,
                    }}
                >
                    <Box style={styles.commonHeader}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box>
                                {isNameTruncated ? (
                                    <Tooltip title={machine.slave_name} placement="top" arrow enterTouchDelay={0} leaveTouchDelay={3000}
                                        componentsProps={{ tooltip: { sx: { fontSize: '13px', fontWeight: 500 } } }}>
                                        <Typography style={styles.floorTitle}>{displayName}</Typography>
                                    </Tooltip>
                                ) : (
                                    <Typography style={styles.floorTitle}>{displayName}</Typography>
                                )}
                            </Box>
                        </Box>
                        <Box style={styles.onlineStatus}>
                            {machine.idle && (
                                <Tooltip title="Idle" arrow>
                                    <IdleIcon sx={{ fontSize: '16px', color: '#F59E0B' }} />
                                </Tooltip>
                            )}
                            {machine.alert && (
                                <Tooltip title={typeof machine.alert === 'string' ? machine.alert : 'Alert'} arrow>
                                    <WarningAmberIcon sx={{ fontSize: '16px', color: '#EF4444' }} />
                                </Tooltip>
                            )}
                            <Typography style={{
                                fontSize: '11px',
                                color: isOnline ? '#30b44a' : '#e34d4d',
                                border: '1px solid ' + (isOnline ? '#30b44a' : '#e34d4d'),
                                padding: '2px 6px',
                                borderRadius: '4px',
                            }}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Typography>
                        </Box>
                    </Box>

                    <Typography style={{ ...styles.floorTitle, fontSize: '12px', fontWeight: 'bold', color: 'rgb(82 93 108)' }}>
                        {formatTimestampForTooltip(machine.current_status?.last_updated)}
                    </Typography>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        py: 1, px: 1, borderRadius: '4px', mb: 1,
                    }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap' }}>
                            Current Status:
                        </Typography>
                        <Chip
                            label={machine.current_status?.status || 'N/A'}
                            size="small"
                            sx={{
                                backgroundColor: isOnline ? '#e8f9e6' : '#fae8e8',
                                color: isOnline ? '#30b44a' : '#e34d4d',
                                fontWeight: 'bold', fontSize: '11px',
                            }}
                        />
                        <Typography sx={{ fontSize: '11px', color: '#0c0c0c', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            from {machine.current_status?.since_display || '-'}
                        </Typography>
                    </Box>

                    <TableContainer style={styles.phaseTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{ ...styles.phaseTableHeader, backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                    <TableCell colSpan={3} style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                        Last Stoppage
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
                                    <TableCell style={styles.tableCell}>{machine.last_stoppage?.start_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.last_stoppage?.end_time || '-'}</TableCell>
                                    <TableCell style={styles.tableCell}>{machine.last_stoppage?.duration || '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TableContainer style={{ ...styles.phaseTable, marginTop: '16px' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow style={{ backgroundColor: isOnline ? 'transparent' : '#f5f5f5' }}>
                                    <TableCell style={{ ...styles.tableCell, fontWeight: 'bold', borderTopLeftRadius: '4px' }}>
                                        Stoppages History
                                    </TableCell>
                                    <TableCell align="center" style={{ ...styles.tableCell, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        Previous 8hrs
                                    </TableCell>
                                    <TableCell align="center" style={{ ...styles.tableCell, fontWeight: 'bold', borderTopRightRadius: '4px', whiteSpace: 'nowrap' }}>
                                        Previous 24hrs
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell style={{ ...styles.tableCell, color: '#1F2937', fontWeight: 600 }}>
                                        No. of Stoppages
                                    </TableCell>
                                    <TableCell align="center" style={styles.tableCell}>
                                        <Box
                                            component="span"
                                            onClick={(e) => { e.stopPropagation(); if (stoppageCount8h > 0) handleStoppageClick(machine, 8); }}
                                            sx={{
                                                cursor: stoppageCount8h > 0 ? 'pointer' : 'default',
                                                color: stoppageCount8h > 0 ? '#2F6FB0' : 'inherit',
                                                fontWeight: 600, textDecoration: 'none',
                                                transition: 'color 0.2s ease, text-decoration 0.2s ease',
                                                '&:hover': stoppageCount8h > 0 ? { textDecoration: 'underline', textDecorationColor: '#2F6FB0' } : {},
                                            }}
                                        >
                                            {stoppageCount8h}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" style={styles.tableCell}>
                                        <Box
                                            component="span"
                                            onClick={(e) => { e.stopPropagation(); if (stoppageCount24h > 0) handleStoppageClick(machine, 24); }}
                                            sx={{
                                                cursor: stoppageCount24h > 0 ? 'pointer' : 'default',
                                                color: stoppageCount24h > 0 ? '#2F6FB0' : 'inherit',
                                                fontWeight: 600, textDecoration: 'none',
                                                transition: 'color 0.2s ease, text-decoration 0.2s ease',
                                                '&:hover': stoppageCount24h > 0 ? { textDecoration: 'underline', textDecorationColor: '#2F6FB0' } : {},
                                            }}
                                        >
                                            {stoppageCount24h}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ ...styles.tableCell, color: '#1F2937', fontWeight: 600 }}>
                                        Stoppage Duration
                                    </TableCell>
                                    <TableCell align="center" style={{ ...styles.tableCell, color: '#1F2937' }}>
                                        {stoppageDuration8h}
                                    </TableCell>
                                    <TableCell align="center" style={{ ...styles.tableCell, color: '#1F2937' }}>
                                        {stoppageDuration24h}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                        <Button
                            variant="contained"
                            style={styles.chartButton}
                            onClick={async () => {
                                setSelectedFloor(machine.slave_name);
                                setChartModalOpen(true);
                                isChartModalOpenRef.current = true;
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
                    <Box sx={styles.headerContainer}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Search Devices..."
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                                sx={{ width: { xs: '100%', sm: '240px' }, backgroundColor: '#fff', borderRadius: '4px', marginLeft: { sm: '18px', md: '30px' } }}
                            />
                        </Box>

                        <Button
                            variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleDownload}
                            sx={{
                                minWidth: '40px', width: '40px', height: '40px', borderRadius: '50%',
                                borderColor: '#2F6FB0', color: '#fff', backgroundColor: '#2F6FB0', padding: 0, marginRight: '10px',
                                '& .MuiButton-startIcon': { margin: 0 },
                                '&:hover': { borderColor: '#1E4A7C', backgroundColor: '#1E4A7C', color: '#fff' },
                            }}
                        />
                    </Box>

                    {refreshing && (
                        <Box sx={{
                            width: '100%', height: '3px', backgroundColor: '#EBF5FF',
                            position: 'relative', overflow: 'hidden', mb: 1, borderRadius: '2px',
                        }}>
                            <Box sx={{
                                position: 'absolute', top: 0, left: 0, height: '100%', width: '30%',
                                backgroundColor: '#2F6FB0', borderRadius: '2px',
                                animation: 'slide 1.5s ease-in-out infinite',
                                '@keyframes slide': { '0%': { left: '-30%' }, '100%': { left: '100%' } },
                            }} />
                        </Box>
                    )}

                    <Box sx={{
                        display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'left',
                        gap: { xs: '15px', sm: '20px', md: '20px 50px' },
                        padding: { xs: '0 5px', sm: '0 15px', md: '0 30px' },
                    }}>
                        {filteredMachines.length > 0 ? (
                            filteredMachines.map((machine, index) => (
                                <Box key={machine.slave_id || index} sx={{ width: { xs: '100%', sm: 'calc(50% - 15px)', md: 'calc(33.33% - 35px)' } }}>
                                    {renderFloorCard(machine)}
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 5, color: '#888' }}>
                                No compressors found matching your search.
                            </Box>
                        )}
                    </Box>

                    {/* ─── TREND modal ─── */}
                    <Modal open={chartModalOpen} onClose={handleChartModalClose}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', md: '60%' }, bgcolor: 'background.paper', borderRadius: '8px', boxShadow: 24, p: 4,
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">{selectedFloor}</Typography>
                                <IconButton onClick={handleChartModalClose}><CloseIcon /></IconButton>
                            </Box>
                            <MemoizedTrendChart
                                options={chartOptions}
                                series={chartSeries}
                                height={300}
                                loading={trendLoading}
                                noDataMessage="No data available"
                            />
                        </Box>
                    </Modal>

                    {/* ═══ TABBED STOPPAGE MODAL ═══ */}
                    <Modal open={stoppageModalOpen} onClose={handleStoppageModalClose}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: { xs: '92%', sm: '600px', md: '750px' },
                            bgcolor: 'background.paper', borderRadius: '12px', boxShadow: 24, overflow: 'hidden',
                        }}>
                            {/* ── Modal Header ── */}
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                px: 3, py: 2, backgroundColor: '#F8F9FA', borderBottom: '1px solid #E5E7EB',
                            }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                                        {stoppageModalTitle}
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '12px', color: '#6B7280', mt: '4px',
                                        fontFamily: '"Ubuntu", sans-serif',
                                        backgroundColor: '#EBF5FF', display: 'inline-block',
                                        px: '8px', py: '3px', borderRadius: '4px', border: '1px solid #DBEAFE',
                                    }}>
                                        {stoppageModalTimeRange}
                                    </Typography>
                                </Box>
                                <IconButton onClick={handleStoppageModalClose} sx={{ color: '#6B7280' }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* ── Tabs row with conditional download icon ── */}
                            <Box sx={{
                                px: 3, backgroundColor: '#F8F9FA', borderBottom: '1px solid #E5E7EB',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <Tabs
                                    value={stoppageActiveTab}
                                    onChange={(_, newVal) => setStoppageActiveTab(newVal)}
                                    sx={{
                                        minHeight: '38px',
                                        '& .MuiTab-root': {
                                            minHeight: '38px', textTransform: 'none',
                                            fontSize: '13px', fontWeight: 600, color: '#6B7280',
                                            '&.Mui-selected': { color: '#2F6FB0' },
                                        },
                                        '& .MuiTabs-indicator': { backgroundColor: '#2F6FB0', height: '3px', borderRadius: '3px 3px 0 0' },
                                    }}
                                >
                                    <Tab icon={<BarChartIcon sx={{ fontSize: '18px', mr: 0.5 }} />} iconPosition="start" label="Chart" />
                                    <Tab icon={<TableChartIcon sx={{ fontSize: '18px', mr: 0.5 }} />} iconPosition="start" label="Data" />
                                </Tabs>

                                {/* ── Download icon: only visible on Data tab ── */}
                                <Tooltip title="Download CSV" arrow placement="top">
                                    <span>
                                        <IconButton
                                            onClick={handleStoppageTableDownload}
                                            disabled={stoppageActiveTab !== 1 || derivedStoppages.length === 0}
                                            sx={{
                                                opacity: stoppageActiveTab === 1 ? 1 : 0,
                                                pointerEvents: stoppageActiveTab === 1 ? 'auto' : 'none',
                                                transition: 'opacity 0.25s ease, color 0.2s ease, background-color 0.2s ease',
                                                color: '#2F6FB0',
                                                '&:hover': { backgroundColor: '#EBF5FF', color: '#1E4A7C' },
                                                '&:disabled': { color: '#CBD5E1', backgroundColor: 'transparent', cursor: 'not-allowed' },
                                                width: '36px',
                                                height: '36px',
                                            }}
                                        >
                                            <FileDownloadIcon sx={{ fontSize: '20px' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>

                            {/* ── Tab Panels ── */}
                            <Box sx={{ px: 3, pb: 3, height: '410px' }}>
                                {/* Chart Tab */}
                                <TabPanel value={stoppageActiveTab} index={0}>
                                    <MemoizedTrendChart
                                        options={downtimeChartOptions}
                                        series={downtimeChartSeries}
                                        height={350}
                                        loading={downtimeLoading}
                                        noDataMessage="No stoppage records found in this period"
                                        chartType="area"
                                    />
                                </TabPanel>

                                {/* Data Tab */}
                                <TabPanel value={stoppageActiveTab} index={1}>
                                    {downtimeLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    ) : derivedStoppages.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '350px' }}>
                                            <TableContainer sx={{
                                                maxHeight: '210px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB',
                                                overflowY: 'auto',
                                                scrollbarWidth: 'thin',
                                                '&::-webkit-scrollbar': { width: '6px' },
                                                '&::-webkit-scrollbar-track': { backgroundColor: '#F3F4F6', borderRadius: '3px' },
                                                '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: '3px', '&:hover': { backgroundColor: '#94A3B8' } },
                                            }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#F3F4F6' }}>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB', width: '40px' }}>#</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>Start Time</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }}>End Time</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', py: '10px', borderBottom: '2px solid #E5E7EB' }} align="right">Duration</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {derivedStoppages.map((item, index) => {
                                                            const isOngoing = item.isOngoing;
                                                            return (
                                                                <TableRow key={index} sx={{
                                                                    '&:hover': { backgroundColor: '#F9FAFB' },
                                                                    backgroundColor: isOngoing ? '#FFF5F5' : 'inherit',
                                                                }}>
                                                                    <TableCell sx={{ fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #F3F4F6', py: '8px' }}>{index + 1}</TableCell>
                                                                    <TableCell sx={{ fontSize: '12px', color: '#1F2937', borderBottom: '1px solid #F3F4F6', fontFamily: 'monospace', py: '8px' }}>{item.start_time || '-'}</TableCell>
                                                                    <TableCell sx={{
                                                                        fontSize: '12px', fontFamily: 'monospace', py: '8px',
                                                                        color: isOngoing ? '#EF4444' : '#1F2937', fontWeight: isOngoing ? 600 : 400,
                                                                        borderBottom: '1px solid #F3F4F6',
                                                                    }}>
                                                                        {isOngoing ? (
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                                <Box sx={{
                                                                                    width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EF4444',
                                                                                    animation: 'pulse 1.5s ease-in-out infinite',
                                                                                    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                                                                                }} />
                                                                                Ongoing
                                                                            </Box>
                                                                        ) : (item.end_time || '-')}
                                                                    </TableCell>
                                                                    <TableCell sx={{
                                                                        fontSize: '12px', fontFamily: 'monospace', py: '8px',
                                                                        color: isOngoing ? '#EF4444' : '#1F2937', fontWeight: isOngoing ? 700 : 600,
                                                                        borderBottom: '1px solid #F3F4F6', textAlign: 'right',
                                                                    }}>{item.duration || '-'}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {derivedStoppages.length > 5 && (
                                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'right', mt: 0.5, fontStyle: 'italic', flexShrink: 0 }}>
                                                    Scroll to see all {derivedStoppages.length} records ↓
                                                </Typography>
                                            )}

                                            <Box sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                mt: 'auto', px: 1.5, py: 1.5, flexShrink: 0,
                                                backgroundColor: '#F0F7FF', borderRadius: '8px', border: '1px solid #DBEAFE',
                                            }}>
                                                <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Total Stoppages:</Typography>
                                                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E4A7C' }}>
                                                    {downtimeMeta?.count ?? derivedStoppages.length}
                                                </Typography>
                                                <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Total Duration:</Typography>
                                                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E4A7C' }}>
                                                    {downtimeMeta?.total_downtime
                                                        ?? formatMinutesToDuration(Math.round(derivedStoppages.reduce((sum, item) => sum + (item.durationSeconds || 0), 0) / 60))
                                                    }
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <TableChartIcon sx={{ fontSize: '48px', color: '#D1D5DB', mb: 1 }} />
                                                <Typography sx={{ color: '#9CA3AF', fontSize: '14px' }}>No stoppage records found in this period</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </TabPanel>
                            </Box>
                        </Box>
                    </Modal>

                    {/* ─── Stoppage Detail Popup Modal ─── */}
                    <Modal open={downtimePopupOpen} onClose={() => setDowntimePopupOpen(false)}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: '500px', md: '600px' },
                            bgcolor: 'background.paper', borderRadius: '12px', boxShadow: 24, p: 0, overflow: 'hidden',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, backgroundColor: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
                                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>{downtimePopupTitle}</Typography>
                                <IconButton onClick={() => setDowntimePopupOpen(false)} sx={{ color: '#6B7280' }}><CloseIcon /></IconButton>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                {downtimePopupData.length > 0 ? (
                                    <>
                                        <TableContainer sx={{
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: '8px', border: '1px solid #E5E7EB',
                                            maxHeight: '240px', overflowY: 'auto', scrollbarWidth: 'thin',
                                            '&::-webkit-scrollbar': { width: '6px' },
                                            '&::-webkit-scrollbar-track': { backgroundColor: '#F3F4F6', borderRadius: '3px' },
                                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: '3px', '&:hover': { backgroundColor: '#94A3B8' } },
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
                                                            <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F9FAFB' }, backgroundColor: isOngoing ? '#FFF5F5' : 'inherit' }}>
                                                                <TableCell sx={{ fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>{index + 1}</TableCell>
                                                                <TableCell sx={{ fontSize: '12px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>{item.start_time || '-'}</TableCell>
                                                                <TableCell sx={{ fontSize: '12px', color: isOngoing ? '#EF4444' : '#1F2937', fontWeight: isOngoing ? 600 : 400, borderBottom: '1px solid #F3F4F6' }}>
                                                                    {item.end_time || (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                                                                            Ongoing
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '12px', color: isOngoing ? '#EF4444' : '#1F2937', fontWeight: isOngoing ? 600 : 400, borderBottom: '1px solid #F3F4F6' }}>
                                                                    {item.duration || '-'}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {downtimePopupData.length > 5 && (
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'right', mt: 0.5, fontStyle: 'italic' }}>
                                                Scroll to see all {downtimePopupData.length} records ↓
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 5 }}>
                                        <Typography sx={{ color: '#9CA3AF', fontSize: '14px' }}>No stoppage records found</Typography>
                                    </Box>
                                )}
                                {downtimePopupData.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, px: 1, py: 1.5, backgroundColor: '#F0F7FF', borderRadius: '8px', border: '1px solid #DBEAFE' }}>
                                        <Typography sx={{ fontSize: '13px', color: '#6B7280', mr: 2 }}>Total:</Typography>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E4A7C' }}>
                                            {downtimePopupData.length} times ({formatMinutesToDuration(downtimePopupData.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0))})
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