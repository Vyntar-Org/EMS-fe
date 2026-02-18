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
import { getFireSafetyLogSlaves, getFireSafetyLogs } from '../../auth/fire-safety/FireSafetyLogsApi';

function FireSafetyLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState(['all']);
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
    { val: 'water', label: 'Water' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Initialize devices on component mount (fetch from API)
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        setError(null);

        const slaves = await getFireSafetyLogSlaves();
        const names = slaves.map((s) => s.slave_name);
        setDevices(['all', ...names]);

        if (slaves.length > 0) {
          setFilterDevice(slaves[0].slave_name);
        }
      } catch (err) {
        console.error('Error loading fire-safety log slaves:', err);
        setError(err.message || 'Failed to load fire-safety devices');
        setDevices(['all']);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
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

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, support single selected device (not "all")
        if (filterDevice === 'all') {
          setLogs([]);
          setError('Please select a specific machine (not "all") to fetch logs.');
          return;
        }

        // Find slave_id for selected name via latest devices list
        // devices state holds names; we need to re-fetch slaves to map name->id
        const slaves = await getFireSafetyLogSlaves();
        const selectedSlave = slaves.find((s) => s.slave_name === filterDevice);

        if (!selectedSlave) {
          setLogs([]);
          setError('Selected machine not found in slave list.');
          return;
        }

        // Backend expects "YYYY-MM-DD HH:mm:ss" strings
        const startStr = dayjs(filterStartDate).format('YYYY-MM-DD HH:mm:ss');
        const endStr = dayjs(filterEndDate).format('YYYY-MM-DD HH:mm:ss');

        const { logs: apiLogs, meta } = await getFireSafetyLogs({
          slaveId: selectedSlave.slave_id,
          startDatetime: startStr,
          endDatetime: endStr,
          limit: rowsPerPage,
          offset: (page - 1) * rowsPerPage,
        });

        // Map logs into the shape used by table
        const mapped = (apiLogs || []).map((log, index) => ({
          id: `${selectedSlave.slave_id}-${index}-${log.timestamp}`,
          slave_id: selectedSlave.slave_id,
          slave_name: selectedSlave.slave_name,
          timestamp: log.timestamp,
          temperature: log.temperature,
          water: log.water_level,
        }));

        // API already returns sorted newest->oldest; keep order as-is
        setRealLogs(mapped);
        setLogs(mapped);
        setPaginationMeta(meta || {});
      } catch (err) {
        console.error('Error fetching fire-safety logs:', err);
        setError(err.message || 'Failed to load logs');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
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

    if (searchClicked && filterDevice !== 'all') {
      try {
        setLoading(true);
        setError(null);

        // Re-fetch slaves to map name -> id
        const slaves = await getFireSafetyLogSlaves();
        const selectedSlave = slaves.find((s) => s.slave_name === filterDevice);

        if (!selectedSlave) {
          setLogs([]);
          setRealLogs([]);
          setError('Selected machine not found in slave list.');
          return;
        }

        const startStr = dayjs(filterStartDate).format('YYYY-MM-DD HH:mm:ss');
        const endStr = dayjs(filterEndDate).format('YYYY-MM-DD HH:mm:ss');

        const limit = rowsPerPage;
        const offset = (value - 1) * rowsPerPage;

        const { logs: apiLogs, meta } = await getFireSafetyLogs({
          slaveId: selectedSlave.slave_id,
          startDatetime: startStr,
          endDatetime: endStr,
          limit,
          offset,
        });

        const mapped = (apiLogs || []).map((log, index) => ({
          id: `${selectedSlave.slave_id}-${index}-${log.timestamp}`,
          slave_id: selectedSlave.slave_id,
          slave_name: selectedSlave.slave_name,
          timestamp: log.timestamp,
          temperature: log.temperature,
          water: log.water_level,
        }));

        setRealLogs(mapped);
        setLogs(mapped);
        setPaginationMeta(meta || {});
      } catch (err) {
        console.error('Error fetching fire-safety logs (page change):', err);
        setError(err.message || 'Failed to load logs');
        setLogs([]);
        setRealLogs([]);
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

          {/* Pagination (server-side, like Logs.js) */}
          {shouldShowPagination && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
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
              />
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}

export default FireSafetyLogs;