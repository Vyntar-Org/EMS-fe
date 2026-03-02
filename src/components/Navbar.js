import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  ListItemIcon,
  CircularProgress,
  ListItemText,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/Person';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import loginApi from '../auth/LoginApi';
import './Navbar.css';

function Navbar({ onMenuClick, activeApp, setActiveApp }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);
  const { logout, userData: contextUserData } = useAuth();
  
  // State for mobile application menu
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [appMenuAnchor, setAppMenuAnchor] = useState(null);
    
  // Load user data from context
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('fullUserData'));
    if (storedUserData) {
      setUserData(storedUserData);
      
      if (storedUserData.applications && storedUserData.applications.length > 0 && !activeApp) {
        const savedApp = localStorage.getItem('activeApp');
        if (savedApp) {
          const parsedApp = JSON.parse(savedApp);
          const appExists = storedUserData.applications.some(app => app.code === parsedApp.code);
          if (appExists) {
            setActiveApp(parsedApp);
            return;
          }
        }
        const energyApp = storedUserData.applications.find(app => app.code === 'ENERGY');
        setActiveApp(energyApp || storedUserData.applications[0]);
      }
    } else {
      setUserData(contextUserData);
      
      if (contextUserData && contextUserData.applications && contextUserData.applications.length > 0 && !activeApp) {
        const savedApp = localStorage.getItem('activeApp');
        if (savedApp) {
          const parsedApp = JSON.parse(savedApp);
          const appExists = contextUserData.applications.some(app => app.code === parsedApp.code);
          if (appExists) {
            setActiveApp(parsedApp);
            return;
          }
        }
        const energyApp = contextUserData.applications.find(app => app.code === 'ENERGY');
        setActiveApp(energyApp || contextUserData.applications[0]);
      }
    }
  }, [contextUserData, activeApp, setActiveApp]);

  const handleMenuOpen = (event) => {
    if (isMobile) {
      setAppMenuAnchor(event.currentTarget);
      setAppMenuOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleAppMenuClose = () => {
    setAppMenuAnchor(null);
    setAppMenuOpen(false);
  };
  
  const handleAppSelection = (app) => {
    setActiveApp(app);
    handleAppMenuClose();
    
    if (app.default_landing_page) {
      let route = app.default_landing_page.toLowerCase();
      route = route.replace(/_/g, '-');
                
      if (app.code === 'TEMPERATURE') {
        navigate(`/temperature/${route}`);
      } else if (app.code === 'FIRE-SAFETY') {
        navigate(`/fire-safety/${route}`);
      } else if (app.code === 'WATER') {
        navigate(`/water/${route}`);
      } else if (app.code === 'FUEL') {
        navigate(`/fuel/${route}`);
      } else if (app.code === 'SOLAR') {
        navigate(`/solar/${route}`);
      } else if (app.code === 'COMPRESSOR') {
        navigate(`/compressor/${route}`);
      } else {
        navigate(`/${route}`);
      }
    } else {
      if (app.code === 'TEMPERATURE') {
        navigate('/temperature/machine-list');
      } else if (app.code === 'FIRE-SAFETY') {
        navigate('/fire-safety/machine-list');
      } else if (app.code === 'WATER') {
        navigate('/water/dashboard');
      } else if (app.code === 'FUEL') {
        navigate('/fuel/dashboard');
      } else if (app.code === 'SOLAR') {
        navigate('/solar/machine-list');
      } else if (app.code === 'COMPRESSOR') {
        navigate('/compressor/machine-list');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleLogoutClick = () => {
    setAnchorEl(null);
    setLogoutOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await loginApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userData');
      localStorage.removeItem('fullUserData');
      localStorage.removeItem('activeApp');
      
      logout();
      
      setLogoutOpen(false);
      setLoggingOut(false);
      
      navigate('/login');
      window.location.reload();
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            {isMobile && (
              <IconButton
                onClick={onMenuClick}
                sx={{ color: '#0156a6', mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <img
              src="/Vyntax_Logo_PNG.png"
              alt="Vyntar Logo"
              className="navbar-logo"
              style={{ width: '115px', verticalAlign: 'top', marginRight: '20px', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            />
          </div>

          {/* APPLICATION ICONS - HIDE ON MOBILE */}
          {!isMobile && userData && userData.applications && (
            <div className="applications-icons" style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
              {userData.applications.map((app, index) => {
                const isActive = activeApp && activeApp.code === app.code;
                let displayName = app.name.substring(0, 4);
                if (app.code === 'ENERGY') {
                  displayName = 'EMS';
                } else if (app.code === 'TEMPERATURE') {
                  displayName = 'Temperature';
                } else if (app.code === 'FIRE-SAFETY') {
                  displayName = 'Fire & Safety';
                } else if (app.code === 'WATER') {
                  displayName = 'Water';
                } else if (app.code === 'FUEL') {
                  displayName = 'Fuel';
                } else if (app.code === 'SOLAR') {
                  displayName = 'Solar';
                } else if (app.code === 'COMPRESSOR') {
                  displayName = 'Compressor';
                }
                                  
                return (
                  <div 
                    key={index}
                    title={`${app.name} Application`}
                    style={{
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      minWidth: '60px',
                      textAlign: 'center',
                      borderBottom: isActive ? '2px solid #f5d547' : '2px solid transparent',
                    }}
                    onClick={() => {
                      setActiveApp(app);
                                        
                      if (app.default_landing_page) {
                        let route = app.default_landing_page.toLowerCase();
                        route = route.replace(/_/g, '-');
                                          
                        if (app.code === 'TEMPERATURE') {
                          navigate(`/temperature/${route}`);
                        } else if (app.code === 'FIRE-SAFETY') {
                          navigate(`/fire-safety/${route}`);
                        } else if (app.code === 'WATER') {
                          navigate(`/water/${route}`);
                        } else if (app.code === 'FUEL') {
                          navigate(`/fuel/${route}`);
                        } else if (app.code === 'SOLAR') {
                          navigate(`/solar/${route}`);
                        } else if (app.code === 'COMPRESSOR') {
                          navigate(`/compressor/${route}`);
                        } else {
                          navigate(`/${route}`);
                        }
                      } else {
                        if (app.code === 'TEMPERATURE') {
                          navigate('/temperature/machine-list');
                        } else if (app.code === 'FIRE-SAFETY') {
                          navigate('/fire-safety/machine-list');
                        } else if (app.code === 'WATER') {
                          navigate('/water/dashboard');
                        } else if (app.code === 'FUEL') {
                          navigate('/fuel/dashboard');
                        } else if (app.code === 'SOLAR') {
                          navigate('/solar/machine-list');
                        } else if (app.code === 'COMPRESSOR') {
                          navigate('/compressor/machine-list');
                        } else {
                          navigate('/dashboard');
                        }
                      }
                    }}
                  >
                    {displayName}
                  </div>
                );
              })}
            </div>
          )}

          {/* USER ICON */}
          <div className="navbar-menu">
            <IconButton onClick={handleMenuOpen}>
              <Avatar
                sx={{
                  bgcolor: '#0156a6',
                  width: 36,
                  height: 36,
                  fontSize: 14,
                }}
              >
                <PersonIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Avatar>
            </IconButton>

            {/* USER INFO DROPDOWN - HIDE ON MOBILE */}
            {!isMobile && (
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    width: 180,
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem onClick={() => navigate('/profile')}>
                  <ListItemIcon>
                    <PersonOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>

                <MenuItem onClick={() => navigate('/settings')}>
                  <ListItemIcon>
                    <SettingsOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogoutClick}>
                  <ListItemIcon>
                    <LogoutOutlinedIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            )}
            
            {/* APPLICATIONS MENU FOR MOBILE */}
            {isMobile && (
              <Menu
                anchorEl={appMenuAnchor}
                open={appMenuOpen}
                onClose={handleAppMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    width: 200,
                    borderRadius: 2,
                  },
                }}
              >
                {userData && userData.applications && userData.applications.map((app, index) => {
                  const isActive = activeApp && activeApp.code === app.code;
                  let displayName = app.name;
                  if (app.code === 'ENERGY') {
                    displayName = 'EMS';
                  } else if (app.code === 'TEMPERATURE') {
                    displayName = 'Temperature';
                  } else if (app.code === 'FIRE-SAFETY') {
                    displayName = 'Fire & Safety';
                  } else if (app.code === 'WATER') {
                    displayName = 'Water';
                  } else if (app.code === 'FUEL') {
                    displayName = 'Fuel';
                  } else if (app.code === 'SOLAR') {
                    displayName = 'Solar';
                  } else if (app.code === 'COMPRESSOR') {
                    displayName = 'Compressor';
                  }
                  
                  return (
                    <MenuItem 
                      key={index}
                      onClick={() => handleAppSelection(app)}
                      selected={isActive}
                    >
                      <ListItemText primary={displayName} />
                    </MenuItem>
                  );
                })}

                <MenuItem onClick={() => navigate('/profile')}>
                  Profile
                </MenuItem>

                <MenuItem onClick={() => navigate('/settings')}>
                  Settings
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={handleLogoutClick}>
                  <ListItemIcon>
                    <LogoutOutlinedIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            )}
          </div>
        </div>  
      </nav>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog open={logoutOpen} onClose={handleLogoutCancel}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} disabled={loggingOut}>Cancel</Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            color="error"
            disabled={loggingOut}
          >
            {loggingOut ? <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} /> : null}
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Navbar;