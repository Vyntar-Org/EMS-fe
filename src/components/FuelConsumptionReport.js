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
import { fetchConsumptionData, fetchReadingData, fetchConsumptionCostData, fetchMonthlyConsumptionData, fetchMonthlyConsumptionCostData } from "../auth/ReportsApi";

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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
    const [consumptionCostData, setConsumptionCostData] = useState(null);
    const [monthlyConsumptionCostData, setMonthlyConsumptionCostData] = useState(null);
    const [monthlyConsumptionData, setMonthlyConsumptionData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(1); // Default to January
    const [selectedYear, setSelectedYear] = useState(2026); // Default to 2026
    const [selectedStation, setSelectedStation] = useState(''); // For dropdown filter
    const [searchTrigger, setSearchTrigger] = useState(0); // Used to trigger re-render on search
    const [isSearchApplied, setIsSearchApplied] = useState(false); // Track if search has been applied
    const [matchedStation, setMatchedStation] = useState(''); // Store the actual matched station name

    const selectStyle = {
        minWidth: 200,
        height: 35,
        padding: "6px 10px",
        fontSize: "14px",
        borderRadius: "5px"
    };


    // Fetch data only for active tab
    useEffect(() => {
        const fetchDataForActiveTab = async () => {
            try {
                setLoading(true);

                if (activeTab === 0) {
                    // Daywise consumption data
                    const response = await fetchConsumptionData(selectedMonth, selectedYear);
                    setConsumptionData(response);
                } else if (activeTab === 1) {
                    // Monthwise consumption data
                    const response = await fetchMonthlyConsumptionData(selectedYear);
                    setMonthlyConsumptionData(response);
                } else if (activeTab === 2) {
                    // Daily meter reading data
                    const response = await fetchReadingData(selectedMonth, selectedYear);
                    setReadingData(response);
                } else if (activeTab === 3) {
                    // Daywise cost consumption data
                    const response = await fetchConsumptionCostData(selectedMonth, selectedYear);
                    setConsumptionCostData(response);
                } else if (activeTab === 4) {
                    // Monthwise cost consumption data
                    const response = await fetchMonthlyConsumptionCostData(selectedYear);
                    setMonthlyConsumptionCostData(response);
                }

                setError(null);
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDataForActiveTab();
    }, [activeTab, selectedMonth, selectedYear, searchTrigger]);

    // Transform API data to table rows format
    const transformDataToRows = (data) => {
        console.log(data);
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, dailyData]) => {
            // Create an array of consumption values for all days (1-31)
            const consumptionValues = days.map(day => {
                const dayData = dailyData.find(d => Number(d.date.split('-').pop()) === day || Number(d.date) === day);
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

    // Transform API consumption cost data to table rows format
    const transformConsumptionCostDataToRows = (data) => {
        console.log(data);
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, dailyData]) => {
            // Create an array of Consumption cost values for all days (1-31)
            const consumptionCostValues = days.map(day => {
                const dayData = dailyData.find(d => Number(d.date.split('-').pop()) === day || Number(d.date) === day);
                return dayData ? dayData.cost : 0;
            });

            // Calculate total consumption for this station
            const total = consumptionCostValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionCostValues,
                total: total.toFixed(2)
            };
        });
    };

    // Transform API reading data to table rows format
    const transformReadingDataToRows = (data) => {
        if (!data || !data.data) return [];
        console.log(data);
        return Object.entries(data.data).map(([station, dailyData]) => {
            // Create an array of reading values for all days (1-31)
            const readingValues = days.map(day => {
                const dayData = dailyData.find(d => Number(d.date.split('-').pop()) === day || Number(d.date) === day);
                return dayData ? (dayData.first_meter_reading !== null ? dayData.first_meter_reading : '--') : '--';
            });


            return {
                station,
                data: readingValues
            };
        });
    };

    // Transform API monthly consumption data to table rows format
    const transformMonthlyConsumptionDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, monthlyData]) => {

            // 3. Map our 12 months to the data provided by the API
            const consumptionValues = months.map((_, index) => {
                const monthNumber = index + 1; // Jan = 1, Feb = 2...

                // Find the record where the month number matches
                const monthRecord = monthlyData.find(d => parseInt(d.month) === monthNumber);

                return monthRecord ? monthRecord.consumption_kwh : 0;
            });

            // 4. Calculate total for the station
            const total = consumptionValues.reduce((sum, val) => sum + val, 0);

            return {
                station,
                data: consumptionValues,
                total: total.toFixed(2)
            };
        });
    };

    // Transform API monthly consumption cost data to table rows format
    const transformMonthlyConsumptionCostDataToRows = (data) => {
        if (!data || !data.data) return [];

        return Object.entries(data.data).map(([station, monthlyData]) => {

            // 3. Map our 12 months to the data provided by the API
            const consumptionValues = months.map((_, index) => {
                const monthNumber = index + 1; // Jan = 1, Feb = 2...

                // Find the record where the month number matches
                const monthRecord = monthlyData.find(d => parseInt(d.month) === monthNumber);

                return monthRecord ? monthRecord.cost : 0;
            });

            // 4. Calculate total for the station
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
        if (activeTab === 0) {
            // Daywise data from API
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const rows = transformDataToRows(consumptionData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: activeTab === 0 ? 'Daywise Consumption Report' : 'Daywise Cost Consumption Report' };
        } else if (activeTab === 1) {
            // Monthwise data from API
            const headers = ['STATION', ...months, 'TOTAL'];
            const rows = transformMonthlyConsumptionDataToRows(monthlyConsumptionData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: activeTab === 1 ? 'Monthwise Consumption Report' : 'Monthwise Cost Consumption Report' };
        } else if (activeTab === 2) {
            // Reading data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`)];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data]);
            return { headers, data, title: 'Daily Meter Reading Report' };
        } else if (activeTab === 3) {
            // Daywise cost consumption data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const rows = transformConsumptionCostDataToRows(consumptionCostData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Daywise Cost Consumption Report' };
        } else if (activeTab === 4) {
            // Monthwise cost consumption data
            const headers = ['STATION', ...months, 'TOTAL'];
            const rows = transformMonthlyConsumptionCostDataToRows(monthlyConsumptionCostData);
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Monthwise Cost Consumption Report' };
        }
    };

    // Get current reading data based on active tab
    const getCurrentReadingData = () => {
        if (activeTab === 2) {
            // Reading Daywise data from API
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`)];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data]);
            return { headers, data, title: 'Reading Daywise Report' };
        } else {
            // For other tabs, return empty data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`)];
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
        setIsSearchApplied(true);
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

    // Remove TOTAL column from headers and data
    const totalIndex = headers.indexOf("TOTAL");
    const filteredHeaders = totalIndex >= 0 ? headers.filter((_, index) => index !== totalIndex) : headers;
    
    // Filter out TOTAL column from each row of data
    const filteredData = data.map(row => 
        totalIndex >= 0 ? row.filter((_, index) => index !== totalIndex) : row
    );

    // Format numbers to 2 decimals
    const formattedData = filteredData.map(row =>
        row.map(cell =>
            typeof cell === "number"
                ? cell.toFixed(2)
                : cell
        )
    );

    import("jspdf").then(({ default: jsPDF }) => {
        import("jspdf-autotable").then(({ default: autoTable }) => {
            const doc = new jsPDF("portrait", "mm", "a4");

            // Get page dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const usableWidth = pageWidth - 16; // Accounting for margins (8mm on each side)

            // Set up the title and date on the first page
            doc.setFontSize(16);
            doc.text(title, 14, 15);

            doc.setFontSize(10);
            doc.text(
                `Generated on: ${new Date().toLocaleDateString()}`,
                14,
                22
            );

            // Split into chunks of 11 columns
            const columnsPerPage = 11;
            const totalPages = Math.ceil(filteredHeaders.length / columnsPerPage);

            // Create a table for each chunk of columns
            for (let page = 0; page < totalPages; page++) {
                // Add new page for all pages except the first one
                if (page > 0) {
                    doc.addPage();

                    // Add title and date to each new page
                    doc.setFontSize(16);
                    doc.text(title, 14, 15);

                    doc.setFontSize(10);
                    doc.text(
                        `Generated on: ${new Date().toLocaleDateString()} - Part ${page + 1} of ${totalPages}`,
                        14,
                        22
                    );
                }

                // Calculate the start and end indices for this chunk
                const startIdx = page * columnsPerPage;
                const endIdx = Math.min(startIdx + columnsPerPage, filteredHeaders.length);

                // Extract the headers for this chunk
                const chunkHeaders = filteredHeaders.slice(startIdx, endIdx);

                // Extract the data for this chunk
                const chunkData = formattedData.map(row => row.slice(startIdx, endIdx));

                // Calculate column widths for this chunk
                // Station column gets 30% of available width
                const stationWidth = usableWidth * 0.3;

                // Remaining width is distributed among date columns (no TOTAL column)
                const remainingWidth = usableWidth - stationWidth;
                const dateColumnCount = chunkHeaders.length - (chunkHeaders[0] === "STATION" ? 1 : 0);
                const dateColumnWidth = dateColumnCount > 0 ? remainingWidth / dateColumnCount : 0;

                // Build column styles object
                const columnStyles = {};

                // Set width for Station column (first column)
                if (chunkHeaders[0] === "STATION" || chunkHeaders[0] === "Station") {
                    columnStyles[0] = { cellWidth: stationWidth };
                }

                // Set width for date columns (all columns after Station)
                for (let i = 1; i < chunkHeaders.length; i++) {
                    columnStyles[i] = { cellWidth: dateColumnWidth };
                }

                // Add the table for this chunk
                autoTable(doc, {
                    head: [chunkHeaders],
                    body: chunkData,
                    startY: 28,
                    theme: "grid",

                    styles: {
                        fontSize: 7,
                        cellPadding: 2,
                        halign: "center",
                        valign: "middle",
                        overflow: 'linebreak', // Ensure content fits
                        cellWidth: 'auto' // Auto-adjust content
                    },

                    headStyles: {
                        fillColor: [1, 86, 166],
                        textColor: 255,
                        fontSize: 7,
                    },

                    columnStyles: columnStyles,

                    margin: { left: 8, right: 8 },
                    showHead: "everyPage",
                    tableWidth: 'auto', // Use full available width
                });

                // Add page number at the bottom
                doc.setFontSize(8);
                doc.text(
                    `Page ${page + 1} of ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: "center" }
                );
            }

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

        // Remove duplicates and sort
        return [...new Set(stations)].sort();
    };

    // Helper function for fuzzy matching station names
    const findMatchingStation = (inputValue) => {
        if (!inputValue.trim()) return '';

        const stations = getAllStations();
        const normalizedInput = inputValue.toLowerCase().replace(/\s+/g, '');

        // Exact match first
        const exactMatch = stations.find(station =>
            station.toLowerCase() === normalizedInput ||
            station.toLowerCase().replace(/\s+/g, '') === normalizedInput
        );

        if (exactMatch) return exactMatch;

        // Partial match (contains the input)
        const partialMatch = stations.find(station =>
            station.toLowerCase().includes(normalizedInput) ||
            station.toLowerCase().replace(/\s+/g, '').includes(normalizedInput)
        );

        if (partialMatch) return partialMatch;

        // Fuzzy match (check each word)
        const inputWords = normalizedInput.split(/[^a-z0-9]/).filter(word => word.length > 0);
        if (inputWords.length > 0) {
            const fuzzyMatch = stations.find(station => {
                const stationWords = station.toLowerCase().replace(/\s+/g, '').split(/[^a-z0-9]/).filter(word => word.length > 0);
                return inputWords.some(inputWord =>
                    stationWords.some(stationWord => stationWord.includes(inputWord))
                );
            });

            if (fuzzyMatch) return fuzzyMatch;
        }

        return '';
    };

    // Get rows for the current view
    const getRows = () => {
        let rows = [];
        if ((activeTab === 0) && consumptionData) {
            rows = transformDataToRows(consumptionData);
        } else if ((activeTab === 1) && monthlyConsumptionData) {
            rows = transformMonthlyConsumptionDataToRows(monthlyConsumptionData);
        } else if ((activeTab === 2) && readingData) {
            rows = transformReadingDataToRows(readingData);
        } else if ((activeTab === 3) && consumptionCostData) {
            rows = transformConsumptionCostDataToRows(consumptionCostData);
        } else if ((activeTab === 4) && monthlyConsumptionCostData) {
            rows = transformMonthlyConsumptionCostDataToRows(monthlyConsumptionCostData);
        } else {
            rows = transformMonthlyConsumptionCostDataToRows(monthlyConsumptionCostData);
        }

        // Apply filters if they exist
        let filteredRows = rows;

        // Apply station filter if matchedStation exists
        if (matchedStation) {
            filteredRows = filteredRows.filter(row => row.station === matchedStation);
        }

        return filteredRows;
    };

    // Get reading rows for the reading table
    const getReadingRows = () => {
        let rows = [];
        if (activeTab === 2 && readingData) {
            // Daywise reading data
            rows = transformReadingDataToRows(readingData);
        }

        // Apply filters if they exist
        let filteredRows = rows;

        // Apply station filter if matchedStation exists
        if (matchedStation) {
            filteredRows = filteredRows.filter(row => row.station === matchedStation);
        }

        return filteredRows;
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
                                // marginLeft: '5px',
                                backgroundColor: '#fff',
                                width: '150%'
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
                                    // marginRight: '8px',
                                    userSelect: 'none',
                                    color: '#007bff',
                                    zIndex: 10,
                                    position: 'relative'
                                }}
                            >
                                {/* <i className={`fa ${sidebarVisible ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i> */}
                            </span>
                            <Tabs value={activeTab} onChange={handleTabChange} centered={false} sx={{ mb: 2, marginTop: '-37px' }}>
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daywise Consumption" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Monthwise Consumption" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daily Meter Reading" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Daywise Cost Consumption" />
                                <Tab sx={{ fontWeight: 600, textTransform: 'capitalize' }} label="Monthwise Cost Consumption" />
                            </Tabs>
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
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
                        // background: "#f8fafc",
                        p: 1.5,
                        borderRadius: 2,
                        // boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
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
                            sx={{ minWidth: 150, height: '30px' }}
                            InputProps={{
                                sx: { height: '30px', padding: '6px 14px' },
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
                        sx={{ minWidth: 130, height: '30px' }}
                        InputProps={{
                            sx: { height: '30px', padding: '6px 14px' },
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
                        size="small"
                        label="Machine"
                        value={selectedStation}
                        placeholder="Machine"
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            setSelectedStation(inputValue);
                            setIsSearchApplied(false);

                            // Find matching station
                            const matched = findMatchingStation(inputValue);
                            setMatchedStation(matched);
                        }}
                        sx={{ minWidth: 200, height: '30px' }}
                        InputProps={{
                            sx: { height: '30px', padding: '6px 14px' },
                            startAdornment: (
                                <InputAdornment position="start">
                                    {/* <FactoryIcon fontSize="small" /> */}
                                </InputAdornment>
                            )
                        }}
                    // helperText={matchedStation ? `Matches: ${matchedStation}` : (selectedStation ? 'No matching station found' : '')}
                    />

                    {/* SEARCH BUTTON */}
                    <IconButton
                        onClick={() => {
                            // Force re-render to apply current filters
                            setSearchTrigger(prev => prev + 1);
                        }}
                        sx={{
                            bgcolor: '#0156a6',
                            color: '#fff',
                            width: '30px',
                            height: '30px',
                            '&:hover': {
                                bgcolor: '#0a223e',
                            }
                        }}
                        title="Search with selected filters"
                    >
                        <SearchIcon fontSize="small" />
                    </IconButton>
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
                <TableContainer component={Paper} sx={{ maxHeight: 520, height: '501px' }}>
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
                                        // onClick={() => {
                                        //     if (activeTab === 0 || activeTab === 3) {
                                        //         // Daywise report click handler
                                        //         if (val !== 0) {
                                        //             alert(`Clicked on ${row.station} for Day ${days[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                        //         }
                                        //     } else {
                                        //         // Monthwise report click handler
                                        //         if (val !== "--") {
                                        //             alert(`Clicked on ${row.station} for ${months[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                        //         } else {
                                        //             // Placeholder for handling clicks on empty cells in monthwise view
                                        //             console.log(`${row.station} - ${months[idx]} is not configured yet`);
                                        //         }
                                        //     }
                                        // }}
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
                <TableContainer component={Paper} sx={{ maxHeight: 500, height: '700px' }}>
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
                                {/* <TableCell align="center" sx={{ backgroundColor: "#0156a6", color: "#fff" }}><b>TOTAL</b></TableCell> */}
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
                                        // onClick={() => {
                                        //     if (activeTab === 2) {
                                        //         // Daywise report click handler
                                        //         if (val !== 0 && val !== "--") {
                                        //             alert(`Clicked on ${row.station} for Day ${days[idx]} with value ${typeof val === 'number' ? val.toFixed(2) : val}`);
                                        //         }
                                        //     }
                                        // }}
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