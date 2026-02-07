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

// Mock device data
const mockDevices = [
  { slave_id: 1, slave_name: 'Slave 1' },
  { slave_id: 2, slave_name: 'Slave 2' },
  { slave_id: 3, slave_name: 'Slave 3' },
  { slave_id: 4, slave_name: 'Slave 4' },
  { slave_id: 5, slave_name: 'Slave 5' },
  { slave_id: 6, slave_name: 'Slave 6' }
];

// Function to generate mock logs data
const generateMockLogs = (slaveId, startDate, endDate) => {
  const logs = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const minutesDiff = end.diff(start, 'minute');
  
  // Generate a log entry every 5 minutes
  for (let i = 0; i <= minutesDiff; i += 5) {
    const timestamp = start.add(i, 'minute').toISOString();
    
    // Generate random values for temperature and water
    const temperature = 18 + Math.random() * 10 + (slaveId * 0.5);
    const water = 40 + Math.random() * 30 + (slaveId * 2);
    
    logs.push({
      id: `${slaveId}-${i}`,
      slave_id: slaveId,
      slave_name: `Slave ${slaveId}`,
      timestamp: timestamp,
      temperature: parseFloat(temperature.toFixed(2)),
      water: parseFloat(water.toFixed(2))
    });
  }
  
  return logs;
};

function FireSafetyLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState(['all']);
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
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  // Define all available parameters
  const allParameters = [
    { val: 'timestamp', label: 'Timestamp' },
    { val: 'temperature', label: 'Temperature' },
    { val: 'water', label: 'Water' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Initialize devices on component mount
  useEffect(() => {
    const deviceNames = mockDevices.map(device => device.slave_name);
    setDevices(['all', ...deviceNames]);
    
    // Set the first device as default if available
    if (mockDevices.length > 0) {
      setFilterDevice(mockDevices[0].slave_name);
    }
  }, []);

  // Handle search button click
  const handleSearch = () => {
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
    setLoading(true);

    try {
      // If 'all' is selected, we'll generate logs for all devices
      if (filterDevice === 'all') {
        let allLogs = [];
        mockDevices.forEach(device => {
          const deviceLogs = generateMockLogs(
            device.slave_id,
            filterStartDate,
            filterEndDate
          );
          allLogs = [...allLogs, ...deviceLogs];
        });
        
        // Sort logs by timestamp
        allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setLogs(allLogs);
      } else {
        // Find the device ID for the selected device name
        const selectedDevice = mockDevices.find(device => device.slave_name === filterDevice);
        if (selectedDevice) {
          const deviceLogs = generateMockLogs(
            selectedDevice.slave_id,
            filterStartDate,
            filterEndDate
          );
          setLogs(deviceLogs);
        }
      }
    } catch (err) {
      console.error('Error generating logs:', err);
      setError(err.message || 'Failed to generate logs');
      setLogs([]);
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
      (log.temperature !== undefined && log.temperature.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.water !== undefined && log.water.toString().toLowerCase().includes(searchTerm.toLowerCase()))
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
    setSelectedColumn([]);
    setLogs([]);
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
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
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
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
                      sx: { minWidth: 220, mr: 2, borderRadius: 2 },
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
                      sx: { minWidth: 220, mr: 2, borderRadius: 2 },
                      onClick: () => setOpenEnd(true), // 🔥 input click opens picker
                    },
                  }}
                  format="DD/MM/YYYY hh:mm A"
                />
              </LocalizationProvider>


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
                  width: '32px', // Smaller width
                  height: '32px', // Smaller height
                  padding: '6px', // Even smaller padding
                  borderRadius: '4px', // Square with rounded corners
                  '& .MuiButton-startIcon': {
                    margin: 0,
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
                  width: '32px', // Smaller width
                  height: '32px', // Smaller height
                  padding: '4px', // Even smaller padding
                  borderRadius: '4px',
                  '& .MuiButton-startIcon': {
                    margin: 0,
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
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Water (%)</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const timestamp = new Date(log.timestamp).toLocaleString();
                      const temperature = log.temperature;
                      const water = log.water;
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
                                {col === 'water' && (typeof water === 'number' ? water.toFixed(2) : water)}
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
                                {typeof water === 'number' ? water.toFixed(2) : water}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={selectedColumn ? selectedColumn.length : 3} align="center">
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

export default FireSafetyLogs;