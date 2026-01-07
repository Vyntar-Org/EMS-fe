import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    PowerSettingsNew as PowerIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MachineList = ({ onSidebarToggle, sidebarVisible }) => {
    const navigate = useNavigate();

    // Machine data from the image
    const [machines, setMachines] = useState([
        { id: 1, name: 'Machine - 1', status: true, kw: 1653.34, kwh: 1057.89 },
        { id: 2, name: 'Machine - 2', status: false, kw: 1383.94, kwh: 1287.09 },
        { id: 3, name: 'Machine - 3', status: true, kw: 1555.34, kwh: 1157.89 }
    ]);

    // Toggle machine status
    const handleToggleStatus = (id) => {
        setMachines(machines.map(machine =>
            machine.id === id ? { ...machine, status: !machine.status } : machine
        ));
    };

    // Define styles
    const styles = {
        mainContent: {
            width: '100%',
            minHeight: 'auto',
            // backgroundColor: '#f4f7f6',
            fontFamily: '"Ubuntu", sans-serif',
            fontSize: '14px',
            color: '#5A5A5A',
            marginBottom: '20px',
        },
        container: {
            // padding: '0 15px',
        },
        blockHeader: {
            padding: '10px 0',
        },
        headerTitle: {
            margin: '0',
            fontSize: '24px',
            fontWeight: '400',
            color: '#515151',
        },
        tableCard: {
            backgroundColor: '#fff',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            padding: '15px',
            marginTop: '20px',
        },
        statusChip: {
            fontWeight: 'bold',
            fontSize: '12px',
        },
        actionButton: {
            margin: '0 5px',
        },
        tableHeader: {
            backgroundColor: '#e9ecef',
            fontWeight: 'bold',
        },
        tableRow: {
            '&:hover': {
                backgroundColor: '#f9f9f9',
            },
        },
        activeStatus: {
            color: '#30b44a',
            backgroundColor: '#e8f9e6',
        },
        inactiveStatus: {
            color: '#e34d4d',
            backgroundColor: '#fae8e8',
        }
    };

    return (
        <Box style={styles.mainContent} id="main-content">
            <Box style={styles.blockHeader} className="block-header mb-1">
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
                          Machine List
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
            <Box style={styles.container}>
                

                {/* Machine List Table */}
                <Card style={styles.tableCard}>
                    <CardContent style={{ padding: 0, lineHeight: '50%' }}>
                        <TableContainer component={Paper} elevation={0}>
                            <Table style={{ marginTop: "20px" }}>
                                <TableHead>
                                    <TableRow style={styles.tableHeader}>
                                        <TableCell style={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell style={{ fontWeight: 'bold' }}>Name</TableCell>
                                        <TableCell style={{ fontWeight: 'bold' }}>KW</TableCell>
                                        <TableCell style={{ fontWeight: 'bold' }}>KWH</TableCell>
                                        <TableCell style={{ fontWeight: 'bold' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {machines.map((machine) => (
                                        <TableRow key={machine.id} style={styles.tableRow}>
                                            <TableCell>
                                                <Chip
                                                    label={machine.status ? 'ON' : 'OFF'}
                                                    size="small"
                                                    style={machine.status ? styles.activeStatus : styles.inactiveStatus}
                                                />
                                            </TableCell>
                                            <TableCell>{machine.name}</TableCell>
                                            <TableCell>{machine.kw}</TableCell>
                                            <TableCell>{machine.kwh}</TableCell>
                                            <TableCell
                                                style={{ color: "#007bff", cursor: "pointer" }}
                                                onClick={() => navigate("/equipment-insight")}
                                            >
                                                <i className="fa-solid fa-desktop"></i>
                                            </TableCell>

                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default MachineList;