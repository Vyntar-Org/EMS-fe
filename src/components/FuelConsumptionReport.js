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
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventIcon from "@mui/icons-material/Event";
import FactoryIcon from "@mui/icons-material/Factory";
import MenuItem from "@mui/material/MenuItem";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { fetchConsumptionData, fetchReadingData, fetchMonthlyReadingData, fetchMonthlyConsumptionData } from "../auth/ReportsApi";

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthwiseRows = [
    {
        station: "",
        data: ["--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"],
        total: "--"
    }
];

export default function FuelConsumptionReport({ onSidebarToggle, sidebarVisible }) {
    const [activeTab, setActiveTab] = useState(0); // 0: Daywise Consumption, 1: Monthwise Consumption, 2: Daily Meter Reading, 3: Daywise Cost Consumption, 4: Monthwise Cost Consumption
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [consumptionData, setConsumptionData] = useState(null);
    const [readingData, setReadingData] = useState(null);
    const [monthlyReadingData, setMonthlyReadingData] = useState(null);
    const [monthlyConsumptionData, setMonthlyConsumptionData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(1); // Default to January
    const [selectedYear, setSelectedYear] = useState(2026); // Default to 2026
    const [selectedStation, setSelectedStation] = useState(''); // For dropdown filter

    const selectStyle = {
        minWidth: 200,
        height: 35,
        padding: "6px 10px",
        fontSize: "14px",
        borderRadius: "5px"
    };


    // Fetch all data when component mounts or month/year changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all four types of data
                const [consumptionResponse, readingResponse, monthlyReadingResponse, monthlyConsumptionResponse] = await Promise.all([
                    fetchConsumptionData(selectedMonth, selectedYear),
                    fetchReadingData(selectedMonth, selectedYear),
                    fetchMonthlyReadingData(selectedYear),
                    fetchMonthlyConsumptionData(selectedYear)
                ]);

                setConsumptionData(consumptionResponse);
                setReadingData(readingResponse);
                setMonthlyReadingData(monthlyReadingResponse);
                setMonthlyConsumptionData(monthlyConsumptionResponse);
                setError(null);
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

    // Transform API data to table rows format
    const transformDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, dailyData]) => {
            // Create an array of consumption values for all days (1-31)
            const consumptionValues = days.map(day => {
                const dayData = dailyData.find(d => parseInt(d.date) === day);
                return dayData ? dayData.consumption : 0;
            });

            // Calculate total consumption for this station
            const total = consumptionValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionValues,
                total: total.toFixed(2)
            };
        });
    };

    // Transform API reading data to table rows format
    const transformReadingDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, dailyData]) => {
            // Create an array of reading values for all days (1-31)
            const readingValues = days.map(day => {
                const dayData = dailyData.find(d => parseInt(d.date) === day);
                return dayData ? (dayData.reading !== null ? dayData.reading : '--') : '--';
            });

            // Calculate total reading for this station
            const total = readingValues.reduce((sum, val) => {
                const numVal = parseFloat(val);
                return sum + (isNaN(numVal) || val === '--' ? 0 : numVal);
            }, 0);

            return {
                station,
                data: readingValues,
                total: total.toFixed(2)
            };
        });
    };

    // Transform API monthly reading data to table rows format
    const transformMonthlyReadingDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, monthlyData]) => {
            // Create an array of reading values for all months (1-12)
            const readingValues = months.map((month, index) => {
                const monthData = monthlyData.find(d => parseInt(d.month) === (index + 1));
                return monthData ? (monthData.reading !== null ? monthData.reading : '--') : '--';
            });

            // Calculate total reading for this station
            const total = readingValues.reduce((sum, val) => {
                const numVal = parseFloat(val);
                return sum + (isNaN(numVal) || val === '--' ? 0 : numVal);
            }, 0);

            return {
                station,
                data: readingValues,
                total: total.toFixed(2)
            };
        });
    };

    // Transform API monthly consumption data to table rows format
    const transformMonthlyConsumptionDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, monthlyData]) => {
            // Create an array of consumption values for all months (1-12)
            const consumptionValues = months.map((month, index) => {
                const monthData = monthlyData.find(d => parseInt(d.month) === (index + 1));
                return monthData ? monthData.consumption : 0;
            });

            // Calculate total consumption for this station
            const total = consumptionValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionValues,
                total: total.toFixed(2)
            };
        });
    };

    // Get current data based on active tab
    const getCurrentData = () => {
        if (activeTab === 0 || activeTab === 3) {
            // Daywise data from API
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const rows = transformDataToRows(consumptionData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: activeTab === 0 ? 'Daywise Consumption Report' : 'Daywise Cost Consumption Report' };
        } else if (activeTab === 1 || activeTab === 4) {
            // Monthwise data from API
            const headers = ['STATION', ...months, 'TOTAL'];
            const rows = transformMonthlyConsumptionDataToRows(monthlyConsumptionData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: activeTab === 1 ? 'Monthwise Consumption Report' : 'Monthwise Cost Consumption Report' };
        } else {
            // Reading data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Daily Meter Reading Report' };
        }
    };

    // Get current reading data based on active tab
    const getCurrentReadingData = () => {
        if (activeTab === 2) {
            // Reading Daywise data from API
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Reading Daywise Report' };
        } else {
            // For other tabs, return empty data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const data = [];
            return { headers, data, title: 'Reading Data' };
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // Clear station filter when changing tabs to avoid confusion
        setSelectedStation('');
    };

    // Determine which tables to show based on active tab
    const showConsumptionTables = activeTab === 0 || activeTab === 1 || activeTab === 3 || activeTab === 4;
    const showReadingTables = activeTab === 2;

    // Search functionality
    const handleSearch = () => {
        alert('Search functionality would be activated here');
    };

    // Column visibility toggle functionality
    const handleColumnVisibility = () => {
        alert('Column visibility settings would open here');
    };

    // Fullscreen toggle functionality
    const toggleFullscreen = () => {
        const tableContainer = document.querySelector('.MuiTableContainer-root');
        if (tableContainer) {
            if (!isFullscreen) {
                if (tableContainer.requestFullscreen) {
                    tableContainer.requestFullscreen();
                } else if (tableContainer.mozRequestFullScreen) { // Firefox
                    tableContainer.mozRequestFullScreen();
                } else if (tableContainer.webkitRequestFullscreen) { // Chrome, Safari and Opera
                    tableContainer.webkitRequestFullscreen();
                } else if (tableContainer.msRequestFullscreen) { // IE/Edge
                    tableContainer.msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { // Firefox
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { // IE/Edge
                    document.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        }
    };

    // Handle fullscreen change event
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement &&
                !document.webkitFullscreenElement &&
                !document.mozFullScreenElement &&
                !document.msFullscreenElement) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Export to Excel functionality
    const exportToExcel = () => {
        const { headers, data, title } = getCurrentData();

        // Create a simple CSV representation for demonstration
        let csvContent = headers.join(',') + '\n';
        data.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${title}_Export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`Exporting ${title} to Excel format`);
    };

    // Export to PDF functionality
    const exportToPDF = () => {
        const { headers, data, title } = getCurrentData();

        // 🔑 Format numbers to 2 decimals
        const formattedData = data.map(row =>
            row.map(cell =>
                typeof cell === "number"
                    ? cell.toFixed(2)
                    : cell
            )
        );

        import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {

                const doc = new jsPDF("landscape", "mm", "a4");

                doc.setFontSize(16);
                doc.text(title, 14, 15);

                doc.setFontSize(10);
                doc.text(
                    `Generated on: ${new Date().toLocaleDateString()}`,
                    14,
                    22
                );

                autoTable(doc, {
                    head: [headers],
                    body: formattedData, // ✅ use formatted data
                    startY: 28,
                    theme: "grid",

                    styles: {
                        fontSize: 7,
                        cellPadding: 2,
                        halign: "center",
                        valign: "middle",
                    },

                    headStyles: {
                        fillColor: [1, 86, 166],
                        textColor: 255,
                        fontSize: 7,
                    },

                    columnStyles: {
                        0: { cellWidth: 30 },
                        ...Object.fromEntries(
                            headers.slice(1, -1).map((_, i) => [i + 1, { cellWidth: 7 }])
                        ),
                        [headers.length - 1]: { cellWidth: 14 },
                    },

                    margin: { left: 8, right: 8 },
                    showHead: "everyPage",
                });

                doc.save(`${title.replace(/\s+/g, "_")}_Export.pdf`);
            });
        });
    };

    // Get all unique station names from current data
    const getAllStations = () => {
        let stations = [];

        // Get stations from consumption data
        if (consumptionData && consumptionData.data) {
            stations = [...stations, ...Object.keys(consumptionData.data)];
        }

        // Get stations from monthly consumption data
        if (monthlyConsumptionData && monthlyConsumptionData.data) {
            stations = [...stations, ...Object.keys(monthlyConsumptionData.data)];
        }

        // Get stations from reading data
        if (readingData && readingData.data) {
            stations = [...stations, ...Object.keys(readingData.data)];
        }

        // Get stations from monthly reading data
        if (monthlyReadingData && monthlyReadingData.data) {
            stations = [...stations, ...Object.keys(monthlyReadingData.data)];
        }

        // Remove duplicates and sort
        return [...new Set(stations)].sort();
    };

    // Get rows for the current view
    const getRows = () => {
        let rows = [];
        if ((activeTab === 0 || activeTab === 3) && consumptionData) {
            rows = transformDataToRows(consumptionData);
        } else if ((activeTab === 1 || activeTab === 4) && monthlyConsumptionData) {
            rows = transformMonthlyConsumptionDataToRows(monthlyConsumptionData);
        } else {
            rows = monthwiseRows;
        }

        // Apply station filter if selectedStation exists
        if (selectedStation) {
            return rows.filter(row => row.station === selectedStation);
        }

        return rows;
    };

    // Get reading rows for the reading table
    const getReadingRows = () => {
        let rows = [];
        if (activeTab === 2 && readingData) {
            // Daywise reading data
            rows = transformReadingDataToRows(readingData);
        }

        // Apply station filter if selectedStation exists
        if (selectedStation) {
            return rows.filter(row => row.station === selectedStation);
        }

        return rows;
    };

    const styles = {
        mainContent: {
            width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)',
            maxWidth: sidebarVisible ? '1600px' : '1800px',
            minHeight: '86.2vh',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            margin: '0',
            marginBottom: '20px',
            transition: 'all 0.3s ease',
        },
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            <Box style={styles.blockHeader} className="block-header mb-1">
                <Grid container>
                    <Grid lg={5} md={8} xs={12}>
                        <Typography
                            variant="h6"
                            className="logs-title"
                            style={{
                                color: '#0F2A44',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                                marginLeft: '5px',
                            }}
                        >
                            <span
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onSidebarToggle) {
                                        onSidebarToggle();
                                    }
                                }}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: 1,
                                    marginLeft: '-2px',
                                    fontWeight: '400',
                                    display: 'inline-block',
                                    cursor: 'pointer',
                                    marginRight: '8px',
                                    userSelect: 'none',
                                    color: '#007bff',
                                    zIndex: 10,
                                    position: 'relative'
                                }}
                            >
                                <i className={`fa ${sidebarVisible ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                            </span>
                            <Tabs value={activeTab} onChange={handleTabChange} centered={false} sx={{ mb: 3, marginTop: '-37px' }}>
                                <Tab sx={{fontWeight: 600}} label={`Daywise Consumption`} />
                                <Tab sx={{fontWeight: 600}} label={`Monthwise Consumption`} />
                                <Tab sx={{fontWeight: 600}} label={`Daily Meter Reading`} />
                                <Tab sx={{fontWeight: 600}} label={`Daywise Cost Consumption`} />
                                <Tab sx={{fontWeight: 600}} label={`Monthwise Cost Consumption`} />
                            </Tabs>
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            {/* Tabs with Selector */}
            {/* <Paper sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7f6f4' }}>
                <Box>
                    <Tabs value={activeTab} onChange={handleTabChange} centered={false} sx={{ minHeight: '48px' }}>
                        <Tab label={`Daywise Consumption`} />
                        <Tab label={`Monthwise Consumption`} />
                        <Tab label={`Daily Meter Reading`} />
                        <Tab label={`Daywise Cost Consumption`} />
                        <Tab label={`Monthwise Cost Consumption`} />
                    </Tabs>
                </Box>
            </Paper> */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2
                }}
            >
                {/* LEFT SIDE – FILTERS */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: "#f8fafc",
                        p: 1.5,
                        borderRadius: 2,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                    }}
                >
                    {/* MONTH */}
                    {(activeTab === 0 || activeTab === 2 || activeTab === 3) && (
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            sx={{ minWidth: 150 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        >
                            {months.map((m, i) => (
                                <MenuItem key={m} value={i + 1}>
                                    {m}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* YEAR */}
                    <TextField
                        select
                        size="small"
                        label="Year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ minWidth: 130 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EventIcon fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    >
                        {Array.from({ length: 11 }, (_, i) => 2021 + i).map((y) => (
                            <MenuItem key={y} value={y}>
                                {y}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* STATION */}
                    <TextField
                        select
                        size="small"
                        label="Station"
                        value={selectedStation}
                        onChange={(e) => setSelectedStation(e.target.value)}
                        sx={{ minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {/* <FactoryIcon fontSize="small" /> */}
                                </InputAdornment>
                            )
                        }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {getAllStations().map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>


                {/* RIGHT SIDE – EXCEL & PDF (FLEX END) */}
                {(showConsumptionTables || showReadingTables) && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            // background: "#ffffff",
                            p: 1,
                            borderRadius: 2,
                            // boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                        }}
                    >
                        <IconButton
                            onClick={exportToExcel}
                            sx={{
                                bgcolor: "#217346",
                                color: "#fff",
                                borderRadius: "8px", // Slightly rounded corners look better for export buttons
                                "&:hover": {
                                    bgcolor: "#1e6b40",
                                    transform: "translateY(-1px)", // Subtle lift effect
                                },
                                transition: "all 0.2s"
                            }}
                            title="Export Excel"
                        >
                            <FileDownloadIcon sx={{ fontSize: 22 }} />
                        </IconButton>

                        <IconButton
                            onClick={exportToPDF}
                            sx={{
                                bgcolor: "#EA3323",
                                color: "#fff",
                                borderRadius: "8px",
                                "&:hover": {
                                    bgcolor: "#c6281c",
                                    transform: "translateY(-1px)",
                                },
                                transition: "all 0.2s"
                            }}
                            title="Export PDF"
                        >
                            <PictureAsPdfIcon sx={{ fontSize: 22 }} />
                        </IconButton>
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

            {/* Consumption Table - Show only for consumption tabs */}
            {!loading && !error && showConsumptionTables && (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>Machine</b></TableCell>
                                {(activeTab === 0 || activeTab === 3) ? (
                                    days.map(day => (
                                        <TableCell key={day} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}>
                                            <b>{day}</b>
                                        </TableCell>
                                    ))
                                ) : (
                                    months.map(month => (
                                        <TableCell key={month} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}>
                                            <b>{month}</b>
                                        </TableCell>
                                    ))
                                )}
                                {/* <TableCell align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>TOTAL</b></TableCell> */}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {getRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell
                                            key={idx}
                                            align="center"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                if (activeTab === 0 || activeTab === 3) {
                                                    // Daywise report click handler
                                                    if (val !== 0) {
                                                        alert(`Clicked on ${row.station} for Day ${days[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                                    }
                                                } else {
                                                    // Monthwise report click handler
                                                    if (val !== "--") {
                                                        alert(`Clicked on ${row.station} for ${months[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                                    } else {
                                                        // Placeholder for handling clicks on empty cells in monthwise view
                                                        console.log(`${row.station} - ${months[idx]} is not configured yet`);
                                                    }
                                                }
                                            }}
                                        >
                                            {typeof val === 'number' ? val.toFixed(2) : val}
                                        </TableCell>
                                    ))}
                                    {/* <TableCell align="center">{typeof row.total === 'number' ? row.total.toFixed(2) : row.total}</TableCell> */}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {/* Reading Table - Show only for reading tabs */}
            {!loading && !error && showReadingTables && (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>Machine</b></TableCell>
                                {activeTab === 2 ? (
                                    days.map(day => (
                                        <TableCell key={day} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}>
                                            <b>{day}</b>
                                        </TableCell>
                                    ))
                                ) : (
                                    months.map(month => (
                                        <TableCell key={month} align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}>
                                            <b>{month}</b>
                                        </TableCell>
                                    ))
                                )}
                                <TableCell align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>TOTAL</b></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {getReadingRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell
                                            key={idx}
                                            align="center"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                if (activeTab === 2) {
                                                    // Daywise report click handler
                                                    if (val !== 0 && val !== "--") {
                                                        alert(`Clicked on ${row.station} for Day ${days[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                                    }
                                                }
                                            }}
                                        >
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
        </Box>
    );
}