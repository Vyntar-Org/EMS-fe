import React, { useState, useEffect } from 'react';
import { getCompressorLogs, getCompressorSlaves } from '../../auth/compressor/CompressorLogsApi';
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const CompressorLogs = ({ onSidebarToggle, sidebarVisible }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30; // Show 30 rows per page
  // Initialize with default dates - 1 hour ago to now
  const [filterStartDate, setFilterStartDate] = useState(dayjs().subtract(1, 'hour'));
  const [filterEndDate, setFilterEndDate] = useState(dayjs());
  const [searchClicked, setSearchClicked] = useState(false); // Track if search has been clicked
  const [devices, setDevices] = useState([]); // Initialize as empty array
  const [deviceObjects, setDeviceObjects] = useState([]); // Store full device objects with IDs
  const [loading, setLoading] = useState(true); // Loading state for devices
  const [error, setError] = useState(null); // Error state for devices

  const [logs, setLogs] = useState([]); // State for logs
  const [realLogs, setRealLogs] = useState([]); // State for real API logs
  const [logsLoading, setLogsLoading] = useState(false); // Loading state for logs
  const [paginationMeta, setPaginationMeta] = useState({}); // State for pagination metadata
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  // Fetch compressor logs when search is clicked
  useEffect(() => {
    const fetchCompressorLogs = async () => {
      if (searchClicked && filterDevice !== 'all') {
        try {
          setLogsLoading(true);

          // Find the selected device object to get its ID
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

          const startDate = filterStartDate ? formatDateTime(filterStartDate) : dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
          const endDate = filterEndDate ? formatDateTime(filterEndDate) : dayjs().format('YYYY-MM-DD HH:mm:ss');

          // Use the actual ID from the device object
          const slaveId = selectedDeviceObj.slave_id || selectedDeviceObj.id;
          console.log('Using slave ID for API call:', slaveId);

          // Calculate offset based on current page and limit
          const limit = rowsPerPage;
          const offset = (page - 1) * rowsPerPage;

          const response = await getCompressorLogs(slaveId, startDate, endDate, limit, offset);

          // Handle the response structure - API returns {success, message, data, meta}
          let logsData = [];
          let meta = {};

          if (response && typeof response === 'object') {
            if (response.data !== undefined) {
              // Response has the expected structure with data array
              logsData = Array.isArray(response.data.logs) ? response.data.logs : [];
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
          console.error('Error fetching compressor logs:', error);
          // Optionally set an error state here
        } finally {
          setLogsLoading(false);
        }
      }
    };

    fetchCompressorLogs();
  }, [searchClicked, filterDevice, filterStartDate, filterEndDate, page]);

  // Fetch slave list from API on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const slaveList = await getCompressorSlaves();
        console.log('Raw slave list from API:', slaveList);
        // Store full device objects for ID mapping
        setDeviceObjects(slaveList);
        // Transform the slave list to the format expected by the dropdown
        const deviceNames = slaveList.map(slave => slave.slave_name);
        console.log('Device names for dropdown:', deviceNames);
        setDevices(['all', ...deviceNames]); // Add 'all' as the first option
        
        // Set default device to the first one (not 'all')
        if (slaveList.length > 0) {
          setFilterDevice(slaveList[0].slave_name);
        }
        
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

  // Filter logs based on search term
  const filteredLogs = searchTerm ?
    realLogs.filter((log) => {
      const matchesSearch = !searchTerm ||
        (log.status && log.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.timestamp && log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    })
    : realLogs;

  // Calculate pagination based on API metadata
  const count = paginationMeta.count || filteredLogs.length;
  const totalRecords = paginationMeta.total || filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  // Determine if pagination should be shown
  const shouldShowPagination = searchClicked && totalRecords > 0 && totalRecords > rowsPerPage;

  // Get logs for current page
  const paginatedLogs = searchClicked ? realLogs : filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDevice('all');
    // Reset to default dates
    setFilterStartDate(dayjs().subtract(1, 'hour'));
    setFilterEndDate(dayjs());
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

        const startDate = filterStartDate ? formatDateTime(filterStartDate) : dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
        const endDate = filterEndDate ? formatDateTime(filterEndDate) : dayjs().format('YYYY-MM-DD HH:mm:ss');

        // Use the actual ID from the device object
        const slaveId = selectedDeviceObj.slave_id || selectedDeviceObj.id;
        console.log('Pagination - Using slave ID for API call:', slaveId);

        // Calculate offset based on page and limit
        const limit = rowsPerPage;
        const offset = (value - 1) * rowsPerPage;

        const response = await getCompressorLogs(slaveId, startDate, endDate, limit, offset);

        // Handle the response structure
        let logsData = [];
        let meta = {};

        if (response && typeof response === 'object') {
          if (response.data !== undefined) {
            logsData = Array.isArray(response.data.logs) ? response.data.logs : [];
            meta = response.meta || {};
            console.log('Pagination API response data:', response.data);
            console.log('Pagination API response meta:', response.meta);
          } else if (Array.isArray(response)) {
            logsData = response;
            meta = {};
          } else {
            console.warn('Unexpected pagination API response structure:', response);
            logsData = [];
            meta = {};
          }
        } else {
          console.error('Invalid pagination API response:', response);
          logsData = [];
          meta = {};
        }

        setRealLogs(logsData);
        setLogs(logsData);
        setPaginationMeta(meta);

      } catch (error) {
        console.error('Error fetching compressor logs for pagination:', error);
      } finally {
        setLogsLoading(false);
      }
    }
  };

  const styles = {
    mainContent: {
      width: '100%',
      minHeight: '86.4vh',
      backgroundColor: '#f4f7f6',
      fontFamily: '"Ubuntu", sans-serif',
      fontSize: '14px',
      color: '#5A5A5A',
      marginBottom: '20px',
      padding: { xs: '10px', sm: '15px' },
      boxSizing: 'border-box',
    },
  }

  return (
    <Box style={styles.mainContent} id="main-content">
      <Card className="logs-card" sx={{ marginTop: '' }}>
        <CardContent>
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
                >
                  {devices.map((device) => (
                    <MenuItem key={device} value={device}>
                      {device === 'all' ? 'Select Device' : device}
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
                          mr: { xs: 0, sm: 2 }, 
                          borderRadius: 2 
                        },
                        onClick: () => setOpenEnd(true),
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
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              <Table 
                stickyHeader 
                style={{ 
                  minWidth: 'max-content',
                  width: '100%',
                }}
              >
                <TableHead>
                  <TableRow className="log-table-header">
                    <TableCell className="log-header-cell">Timestamp</TableCell>
                    <TableCell className="log-header-cell">Status</TableCell>
                    <TableCell className="log-header-cell">Idle</TableCell>
                    <TableCell className="log-header-cell">Alert</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => {
                      const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                      const status = log.status || 'N/A';
                      const idle = log.idle !== null && log.idle !== undefined ? log.idle : 'N/A';
                      const alert = log.alert !== null && log.alert !== undefined ? log.alert : 'N/A';

                      return (
                        <TableRow key={index} hover className="log-table-row">
                          <TableCell className="log-table-cell">{timestamp}</TableCell>
                          <TableCell className="log-table-cell">
                            <Chip 
                              label={status} 
                              size="small"
                              color={status === 'ON' ? 'success' : status === 'OFF' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell className="log-table-cell">{idle}</TableCell>
                          <TableCell className="log-table-cell">{alert}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
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

export default CompressorLogs;
