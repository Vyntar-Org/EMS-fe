import React, { useState } from 'react';
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

  // Generate 25 rows of sample log data matching the image structure
  const generateLogData = () => {
    const baseDate = new Date('2025-05-27T12:51:32');
    const machines = ['Machine 1', 'Machine 2', 'Machine 3'];
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
      const machine = machines[i % 3];
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
        machine,
      });
    }

    return logs;
  };

  const logs = generateLogData();
  const devices = ['all', 'Machine 1', 'Machine 2', 'Machine 3'];

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
    setSearchClicked(true);
    setPage(1); // Reset to first page when searching
  };

  // Filter logs based on all criteria
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !searchTerm ||
      log.entryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.consumpMachines.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = filterDevice === 'all' || log.machine === filterDevice;

    const startDate = parseDateTimeLocal(filterStartDate);
    const endDate = parseDateTimeLocal(filterEndDate);
    const matchesDateRange = isDateInRange(log.timestamp, startDate, endDate);

    // If search hasn't been clicked, show all logs
    if (!searchClicked) {
      return true;
    }

    return matchesSearch && matchesDevice && matchesDateRange;
  });

  // Calculate pagination
  const count = filteredLogs.length;
  const totalPages = Math.ceil(count / rowsPerPage);

  // Get logs for current page
  const paginatedLogs = filteredLogs.slice(
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
  const handlePageChange = (event, value) => {
    setPage(value);
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
      minHeight: 'auto',
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
      <Box  className="block-header mb-1">
        <Grid container>
          <Grid item lg={5} md={8} xs={12}>
            <Typography
              variant="h6"
              className="logs-title"
              style={{
                // marginBottom: '-10px',
                color: '#0156a6',
                fontWeight: 600,
                fontFamily: 'inherit',
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
      </Box>

      <Card className="logs-card" sx={{marginTop: '20px'}}>
        <CardContent>
          <Box className="logs-header">
            <Box className="logs-filters">
              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Device</InputLabel>
                <Select
                  value={filterDevice}
                  label="Select Device"
                  onChange={(e) => setFilterDevice(e.target.value)}
                >
                  {devices.map((device) => (
                    <MenuItem key={device} value={device}>
                      {device === 'all' ? 'Select Device' : device}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 300, mr: 2 }}>
                <InputLabel>Select Device</InputLabel>
                <Select
                  value={filterDevice}
                  label="Select Device"
                  onChange={(e) => setFilterDevice(e.target.value)}
                >
                  {devices.map((device) => (
                    <MenuItem key={device} value={device}>
                      {device === 'all' ? 'Select Device' : device}
                    </MenuItem>
                  ))}
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

          <TableContainer
            component={Paper}
            className="logs-table-container"
            style={{ overflow: 'auto' }}
          >
            <Table stickyHeader style={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow className="log-table-header">
                  <TableCell className="log-header-cell">timestamp</TableCell>
                  <TableCell className="log-header-cell">Active Energy Import (kWh)</TableCell>
                  <TableCell className="log-header-cell">Total Active Power (kW)</TableCell>
                  <TableCell className="log-header-cell">Total Apparent Power (kVA)</TableCell>
                  <TableCell className="log-header-cell">Average Current (A)</TableCell>
                  <TableCell className="log-header-cell">Average Line-to-Line Voltage (V)</TableCell>
                  <TableCell className="log-header-cell">C–A Phase Voltage RMS (V)</TableCell>
                  <TableCell className="log-header-cell">System Frequency (Hz)</TableCell>
                  <TableCell className="log-header-cell">RMS Current – Phase C (A)</TableCell>
                  <TableCell className="log-header-cell">RMS Current – Phase A (A)</TableCell>
                  <TableCell className="log-header-cell">RMS Current – Phase B (A)</TableCell>
                  <TableCell className="log-header-cell">Total Power Factor</TableCell>
                  <TableCell className="log-header-cell">Reactive Energy Import (kVArh)</TableCell>
                  <TableCell className="log-header-cell">A–B Phase Voltage RMS (V)</TableCell>
                  <TableCell className="log-header-cell">B–C Phase Voltage RMS (V)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const [consumption, total, status] = log.consumpMachines.split(' ');
                    return (
                      <TableRow key={log.id} hover className="log-table-row">
                        <TableCell className="log-table-cell" title={log.entryDate}>
                          {log.entryDate}
                        </TableCell>
                        <TableCell className="log-table-cell">{log.rPhaseVoY}</TableCell>
                        <TableCell className="log-table-cell">{log.phaseB1}</TableCell>
                        <TableCell className="log-table-cell">{log.phaseR}</TableCell>
                        <TableCell className="log-table-cell">{log.phaseY}</TableCell>
                        <TableCell className="log-table-cell">{log.phaseB2}</TableCell>
                        <TableCell className="log-table-cell">{log.ryVolta}</TableCell>
                        <TableCell className="log-table-cell">{log.ybVolta}</TableCell>
                        <TableCell className="log-table-cell">{log.brVolta}</TableCell>
                        <TableCell className="log-table-cell">{log.frequenc}</TableCell>
                        <TableCell className="log-table-cell">{log.totalAct}</TableCell>
                        <TableCell className="log-table-cell">{log.totalAct}</TableCell>
                        <TableCell className="log-table-cell">{log.averageKWH}</TableCell>
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
                            color={status === 'On' ? 'success' : 'default'}
                            sx={{
                              height: '20px',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={14} align="center">
                      {searchClicked ? 'No logs found matching your filters' : 'Select filters and click Search to view logs'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'right', mt: 2 }}>
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