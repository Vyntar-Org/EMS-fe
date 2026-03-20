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
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import '../../components/Logs.css';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { getTemperatureLogsWithNames, getTemperatureSlaves } from '../../auth/temperature/TemperatureLogsApi';

function TemperatureLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [realLogs, setRealLogs] = useState([]); // current page logs from API
  const [paginationMeta, setPaginationMeta] = useState({}); // pagination info from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Define all available parameters
  const allParameters = [
    { val: 'timestamp', label: 'Timestamp' },
    { val: 'temperature', label: 'Temperature' },
    { val: 'humidity', label: 'Humidity' },
    { val: 'battery', label: 'Battery' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Load devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const slavesData = await getTemperatureSlaves();

        if (slavesData.success && slavesData.data && slavesData.data.slaves) {
          // Transform slave data to device list
          const deviceList = ['all', ...slavesData.data.slaves.map(slave => slave.slave_name)];
          setDevices(deviceList);

          // Set the first device as default if available
          if (slavesData.data.slaves.length > 0) {
            setFilterDevice(slavesData.data.slaves[0].slave_name);
          }
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(err.message || 'Failed to fetch devices');
        // Set a default list if API fails
        setDevices(['all', 'Compliance Room', 'Executive Room', 'Production Area', 'IT Cabin']);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Handle search button click
  const handleSearch = async () => {
    if (!filterDevice) {
      alert('Please select a device');
      return;
    }
    if (!filterStartDate) {
      alert('Please select a start date');
      return;
    }
    if (!filterEndDate) {
      alert('Please select an end date');
      return;
    }

    setSearchClicked(true);
    setPage(1);

    try {
      setLoading(true);

      // Convert dayjs objects to proper datetime strings
      const startDateTime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
      const endDateTime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');

      // For server-side pagination, always fetch a single device page at a time
      if (filterDevice === 'all') {
        setLogs([]);
        setRealLogs([]);
        setPaginationMeta({});
        setError('Please select a specific device (not "all") to fetch logs.');
        return;
      }

      // Map selected device name -> slave_id from latest slaves list
      const slavesData = await getTemperatureSlaves();
      let slaveId = null;
      if (slavesData.success && slavesData.data && Array.isArray(slavesData.data.slaves)) {
        const selectedSlave = slavesData.data.slaves.find(
          (s) => s.slave_name === filterDevice
        );
        if (selectedSlave) {
          slaveId = selectedSlave.slave_id;
        }
      }

      if (!slaveId) {
        setLogs([]);
        setRealLogs([]);
        setPaginationMeta({});
        setError('Selected device not found in slave list.');
        return;
      }

      const limit = rowsPerPage;
      const offset = 0; // first page

      const logsData = await getTemperatureLogsWithNames(
        slaveId,
        startDateTime,
        endDateTime,
        limit,
        offset
      );

      let pageLogs = [];
      let meta = {};

      if (logsData.success && logsData.data && Array.isArray(logsData.data.logs)) {
        pageLogs = logsData.data.logs;
        meta = logsData.meta || {};
      }

      setRealLogs(pageLogs);
      setLogs(pageLogs);
      setPaginationMeta(meta);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
      setLogs([]);
      setRealLogs([]);
      setPaginationMeta({});
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term only (date and device filters are handled by API)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;

    return (
      log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.slave_name && log.slave_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.temperature !== undefined && log.temperature.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.humidity !== undefined && log.humidity.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.battery !== undefined && log.battery.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate pagination based on API metadata (similar to Logs.js)
  const count = paginationMeta.count || filteredLogs.length;
  const totalRecords = paginationMeta.total || filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  const shouldShowPagination = searchClicked && totalRecords > 0 && totalRecords > rowsPerPage;

  // Get logs for current page
  // When using API pagination, realLogs already contains the correct page
  const paginatedLogs = searchClicked
    ? realLogs
    : filteredLogs.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
      );

  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    if (devices.length > 1) {
      setFilterDevice(devices[1]); // Reset to first device (excluding 'all')
    }
    setFilterDate('');
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
    setPage(1);
    setSearchClicked(false);
    setSelectedColumn([]);
    setLogs([]);
  };

  // Handle page change (fetch new page from API, like Logs.js)
  const handlePageChange = async (event, value) => {
    setPage(value);

    if (searchClicked && filterDevice && filterDevice !== 'all') {
      try {
        setLoading(true);
        setError(null);

        const startDateTime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
        const endDateTime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');

        const slavesData = await getTemperatureSlaves();
        let slaveId = null;
        if (slavesData.success && slavesData.data && Array.isArray(slavesData.data.slaves)) {
          const selectedSlave = slavesData.data.slaves.find(
            (s) => s.slave_name === filterDevice
          );
          if (selectedSlave) {
            slaveId = selectedSlave.slave_id;
          }
        }

        if (!slaveId) {
          setLogs([]);
          setRealLogs([]);
          setPaginationMeta({});
          setError('Selected device not found in slave list.');
          return;
        }

        const limit = rowsPerPage;
        const offset = (value - 1) * rowsPerPage;

        const logsData = await getTemperatureLogsWithNames(
          slaveId,
          startDateTime,
          endDateTime,
          limit,
          offset
        );

        let pageLogs = [];
        let meta = {};

        if (logsData.success && logsData.data && Array.isArray(logsData.data.logs)) {
          pageLogs = logsData.data.logs;
          meta = logsData.meta || {};
        }

        setRealLogs(pageLogs);
        setLogs(pageLogs);
        setPaginationMeta(meta);
      } catch (err) {
        console.error('Error fetching logs (page change):', err);
        setError(err.message || 'Failed to fetch logs');
        setLogs([]);
        setRealLogs([]);
        setPaginationMeta({});
      } finally {
        setLoading(false);
      }
    }
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
      width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)',
      maxWidth: sidebarVisible ? '1600px' : '1800px',
      minHeight: '89vh',
      fontFamily: 'Inter, Roboto, system-ui, sans-serif',
      fontSize: '14px',
      margin: '0',
      transition: 'all 0.3s ease',
    },
  }

  // Show loading indicator
  if (loading && !searchClicked) {
    return (
      <Box style={styles.mainContent} id="main-content">
        <Card className="logs-card" sx={{ marginTop: '' }}>
          <CardContent>
            <Typography variant="h6" align="center">Loading devices...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box style={styles.mainContent} id="main-content">
      <Card className="logs-card" sx={{ marginTop: '' }}>
        <CardContent>
          {loading && searchClicked && (
            <Typography variant="body2" align="center" gutterBottom>
              Loading logs...
            </Typography>
          )}
          {error && (
            <Typography color="error" align="center" gutterBottom>
              Error: {error}
            </Typography>
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
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 300 },
                  mr: { xs: 0, sm: 2 }
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
              
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 300 },
                  mr: { xs: 0, sm: 2 }
                }}
              >
                <InputLabel id="param-select-label">Select Parameter</InputLabel>
                <Select
                  labelId="param-select-label"
                  multiple
                  value={selectedColumn} // Ensure this state is an array: []
                  onChange={handleParameterChange}
                  label="Select Parameter"
                  // RENDER LOGIC: Keeps input box height fixed
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
                            backgroundColor: '#0156a6',
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
                      backgroundColor: isAllParametersSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
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
                          transform: "scale(0.8)", // Shrunk checkbox
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

              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 2 },
                alignItems: { xs: 'stretch', sm: 'center' },
                width: { xs: '100%', sm: 'auto' },
              }}>
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
                          mr: { xs: 0, sm: 2 }, 
                          borderRadius: 2 
                        },
                        onClick: () => setOpenStart(true), // 🔥 input click opens picker
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
                          mr: { xs: 0, sm: 2 }, 
                          borderRadius: 2 
                        },
                        onClick: () => setOpenEnd(true), // 🔥 input click opens picker
                      },
                    }}
                    format="DD/MM/YYYY hh:mm A"
                  />
                </LocalizationProvider>
              </Box>

              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'row' },
                gap: 1,
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'flex-start' },
                width: { xs: '100%', sm: 'auto' },
              }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{
                    backgroundColor: '#0156a6',
                    '&:hover': {
                      backgroundColor: '#166aa0',
                    },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '6px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': {
                      margin: { xs: '0 8px 0 0', sm: 0 },
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
                    minWidth: { xs: 'auto', sm: 'auto' },
                    width: { xs: 'auto', sm: '32px' },
                    height: '32px',
                    padding: { xs: '6px 16px', sm: '4px' },
                    borderRadius: '4px',
                    '& .MuiButton-startIcon': {
                      margin: { xs: '0 8px 0 0', sm: 0 },
                    }
                  }}
                >
                </Button>
              </Box>
            </Box>
          </Box>

          {searchClicked && (
            <TableContainer
              component={Paper}
              className="logs-table-container"
              sx={{ 
                overflow: 'auto',
                maxWidth: '100%',
              }}
            >
              <Table stickyHeader style={{ tableLayout: 'auto', width: '100%' }}>
                <TableHead>
                  <TableRow className="log-table-header">
                    {selectedColumn.length > 0 ? (
                      selectedColumn.map((col) => (
                        <TableCell key={col} className="log-header-cell" sx={{ textTransform: 'capitalize' }}>
                          {allParameters.find(p => p.val === col)?.label || col.replace(/_/g, ' ')}
                        </TableCell>
                      ))
                    ) : (
                      <>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Timestamp</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Temperature (°C)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Humidity (%)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Battery (V)</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const timestamp = new Date(log.timestamp).toLocaleString();
                      const temperature = log.temperature;
                      const humidity = log.humidity;
                      const battery = log.battery;
                      console.log(log);

                      return (
                        <TableRow key={log.id} hover className="log-table-row">
                          {selectedColumn.length > 0 ? (
                            // DYNAMIC MULTI-COLUMN VIEW
                            // This loops through whatever you checked in the dropdown
                            selectedColumn.map((col) => (
                              <TableCell key={col} className="log-table-cell">
                                {col === 'timestamp' && timestamp}
                                {col === 'temperature' && (typeof temperature === 'number' ? temperature.toFixed(2) : temperature)}
                                {col === 'humidity' && (typeof humidity === 'number' ? humidity.toFixed(2) : humidity)}
                                {col === 'battery' && (typeof battery === 'number' ? battery.toFixed(2) : battery)}
                              </TableCell>
                            ))
                          ) : (
                            // DEFAULT "ALL COLUMNS" VIEW (When nothing is selected)
                            <>
                              <TableCell className="log-table-cell" title={timestamp}>
                                {timestamp}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {typeof temperature === 'number' ? temperature.toFixed(2) : temperature}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {typeof humidity === 'number' ? humidity.toFixed(2) : humidity}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {typeof battery === 'number' ? battery.toFixed(2) : battery}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={selectedColumn ? selectedColumn.length : 4} align="center">
                        {paginatedLogs.length === 0 ? 'No logs found matching your filters' : ''}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination (server-side, similar to Logs.js) */}
          {shouldShowPagination && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'center', sm: 'center' }, 
              mt: 2,
              gap: { xs: 1, sm: 0 },
            }}>
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ fontSize: { xs: '12px', sm: '14px' } }}
              >
                Showing {(paginationMeta.offset || 0) + 1} to {Math.min(
                  (paginationMeta.offset || 0) + (paginationMeta.limit || rowsPerPage),
                  paginationMeta.total || realLogs.length
                )} of {paginationMeta.total || realLogs.length} entries
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="small"
                siblingCount={1}
                boundaryCount={1}
                sx={{
                  '& .MuiPagination-ul': {
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    justifyContent: { xs: 'center', sm: 'flex-end' },
                  }
                }}
              />
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}

export default TemperatureLogs;