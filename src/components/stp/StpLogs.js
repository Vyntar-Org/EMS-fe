import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import '../ems/Logs.css';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function StpLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState(['all']);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Filter State variables
  const [filterDevice, setFilterDevice] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  // Define device-specific columns configuration
  const deviceColumnsConfig = {
    'Water Inlet': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'inlet_flow', label: 'Inlet Flow (m³/hr)' },
      { key: 'inlet_totalizer', label: 'Inlet Totalizer (KL)' },
    ],
    'Water Outlet': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'outlet_flow', label: 'Outlet Flow (m³/hr)' },
      { key: 'outlet_totalizer', label: 'Outlet Totalizer (KL)' },
    ],
    'pH Monitor': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'ph', label: 'pH' },
    ],
    'TDS Monitor': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'tds', label: 'TDS (ppm)' },
    ],
    'Water Level Monitoring': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'collection_tank_level', label: 'Collection Tank Level' },
      { key: 'collection_motor_status', label: 'Motor Status (Collection)' },
      { key: 'filter_out_level', label: 'Filter Out Level' },
      { key: 'filter_out_motor_status', label: 'Motor Status (Filter Out)' },
    ]
  };

  // Function to get current columns based on selected device
  const getCurrentColumns = () => {
    return deviceColumnsConfig[filterDevice] || [];
  };

  // Load devices on component mount
  useEffect(() => {
    setTimeout(() => {
      const mockDevices = ['Water Inlet', 'Water Outlet', 'pH Monitor', 'TDS Monitor', 'Water Level Monitoring'];
      setDevices(['all', ...mockDevices]);
      if (mockDevices.length > 0) {
        setFilterDevice(mockDevices[0]);
      }
    }, 500);
  }, []);

  // Helper to generate random mock logs based on device
  const generateMockLogs = (device, start, end) => {
    const data = [];
    const startTime = start.valueOf();
    const endTime = end.valueOf();
    const diff = endTime - startTime;

    if (diff <= 0) return [];

    const numberOfEntries = Math.floor(Math.random() * 50) + 50;
    const levels = ['Full', 'Low'];
    const motorStatuses = ['On', 'Off'];

    for (let i = 0; i < numberOfEntries; i++) {
      const randomTime = startTime + Math.random() * diff;
      const entry = {
        timestamp: new Date(randomTime).toISOString(),
      };

      // Generate data based on device type
      if (device === 'Water Inlet') {
        entry.inlet_flow = (Math.random() * 100).toFixed(2);
        entry.inlet_totalizer = Math.floor(Math.random() * 1000);
      } else if (device === 'Water Outlet') {
        entry.outlet_flow = (Math.random() * 100).toFixed(2);
        entry.outlet_totalizer = Math.floor(Math.random() * 1000);
      } else if (device === 'pH Monitor') {
        entry.ph = (Math.random() * 3 + 6).toFixed(2); // Range 6-9
      } else if (device === 'TDS Monitor') {
        entry.tds = Math.floor(Math.random() * 400 + 100); // Range 100-500
      } else if (device === 'Water Level Monitoring') {
        entry.collection_tank_level = levels[Math.floor(Math.random() * levels.length)];
        entry.collection_motor_status = motorStatuses[Math.floor(Math.random() * motorStatuses.length)];
        entry.filter_out_level = levels[Math.floor(Math.random() * levels.length)];
        entry.filter_out_motor_status = motorStatuses[Math.floor(Math.random() * motorStatuses.length)];
      }

      data.push(entry);
    }

    return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Handle search button click
  const handleSearch = () => {
    if (!filterDevice || filterDevice === 'all') {
      setSnackbarMessage('Please select a device');
      setSnackbarOpen(true);
      return;
    }
    if (!filterStartDate || !filterEndDate) {
      setSnackbarMessage('Please select a valid date range');
      setSnackbarOpen(true);
      return;
    }

    setSearchClicked(true);
    setPage(1);
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const mockData = generateMockLogs(filterDevice, filterStartDate, filterEndDate);
        setLogs(mockData);
      } catch (err) {
        setError('Failed to generate mock data');
        setSnackbarMessage('Failed to generate mock data');
        setSnackbarOpen(true);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  // Calculate pagination
  const totalRecords = logs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const shouldShowPagination = searchClicked && totalRecords > 0;

  // Get logs for current page
  const paginatedLogs = logs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Function to reset all filters
  const handleResetFilters = () => {
    if (devices.length > 1) {
      setFilterDevice(devices[1]);
    }
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
    setPage(1);
    setSearchClicked(false);
    setLogs([]);
    setError(null);
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
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
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
    }
  }

  // Helper to render cell content
  const renderCellContent = (log, colKey) => {
    if (colKey === 'timestamp') {
      return new Date(log.timestamp).toLocaleString();
    }
    return log[colKey] !== undefined ? log[colKey] : '-';
  };

  // Helper to render status chips
  const renderStatusChip = (value) => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      let bgColor = '';
      let label = value;

      if (lowerValue === 'full') {
        bgColor = '#4f92d4';
        label = 'FULL';
      } else if (lowerValue === 'low') {
        bgColor = '#d05353';
        label = 'LOW';
      } else if (lowerValue === 'on') {
        bgColor = 'green';
        label = 'ON';
      } else if (lowerValue === 'off') {
        bgColor = 'red';
        label = 'OFF';
      }

      if (bgColor) {
        return (
          <Chip 
            label={label} 
            size="small" 
            sx={{ 
              backgroundColor: bgColor, 
              color: 'white', 
              fontWeight: 'bold',
              borderRadius: '16px',
              minWidth: '50px',
              fontSize: '10px',
            }} 
          />
        );
      }
    }
    return value;
  };

  if (loading && !searchClicked) {
    return (
      <Box sx={styles.mainContent} id="main-content">
        <Card className="logs-card" sx={{ marginTop: '' }}>
          <CardContent>
            <Box style={styles.loadingContainer}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const currentColumns = getCurrentColumns();

  return (
    <Box sx={styles.mainContent} id="main-content">
      <Card className="logs-card" sx={{ marginTop: '' }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {loading && searchClicked && (
            <Typography variant="body2" align="center" gutterBottom>
              Loading logs...
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error: {error}
            </Alert>
          )}

          <Box className="logs-header">
            <Box
              className="logs-filters"
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                gap: { xs: 2, sm: 2 },
                alignItems: { xs: 'stretch', sm: 'center' },
              }}
            >
              {/* Device Select */}
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: '100%', sm: 200 },
                  mr: { sm: 2 },
                }}
              >
                <InputLabel>Select Device</InputLabel>
                <Select
                  value={filterDevice}
                  label="Select Device"
                  onChange={(e) => setFilterDevice(e.target.value)}
                  disabled={devices.length === 0}
                >
                  {devices.length > 0 ? (
                    devices.map((device) => (
                      <MenuItem key={device} value={device}>
                        {device === 'all' ? 'Select Device' : device}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>Loading devices...</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Date Pickers */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    open={openStart}
                    onOpen={() => setOpenStart(true)}
                    onClose={() => setOpenStart(false)}
                    value={filterStartDate}
                    onChange={(newValue) => setFilterStartDate(newValue)}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 220 } } }}
                    format="DD/MM/YYYY hh:mm A"
                  />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    open={openEnd}
                    onOpen={() => setOpenEnd(true)}
                    onClose={() => setOpenEnd(false)}
                    value={filterEndDate}
                    onChange={(newValue) => setFilterEndDate(newValue)}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 220 } } }}
                    format="DD/MM/YYYY hh:mm A"
                  />
                </LocalizationProvider>
              </Box>

              {/* Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  order: { xs: 4, sm: 4 },
                  justifyContent: { xs: 'flex-start', sm: 'flex-start' }
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{
                    backgroundColor: '#2F6FB0',
                    '&:hover': { backgroundColor: '#1E4A7C' },
                    minWidth: 'auto',
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '6px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': { margin: { sm: 0 } }
                  }}
                >
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetFilters}
                  sx={{
                    borderColor: '#6c757d',
                    color: '#6c757d',
                    '&:hover': { borderColor: '#5a6268', color: '#5a6268' },
                    minWidth: 'auto',
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '4px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': { margin: { sm: 0 } }
                  }}
                >
                </Button>
              </Box>
            </Box>
          </Box>

          {searchClicked && (
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <TableContainer component={Paper} className="logs-table-container" sx={{ maxHeight: { xs: 400, sm: 520 }, width: '100%' }}>
                <Table stickyHeader sx={{ tableLayout: 'auto', width: '100%' }}>
                  <TableHead>
                    <TableRow className="log-table-header">
                      {/* <TableCell 
                        className="log-header-cell" 
                        sx={{ 
                          textTransform: 'capitalize',
                          fontSize: { xs: '11px', sm: '14px' },
                          padding: { xs: '8px 4px', sm: '16px' },
                          fontWeight: 'bold',
                          backgroundColor: "#0156a6", color: "#fff"
                        }}
                      >
                        #
                      </TableCell> */}
                      {currentColumns.map((col) => (
                        <TableCell 
                          key={col.key} 
                          className="log-header-cell" 
                          sx={{ 
                            textTransform: 'capitalize',
                            fontSize: { xs: '11px', sm: '14px' },
                            padding: { xs: '8px 4px', sm: '16px' },
                            fontWeight: 'bold',
                            backgroundColor: "#0156a6", color: "#fff"
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log, index) => (
                        <TableRow key={index} hover className="log-table-row">
                          {/* <TableCell 
                            className="log-table-cell"
                            sx={{
                              fontSize: { xs: '11px', sm: '14px' },
                              padding: { xs: '8px 4px', sm: '16px' }
                            }}
                          >
                            {(page - 1) * rowsPerPage + index + 1}
                          </TableCell> */}
                          {currentColumns.map((col) => {
                            const value = log[col.key];
                            
                            return (
                              <TableCell 
                                key={col.key} 
                                className="log-table-cell"
                                sx={{
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                {renderStatusChip(value) || renderCellContent(log, col.key)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell 
                          colSpan={currentColumns.length + 1} 
                          align="center"
                          sx={{
                            fontSize: { xs: '12px', sm: '14px' },
                            padding: { xs: '16px 8px', sm: '16px' }
                          }}
                        >
                          No logs found matching your filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Pagination - Updated to match WaterLogs style */}
          {shouldShowPagination && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'center', sm: 'center' }, 
              mt: 2,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '14px' } }}
              >
                Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, totalRecords)} of {totalRecords} entries
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: { xs: '11px', sm: '14px' },
                    minWidth: { xs: '28px', sm: '32px' },
                    height: { xs: '28px', sm: '32px' }
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

export default StpLogs;