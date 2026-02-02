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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('');

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
      
      // If 'all' is selected, we'll need to fetch logs for each device
      if (filterDevice === 'all') {
        // For simplicity, we'll fetch from the first device if 'all' is selected
        // In a real implementation, you might want to fetch from all devices
        const firstSlaveName = devices.length > 1 ? devices[1] : null;
        if (firstSlaveName) {
          const logsData = await getTemperatureLogsWithNames(1, startDateTime, endDateTime);
          if (logsData.success && logsData.data && logsData.data.logs) {
            setLogs(logsData.data.logs);
          } else {
            setLogs([]);
          }
        }
      } else {
        // Find the slave_id for the selected device name
        const slaveName = filterDevice;
        // Since we don't have the mapping available here, we'll use a placeholder
        // In a real implementation, we would have the slave_id mapping
        // For now, we'll use a simple mapping based on known devices
        const slaveIdMap = {
          'Compliance Room': 7,
          'Executive Room': 8,
          'Production Area': 9,
          'IT Cabin': 10
        };
        const slaveId = slaveIdMap[slaveName] || 1; // Default to 1 if not found
        
        const logsData = await getTemperatureLogsWithNames(slaveId, startDateTime, endDateTime);
        if (logsData.success && logsData.data && logsData.data.logs) {
          setLogs(logsData.data.logs);
        } else {
          setLogs([]);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
      setLogs([]);
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

  // Get logs for current page
  const paginatedLogs = filteredLogs.slice(
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
    setSelectedColumn('');
    setLogs([]);
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

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
        <Card className="logs-card" sx={{marginTop: ''}}>
          <CardContent>
            <Typography variant="h6" align="center">Loading devices...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box style={styles.mainContent} id="main-content">
      <Card className="logs-card" sx={{marginTop: ''}}>
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
            <Box className="logs-filters">
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Machine</InputLabel>
                <Select
                  value={filterDevice}
                  label="Select Machine"
                  onChange={(e) => setFilterDevice(e.target.value)}
                  disabled={devices.length === 0}
                >
                  {devices.length > 0 ? (
                    devices.map((device) => (
                      <MenuItem key={device} value={device}>
                        {device === 'all' ? 'All Devices' : device}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      Loading devices...
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Parameter</InputLabel>
                <Select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  label="Select Machine Values"
                >
                  <MenuItem value="timestamp">timestamp</MenuItem>
                  <MenuItem value="temperature">Temperature (°C)</MenuItem>
                  <MenuItem value="humidity">Humidity (%)</MenuItem>
                  <MenuItem value="battery">Battery (V)</MenuItem>
                </Select>
              </FormControl>

               <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={dayjs.isDayjs(filterStartDate) ? filterStartDate : null}
                  onChange={(newValue) => setFilterStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        minWidth: 220,
                        mr: 2,
                        borderRadius: 2,
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={filterEndDate ? (dayjs.isDayjs(filterEndDate) ? filterEndDate : dayjs(filterEndDate)) : null}
                  onChange={(newValue) => setFilterEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        minWidth: 220,
                        mr: 2,
                        borderRadius: 2,
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{
                  backgroundColor: '#0156a6',
                  '&:hover': {
                    backgroundColor: '#166aa0',
                  },
                  mr: 1
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
                  }
                }}
              >
              </Button>
            </Box>
          </Box>

          {searchClicked && (
          <TableContainer
            component={Paper}
            className="logs-table-container"
            style={{ overflow: 'auto' }}
          >
            <Table stickyHeader style={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow className="log-table-header">
                  {selectedColumn ? (
                    // Single column view
                    <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>
                      {selectedColumn === 'timestamp' && 'timestamp'}
                      {selectedColumn === 'temperature' && 'Temperature (°C)'}
                      {selectedColumn === 'humidity' && 'Humidity (%)'}
                      {selectedColumn === 'battery' && 'Battery (V)'}
                    </TableCell>
                  ) : (
                    // All columns view
                    <>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>timestamp</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Temperature (°C)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Humidity (%)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Battery (V)</TableCell>
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
                    
                    return (
                      <TableRow key={log.id} hover className="log-table-row">
                        {selectedColumn ? (
                          // Single column view
                          <TableCell className="log-table-cell">
                            {selectedColumn === 'timestamp' && timestamp}
                            {selectedColumn === 'temperature' && temperature}
                            {selectedColumn === 'humidity' && humidity}
                            {selectedColumn === 'battery' && battery}
                          </TableCell>
                        ) : (
                          // All columns view
                          <>
                            <TableCell className="log-table-cell" title={timestamp}>
                              {timestamp}
                            </TableCell>
                            <TableCell className="log-table-cell">{temperature?.toFixed(2)}</TableCell>
                            <TableCell className="log-table-cell">{humidity?.toFixed(2)}</TableCell>
                            <TableCell className="log-table-cell">{battery?.toFixed(2)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={selectedColumn ? 1 : 4} align="center">
                      {paginatedLogs.length === 0 ? 'No logs found matching your filters' : ''}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          )}

          {/* Pagination */}
          {searchClicked && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, logs.length)} of {logs.length} entries
              </Typography>
              <Pagination
                count={Math.ceil(logs.length / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="small"
              />
            </Box>
          )}
          
        </CardContent>
      </Card>
    </Box>
  );
}

export default TemperatureLogs;