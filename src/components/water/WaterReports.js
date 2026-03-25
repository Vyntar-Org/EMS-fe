import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Grid,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventIcon from "@mui/icons-material/Event";
import MenuItem from "@mui/material/MenuItem";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// Import API functions
import {
    fetchWaterDailyConsumption,
    fetchWaterDailyReading,
    fetchWaterMonthlyConsumption
} from '../../auth/water/WaterReportsApi';

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Function to get the number of days in a month
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

function WaterReports({ onSidebarToggle, sidebarVisible }) {
    // Get current date for default values
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedStation, setSelectedStation] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [matchedStation, setMatchedStation] = useState('');
    const [isSearchApplied, setIsSearchApplied] = useState(false);

    // State for API Data
    const [consumptionData, setConsumptionData] = useState(null);
    const [readingData, setReadingData] = useState(null);
    const [monthlyConsumptionData, setMonthlyConsumptionData] = useState(null);

    // Get days in current month for display
    const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);
    const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

    // Fetch Data from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (activeTab === 0) {
                    // Daily Consumption
                    const res = await fetchWaterDailyConsumption(selectedMonth, selectedYear);
                    setConsumptionData(res);
                } else if (activeTab === 1) {
                    // Monthly Consumption
                    const res = await fetchWaterMonthlyConsumption(selectedYear);
                    setMonthlyConsumptionData(res);
                } else if (activeTab === 2) {
                    // Daily Reading
                    const res = await fetchWaterDailyReading(selectedMonth, selectedYear);
                    setReadingData(res);
                }
            } catch (err) {
                console.error("API Error:", err);
                setError(err.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, selectedMonth, selectedYear, searchTrigger]);

    // Transformation Functions

    const transformDataToRows = (data) => {
        if (!data) return [];
        // Handle both { data: {...} } and direct { Device: ... } structures
        const deviceMap = data.data || data;

        return Object.entries(deviceMap).map(([station, dailyData]) => {
            const consumptionValues = currentMonthDays.map(day => {
                // Handle different date formats (string vs number)
                const dayData = dailyData.find(d => {
                    const dDay = d.date ? Number(String(d.date).split('-').pop()) : Number(d.date);
                    return dDay === day;
                });
                // CORRECTED: API returns 'value', not 'consumption'
                return dayData ? (dayData.value || 0) : 0;
            });

            const total = consumptionValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionValues,
                total: total.toFixed(2)
            };
        });
    };

    const transformReadingDataToRows = (data) => {
        if (!data) return [];
        const deviceMap = data.data || data;

        return Object.entries(deviceMap).map(([station, dailyData]) => {
            const readingValues = currentMonthDays.map(day => {
                const dayData = dailyData.find(d => {
                    const dDay = d.date ? Number(String(d.date).split('-').pop()) : Number(d.date);
                    return dDay === day;
                });
                // CORRECTED: API returns 'value', not 'first_meter_reading'
                return dayData && dayData.value != null ? dayData.value : '--';
            });

            return {
                station,
                data: readingValues
            };
        });
    };

    const transformMonthlyConsumptionDataToRows = (data) => {
        if (!data) return [];
        const deviceMap = data.data || data;

        return Object.entries(deviceMap).map(([station, monthlyData]) => {
            const consumptionValues = months.map((_, index) => {
                const monthNumber = index + 1;
                const monthRecord = monthlyData.find(d => parseInt(d.month) === monthNumber);
                // CORRECTED: API returns 'value', not 'consumption_kwh'
                return monthRecord ? (monthRecord.value || 0) : 0;
            });

            const total = consumptionValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionValues,
                total: total.toFixed(2)
            };
        });
    };

    // Helper functions

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSelectedStation('');
        setMatchedStation('');
    };

    const getAllStations = () => {
        let stations = [];
        const currentData = activeTab === 0 ? consumptionData :
            activeTab === 1 ? monthlyConsumptionData : readingData;

        if (currentData) {
            const deviceMap = currentData.data || currentData;
            stations = Object.keys(deviceMap);
        }
        return stations.sort();
    };

    const findMatchingStation = (inputValue) => {
        if (!inputValue.trim()) return '';
        const stations = getAllStations();
        const normalizedInput = inputValue.toLowerCase().replace(/\s+/g, '');

        const exactMatch = stations.find(station =>
            station.toLowerCase() === normalizedInput ||
            station.toLowerCase().replace(/\s+/g, '') === normalizedInput
        );
        if (exactMatch) return exactMatch;

        const partialMatch = stations.find(station =>
            station.toLowerCase().includes(normalizedInput)
        );
        return partialMatch || '';
    };

    const getRows = () => {
        let rows = [];
        if (activeTab === 0 && consumptionData) {
            rows = transformDataToRows(consumptionData);
        } else if (activeTab === 1 && monthlyConsumptionData) {
            rows = transformMonthlyConsumptionDataToRows(monthlyConsumptionData);
        } else if (activeTab === 2 && readingData) {
            rows = transformReadingDataToRows(readingData);
        }

        if (matchedStation) {
            return rows.filter(row => row.station === matchedStation);
        }
        return rows;
    };

    const getCurrentData = () => {
        const rows = getRows();
        let headers = [];

        if (activeTab === 0) {
            headers = ['STATION', ...currentMonthDays.map(d => `Day ${d}`), 'TOTAL'];
            return { headers, data: rows.map(r => [r.station, ...r.data, r.total]), title: 'Daywise Consumption Report' };
        } else if (activeTab === 1) {
            headers = ['STATION', ...months, 'TOTAL'];
            return { headers, data: rows.map(r => [r.station, ...r.data, r.total]), title: 'Monthwise Consumption Report' };
        } else if (activeTab === 2) {
            headers = ['STATION', ...currentMonthDays.map(d => `Day ${d}`)];
            return { headers, data: rows.map(r => [r.station, ...r.data]), title: 'Daily Meter Reading Report' };
        }
        return { headers: [], data: [], title: '' };
    };

    // Export Functions
    const exportToExcel = () => {
        const { headers, data, title } = getCurrentData();
        let csvContent = headers.join(',') + '\n';
        data.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${title}_Export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const { headers, data, title } = getCurrentData();

        import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
                const doc = new jsPDF("portrait", "mm", "a4");
                doc.setFontSize(16);
                doc.text(title, 14, 15);
                doc.setFontSize(10);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

                autoTable(doc, {
                    head: [headers],
                    body: data,
                    startY: 28,
                    theme: "grid",
                    styles: { fontSize: 7, cellPadding: 2, halign: "center" },
                    headStyles: { fillColor: [1, 86, 166], textColor: 255 },
                });

                doc.save(`${title.replace(/\s+/g, "_")}_Export.pdf`);
            });
        });
    };

    const styles = {
        mainContent: {
            width: '100%',
            minHeight: '89vh',
            fontFamily: 'Inter, Roboto, system-ui, sans-serif',
            fontSize: '14px',
            margin: '0',
            padding: { xs: '5px', sm: '0' },
            boxSizing: 'border-box',
        },
    };

    const showConsumptionTables = activeTab === 0 || activeTab === 1;
    const showReadingTables = activeTab === 2;

    return (
        <Box style={styles.mainContent} id="main-content">
            <Box style={styles.blockHeader} className="block-header mb-1">
                <Grid container>
                    <Grid lg={5} md={8} xs={12}>
                        <Typography
                            variant="h6"
                            className="logs-title"
                            sx={{
                                color: '#0F2A44',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                                backgroundColor: '#fff',
                                width: { xs: '100%', lg: '250%' }
                            }}
                        >
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{
                                    mb: 2,
                                    minHeight: { xs: '40px', sm: '48px' },
                                    '& .MuiTabs-scroller': { overflowX: 'auto' },
                                    '& .MuiTab-root': { minWidth: { xs: '140px', sm: 200 }, fontSize: { xs: '11px', sm: '13px' } },
                                    '& .MuiTabs-indicator': { backgroundColor: '#0156a6' },
                                }}
                            >
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daywise Consumption" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Monthwise Consumption" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daily Meter Reading" />
                            </Tabs>
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: "space-between",
                    mb: 2,
                    gap: { xs: 2, sm: 0 },
                }}
            >
                {/* LEFT SIDE – FILTERS */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: { xs: 1.5, sm: 2 },
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                    }}
                >
                    {/* MONTH */}
                    {(activeTab === 0 || activeTab === 2) && (
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            sx={{ minWidth: { xs: '100%', sm: 150 }, height: '30px' }}
                            InputProps={{
                                sx: { height: '30px', padding: '6px 14px' },
                                startAdornment: (<InputAdornment position="start"><CalendarMonthIcon fontSize="small" /></InputAdornment>)
                            }}
                        >
                            {months.map((m, i) => (<MenuItem key={m} value={i + 1}>{m}</MenuItem>))}
                        </TextField>
                    )}

                    {/* YEAR */}
                    <TextField
                        select
                        size="small"
                        label="Year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ minWidth: { xs: '100%', sm: 130 }, height: '30px' }}
                        InputProps={{
                            sx: { height: '30px', padding: '6px 14px' },
                            startAdornment: (<InputAdornment position="start"><EventIcon fontSize="small" /></InputAdornment>)
                        }}
                    >
                        {Array.from({ length: 11 }, (_, i) => 2021 + i).map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
                    </TextField>

                    {/* STATION */}
                    <TextField
                        size="small"
                        label="Device"
                        value={selectedStation}
                        placeholder="Device"
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            setSelectedStation(inputValue);
                            setIsSearchApplied(false);

                            // Find matching station
                            const matched = findMatchingStation(inputValue);
                            setMatchedStation(matched);
                        }}
                        sx={{
                            minWidth: { xs: '100%', sm: 200 },
                            height: '30px'
                        }}
                        InputProps={{
                            sx: { height: '30px', padding: '6px 14px' },
                            startAdornment: (
                                <InputAdornment position="start">
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* SEARCH BUTTON */}
                    <IconButton
                        onClick={() => setSearchTrigger(prev => prev + 1)}
                        sx={{
                            bgcolor: '#0156a6', color: '#fff', width: { xs: '100%', sm: '30px' }, height: '30px',
                            borderRadius: { xs: '4px', sm: '50%' }, '&:hover': { bgcolor: '#0a223e' }
                        }}
                    >
                        <SearchIcon fontSize="small" sx={{ mr: { xs: 1, sm: 0 } }} />
                        <Box sx={{ display: { xs: 'inline', sm: 'none' }, fontSize: '14px' }}>Search</Box>
                    </IconButton>
                </Box>

                {/* RIGHT SIDE – EXCEL & PDF */}
                {(showConsumptionTables || showReadingTables) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2 }}>
                        <Button
                            onClick={exportToExcel}
                            startIcon={<FileDownloadIcon sx={{ marginLeft: '12px' }} />}
                            sx={{ bgcolor: "#217346", color: "#fff", borderRadius: "8px", '&:hover': { bgcolor: "#1e6b40" }, px: { xs: 2, sm: 1 } }}
                        />
                        <Button
                            onClick={exportToPDF}
                            startIcon={<PictureAsPdfIcon sx={{ marginLeft: '12px' }} />}
                            sx={{ bgcolor: "#EA3323", color: "#fff", borderRadius: "8px", '&:hover': { bgcolor: "#c6281c" }, px: { xs: 2, sm: 1 } }}
                        />
                    </Box>
                )}
            </Box>

            {/* Loading Indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Consumption Table */}
            {!loading && !error && showConsumptionTables && (
                <TableContainer component={Paper} sx={{ maxHeight: { xs: 400, sm: 520 }, overflowX: 'auto', '& .MuiTableCell-root': { fontSize: { xs: '10px', sm: '12px' }, padding: { xs: '4px 2px', sm: '6px 8px' }, whiteSpace: 'nowrap' } }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 1 }}><b>Device</b></TableCell>
                                {activeTab === 0 ? (
                                    currentMonthDays.map(day => (
                                        <TableCell key={day} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>{day}</b></TableCell>
                                    ))
                                ) : (
                                    months.map(month => (
                                        <TableCell key={month} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>{month}</b></TableCell>
                                    ))
                                )}
                                <TableCell align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>Total</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff", zIndex: 1, fontWeight: 'bold' }}>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell key={idx} align="center">
                                            {typeof val === 'number' ? val.toFixed(2) : val}
                                        </TableCell>
                                    ))}
                                    <TableCell align="center">{typeof row.total === 'number' ? row.total.toFixed(2) : row.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Reading Table */}
            {!loading && !error && showReadingTables && (
                <TableContainer component={Paper} sx={{ maxHeight: { xs: 400, sm: 500 }, overflowX: 'auto', '& .MuiTableCell-root': { fontSize: { xs: '10px', sm: '12px' }, padding: { xs: '4px 2px', sm: '6px 8px' }, whiteSpace: 'nowrap' } }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 1 }}><b>Device</b></TableCell>
                                {currentMonthDays.map(day => (
                                    <TableCell key={day} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>{day}</b></TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff", zIndex: 1, fontWeight: 'bold' }}>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell key={idx} align="center">
                                            {typeof val === 'number' ? val.toFixed(2) : val}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

export default WaterReports;