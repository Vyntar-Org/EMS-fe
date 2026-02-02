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
  const [selectedColumn, setSelectedColumn] = useState(''); // State for selected column in dropdown

  // Generate 25 rows of sample log data matching the image structure
  const generateLogData = (availableDevices = []) => {
    const baseDate = new Date('2025-05-27T12:51:32');
    // Use the actual device names from the API, or fallback to default machines
    const deviceNames = availableDevices && availableDevices.length > 1 
      ? availableDevices.filter(device => device !== 'all') // Exclude 'all' from the list of actual devices
      : ['Machine 1', 'Machine 2', 'Machine 3'];
    
    const logs = [];

    for (let i = 0; i < 25; i++) {
      const date = new Date(baseDate);
      date.setSeconds(date.getSeconds() - (i * 45));

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      const entryDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      const device = deviceNames[i % deviceNames.length];
      const baseConsump = 126730 + (i * 0.1);
      const status = i % 4 === 2 ? 'Off' : 'On';

      logs.push({
        id: i + 1,
        entryDate,
        timestamp: date, // Store as Date object for easier comparison
        rPhaseVoY: (254 + Math.random() * 2 - 1).toFixed(2),
        phaseB1: (253 + Math.random() * 2 - 1).toFixed(2),
        phaseR: (252 + Math.random() * 2 - 1).toFixed(2),
        phaseY: (52 + Math.random() * 3 - 1.5).toFixed(2),
        phaseB2: (54 + Math.random() * 3 - 1.5).toFixed(2),
        ryVolta: (53 + Math.random() * 3 - 1.5).toFixed(2),
        ybVolta: (439 + Math.random() * 3 - 1.5).toFixed(2),
        brVolta: (439 + Math.random() * 3 - 1.5).toFixed(2),
        frequenc: (50.2 + Math.random() * 0.2 - 0.1).toFixed(2),
        totalAct: (22 + Math.random() * 3 - 1.5).toFixed(2),
        totalAct: (22 + Math.random() * 3 - 1.5).toFixed(2),
        averageKWH: (0.65 + Math.random() * 0.1).toFixed(2),
        consumpMachines: `${baseConsump.toFixed(1)} ${baseConsump.toFixed(1)} ${status}`,
        machine: device,
      });
    }

    return logs;
  };

  const [logs, setLogs] = useState([]); // State for logs
  const [realLogs, setRealLogs] = useState([]); // State for real API logs
  const [logsLoading, setLogsLoading] = useState(false); // Loading state for logs
  const [paginationMeta, setPaginationMeta] = useState({}); // State for pagination metadata
  
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
  
  // Regenerate sample logs when devices change (fallback)
  useEffect(() => {
    if (!searchClicked && !loading) { // Only regenerate sample logs when not searching
      const generatedLogs = generateLogData(devices);
      setLogs(generatedLogs);
      setRealLogs([]); // Clear real logs when not searching
    }
  }, [devices, loading, searchClicked]);

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

      <Card className="logs-card" sx={{marginTop: ''}}>
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
                <InputLabel>Select Parameter</InputLabel>
                <Select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  label="Select Machine Values"
                >
                  <MenuItem value="timestamp">timestamp</MenuItem>
                  <MenuItem value="active_energy_import">Active Energy Import (kWh)</MenuItem>
                  <MenuItem value="total_active_power">Total Active Power (kW)</MenuItem>
                  <MenuItem value="total_apparent_power">Total Apparent Power (kVA)</MenuItem>
                  <MenuItem value="average_current">Average Current (A)</MenuItem>
                  <MenuItem value="average_line_to_line_voltage">Average Line-to-Line Voltage (V)</MenuItem>
                  <MenuItem value="c_a_phase_voltage_rms">C–A Phase Voltage RMS (V)</MenuItem>
                  <MenuItem value="system_frequency">System Frequency (Hz)</MenuItem>
                  <MenuItem value="rms_current_phase_c">RMS Current – Phase C (A)</MenuItem>
                  <MenuItem value="rms_current_phase_a">RMS Current – Phase A (A)</MenuItem>
                  <MenuItem value="rms_current_phase_b">RMS Current – Phase B (A)</MenuItem>
                  <MenuItem value="total_power_factor">Total Power Factor</MenuItem>
                  <MenuItem value="reactive_energy_import">Reactive Energy Import (kVArh)</MenuItem>
                  <MenuItem value="a_b_phase_voltage_rms">A–B Phase Voltage RMS (V)</MenuItem>
                  <MenuItem value="b_c_phase_voltage_rms">B–C Phase Voltage RMS (V)</MenuItem>
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
                  backgroundColor: '#0156a6', // Blue color to match the image
                  '&:hover': {
                    backgroundColor: '#166aa0', // Darker blue on hover
                  },
                  mr: 1
                }}
              >
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  handleResetFilters();
                  setSelectedColumn(''); // Reset the column selection dropdown
                }}
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
                  {selectedColumn ? (
                    // Single column view
                    <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>
                      {selectedColumn === 'timestamp' && 'timestamp'}
                      {selectedColumn === 'active_energy_import' && 'Active Energy Import (kWh)'}
                      {selectedColumn === 'total_active_power' && 'Total Active Power (kW)'}
                      {selectedColumn === 'total_apparent_power' && 'Total Apparent Power (kVA)'}
                      {selectedColumn === 'average_current' && 'Average Current (A)'}
                      {selectedColumn === 'average_line_to_line_voltage' && 'Average Line-to-Line Voltage (V)'}
                      {selectedColumn === 'c_a_phase_voltage_rms' && 'C–A Phase Voltage RMS (V)'}
                      {selectedColumn === 'system_frequency' && 'System Frequency (Hz)'}
                      {selectedColumn === 'rms_current_phase_c' && 'RMS Current – Phase C (A)'}
                      {selectedColumn === 'rms_current_phase_a' && 'RMS Current – Phase A (A)'}
                      {selectedColumn === 'rms_current_phase_b' && 'RMS Current – Phase B (A)'}
                      {selectedColumn === 'total_power_factor' && 'Total Power Factor'}
                      {selectedColumn === 'reactive_energy_import' && 'Reactive Energy Import (kVArh)'}
                      {selectedColumn === 'a_b_phase_voltage_rms' && 'A–B Phase Voltage RMS (V)'}
                      {selectedColumn === 'b_c_phase_voltage_rms' && 'B–C Phase Voltage RMS (V)'}
                    </TableCell>
                  ) : (
                    // All columns view
                    <>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>timestamp</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Active Energy Import (kWh)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Total Active Power (kW)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Total Apparent Power (kVA)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Average Current (A)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Average Line-to-Line Voltage (V)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>C–A Phase Voltage RMS (V)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>System Frequency (Hz)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>RMS Current – Phase C (A)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>RMS Current – Phase A (A)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>RMS Current – Phase B (A)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Total Power Factor</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>Reactive Energy Import (kVArh)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>A–B Phase Voltage RMS (V)</TableCell>
                      <TableCell className="log-header-cell" sx={{textTransform: 'capitalize'}}>B–C Phase Voltage RMS (V)</TableCell>
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
                        {selectedColumn ? (
                          // Single column view
                          <TableCell className="log-table-cell">
                            {selectedColumn === 'timestamp' && timestamp}
                            {selectedColumn === 'active_energy_import' && activeEnergyImport}
                            {selectedColumn === 'total_active_power' && totalActivePower}
                            {selectedColumn === 'total_apparent_power' && totalApparentPower}
                            {selectedColumn === 'average_current' && avgCurrent}
                            {selectedColumn === 'average_line_to_line_voltage' && avgLineToLineVoltage}
                            {selectedColumn === 'c_a_phase_voltage_rms' && brVoltage}
                            {selectedColumn === 'system_frequency' && frequency}
                            {selectedColumn === 'rms_current_phase_c' && ibCurrent}
                            {selectedColumn === 'rms_current_phase_a' && irCurrent}
                            {selectedColumn === 'rms_current_phase_b' && iyCurrent}
                            {selectedColumn === 'total_power_factor' && totalPowerFactor}
                            {selectedColumn === 'reactive_energy_import' && reactiveEnergyImport}
                            {selectedColumn === 'a_b_phase_voltage_rms' && ryVoltage}
                            {selectedColumn === 'b_c_phase_voltage_rms' && ybVoltage}
                          </TableCell>
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