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
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './Logs.css';

function Logs({ onSidebarToggle, sidebarVisible }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 20; // Show 20 rows per page

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
        averageKWH: (0.65 + Math.random() * 0.1).toFixed(2),
        consumpMachines: `${baseConsump.toFixed(1)} ${baseConsump.toFixed(1)} ${status}`,
        machine,
      });
    }

    return logs;
  };

  const logs = generateLogData();

  const devices = ['all', 'Machine 1', 'Machine 2', 'Machine 3'];

  const formatDateForFilter = (dateString) => {
    if (!dateString) return '';
    // Convert DD-MM-YYYY HH:MM:SS to YYYY-MM-DD for date input
    const parts = dateString.split(' ');
    if (parts.length > 0) {
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      }
    }
    return '';
  };

  const matchesDate = (logDate, filterDate) => {
    if (!filterDate) return true;
    const logDateOnly = logDate.split(' ')[0]; // Get DD-MM-YYYY part
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const filterParts = filterDate.split('-');
    if (filterParts.length === 3) {
      const filterDateFormatted = `${filterParts[2]}-${filterParts[1]}-${filterParts[0]}`;
      return logDateOnly === filterDateFormatted;
    }
    return true;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.entryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.consumpMachines.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDevice = filterDevice === 'all' || log.machine === filterDevice;
    const matchesDateFilter = matchesDate(log.entryDate, filterDate);
    return matchesSearch && matchesDevice && matchesDateFilter;
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
    setPage(1); // Reset to first page when filters are reset
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, filterDevice, filterDate]);

  return (
    <Box className="logs-container">
      <Typography
        variant="h6"
        className="logs-title"
        style={{
          marginBottom: '20px',
          color: '#50342c',
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

      <Card className="logs-card">
        <CardContent>
          <Box className="logs-header">
            <Box className="logs-filters">
              <TextField
                placeholder="Search logs..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300, mr: 2 }}
              />
              <FormControl size="small" sx={{ minWidth: 180, mr: 2 }}>
                <InputLabel>Filter by Device</InputLabel>
                <Select
                  value={filterDevice}
                  label="Filter by Device"
                  onChange={(e) => setFilterDevice(e.target.value)}
                >
                  {devices.map((device) => (
                    <MenuItem key={device} value={device}>
                      {device === 'all' ? 'All Devices' : device}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Filter by Date"
                variant="outlined"
                size="small"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ minWidth: 180, mr: 2 }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                title="Reset Filters"
              >
                Reset
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
                  <TableCell className="log-header-cell">ENTRYDATE</TableCell>
                  <TableCell className="log-header-cell">R_Phase_VoY</TableCell>
                  <TableCell className="log-header-cell">Phase_B</TableCell>
                  <TableCell className="log-header-cell">Phase_R</TableCell>
                  <TableCell className="log-header-cell">Phase_Y</TableCell>
                  <TableCell className="log-header-cell">Phase_B</TableCell>
                  <TableCell className="log-header-cell">RY_Volta</TableCell>
                  <TableCell className="log-header-cell">YB_Volta</TableCell>
                  <TableCell className="log-header-cell">BR_Volta</TableCell>
                  <TableCell className="log-header-cell">Frequenc</TableCell>
                  <TableCell className="log-header-cell">Total_Act</TableCell>
                  <TableCell className="log-header-cell">Average_kWH</TableCell>
                  <TableCell className="log-header-cell">Consump</TableCell>
                  <TableCell className="log-header-cell">Machines</TableCell>
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
                      No logs found
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