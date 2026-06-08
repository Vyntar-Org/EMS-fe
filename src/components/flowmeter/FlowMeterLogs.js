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
import { getFlowMeterSlaveList, getFlowMeterLogs } from '../../auth/flowmeter/FlowMeterLogsApi'; // Adjust import path as needed

function FlowMeterLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Filter State variables
  const [selectedSlaveId, setSelectedSlaveId] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);
  
  // Meta info for pagination
  const [totalRecords, setTotalRecords] = useState(0);

  // --- UPDATED CONFIGURATION ---
  // Match keys exactly as they appear in the API response for better labeling
  const deviceColumnsConfig = {
    'Water Inlet': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'Inlet Flowrate', label: 'Inlet Flow (m³/hr)' },
      { key: 'Inlet Totalizer', label: 'Inlet Totalizer (KL)' },
    ],
    'Water Outlet': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'Outlet Flowrate', label: 'Outlet Flow (m³/hr)' },
      { key: 'Outlet Totalizer', label: 'Outlet Totalizer (KL)' },
    ],
    'Generic Flow Meter': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'Flowrate', label: 'Flow Rate' },
      { key: 'Totalizer', label: 'Totalizer' },
    ],
    'pH Monitor': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'pH', label: 'pH' },
    ],
    'TDS Monitor': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'TDS', label: 'TDS (ppm)' },
    ],
    'Water Level Monitoring': [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'Level 1', label: 'Collection Tank Level' },
      { key: 'Motor 1 Status', label: 'Motor Status (Collection)' },
      { key: 'Level 2', label: 'Filter Out Level' },
      { key: 'Motor 2 Status', label: 'Motor Status (Filter Out)' },
    ]
  };

  // Helper to find the column config key based on slave name
  const getColumnConfigKey = (slave) => {
    if (!slave || !slave.slave_name) return null;
    const slaveName = slave.slave_name;
    if (slaveName.includes('Water Inlet') || slaveName.includes('Inlet')) return 'Water Inlet';
    if (slaveName.includes('Water Outlet') || slaveName.includes('Outlet')) return 'Water Outlet';
    if (slaveName.includes('pH')) return 'pH Monitor';
    if (slaveName.includes('TDS')) return 'TDS Monitor';
    if (slaveName.includes('Water Level')) return 'Water Level Monitoring';
    
    // Default for any FLOW_METER type if no keyword matches
    if (slave.slave_type === 'FLOW_METER') return 'Generic Flow Meter';
    
    return null;
  };

  // Function to get current columns based on selected device and data
  const getCurrentColumns = () => {
    const selectedDevice = devices.find(d => d.slave_id === selectedSlaveId);
    if (!selectedDevice) return [];
    
    // 1. Try to get configured columns
    const configKey = getColumnConfigKey(selectedDevice);
    const configuredCols = deviceColumnsConfig[configKey];

    // 2. If we have logs, check if configured columns actually exist in the data
    if (logs.length > 0) {
      const logKeys = Object.keys(logs[0]);
      
      // If no config or config keys don't match data, generate dynamically
      if (!configuredCols || !configuredCols.some(col => col.key !== 'timestamp' && logKeys.includes(col.key))) {
        return logKeys.map(key => ({
          key,
          label: key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }));
      }
    }

    return configuredCols || [];
  };

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setInitialLoading(true);
        const data = await getFlowMeterSlaveList();
        setDevices(data);
        
        // --- CHANGE: Set the first device as default ---
        if (data && data.length > 0) {
          setSelectedSlaveId(data[0].slave_id);
        }
      } catch (err) {
        console.error(err);
        setSnackbarMessage('Failed to fetch device list');
        setSnackbarOpen(true);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // Use raw logs or normalize if needed. 
  // Based on the provided JSON, keeping keys as they are might be better for labels.
  const processLogs = (logsData) => {
    return logsData;
  };

  // Handle search button click
  const handleSearch = async () => {
    if (!selectedSlaveId) {
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
    fetchLogs(1);
  };

  const fetchLogs = async (currentPage) => {
    setLoading(true);
    setError(null);
    
    const offset = (currentPage - 1) * rowsPerPage;
    const start = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
    const end = filterEndDate.format('YYYY-MM-DD HH:mm:ss');

    try {
      const response = await getFlowMeterLogs(selectedSlaveId, start, end, rowsPerPage, offset);
      setLogs(response.logs || []);
      setTotalRecords(response.meta.total || 0);
    } catch (err) {
      setError('Failed to fetch logs');
      setSnackbarMessage('Failed to fetch logs');
      setSnackbarOpen(true);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    fetchLogs(value);
  };

  // Function to reset all filters
  const handleResetFilters = () => {
    // Reset to first device instead of empty string
    if (devices.length > 0) {
      setSelectedSlaveId(devices[0].slave_id);
    } else {
      setSelectedSlaveId('');
    }
    
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
    setPage(1);
    setSearchClicked(false);
    setLogs([]);
    setError(null);
    setTotalRecords(0);
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
  };

  // Helper to render cell content
  const renderCellContent = (log, colKey) => {
    if (colKey === 'timestamp') {
      return dayjs(log.timestamp).format('DD/MM/YYYY hh:mm:ss A');
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

  if (initialLoading) {
    return (
      <Box sx={styles.mainContent} id="main-content">
        <Card className="logs-card">
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
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  return (
    <Box sx={styles.mainContent} id="main-content">
      <Card className="logs-card">
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {loading && searchClicked && (
            <Typography variant="body2" align="center" gutterBottom sx={{ mb: 2 }}>
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
                  value={selectedSlaveId}
                  label="Select Device"
                  onChange={(e) => setSelectedSlaveId(e.target.value)}
                  disabled={devices.length === 0}
                >
                  {/* Removed the disabled placeholder MenuItem so the default value shows cleanly */}
                  {devices.map((device) => (
                    <MenuItem key={device.slave_id} value={device.slave_id}>
                      {device.slave_name}
                    </MenuItem>
                  ))}
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
                  disabled={loading}
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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={currentColumns.length} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : logs.length > 0 ? (
                      logs.map((log, index) => (
                        <TableRow key={index} hover className="log-table-row">
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
                          colSpan={currentColumns.length} 
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

          {/* Pagination */}
          {searchClicked && totalRecords > 0 && (
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

export default FlowMeterLogs; 