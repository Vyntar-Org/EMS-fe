import React from 'react';
import { IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import './Navbar.css';

function Navbar({ onMenuClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          {isMobile && (
            <IconButton
              className="navbar-menu-button"
              onClick={onMenuClick}
              aria-label="open menu"
              sx={{
                color: '#125493',
                padding: '8px',
                marginRight: '10px',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <div className="navbar-brand">
            <h2 className="navbar-title">Energy Monitoring Dashboard</h2>
          </div>
        </div>
        {/* <div className="navbar-menu">
          <span className="navbar-user">User</span>
        </div> */}
      </div>
    </nav>
  );
}

export default Navbar;

