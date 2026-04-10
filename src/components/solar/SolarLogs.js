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
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Grid,
  Pagination,
  Checkbox,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
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

// Import API functions
import { getSolarSlaves, getSolarLogs } from '../../auth/solar/SolarLogsApi';

function SolarLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState(['all']);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceObjects, setDeviceObjects] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  // Define all available parameters for solar
  // Keys are kept as simple identifiers for UI logic (e.g., 'flowrate'), 
  // mapped to API fields in the render section.
  const allParameters = [
    { val: 'timestamp', label: 'Timestamp' },
    { val: 'flowrate', label: 'Flow Rate (m³/hr)' },
    { val: 'flow_temperature', label: 'Flow Temperature (°C)' },
    { val: 'pressure', label: 'Flow Pressure' },
    { val: 'inlet_temperature', label: 'Inlet Temperature (°C)' },
    { val: 'outlet_temperature', label: 'Outlet Temperature (°C)' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Function to fetch devices
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const slaves = await getSolarSlaves();
      setDeviceObjects(slaves);
      const deviceNames = slaves.map(device => device.slave_name);
      setDevices(['all', ...deviceNames]);
      
      // Set the first device as default if available
      if (slaves.length > 0) {
        setFilterDevice(slaves[0].slave_name);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err.message || 'Failed to fetch devices');
      setSnackbarMessage(err.message || 'Failed to fetch devices');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = async () => {
    if (!filterDevice || filterDevice === 'all') {
      setSnackbarMessage('Please select a device');
      setSnackbarOpen(true);
      return;
    }
    if (!filterStartDate) {
      setSnackbarMessage('Please select a start date');
      setSnackbarOpen(true);
      return;
    }
    if (!filterEndDate) {
      setSnackbarMessage('Please select an end date');
      setSnackbarOpen(true);
      return;
    }

    setSearchClicked(true);
    setPage(1);
    setLoading(true);

    try {
      // Find the device ID for the selected device name
      const selectedDevice = deviceObjects.find(device => device.slave_name === filterDevice);
      if (!selectedDevice) {
        throw new Error('Device not found');
      }

      // Format dates for API
      const startDatetime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
      const endDatetime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');
      
      // Fetch logs from API
      const logsData = await getSolarLogs(
        selectedDevice.slave_id,
        startDatetime,
        endDatetime,
        rowsPerPage,
        0 // First page
      );
      
      // Add device name to each log
      const enrichedLogs = logsData.data.logs.map(log => ({
        ...log,
        slave_name: filterDevice,
        id: `${selectedDevice.slave_id}-${log.timestamp}`
      }));
      
      setLogs(enrichedLogs);
      setTotalLogs(logsData.meta.total || logsData.data.logs.length);
      setHasMore(logsData.meta.has_more || false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
      setSnackbarMessage(err.message || 'Failed to fetch logs');
      setSnackbarOpen(true);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = async (event, value) => {
    setPage(value);
    setLoading(true);

    try {
      // Find the device ID for the selected device name
      const selectedDevice = deviceObjects.find(device => device.slave_name === filterDevice);
      if (!selectedDevice) {
        throw new Error('Device not found');
      }

      // Format dates for API
      const startDatetime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
      const endDatetime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');
      
      // Calculate offset for pagination
      const offset = (value - 1) * rowsPerPage;
      
      // Fetch logs from API
      const logsData = await getSolarLogs(
        selectedDevice.slave_id,
        startDatetime,
        endDatetime,
        rowsPerPage,
        offset
      );
      
      // Add device name to each log
      const enrichedLogs = logsData.data.logs.map(log => ({
        ...log,
        slave_name: filterDevice,
        id: `${selectedDevice.slave_id}-${log.timestamp}`
      }));
      
      setLogs(enrichedLogs);
    } catch (err) {
      console.error('Error fetching page logs:', err);
      setError(err.message || 'Failed to fetch logs');
      setSnackbarMessage(err.message || 'Failed to fetch logs');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term only (date and device filters are handled by the search function)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;

    return (
      log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.slave_name && log.slave_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Mapped to API: instant_flow
      (log.instant_flow !== undefined && log.instant_flow.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Mapped to API: flow_temperature
      (log.flow_temperature !== undefined && log.flow_temperature.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Mapped to API: pressure
      (log.pressure !== undefined && log.pressure.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.inlet_temperature !== undefined && log.inlet_temperature.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.outlet_temperature !== undefined && log.outlet_temperature.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Get logs for current page
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    if (deviceObjects.length > 0) {
      setFilterDevice(deviceObjects[0].slave_name); // Reset to first device
    }
    setFilterDate('');
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
    setPage(1);
    setSearchClicked(false);
    setSelectedColumn([]);
    setLogs([]);
    setTotalLogs(0);
    setHasMore(false);
    setError(null);
  };

  // Handle parameter selection
  const handleParameterChange = (event) => {
    const value = event.target.value;
    
    // Check if "All Parameters" was selected
    if (value.includes('all_parameters')) {
      if (selectedColumn.length === allParameterValues.length) {
        // If all are already selected, deselect all
        setSelectedColumn([]);
      } else {
        // Select all parameters
        setSelectedColumn([...allParameterValues]);
      }
    } else {
      // Normal selection behavior
      setSelectedColumn(typeof value === 'string' ? value.split(',') : value);
    }
  };

  // Check if all parameters are selected
  const isAllParametersSelected = selectedColumn.length === allParameterValues.length;

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
    },
  }

  // Show loading indicator
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

  return (
    <Box sx={styles.mainContent} id="main-content">
      <Card className="logs-card" sx={{ marginTop: '' }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
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
              {/* Machine Select */}
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 300 }, 
                  mr: { sm: 2 },
                  order: { xs: 1, sm: 1 }
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
                        {device === 'all' ? '' : device}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      Loading devices...
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Parameters Select */}
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 300 }, 
                  mr: { sm: 2 },
                  order: { xs: 2, sm: 2 }
                }}
              >
                <InputLabel id="param-select-label">Select Parameter</InputLabel>
                <Select
                  labelId="param-select-label"
                  multiple
                  value={selectedColumn}
                  onChange={handleParameterChange}
                  label="Select Parameter"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                      {/* Show "All Parameters" if all are selected */}
                      {isAllParametersSelected ? (
                        <Chip
                          label="All Parameters"
                          size="small"
                          sx={{ height: '20px', fontSize: '10px' }}
                        />
                      ) : (
                        /* Show the first 2 items as Chips */
                        selected.slice(0, 2).map((value) => (
                          <Chip
                            key={value}
                            label={allParameters.find(p => p.val === value)?.label || value.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '10px',
                              textTransform: 'capitalize'
                            }}
                          />
                        ))
                      )}

                      {/* If more than 2 items and not all selected, show the +X counter */}
                      {!isAllParametersSelected && selected.length > 2 && (
                        <Chip
                          label={`+${selected.length - 2} more`}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            backgroundColor: '#d32f2f',
                            color: '#fff',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300, width: 250 },
                    },
                  }}
                >
                  {/* "All Parameters" option */}
                  <MenuItem 
                    value="all_parameters" 
                    sx={{
                      py: 0.5,
                      px: 1,
                      fontWeight: isAllParametersSelected ? 'bold' : 'normal',
                      backgroundColor: isAllParametersSelected ? 'rgba(211, 47, 47, 0.08)' : 'transparent',
                    }}
                  >
                    <Checkbox 
                      checked={isAllParametersSelected} 
                      indeterminate={selectedColumn.length > 0 && !isAllParametersSelected}
                      sx={{
                        p: 0.5,
                        mr: 0.5,
                        transform: "scale(0.8)",
                        '& .MuiSvgIcon-root': { fontSize: 20 }
                      }} 
                    />
                    <ListItemText primary="All Parameters" primaryTypographyProps={{
                      fontSize: '12px',
                      lineHeight: 1.2,
                      fontWeight: isAllParametersSelected ? 'bold' : 'normal'
                    }} />
                  </MenuItem>
                  
                  {/* Individual parameter options */}
                  {allParameters.map((item) => (
                    <MenuItem
                      key={item.val}
                      value={item.val}
                      sx={{ py: 0, minHeight: '32px', px: 1 }}
                    >
                      <Checkbox
                        checked={selectedColumn.indexOf(item.val) > -1}
                        sx={{
                          p: 0.5,
                          mr: 0.5,
                          transform: "scale(0.8)",
                          '& .MuiSvgIcon-root': { fontSize: 20 }
                        }}
                      />
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '12px' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Pickers Row */}
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 2 },
                  order: { xs: 3, sm: 3 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    open={openStart}
                    onOpen={() => setOpenStart(true)}
                    onClose={() => setOpenStart(false)}
                    value={dayjs.isDayjs(filterStartDate) ? filterStartDate : null}
                    onChange={(newValue) => setFilterStartDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { 
                          minWidth: { xs: '100%', sm: 220 }, 
                          mr: { sm: 2 }, 
                          borderRadius: 2 
                        },
                        onClick: () => setOpenStart(true),
                      },
                    }}
                    format="DD/MM/YYYY hh:mm A"
                  />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    open={openEnd}
                    onOpen={() => setOpenEnd(true)}
                    onClose={() => setOpenEnd(false)}
                    value={
                      filterEndDate
                        ? dayjs.isDayjs(filterEndDate)
                          ? filterEndDate
                          : dayjs(filterEndDate)
                        : null
                    }
                    onChange={(newValue) => setFilterEndDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { 
                          minWidth: { xs: '100%', sm: 220 }, 
                          mr: { sm: 2 }, 
                          borderRadius: 2 
                        },
                        onClick: () => setOpenEnd(true),
                      },
                    }}
                    format="DD/MM/YYYY hh:mm A"
                  />
                </LocalizationProvider>
              </Box>

              {/* Buttons Row */}
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
                    '&:hover': {
                      backgroundColor: '#1E4A7C',
                    },
                    minWidth: 'auto',
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '6px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': {
                      margin: { sm: 0 },
                    }
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
                    '&:hover': {
                      borderColor: '#5a6268',
                      color: '#5a6268',
                    },
                    minWidth: 'auto',
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '4px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': {
                      margin: { sm: 0 },
                    }
                  }}
                >
                </Button>
              </Box>
            </Box>
          </Box>

          {searchClicked && (
            <>
              {loading ? (
                <Box style={styles.loadingContainer}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <TableContainer
                    component={Paper}
                    className="logs-table-container"
                    sx={{ 
                      overflow: 'auto',
                      maxWidth: '100%',
                    }}
                  >
                    <Table stickyHeader sx={{ tableLayout: 'auto', width: '100%' }}>
                      <TableHead>
                        <TableRow className="log-table-header">
                          {selectedColumn.length > 0 ? (
                            selectedColumn.map((col) => (
                              <TableCell 
                                key={col} 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                {allParameters.find(p => p.val === col)?.label || col.replace(/_/g, ' ')}
                              </TableCell>
                            ))
                          ) : (
                            <>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Timestamp
                              </TableCell>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Flow Rate (m³/hr)
                              </TableCell>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Flow Temp (°C)
                              </TableCell>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Flow Pressure
                              </TableCell>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Inlet Temp (°C)
                              </TableCell>
                              <TableCell 
                                className="log-header-cell" 
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '11px', sm: '14px' },
                                  padding: { xs: '8px 4px', sm: '16px' }
                                }}
                              >
                                Outlet Temp (°C)
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedLogs.length > 0 ? (
                          paginatedLogs.map((log) => {
                            const timestamp = new Date(log.timestamp).toLocaleString();
                            // MAPPING LOGIC: Map API keys to local variables
                            const flowrate = log.instant_flow; // API: instant_flow
                            const flowTemp = log.flow_temperature; // API: flow_temperature
                            const pressure = log.pressure;       // API: pressure
                            const inletTemp = log.inlet_temperature;
                            const outletTemp = log.outlet_temperature;

                            return (
                              <TableRow key={log.id} hover className="log-table-row">
                                {selectedColumn.length > 0 ? (
                                  // DYNAMIC MULTI-COLUMN VIEW
                                  selectedColumn.map((col) => (
                                    <TableCell 
                                      key={col} 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {col === 'timestamp' && timestamp}
                                      {col === 'flowrate' && (typeof flowrate === 'number' ? flowrate.toFixed(2) : flowrate)}
                                      {col === 'flow_temperature' && (typeof flowTemp === 'number' ? flowTemp.toFixed(2) : flowTemp)}
                                      {col === 'pressure' && (typeof pressure === 'number' ? pressure.toFixed(2) : pressure)}
                                      {col === 'inlet_temperature' && (typeof inletTemp === 'number' ? inletTemp.toFixed(2) : inletTemp)}
                                      {col === 'outlet_temperature' && (typeof outletTemp === 'number' ? outletTemp.toFixed(2) : outletTemp)}
                                    </TableCell>
                                  ))
                                ) : (
                                  // DEFAULT "ALL COLUMNS" VIEW
                                  <>
                                    <TableCell 
                                      className="log-table-cell" 
                                      title={timestamp}
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {timestamp}
                                    </TableCell>
                                    <TableCell 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {typeof flowrate === 'number' ? flowrate.toFixed(2) : flowrate}
                                    </TableCell>
                                    <TableCell 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {typeof flowTemp === 'number' ? flowTemp.toFixed(2) : flowTemp}
                                    </TableCell>
                                    <TableCell 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {typeof pressure === 'number' ? pressure.toFixed(2) : pressure}
                                    </TableCell>
                                    <TableCell 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {typeof inletTemp === 'number' ? inletTemp.toFixed(2) : inletTemp}
                                    </TableCell>
                                    <TableCell 
                                      className="log-table-cell"
                                      sx={{
                                        fontSize: { xs: '11px', sm: '14px' },
                                        padding: { xs: '8px 4px', sm: '16px' }
                                      }}
                                    >
                                      {typeof outletTemp === 'number' ? outletTemp.toFixed(2) : outletTemp}
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell 
                              colSpan={selectedColumn.length > 0 ? selectedColumn.length : 6} 
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
              {!loading && (
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
                    Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, logs.length)} of {totalLogs} entries
                  </Typography>
                  <Pagination
                    count={Math.ceil(totalLogs / rowsPerPage)}
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
            </>
          )}

        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

export default SolarLogs;