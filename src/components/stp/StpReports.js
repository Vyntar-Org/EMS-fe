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

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Function to get the number of days in a month
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

function StpReports({ onSidebarToggle, sidebarVisible }) {
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

    // State for Data
    const [consumptionData, setConsumptionData] = useState(null);
    const [readingData, setReadingData] = useState(null);
    const [monthlyConsumptionData, setMonthlyConsumptionData] = useState(null);

    // Get days in current month for display
    const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);
    const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

    // Mock Data Generator
    const generateMockData = (month, year, type) => {
        const daysInMonth = getDaysInMonth(month, year);
        // Fixed Device Names as per image
        const devices = ['Water Inlet', 'Water Outlet']; 
        const result = {};

        devices.forEach(device => {
            result[device] = [];
            let cumulative = Math.floor(Math.random() * 1000) + 500; // Starting reading

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                if (type === 'consumption') {
                    // Daily consumption (random value between 50 and 150)
                    const consumption = Math.floor(Math.random() * 100) + 50;
                    result[device].push({ date: dateStr, value: consumption });
                } else if (type === 'reading') {
                    // Daily meter reading (cumulative)
                    cumulative += Math.floor(Math.random() * 100) + 50;
                    result[device].push({ date: dateStr, value: cumulative });
                }
            }
        });

        return result;
    };

    const generateMockMonthlyData = (year) => {
        const devices = ['Water Inlet', 'Water Outlet'];
        const result = {};

        devices.forEach(device => {
            result[device] = [];
            for (let m = 1; m <= 12; m++) {
                const consumption = Math.floor(Math.random() * 3000) + 1000;
                result[device].push({ month: m, value: consumption });
            }
        });

        return result;
    };

    // Fetch Mock Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                if (activeTab === 0) {
                    // Daily Consumption
                    const res = generateMockData(selectedMonth, selectedYear, 'consumption');
                    setConsumptionData(res);
                } else if (activeTab === 1) {
                    // Monthly Consumption
                    const res = generateMockMonthlyData(selectedYear);
                    setMonthlyConsumptionData(res);
                } else if (activeTab === 2) {
                    // Daily Reading
                    const res = generateMockData(selectedMonth, selectedYear, 'reading');
                    setReadingData(res);
                }
            } catch (err) {
                console.error("Mock Data Error:", err);
                setError(err.message || "Failed to generate data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, selectedMonth, selectedYear, searchTrigger]);

    // Transformation Functions

    const transformDataToRows = (data) => {
        if (!data) return [];
        const deviceMap = data.data || data;

        return Object.entries(deviceMap).map(([station, dailyData]) => {
            const consumptionValues = currentMonthDays.map(day => {
                const dayData = dailyData.find(d => {
                    const dDay = d.date ? Number(String(d.date).split('-').pop()) : Number(d.date);
                    return dDay === day;
                });
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
        import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
                
                const isDaywise = [0, 2, 3].includes(activeTab);
                const orientation = isDaywise ? "landscape" : "portrait";

                let reportTitle = "";
                let unit = "";

                if (activeTab === 0) {
                    reportTitle = "Station Daywise Data - Consumption";
                    unit = "(in Units)";
                } else if (activeTab === 1) {
                    reportTitle = "Station Monthwise Data - Consumption";
                    unit = "(in Units)";
                } else if (activeTab === 2) {
                    reportTitle = "Station Daywise Data - Meter Reading";
                    unit = "(Readings)";
                } else {
                    reportTitle = "Station Monthwise Data - Cost Consumption";
                    unit = "(Currency)";
                }

                const finalTitle = unit ? `${reportTitle} ${unit}` : reportTitle;

                let dateRangeText = "";
                if (isDaywise) {
                    const monthName = months[selectedMonth - 1];
                    const daysCount = getDaysInMonth(selectedMonth, selectedYear);
                    const startStr = `01/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
                    const endStr = `${daysCount}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
                    dateRangeText = `${monthName} ${selectedYear} (${startStr} to ${endStr})`;
                } else {
                    dateRangeText = `Year ${selectedYear}`;
                }

                const doc = new jsPDF(orientation, "mm", "a4");
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text(finalTitle, 14, 15);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(60, 60, 60);
                doc.text(dateRangeText, 14, 22);

                const { data } = getCurrentData();

                let pdfHeaders = [];
                if (isDaywise) {
                    pdfHeaders = ['STATION', ...currentMonthDays.map(d => String(d)), 'TOTAL'];
                } else {
                    pdfHeaders = ['STATION', ...months, 'TOTAL'];
                }

                const totalIndex = pdfHeaders.indexOf("TOTAL");
                const filteredHeaders = totalIndex >= 0 ? pdfHeaders.filter((_, index) => index !== totalIndex) : pdfHeaders;
                
                const filteredData = data.map(row => 
                    totalIndex >= 0 ? row.filter((_, index) => index !== totalIndex) : row
                );

                const formattedData = filteredData.map(row =>
                    row.map(cell =>
                        typeof cell === "number" ? cell.toFixed(2) : cell
                    )
                );

                const margin = 14; 
                const usableWidth = pageWidth - (margin * 2);
                const stationWidth = 40;
                
                const colCount = filteredHeaders.length - 1;
                const dataColWidth = (usableWidth - stationWidth) / (colCount > 0 ? colCount : 1);

                const columnStyles = {
                    0: { 
                        cellWidth: stationWidth, 
                        fontStyle: 'bold', 
                        halign: 'left' 
                    }
                };

                for (let i = 1; i < filteredHeaders.length; i++) {
                    columnStyles[i] = { cellWidth: dataColWidth };
                }

                autoTable(doc, {
                    head: [filteredHeaders],
                    body: formattedData,
                    startY: 28,
                    theme: "grid",

                    styles: {
                        fontSize: isDaywise ? 7 : 9, 
                        cellPadding: 2,
                        halign: "center",
                        valign: "middle",
                        overflow: 'linebreak',
                        lineColor: [200, 200, 200], 
                        lineWidth: 0.1
                    },

                    headStyles: {
                        fillColor: [1, 86, 166], 
                        textColor: 255,
                        fontSize: isDaywise ? 8 : 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },

                    columnStyles: columnStyles,
                    
                    didDrawPage: function (data) {
                        doc.setFontSize(8);
                        doc.setTextColor(100);
                        doc.text("Provided by Salieabs", 14, pageHeight - 10);
                        
                        const pageNumber = doc.internal.getNumberOfPages();
                        doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
                    }
                });

                doc.save(`${finalTitle.replace(/\s+/g, "_")}.pdf`);
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
                                width: { xs: '100%', lg: '150%' },
                                marginLeft: { xs: '-12px', lg: 0, sm: '17px' },
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
                                    width: { xs: '410px' ,sm: '720px', md: '100%' },
                                    '& .MuiTabs-scroller': { overflowX: 'auto' },
                                    '& .MuiTab-root': { minWidth: { xs: '', sm: 200 }, fontSize: { xs: '11px', sm: '13px' } },
                                    '& .MuiTabs-indicator': { backgroundColor: '#0156a6' },
                                }}
                            >
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daywise" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Monthwise" />
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
                    marginLeft: { sm: '10px' },
                    padding: { sm: '10px' },
                }}
            >
                {/* LEFT SIDE – FILTERS */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: { xs: 1.5, sm: 2 },
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
                <TableContainer component={Paper} sx={{ maxHeight: { xs: 400, sm: 520 },
                        width: { sm: '96%', md: '98%' },
                        marginLeft: { sm: '15px' }, overflowX: 'auto', '& .MuiTableCell-root': { fontSize: { xs: '10px', sm: '12px' }, padding: { xs: '4px 2px', sm: '6px 8px' }, whiteSpace: 'nowrap' } }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 10 }}><b>Device</b></TableCell>
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
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 10 }}><b>Device</b></TableCell>
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

export default StpReports;