import React, { useState, useEffect } from 'react';
import { getSlaveList, getDeviceLogs } from '../auth/LogsApi';
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
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './Logs.css';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function Logs({ onSidebarToggle, sidebarVisible }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 20; // Show 20 rows per page
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
  const [devices, setDevices] = useState([]); // Initialize as empty array
  const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs
  const [loading, setLoading] = useState(true); // Loading state for devices
  const [error, setError] = useState(null); // Error state for devices
  const [selectedColumn, setSelectedColumn] = useState([]); // State for selected column in dropdown

  const [logs, setLogs] = useState([]); // State for logs
  const [realLogs, setRealLogs] = useState([]); // State for real API logs
  const [logsLoading, setLogsLoading] = useState(false); // Loading state for logs
  const [paginationMeta, setPaginationMeta] = useState({}); // State for pagination metadata
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);


  // Fetch device logs when search is clicked
  useEffect(() => {
    const fetchDeviceLogs = async () => {
      if (searchClicked && filterDevice !== 'all') {
        try {
          setLogsLoading(true);

          // Find the selected device object to get its ID
          // The filterDevice contains slave_name, but deviceObjects may have different property names
          const selectedDeviceObj = deviceObjects.find(device =>
            device.slave_name === filterDevice ||
            device.name === filterDevice ||
            device.slave_id === parseInt(filterDevice)
          );

          console.log('Selected device filter:', filterDevice);
          console.log('Available devices:', deviceObjects);
          console.log('Found device object:', selectedDeviceObj);
          if (!selectedDeviceObj) {
            console.error('Selected device not found in device list');
            return;
          }

          // Format dates properly for API request
          const formatDateTime = (date) => {
            if (!date) return '';
            // Check if it's a dayjs object
            if (typeof date.format === 'function') {
              return date.format('YYYY-MM-DD HH:mm:ss');
            }
            // If it's a regular Date object
            if (date instanceof Date) {
              return date.toISOString().slice(0, 19).replace('T', ' ');
            }
            // If it's already a string, return as is
            return date;
          };

          const startDate = filterStartDate ? formatDateTime(filterStartDate) : '2026-01-03 23:03:00';
          const endDate = filterEndDate ? formatDateTime(filterEndDate) : '2026-01-05 23:03:00';

          // Use the actual ID from the device object - could be slave_id or id
          const slaveId = selectedDeviceObj.slave_id || selectedDeviceObj.id;
          console.log('Using slave ID for API call:', slaveId);

          // Calculate offset based on current page and limit
          const limit = rowsPerPage;
          const offset = (page - 1) * rowsPerPage;

          const response = await getDeviceLogs(slaveId, startDate, endDate, limit, offset);

          // Handle the response structure - API returns {success, message, data, meta}
          let logsData = [];
          let meta = {};

          if (response && typeof response === 'object') {
            if (response.data !== undefined) {
              // Response has the expected structure with data array
              logsData = Array.isArray(response.data) ? response.data : [];
              meta = response.meta || {};
              console.log('API response data:', response.data);
              console.log('API response meta:', response.meta);
            } else if (Array.isArray(response)) {
              // Direct array response
              logsData = response;
              meta = {};
            } else {
              // Unexpected structure
              console.warn('Unexpected API response structure:', response);
              logsData = [];
              meta = {};
            }
          } else {
            // Invalid response
            console.error('Invalid API response:', response);
            logsData = [];
            meta = {};
          }

          setRealLogs(logsData);
          setLogs(logsData); // Use real logs instead of generated logs
          setPaginationMeta(meta); // Store pagination metadata

        } catch (error) {
          console.error('Error fetching device logs:', error);
          // Optionally set an error state here
        } finally {
          setLogsLoading(false);
        }
      }
    };

    fetchDeviceLogs();
  }, [searchClicked, filterDevice, filterStartDate, filterEndDate, devices]);

  // // Regenerate sample logs when devices change (fallback)
  // useEffect(() => {
  //   if (!searchClicked && !loading) { // Only regenerate sample logs when not searching
  //     const generatedLogs = generateLogData(devices);
  //     setLogs(generatedLogs);
  //     setRealLogs([]); // Clear real logs when not searching
  //   }
  // }, [devices, loading, searchClicked]);

  // Fetch slave list from API on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const slaveList = await getSlaveList();
        console.log('Raw slave list from API:', slaveList);
        // Store full device objects for ID mapping
        setDeviceObjects(slaveList);
        // Transform the slave list to the format expected by the dropdown
        const deviceNames = slaveList.map(slave => slave.slave_name);
        console.log('Device names for dropdown:', deviceNames);
        setDevices(['all', ...deviceNames]); // Add 'all' as the first option
        setError(null);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(err.message || 'Failed to fetch device list');
        // Keep the default 'all' option if there's an error
        setDevices(['all']);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Convert date string to Date object for comparison
  const parseDateTimeLocal = (dateTimeString) => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString);
  };

  // Check if log date is within the selected date range
  const isDateInRange = (logTimestamp, startDate, endDate) => {
    if (!startDate && !endDate) return true;

    const logDate = new Date(logTimestamp);

    if (startDate && endDate) {
      return logDate >= startDate && logDate <= endDate;
    } else if (startDate) {
      return logDate >= startDate;
    } else if (endDate) {
      return logDate <= endDate;
    }

    return true;
  };

  // Handle search button click
  const handleSearch = () => {
    if (!filterDevice || filterDevice === 'all') {
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
    setPage(1); // Reset to first page when searching
  };

  // Filter logs based on all criteria
  let filteredLogs;

  if (searchClicked) {
    // When search is clicked, use real logs from API
    // Since pagination is handled by the API, we use the realLogs directly
    // The search term filtering happens on the backend
    filteredLogs = searchTerm ?
      realLogs.filter((log) => {
        const matchesSearch = !searchTerm ||
          (log.timestamp && log.timestamp.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.ry_v !== undefined && log.ry_v.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.yb_v !== undefined && log.yb_v.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.br_v !== undefined && log.br_v.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.acte_im !== undefined && log.acte_im.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.actpr_t !== undefined && log.actpr_t.toString().toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
      })
      : realLogs;
  } else {
    // When not searching, use generated logs
    filteredLogs = logs.filter((log) => {
      const matchesSearch = !searchTerm ||
        log.entryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.consumpMachines.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDevice = filterDevice === 'all' || log.machine === filterDevice;

      const startDate = parseDateTimeLocal(filterStartDate);
      const endDate = parseDateTimeLocal(filterEndDate);
      const matchesDateRange = isDateInRange(log.timestamp, startDate, endDate);

      return matchesSearch && matchesDevice && matchesDateRange;
    });
  }

  // Calculate pagination based on API metadata
  const count = paginationMeta.count || filteredLogs.length;
  const totalRecords = paginationMeta.total || filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  // Determine if pagination should be shown
  const shouldShowPagination = searchClicked && totalRecords > 0 && totalRecords > rowsPerPage;

  // Get logs for current page
  // When using API pagination, the realLogs state already contains the correct page of data
  const paginatedLogs = searchClicked ? realLogs : filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDevice('all');
    setFilterDate('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
    setSearchClicked(false); // Reset search state
  };

  // Handle page change
  const handlePageChange = async (event, value) => {
    setPage(value);

    // Only fetch new data from API if search has been clicked
    if (searchClicked && filterDevice !== 'all') {
      try {
        setLogsLoading(true);

        // Find the selected device object to get its ID
        // The filterDevice contains slave_name, but deviceObjects may have different property names
        const selectedDeviceObj = deviceObjects.find(device =>
          device.slave_name === filterDevice ||
          device.name === filterDevice ||
          device.slave_id === parseInt(filterDevice)
        );

        console.log('Pagination - Selected device filter:', filterDevice);
        console.log('Pagination - Available devices:', deviceObjects);
        console.log('Pagination - Found device object:', selectedDeviceObj);
        if (!selectedDeviceObj) {
          console.error('Selected device not found in device list');
          return;
        }

        // Format dates properly for API request
        const formatDateTime = (date) => {
          if (!date) return '';
          // Check if it's a dayjs object
          if (typeof date.format === 'function') {
            return date.format('YYYY-MM-DD HH:mm:ss');
          }
          // If it's a regular Date object
          if (date instanceof Date) {
            return date.toISOString().slice(0, 19).replace('T', ' ');
          }
          // If it's already a string, return as is
          return date;
        };

        const startDate = filterStartDate ? formatDateTime(filterStartDate) : '2026-01-03 23:03:00';
        const endDate = filterEndDate ? formatDateTime(filterEndDate) : '2026-01-05 23:03:00';

        // Use the actual ID from the device object - could be slave_id or id
        const slaveId = selectedDeviceObj.slave_id || selectedDeviceObj.id;
        console.log('Pagination - Using slave ID for API call:', slaveId);

        // Calculate offset based on page and limit
        const limit = rowsPerPage;
        const offset = (value - 1) * rowsPerPage;

        const response = await getDeviceLogs(slaveId, startDate, endDate, limit, offset);

        // Handle the response structure - API returns {success, message, data, meta}
        let logsData = [];
        let meta = {};

        if (response && typeof response === 'object') {
          if (response.data !== undefined) {
            // Response has the expected structure with data array
            logsData = Array.isArray(response.data) ? response.data : [];
            meta = response.meta || {};
            console.log('Pagination API response data:', response.data);
            console.log('Pagination API response meta:', response.meta);
          } else if (Array.isArray(response)) {
            // Direct array response
            logsData = response;
            meta = {};
          } else {
            // Unexpected structure
            console.warn('Unexpected pagination API response structure:', response);
            logsData = [];
            meta = {};
          }
        } else {
          // Invalid response
          console.error('Invalid pagination API response:', response);
          logsData = [];
          meta = {};
        }

        setRealLogs(logsData);
        setLogs(logsData); // Update logs with new data
        setPaginationMeta(meta); // Store pagination metadata

      } catch (error) {
        console.error('Error fetching device logs for pagination:', error);
      } finally {
        setLogsLoading(false);
      }
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    if (searchClicked) {
      setPage(1);
    }
  }, [searchTerm, filterDevice, filterDate, filterStartDate, filterEndDate, searchClicked]);

  const styles = {
    mainContent: {
      width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)', // Adjust width based on sidebar visibility
      maxWidth: sidebarVisible ? '1600px' : '1800px', // Adjust max width
      minHeight: '89vh',
      // backgroundColor: '#F8FAFC',
      fontFamily: 'Inter, Roboto, system-ui, sans-serif',
      fontSize: '14px',
      // padding: '24px',
      margin: '0',
      transition: 'all 0.3s ease', // Add smooth transition
    },
  }
  return (
    <Box style={styles.mainContent} id="main-content">
      {/* <Box  className="block-header mb-1">
        <Grid container>
          <Grid item lg={5} md={8} xs={12}>
            <Typography
              variant="h6"
              className="logs-title"
              style={{
                // marginBottom: '-10px',
                color: '#0F2A44',
                fontWeight: 600,
                fontFamily: 'sans-serif',
                 marginLeft: '5px',
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
              Logs
            </Typography>
          </Grid>
        </Grid>
      </Box> */}

      <Card className="logs-card" sx={{ marginTop: '' }}>
        <CardContent>
          <Box className="logs-header">
            <Box className="logs-filters">
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Machine</InputLabel>
                <Select
                  value={filterDevice}
                  label="Select Machine"
                  onChange={(e) => setFilterDevice(e.target.value)}
                >
                  {devices.map((device) => (
                    <MenuItem key={device} value={device}>
                      {device === 'all' ? 'Select Machine' : device}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Parameters</InputLabel>
                <Select
                  multiple
                  value={selectedColumn}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedColumn(typeof value === 'string' ? value.split(',') : value);
                  }}
                  label="Select Parameters"
                  // RENDER LOGIC FOR "+X MORE"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {/* Show the first 2 items as Chips */}
                      {selected.slice(0, 2).map((value) => (
                        <Chip
                          key={value}
                          label={value.replace(/_/g, ' ')}
                          size="small"
                          sx={{ height: '20px', fontSize: '10px', textTransform: 'capitalize' }}
                        />
                      ))}

                      {/* If more than 2 items, show the +X counter */}
                      {selected.length > 2 && (
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
                  {[
                    { val: 'timestamp', label: 'Timestamp' },
                    { val: 'active_energy_import', label: 'Active Energy Import (kWh)' },
                    { val: 'total_active_power', label: 'Total Active Power (kW)' },
                    { val: 'total_apparent_power', label: 'Total Apparent Power (kVA)' },
                    { val: 'average_current', label: 'Average Current (A)' },
                    { val: 'average_line_to_line_voltage', label: 'Average Line-to-Line Voltage (V)' },
                    { val: 'c_a_phase_voltage_rms', label: 'C–A Phase Voltage RMS (V)' },
                    { val: 'system_frequency', label: 'System Frequency (Hz)' },
                    { val: 'rms_current_phase_c', label: 'RMS Current – Phase C (A)' },
                    { val: 'rms_current_phase_a', label: 'RMS Current – Phase A (A)' },
                    { val: 'rms_current_phase_b', label: 'RMS Current – Phase B (A)' },
                    { val: 'total_power_factor', label: 'Total Power Factor' },
                    { val: 'reactive_energy_import', label: 'Reactive Energy Import (kVArh)' },
                    { val: 'a_b_phase_voltage_rms', label: 'A–B Phase Voltage RMS (V)' },
                    { val: 'b_c_phase_voltage_rms', label: 'B–C Phase Voltage RMS (V)' }
                  ].map((item) => (
                    <MenuItem key={item.val} value={item.val} sx={{
                      py: 0.2, // Tight vertical padding for the list item
                      px: 1,
                      minHeight: '32px', // Forces a slim row height
                    }}>
                      <Checkbox checked={selectedColumn.indexOf(item.val) > -1} sx={{
                        p: 0.5,   // Removes the 9px default padding
                        mr: 0.5,   // Adds spacing between box and text
                        transform: "scale(0.8)", // SHRINK THE CHECKBOX SIZE
                        '& .MuiSvgIcon-root': { fontSize: 20 } // Fine-tune the icon size specifically
                      }} />
                      <ListItemText primary={item.label} primaryTypographyProps={{
                        fontSize: '12px', // Smaller font to match the small checkbox
                        lineHeight: 1.2
                      }} />
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
                      sx: {
                        minWidth: 220,
                        mr: 2,
                        borderRadius: 2,
                      },
                      onClick: () => setOpenStart(true), // ✅ input click opens picker
                      onFocus: () => setOpenStart(true),
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
                        minWidth: 220,
                        mr: 2,
                        borderRadius: 2,
                      },
                      onClick: () => setOpenEnd(true), // ✅ input click opens picker
                      onFocus: () => setOpenEnd(true),
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
                  backgroundColor: '#0156a6', // Blue color to match the image
                  '&:hover': {
                    backgroundColor: '#166aa0', // Darker blue on hover
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
                onClick={() => {
                  handleResetFilters();
                  setSelectedColumn([]); // Reset the column selection dropdown
                }}
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

          {/* {!searchClicked && (
            <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: 2, mt: 2 }}>
              <Typography variant="h6" color="textSecondary">
                Please select a device, start date, and end date, then click the search button to view logs.
              </Typography>
            </Box>
          )} */}
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
                          {col.replace(/_/g, ' ')}
                        </TableCell>
                      ))
                    ) : (
                      // All columns view
                      <>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>timestamp</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Active Energy Import (kWh)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Total Active Power (kW)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Total Apparent Power (kVA)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Average Current (A)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Average Line-to-Line Voltage (V)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>C–A Phase Voltage RMS (V)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>System Frequency (Hz)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>RMS Current – Phase C (A)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>RMS Current – Phase A (A)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>RMS Current – Phase B (A)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Total Power Factor</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>Reactive Energy Import (kVArh)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>A–B Phase Voltage RMS (V)</TableCell>
                        <TableCell className="log-header-cell" sx={{ textTransform: 'capitalize' }}>B–C Phase Voltage RMS (V)</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      // Check if log is from API (has timestamp) or generated (has entryDate)
                      const isAPIData = log.hasOwnProperty('timestamp');

                      // For API data
                      const timestamp = isAPIData ? new Date(log.timestamp).toLocaleString() : log.entryDate;
                      const ryVoltage = isAPIData ? log.ry_v : log.rPhaseVoY;
                      const ybVoltage = isAPIData ? log.yb_v : log.phaseB1;
                      const brVoltage = isAPIData ? log.br_v : log.phaseR;
                      const avgLineToLineVoltage = isAPIData ? log.avg_l_l_v : log.phaseY;
                      const frequency = isAPIData ? log.fq : log.phaseB2;
                      const irCurrent = isAPIData ? log.i_r : log.ryVolta;
                      const iyCurrent = isAPIData ? log.i_y : log.ybVolta;
                      const ibCurrent = isAPIData ? log.i_b : log.brVolta;
                      const avgCurrent = isAPIData ? log.avg_i : log.frequenc;
                      const totalActivePower = isAPIData ? log.actpr_t : log.totalAct;
                      const totalApparentPower = isAPIData ? log.apppr_t : log.totalAct;
                      const totalPowerFactor = isAPIData ? log.pf_t : log.averageKWH;
                      const activeEnergyImport = isAPIData ? log.acte_im : parseFloat(log.consumpMachines.split(' ')[0]);
                      const reactiveEnergyImport = isAPIData ? log.reacte_im : 0;

                      // For generated data compatibility
                      const [consumption, total, status] = isAPIData ? [activeEnergyImport, activeEnergyImport, 'N/A'] : log.consumpMachines.split(' ');

                      return (
                        <TableRow key={isAPIData ? log.timestamp : log.id} hover className="log-table-row">
                          {selectedColumn.length > 0 ? (
                            selectedColumn.map((col) => (
                              <TableCell key={col} className="log-table-cell">
                                {col === 'timestamp' && timestamp}
                                {col === 'active_energy_import' && activeEnergyImport}
                                {col === 'total_active_power' && totalActivePower}
                                {col === 'total_apparent_power' && totalApparentPower}
                                {col === 'average_current' && avgCurrent}
                                {col === 'average_line_to_line_voltage' && avgLineToLineVoltage}
                                {col === 'c_a_phase_voltage_rms' && brVoltage}
                                {col === 'system_frequency' && frequency}
                                {col === 'rms_current_phase_c' && ibCurrent}
                                {col === 'rms_current_phase_a' && irCurrent}
                                {col === 'rms_current_phase_b' && iyCurrent}
                                {col === 'total_power_factor' && totalPowerFactor}
                                {col === 'reactive_energy_import' && reactiveEnergyImport}
                                {col === 'a_b_phase_voltage_rms' && ryVoltage}
                                {col === 'b_c_phase_voltage_rms' && ybVoltage}
                              </TableCell>
                            ))
                          ) : (
                            // All columns view
                            <>
                              <TableCell className="log-table-cell" title={timestamp}>
                                {timestamp}
                              </TableCell>
                              <TableCell className="log-table-cell">{activeEnergyImport}</TableCell>
                              <TableCell className="log-table-cell">{totalActivePower}</TableCell>
                              <TableCell className="log-table-cell">{totalApparentPower}</TableCell>
                              <TableCell className="log-table-cell">{avgCurrent}</TableCell>
                              <TableCell className="log-table-cell">{avgLineToLineVoltage}</TableCell>
                              <TableCell className="log-table-cell">{brVoltage}</TableCell>
                              <TableCell className="log-table-cell">{frequency}</TableCell>
                              <TableCell className="log-table-cell">{ibCurrent}</TableCell>
                              <TableCell className="log-table-cell">{irCurrent}</TableCell>
                              <TableCell className="log-table-cell">{iyCurrent}</TableCell>
                              <TableCell className="log-table-cell">{totalPowerFactor}</TableCell>
                              <TableCell className="log-table-cell">{reactiveEnergyImport}</TableCell>
                              <TableCell className="log-table-cell">{ryVoltage}</TableCell>
                              <TableCell className="log-table-cell">{ybVoltage}</TableCell>
                              <TableCell className="log-table-cell">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    sx={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '100%'
                                    }}
                                    title={`${consumption} ${total}`}
                                  >
                                    {consumption} {total}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell className="log-table-cell">
                                <Chip
                                  label={status}
                                  size="small"
                                  color={status === 'On' ? 'success' : status === 'N/A' ? 'default' : 'default'}
                                  sx={{
                                    height: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={selectedColumn ? 1 : 16} align="center">
                        {loading || logsLoading ? 'Loading...' : (paginatedLogs.length === 0 ? 'No logs found matching your filters' : '')}
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
                Showing {(paginationMeta.offset || 0) + 1} to {Math.min((paginationMeta.offset || 0) + (paginationMeta.limit || rowsPerPage), paginationMeta.total || realLogs.length)} of {paginationMeta.total || realLogs.length} entries
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

export default Logs;