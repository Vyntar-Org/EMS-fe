import React, { useState } from 'react';
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
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/Person';

import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ onMenuClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

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

  const handleLogoutConfirm = () => {
    setLogoutOpen(false);

    // Clear auth data if any
    localStorage.clear();

    // Redirect to login page
    navigate('/login');
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
              src="/vyntar_new.png"
              alt="Vyntar Logo"
              className="navbar-logo"
              style={{ width: '115px', verticalAlign: 'top', marginRight: '20px' }}
            />
          </div>

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

            {/* DROPDOWN MENU */}
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
          <Button onClick={handleLogoutCancel}>Cancel</Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            color="error"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Navbar;
