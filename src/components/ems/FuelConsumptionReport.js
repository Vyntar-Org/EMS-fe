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
import { fetchConsumptionData, fetchReadingData, fetchConsumptionCostData, fetchMonthlyConsumptionData, fetchMonthlyConsumptionCostData } from "../../auth/ReportsApi";

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Function to get the number of days in a month
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

export default function FuelConsumptionReport({ onSidebarToggle, sidebarVisible }) {
    // Get current date for default values
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const currentYear = currentDate.getFullYear();
    
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
    const [selectedMonth, setSelectedMonth] = useState(currentMonth); // Default to current month
    const [selectedYear, setSelectedYear] = useState(currentYear); // Default to current year
    const [selectedStation, setSelectedStation] = useState(''); // For dropdown filter
    const [searchTrigger, setSearchTrigger] = useState(0); // Used to trigger re-render on search
    const [isSearchApplied, setIsSearchApplied] = useState(false); // Track if search has been applied
    const [matchedStation, setMatchedStation] = useState(''); // Store the actual matched station name

    // Get days in current month for display
    const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);
    const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

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
            // Create an array of consumption values for all days in the current month
            const consumptionValues = currentMonthDays.map(day => {
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
            // Create an array of Consumption cost values for all days in the current month
            const consumptionCostValues = currentMonthDays.map(day => {
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
            // Create an array of reading values for all days in the current month
            const readingValues = currentMonthDays.map(day => {
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
            const headers = ['STATION', ...Array.from({ length: daysInCurrentMonth }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
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
            const headers = ['STATION', ...Array.from({ length: daysInCurrentMonth }, (_, i) => `Day ${i + 1}`)];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data]);
            return { headers, data, title: 'Daily Meter Reading Report' };
        } else if (activeTab === 3) {
            // Daywise cost consumption data
            const headers = ['STATION', ...Array.from({ length: daysInCurrentMonth }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
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
            const headers = ['STATION', ...Array.from({ length: daysInCurrentMonth }, (_, i) => `Day ${i + 1}`)];
            const rows = transformReadingDataToRows(readingData);
            const data = rows.map(row => [row.station, ...row.data]);
            return { headers, data, title: 'Reading Daywise Report' };
        } else {
            // For other tabs, return empty data
            const headers = ['STATION', ...Array.from({ length: daysInCurrentMonth }, (_, i) => `Day ${i + 1}`)];
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

    // Export to PDF functionality - UPDATED TO MATCH IMAGE STYLE
        // Export to PDF functionality - UPDATED TO MATCH IMAGE STYLE
    const exportToPDF = () => {
        import("jspdf").then(({ default: jsPDF }) => {
            import("jspdf-autotable").then(({ default: autoTable }) => {
                
                // 1. Determine Orientation based on active tab (Landscape for Daywise, Portrait for Monthwise)
                const isDaywise = [0, 2, 3].includes(activeTab);
                const orientation = isDaywise ? "landscape" : "portrait";

                // 2. Generate Title and Unit based on Active Tab
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
                } else if (activeTab === 3) {
                    reportTitle = "Station Daywise Data - Cost Consumption";
                    unit = "(Currency)";
                } else {
                    reportTitle = "Station Monthwise Data - Cost Consumption";
                    unit = "(Currency)";
                }

                const finalTitle = unit ? `${reportTitle} ${unit}` : reportTitle;

                // 3. Generate Date Range String (e.g., "April 2026 (01/04/2026 to 30/04/2026)")
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

                // 4. Initialize PDF
                const doc = new jsPDF(orientation, "mm", "a4");
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // 5. Add Header Text
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0); // Black text
                doc.text(finalTitle, 14, 15);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(60, 60, 60); // Dark gray text
                doc.text(dateRangeText, 14, 22);

                // 6. Prepare Data
                const { data } = getCurrentData(); // Get raw data

                // --- MANUAL HEADER GENERATION TO MATCH IMAGE ---
                // We create headers manually here to ensure they are just "1", "2", "3" instead of "Day 1"
                let pdfHeaders = [];
                if (isDaywise) {
                    // Daywise: ["STATION", "1", "2", "3", ..., "TOTAL"]
                    pdfHeaders = ['STATION', ...currentMonthDays.map(d => String(d)), 'TOTAL'];
                } else {
                    // Monthwise: ["STATION", "Jan", "Feb", ..., "TOTAL"]
                    pdfHeaders = ['STATION', ...months, 'TOTAL'];
                }

                // Remove TOTAL column for cleaner look (matching image style)
                const totalIndex = pdfHeaders.indexOf("TOTAL");
                const filteredHeaders = totalIndex >= 0 ? pdfHeaders.filter((_, index) => index !== totalIndex) : pdfHeaders;
                
                // Filter out TOTAL column from data rows as well
                const filteredData = data.map(row => 
                    totalIndex >= 0 ? row.filter((_, index) => index !== totalIndex) : row
                );

                // Format numbers to 2 decimals
                const formattedData = filteredData.map(row =>
                    row.map(cell =>
                        typeof cell === "number" ? cell.toFixed(2) : cell
                    )
                );

                // --- CALCULATE COLUMN WIDTHS TO BE EQUAL ---
                // We set margins (14mm) and calculate the usable width.
                // Station gets a fixed width, the rest are divided equally.
                const margin = 14; 
                const usableWidth = pageWidth - (margin * 2);
                const stationWidth = 40; // Fixed width for Station column in mm
                
                // Calculate width for each remaining column
                const colCount = filteredHeaders.length - 1; // Total columns minus Station
                const dataColWidth = (usableWidth - stationWidth) / (colCount > 0 ? colCount : 1);

                // Build column styles object
                const columnStyles = {
                    // Column 0 (Station)
                    0: { 
                        cellWidth: stationWidth, 
                        fontStyle: 'bold', 
                        halign: 'left' 
                    }
                };

                // Apply equal width to all other columns (Days/Months)
                for (let i = 1; i < filteredHeaders.length; i++) {
                    columnStyles[i] = { cellWidth: dataColWidth };
                }

                // 7. Generate Table
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

                    // Apply the calculated column styles here
                    columnStyles: columnStyles,
                    
                    // Footer configuration
                    didDrawPage: function (data) {
                        // Add "Provided by Salieabs" at bottom left
                        doc.setFontSize(8);
                        doc.setTextColor(100);
                        doc.text("Provided by Salieabs", 14, pageHeight - 10);
                        
                        // Add Page Number at bottom right
                        const pageNumber = doc.internal.getNumberOfPages();
                        doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
                    }
                });

                // 8. Save PDF
                doc.save(`${finalTitle.replace(/\s+/g, "_")}.pdf`);
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
            width: '100%',
            minHeight: '89vh',
            fontFamily: 'Inter, Roboto, system-ui, sans-serif',
            fontSize: '14px',
            margin: '0',
            padding: { xs: '5px', sm: '0' },
            boxSizing: 'border-box',
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
                            sx={{
                                color: '#0F2A44',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                                backgroundColor: '#fff',
                                width: { xs: '100%', lg: '150%' },
                                marginLeft: { xs: '-12px', lg: 0, sm: '17px' },
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
                                sx={{
                                    fontSize: '14px',
                                    lineHeight: 1,
                                    marginLeft: '-2px',
                                    fontWeight: '400',
                                    display: 'inline-block',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    color: '#007bff',
                                    zIndex: 10,
                                    position: 'relative'
                                }}
                            >
                            </span>
                            <Tabs 
                                value={activeTab} 
                                onChange={handleTabChange} 
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                centered={false} 
                                sx={{ 
                                    mb: 2, 
                                    minHeight: { xs: '40px', sm: '48px' },
                                    width: { xs: '410px' ,sm: '720px', md: '100%' },
                                    '& .MuiTabs-scroller': {
                                        overflowX: 'auto',
                                        '&::-webkit-scrollbar': {
                                            height: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: '#f1f1f1',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#0156a6',
                                            borderRadius: '4px',
                                        },
                                    },
                                    '& .MuiTabs-flexContainer': {
                                        flexWrap: 'nowrap',
                                    },
                                    '& .MuiTab-root': {
                                        minWidth: { xs: '', sm: 200 },
                                        fontSize: { xs: '11px', sm: '13px' },
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#0156a6',
                                    },
                                }}
                            >
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
                    {(activeTab === 0 || activeTab === 2 || activeTab === 3) && (
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            sx={{ 
                                minWidth: { xs: '100%', sm: 150 }, 
                                height: '30px' 
                            }}
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
                        sx={{ 
                            minWidth: { xs: '100%', sm: 130 }, 
                            height: '30px' 
                        }}
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
                        onClick={() => {
                            // Force re-render to apply current filters
                            setSearchTrigger(prev => prev + 1);
                        }}
                        sx={{
                            bgcolor: '#0156a6',
                            color: '#fff',
                            width: { xs: '100%', sm: '30px' },
                            height: '30px',
                            borderRadius: { xs: '4px', sm: '50%' },
                            '&:hover': {
                                bgcolor: '#0a223e',
                            }
                        }}
                        title="Search with selected filters"
                    >
                        <SearchIcon fontSize="small" sx={{ mr: { xs: 1, sm: 0 } }} />
                        <Box sx={{ display: { xs: 'inline', sm: 'none' }, fontSize: '14px' }}>Search</Box>
                    </IconButton>
                </Box>


                {/* RIGHT SIDE – EXCEL & PDF (FLEX END) */}
                {(showConsumptionTables || showReadingTables) && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                            gap: 1,
                            p: 1,
                            borderRadius: 2,
                        }}
                    >
                        <Button
                            onClick={exportToExcel}
                            startIcon={<FileDownloadIcon sx={{marginLeft: '12px'}} />}
                            sx={{
                                bgcolor: "#217346",
                                color: "#fff",
                                borderRadius: "8px",
                                textTransform: 'none',
                                "&:hover": {
                                    bgcolor: "#1e6b40",
                                },
                                transition: "all 0.2s",
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 2, sm: 1 },
                            }}
                        >
                        </Button>

                        <Button
                            onClick={exportToPDF}
                            startIcon={<PictureAsPdfIcon sx={{marginLeft: '12px'}} />}
                            sx={{
                                bgcolor: "#EA3323",
                                color: "#fff",
                                borderRadius: "8px",
                                textTransform: 'none',
                                "&:hover": {
                                    bgcolor: "#c6281c",
                                },
                                transition: "all 0.2s",
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 2, sm: 1 },
                            }}
                        >
                        </Button>
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
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        maxHeight: { xs: 400, sm: 520 }, 
                        height: { xs: '400px', sm: '501px' },
                        width: { sm: '96%', md: '98%' },
                        marginLeft: { sm: '15px' },
                        overflowX: 'auto',
                        '& .MuiTableCell-root': {
                            fontSize: { xs: '10px', sm: '12px' },
                            padding: { xs: '4px 2px', sm: '6px 8px' },
                            whiteSpace: 'nowrap',
                        },
                        '& .MuiTableCell-head': {
                            fontSize: { xs: '9px', sm: '12px' },
                            fontWeight: 'bold',
                        }
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 10 }}><b>Device</b></TableCell>
                                {(activeTab === 0 || activeTab === 3) ? (
                                    currentMonthDays.map(day => (
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
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {getRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff", zIndex: 1, fontWeight: 'bold' }}>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell
                                            key={idx}
                                            align="center"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {typeof val === 'number' ? val.toFixed(2) : val}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            {/* Reading Table - Show only for reading tabs */}
            {!loading && !error && showReadingTables && (
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        maxHeight: { xs: 400, sm: 500 }, 
                        height: { xs: '400px', sm: '700px' },
                        overflowX: 'auto',
                        '& .MuiTableCell-root': {
                            fontSize: { xs: '10px', sm: '12px' },
                            padding: { xs: '4px 2px', sm: '6px 8px' },
                            whiteSpace: 'nowrap',
                        },
                        '& .MuiTableCell-head': {
                            fontSize: { xs: '9px', sm: '12px' },
                            fontWeight: 'bold',
                        }
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: "#0156a6", color: "#fff", position: 'sticky', left: 0, zIndex: 10 }}><b>Device</b></TableCell>
                                {activeTab === 2 ? (
                                    currentMonthDays.map(day => (
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
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {getReadingRows().map((row, i) => (
                                <TableRow key={i} sx={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "inherit" }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff", zIndex: 1, fontWeight: 'bold' }}>{row.station}</TableCell>
                                    {row.data.map((val, idx) => (
                                        <TableCell
                                            key={idx}
                                            align="center"
                                            style={{ cursor: 'pointer' }}
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