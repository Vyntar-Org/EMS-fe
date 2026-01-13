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

} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthwiseRows = [
    {
        station: "DG 1500 KVA",
        data: ["--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"],
        total: "--"
    },
    {
        station: "Mother Tank",
        data: ["--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"],
        total: "--"
    },
    {
        station: "DG 625 KVA",
        data: ["--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"],
        total: "--"
    },
    {
        station: "DG 380 KVA",
        data: ["--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--", "--"],
        total: "--"
    }
];

const rows = [
    {
        station: "DG 1500 KVA",
        data: [63, 115, 473, 0, 0, 38, 3, 0, 0, 0, 19, 16, 0, 0, 0, 0, 1661, 16, 0, 0, 0, 0, 0, 32, 8, 0, 0, 0, 0, 0, 150],
        total: "2594.00"
    },
    {
        station: "Mother Tank",
        data: [8, 0, 2, 8, 6, 6, 4, 8, 10, 6, 8, 6, 10, 6, 201, 2, 2541, 814, 4, 4, 6, 6, 6, 4, 600, 6, 6, 8, 6, 6, 506],
        total: "4814.00"
    },
    {
        station: "DG 625 KVA",
        data: [0, 124, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 118, 0, 0, 0, 2, 0, 0, 7, 6, 0, 0, 0, 0, 0, 0, 79],
        total: "390.00"
    },
    {
        station: "DG 380 KVA",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 2, 4, 0, 0, 0, 0, 0, 0, 5],
        total: "19.00"
    }
];
export default function FuelConsumptionReport({ onSidebarToggle, sidebarVisible }) {
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState({}); // Track visibility of columns
    const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen mode

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Search functionality
    const handleSearch = () => {
        // In a real implementation, this would open a search dialog or activate search input
        alert('Search functionality would be activated here');
    };

    // Column visibility toggle functionality
    const handleColumnVisibility = () => {
        // In a real implementation, this would open a dialog to select visible columns
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

    // Get current data based on active tab
    const getCurrentData = () => {
        if (activeTab === 0) {
            // Daywise data
            const headers = ['STATION', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`), 'TOTAL'];
            const data = rows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Daywise Report' };
        } else {
            // Monthwise data
            const headers = ['STATION', ...months, 'TOTAL'];
            const data = monthwiseRows.map(row => [row.station, ...row.data, row.total]);
            return { headers, data, title: 'Monthwise Report' };
        }
    };

    // Export to Excel functionality
    const exportToExcel = () => {
        // In a real implementation, this would generate an Excel file
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
        // In a real implementation, this would generate a PDF file
        const { title } = getCurrentData();
        alert(`Exporting ${title} to PDF format`);
    };

    const styles = {
        mainContent: {
            width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)', // Adjust width based on sidebar visibility
            maxWidth: sidebarVisible ? '1600px' : '1800px', // Adjust max width
            minHeight: 'auto',
            // backgroundColor: '#F8FAFC',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            // padding: '24px',
            margin: '0',
            marginBottom: '20px',
            transition: 'all 0.3s ease', // Add smooth transition
        },
    }
    return (
        <Box style={styles.mainContent} id="main-content">
            <Box style={styles.blockHeader} className="block-header mb-1">
                <Grid container>
                    <Grid lg={5} md={8} xs={12}>
                        <Typography
                            variant="h6"
                            className="logs-title"
                            style={{
                                // marginBottom: '-10px',
                                color: '#0156a6',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
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
                            Reports
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 2, alignItems: 'left', display: 'flex' }}>
                <Tabs value={activeTab} onChange={handleTabChange} centered>
                    <Tab label="Daywise Report" />
                    <Tab label="Monthwise Report" />
                </Tabs>
            </Paper>

            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2
                }}
            >
                <Typography variant="h6">
                    {activeTab === 0 ? 
                        "Stations Daily Avg. Fuel Consumption in Ltrs. Report" : 
                        "Stations Monthly Avg. Fuel Consumption in Ltrs. Report"}
                </Typography>

                <Box>
                    <Button variant="outlined" sx={{ mr: 1 }} onClick={exportToExcel}>
                        Export to Excel
                    </Button>
                    <Button variant="outlined" onClick={exportToPDF}>
                        Export to PDF
                    </Button>
                </Box>
            </Box>
            {/* Table Tools */}
            <Box sx={{ display: "flex", justifyContent: "right", mb: 1 }}>
                <Box>
                    <IconButton onClick={handleSearch} title="Search"><SearchIcon /></IconButton>
                    <IconButton onClick={handleColumnVisibility} title="Toggle Column Visibility"><ViewColumnIcon /></IconButton>
                    <IconButton onClick={toggleFullscreen} title="Toggle Fullscreen"><FullscreenIcon /></IconButton>
                </Box>
            </Box>
            {/* Table */}
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>STATION</b></TableCell>
                            {activeTab === 0 ? (
                                days.map(day => (
                                    <TableCell key={day} align="center">
                                        <b>{day}</b>
                                    </TableCell>
                                ))
                            ) : (
                                months.map(month => (
                                    <TableCell key={month} align="center">
                                        <b>{month}</b>
                                    </TableCell>
                                ))
                            )}
                            <TableCell align="center"><b>TOTAL</b></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {(activeTab === 0 ? rows : monthwiseRows).map((row, i) => (
                            <TableRow key={i}>
                                <TableCell>{row.station}</TableCell>
                                {row.data.map((val, idx) => (
                                    <TableCell 
                                        key={idx} 
                                        align="center"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            if (activeTab === 0) {
                                                // Daywise report click handler
                                                if (val !== 0) {
                                                    alert(`Clicked on ${row.station} for Day ${days[idx]} with value ${val}`);
                                                }
                                            } else {
                                                // Monthwise report click handler
                                                if (val !== "--") {
                                                    alert(`Clicked on ${row.station} for ${months[idx]} with value ${val}`);
                                                } else {
                                                    // Placeholder for handling clicks on empty cells in monthwise view
                                                    console.log(`${row.station} - ${months[idx]} is not configured yet`);
                                                }
                                            }
                                        }}
                                    >
                                        {val}
                                    </TableCell>
                                ))}
                                <TableCell align="center">{row.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
