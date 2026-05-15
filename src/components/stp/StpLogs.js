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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  // Define all available parameters based on the image
  const allParameters = [
    { val: 'device', label: 'Device' },
    { val: 'timestamp', label: 'Timestamp' },
    { val: 'rpm', label: 'RPM' },
    { val: 'temperature', label: 'Temperature (°C)' },
    { val: 'pressure', label: 'Pressure (bar)' },
    { val: 'ph', label: 'pH' },
    { val: 'tds', label: 'TDS (ppm)' },
    { val: 'cod', label: 'COD (mg/L)' },
    { val: 'tss', label: 'TSS (mg/L)' },
    { val: 'bod', label: 'BOD (mg/L)' },
    { val: 'intake_total', label: 'Intake Total (L/m²/day)' },
    { val: 'flow_rate', label: 'Flow Rate (L/min)' },
    { val: 'running_hours', label: 'Total Running Hours' },
    { val: 'power', label: 'Power (kW)' },
    { val: 'data_status', label: 'Data Status' }
  ];

  // Get all parameter values for easy reference
  const allParameterValues = allParameters.map(param => param.val);

  // Load devices on component mount (Mock Data)
  useEffect(() => {
    setTimeout(() => {
      const mockDevices = ['STP 1', 'STP 2'];
      setDevices(['all', ...mockDevices]);
      if (mockDevices.length > 0) {
        setFilterDevice(mockDevices[0]);
      }
    }, 500);
  }, []);

  // Helper to generate random mock logs based on image columns
  const generateMockLogs = (device, start, end) => {
    const data = [];
    const startTime = start.valueOf();
    const endTime = end.valueOf();
    const diff = endTime - startTime;

    if (diff <= 0) return [];

    const numberOfEntries = Math.floor(Math.random() * 50) + 50;
    const statuses = ['Valid', 'Invalid', 'Warning'];

    for (let i = 0; i < numberOfEntries; i++) {
      const randomTime = startTime + Math.random() * diff;
      data.push({
        device: device,
        timestamp: new Date(randomTime).toISOString(),
        rpm: Math.floor(Math.random() * 3000) + 1000,
        temperature: (Math.random() * 60 + 20).toFixed(2),
        pressure: (Math.random() * 10).toFixed(2),
        ph: (Math.random() * 5 + 4).toFixed(2),
        tds: Math.floor(Math.random() * 500 + 100),
        cod: Math.floor(Math.random() * 100 + 20),
        tss: Math.floor(Math.random() * 50 + 10),
        bod: Math.floor(Math.random() * 30 + 5),
        intake_total: Math.floor(Math.random() * 1000 + 500),
        flow_rate: (Math.random() * 100).toFixed(2),
        running_hours: Math.floor(Math.random() * 5000),
        power: (Math.random() * 50).toFixed(2),
        data_status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Handle search button click (Mock Data)
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

  // Filter logs based on search term (Client-side filtering)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    // Search across relevant string/number fields
    return (
      log.device.toLowerCase().includes(term) ||
      log.timestamp.toLowerCase().includes(term) ||
      log.data_status.toLowerCase().includes(term) ||
      log.rpm.toString().includes(term)
    );
  });

  // Calculate pagination (Client-side)
  const totalRecords = filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const shouldShowPagination = searchClicked && totalRecords > 0;

  // Get logs for current page
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    if (devices.length > 1) {
      setFilterDevice(devices[1]);
    }
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
    setPage(1);
    setSearchClicked(false);
    setSelectedColumn([]);
    setLogs([]);
    setError(null);
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Handle parameter selection
  const handleParameterChange = (event) => {
    const value = event.target.value;

    if (value.includes('all_parameters')) {
      if (selectedColumn.length === allParameterValues.length) {
        setSelectedColumn([]);
      } else {
        setSelectedColumn([...allParameterValues]);
      }
    } else {
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
    }
  }

  // Helper to render cell content based on column
  const renderCellContent = (log, col) => {
    switch (col) {
      case 'timestamp': return new Date(log.timestamp).toLocaleString();
      case 'device': return log.device;
      case 'rpm': return log.rpm;
      case 'temperature': return `${log.temperature} °C`;
      case 'pressure': return `${log.pressure} bar`;
      case 'ph': return log.ph;
      case 'tds': return `${log.tds} ppm`;
      case 'cod': return `${log.cod} mg/L`;
      case 'tss': return `${log.tss} mg/L`;
      case 'bod': return `${log.bod} mg/L`;
      case 'intake_total': return `${log.intake_total} L/m²/day`;
      case 'flow_rate': return `${log.flow_rate} L/min`;
      case 'running_hours': return log.running_hours;
      case 'power': return `${log.power} kW`;
      case 'data_status': return log.data_status;
      default: return '-';
    }
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

              {/* Parameters Select */}
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: '100%', sm: 300 },
                  mr: { sm: 2 },
                }}
              >
                <InputLabel>Select Parameters</InputLabel>
                <Select
                  multiple
                  value={selectedColumn}
                  onChange={handleParameterChange}
                  label="Select Parameters"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {isAllParametersSelected ? (
                        <Chip label="All Parameters" size="small" sx={{ height: '20px', fontSize: '10px' }} />
                      ) : (
                        selected.slice(0, 2).map((value) => (
                          <Chip
                            key={value}
                            label={allParameters.find(p => p.val === value)?.label || value}
                            size="small"
                            sx={{ height: '20px', fontSize: '10px' }}
                          />
                        ))
                      )}
                      {!isAllParametersSelected && selected.length > 2 && (
                        <Chip label={`+${selected.length - 2} more`} size="small" sx={{ height: '20px', fontSize: '10px' }} />
                      )}
                    </Box>
                  )}
                  MenuProps={{ PaperProps: { style: { maxHeight: 300, width: 250 } } }}
                >
                  <MenuItem value="all_parameters">
                    <Checkbox checked={isAllParametersSelected} indeterminate={selectedColumn.length > 0 && !isAllParametersSelected} />
                    <ListItemText primary="All Parameters" />
                  </MenuItem>
                  {allParameters.map((item) => (
                    <MenuItem key={item.val} value={item.val}>
                      <Checkbox checked={selectedColumn.indexOf(item.val) > -1} />
                      <ListItemText primary={item.label} />
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
                  onClick={() => {
                    handleResetFilters();
                  }}
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
            <Box sx={{ width: '100%', overflow: 'auto', mt: 2 }}>
              <TableContainer component={Paper} className="logs-table-container">
                <Table stickyHeader sx={{ tableLayout: 'auto', width: '100%' }}>
                  <TableHead>
                    <TableRow className="log-table-header">
                      <TableCell className="log-header-cell" sx={{ fontWeight: 'bold' }}>#</TableCell>
                      {selectedColumn.length > 0 ? (
                        selectedColumn.map((col) => (
                          <TableCell key={col} className="log-header-cell" sx={{ fontWeight: 'bold' }}>
                            {allParameters.find(p => p.val === col)?.label || col}
                          </TableCell>
                        ))
                      ) : (
                        allParameters.map((param) => (
                          <TableCell key={param.val} className="log-header-cell" sx={{ fontWeight: 'bold' }}>
                            {param.label}
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>

                          {selectedColumn.length > 0 ? (
                            selectedColumn.map((col) => (
                              <TableCell key={col}>
                                {renderCellContent(log, col)}
                              </TableCell>
                            ))
                          ) : (
                            allParameters.map((param) => (
                              <TableCell key={param.val}>
                                {renderCellContent(log, param.val)}
                              </TableCell>
                            ))
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={selectedColumn.length > 0 ? selectedColumn.length + 1 : allParameters.length + 1} align="center">
                          No logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Pagination */}
          {shouldShowPagination && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2">
                Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, totalRecords)} of {totalRecords} entries
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
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