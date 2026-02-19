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
  Snackbar
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
import { getWaterSlaves, getWaterLogs } from '../../auth/water/WaterLogsApi';

function WaterLogs({ onSidebarToggle, sidebarVisible }) {
  // State variables
  const [devices, setDevices] = useState(['all']);
  const [logs, setLogs] = useState([]);
  const [realLogs, setRealLogs] = useState([]); // current page logs from API
  const [paginationMeta, setPaginationMeta] = useState({}); // pagination info from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  // Define all available parameters
  const allParameters = [
    { val: 'timestamp', label: 'Timestamp' },
    { val: 'metric_name', label: 'Metric Name' },
    { val: 'flowrate', label: 'Flow Rate (L/min)' },
    { val: 'totalizer', label: 'Totalizer (L)' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Load devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const slavesData = await getWaterSlaves();

        if (Array.isArray(slavesData)) {
          // Transform slave data to device list
          const deviceList = ['all', ...slavesData.map(slave => slave.slave_name)];
          setDevices(deviceList);

          // Set the first device as default if available
          if (slavesData.length > 0) {
            setFilterDevice(slavesData[0].slave_name);
          }
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(err.message || 'Failed to fetch devices');
        setSnackbarMessage(err.message || 'Failed to fetch devices');
        setSnackbarOpen(true);
        // Set a default list if API fails
        setDevices(['all', 'Water Slave 1', 'Water Slave 2', 'Water Slave 3']);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

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

    try {
      setLoading(true);
      setError(null);

      // Convert dayjs objects to proper datetime strings
      const startDateTime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
      const endDateTime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');

      // Map selected device name -> slave_id from latest slaves list
      const slavesData = await getWaterSlaves();
      let slaveId = null;
      if (Array.isArray(slavesData)) {
        const selectedSlave = slavesData.find(
          (s) => s.slave_name === filterDevice
        );
        if (selectedSlave) {
          slaveId = selectedSlave.slave_id;
        }
      }

      if (!slaveId) {
        setError('Selected device not found in slave list.');
        setSnackbarMessage('Selected device not found in slave list.');
        setSnackbarOpen(true);
        return;
      }

      const limit = rowsPerPage;
      const offset = 0; // first page

      const logsData = await getWaterLogs(
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
      setSnackbarMessage(err.message || 'Failed to fetch logs');
      setSnackbarOpen(true);
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
      (log.metric_name && log.metric_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.flowrate !== undefined && log.flowrate.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.totalizer !== undefined && log.totalizer.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate pagination based on API metadata
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
    setRealLogs([]);
    setPaginationMeta({});
  };

  // Handle page change (fetch new page from API)
  const handlePageChange = async (event, value) => {
    setPage(value);

    if (searchClicked && filterDevice && filterDevice !== 'all') {
      try {
        setLoading(true);
        setError(null);

        const startDateTime = filterStartDate.format('YYYY-MM-DD HH:mm:ss');
        const endDateTime = filterEndDate.format('YYYY-MM-DD HH:mm:ss');

        const slavesData = await getWaterSlaves();
        let slaveId = null;
        if (Array.isArray(slavesData)) {
          const selectedSlave = slavesData.find(
            (s) => s.slave_name === filterDevice
          );
          if (selectedSlave) {
            slaveId = selectedSlave.slave_id;
          }
        }

        if (!slaveId) {
          setError('Selected device not found in slave list.');
          setSnackbarMessage('Selected device not found in slave list.');
          setSnackbarOpen(true);
          return;
        }

        const limit = rowsPerPage;
        const offset = (value - 1) * rowsPerPage;

        const logsData = await getWaterLogs(
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
        setSnackbarMessage(err.message || 'Failed to fetch logs');
        setSnackbarOpen(true);
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
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
    }
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
            <Alert severity="error" sx={{ mb: 2 }}>
              Error: {error}
            </Alert>
          )}
          <Box className="logs-header">
            <Box className="logs-filters">
              <FormControl size="small" sx={{ minWidth: 300 }}>
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
                        {device === 'all' ? 'Select Machine' : device}
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
                <InputLabel>Select Parameters</InputLabel>
                <Select
                  multiple
                  value={selectedColumn}
                  onChange={handleParameterChange}
                  label="Select Parameters"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '24px' }}>
                      {isAllParametersSelected ? (
                        <Chip
                          label="All Parameters"
                          size="small"
                          sx={{ height: '20px', fontSize: '10px' }}
                        />
                      ) : (
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
                      sx: { minWidth: 220, mr: 2, borderRadius: 2 },
                      onClick: () => setOpenEnd(true),
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
                  width: '32px',
                  height: '32px',
                  padding: '6px',
                  borderRadius: '4px',
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
                  width: '32px',
                  height: '32px',
                  padding: '4px',
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
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Metric Name</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Flow Rate (L/min)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Totalizer (L)</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => {
                      const timestamp = new Date(log.timestamp).toLocaleString();
                      const metricName = log.metric_name;
                      const flowRate = log.flowrate;
                      const totalizer = log.totalizer;

                      return (
                        <TableRow key={`${log.timestamp}-${index}`} hover className="log-table-row">
                          {selectedColumn.length > 0 ? (
                            selectedColumn.map((col) => (
                              <TableCell key={col} className="log-table-cell">
                                {col === 'timestamp' && timestamp}
                                {col === 'metric_name' && metricName}
                                {col === 'flowrate' && (typeof flowRate === 'number' ? flowRate.toFixed(2) : flowRate)}
                                {col === 'totalizer' && (typeof totalizer === 'number' ? totalizer.toFixed(2) : totalizer)}
                              </TableCell>
                            ))
                          ) : (
                            <>
                              <TableCell className="log-table-cell" title={timestamp}>
                                {timestamp}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {metricName}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {typeof flowRate === 'number' ? flowRate.toFixed(2) : flowRate}
                              </TableCell>
                              <TableCell className="log-table-cell">
                                {typeof totalizer === 'number' ? totalizer.toFixed(2) : totalizer}
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

          {/* Pagination */}
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

export default WaterLogs;