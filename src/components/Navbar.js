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
  
  // Manually add the Fire & Safety application
  const addFireSafetyApp = (applications) => {
    if (!applications) return applications;
    
    // Check if Fire & Safety app already exists
    const hasFireSafety = applications.some(app => app.code === 'FIRE_SAFETY');
    
    if (!hasFireSafety) {
      // Add the Fire & Safety app
      return [
        ...applications,
        {
          code: 'FIRE_SAFETY',
          name: 'Fire & Safety',
          default_landing_page: 'machine-list'
        }
      ];
    }
    
    return applications;
  };
  
  // Load user data from context
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('fullUserData'));
    if (storedUserData) {
      // Add Fire & Safety app if not present
      const updatedUserData = {
        ...storedUserData,
        applications: addFireSafetyApp(storedUserData.applications)
      };
      setUserData(updatedUserData);
      
      // Set default active app if available and not already set
      if (updatedUserData.applications && updatedUserData.applications.length > 0 && !activeApp) {
        // Check if there's a saved active app first
        const savedApp = localStorage.getItem('activeApp');
        if (savedApp) {
          const parsedApp = JSON.parse(savedApp);
          // Verify the saved app still exists in user's applications
          const appExists = updatedUserData.applications.some(app => app.code === parsedApp.code);
          if (appExists) {
            setActiveApp(parsedApp);
            return;
          }
        }
        // If no saved app or it doesn't exist, set default
        const energyApp = updatedUserData.applications.find(app => app.code === 'ENERGY');
        setActiveApp(energyApp || updatedUserData.applications[0]);
      }
    } else {
      // Add Fire & Safety app if not present
      const updatedContextUserData = contextUserData ? {
        ...contextUserData,
        applications: addFireSafetyApp(contextUserData.applications)
      } : null;
      
      setUserData(updatedContextUserData);
      
      // Set default active app if available and not already set
      if (updatedContextUserData && updatedContextUserData.applications && updatedContextUserData.applications.length > 0 && !activeApp) {
        // Check if there's a saved active app first
        const savedApp = localStorage.getItem('activeApp');
        if (savedApp) {
          const parsedApp = JSON.parse(savedApp);
          // Verify the saved app still exists in user's applications
          const appExists = updatedContextUserData.applications.some(app => app.code === parsedApp.code);
          if (appExists) {
            setActiveApp(parsedApp);
            return;
          }
        }
        // If no saved app or it doesn't exist, set default
        const energyApp = updatedContextUserData.applications.find(app => app.code === 'ENERGY');
        setActiveApp(energyApp || updatedContextUserData.applications[0]);
      }
    }
  }, [contextUserData, activeApp, setActiveApp]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
      console.log('Refresh token for logout:', refreshToken);
      if (refreshToken) {
        await loginApi.logout(refreshToken);
      }
    } catch (error) {
      // Even if API logout fails, we should still clear local data and redirect
      console.error('Logout error:', error);
    } finally {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userData');
      localStorage.removeItem('fullUserData');
      localStorage.removeItem('activeApp');
      
      // Update auth context
      logout();
      
      // Close dialog
      setLogoutOpen(false);
      setLoggingOut(false);
      
      // Navigate to login page and reload to ensure clean state
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

          {/* APPLICATION ICONS */}
            {userData && userData.applications && (
              <div className="applications-icons" style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
                {userData.applications.map((app, index) => {
                  const isActive = activeApp && activeApp.code === app.code;
                  // Get display name for the app
                  let displayName = app.name.substring(0, 4);
                  if (app.code === 'ENERGY') {
                    displayName = 'EMS';
                  } else if (app.code === 'TEMPERATURE') {
                    displayName = 'Temperature';
                  } else if (app.code === 'FIRE_SAFETY') {
                    displayName = 'Fire & Safety';
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
                        // Set the active application
                        setActiveApp(app);
                        
                        // Navigate to the application's default landing page
                        if (app.default_landing_page) {
                          let route = app.default_landing_page.toLowerCase();
                          // Convert underscores to hyphens for URL routing
                          route = route.replace(/_/g, '-');
                          
                          // Handle different application routing
                          if (app.code === 'TEMPERATURE') {
                            navigate(`/temperature/${route}`);
                          } else if (app.code === 'FIRE_SAFETY') {
                            navigate(`/fire-safety/${route}`);
                          } else {
                            navigate(`/${route}`);
                          }
                        } else {
                          // Handle different application default routing
                          if (app.code === 'TEMPERATURE') {
                            navigate('/temperature/machine-list');
                          } else if (app.code === 'FIRE_SAFETY') {
                            navigate('/fire-safety/machine-list');
                          } else {
                            // Default to dashboard if no specific landing page
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

            {/* USER INFO DROPDOWN */}
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