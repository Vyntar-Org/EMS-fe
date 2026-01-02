import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton, Drawer, useMediaQuery, useTheme, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Sidebar.css';

function Sidebar({ mobileOpen: controlledMobileOpen, onClose, visible = false, onSidebarHide }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const mobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;

  const handleDrawerToggle = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalMobileOpen(!internalMobileOpen);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile && mobileOpen) {
      if (onClose) {
        onClose();
      } else {
        setInternalMobileOpen(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  
  const menuItems = [
    { id: 1, name: 'Dashboard', path: '/', icon: 'home' },
    { id: 2, name: 'Machine List', path: '/machine-list', icon: 'list' },
    { id: 3, name: 'Equipment Insight', path: '/equipment-insight', icon: 'paper-plane' },
    { id: 4, name: 'Analytics', path: '/analytics', icon: 'bar-chart' },
    { id: 5, name: 'Logs', path: '/logs', icon: 'file-text' },
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'list':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        );
      case 'paper-plane':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        );
      case 'bar-chart':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        );
      case 'file-text':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  const sidebarContent = (
    <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : ''}`}>
      <div className="sidebar-container">
        {isMobile && (
          <div className="sidebar-mobile-header">
            <Typography variant="h6" className="sidebar-mobile-title">
              Menu
            </Typography>
            <IconButton
              onClick={handleDrawerToggle}
              className="sidebar-close-button"
              aria-label="close menu"
            >
              <CloseIcon />
            </IconButton>
          </div>
        )}
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id} className="sidebar-item">
                <Link 
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={isMobile ? handleDrawerToggle : () => { if (typeof onSidebarHide === 'function') onSidebarHide(); }}
                >
                  <span className="sidebar-icon">{getIcon(item.icon)}</span>
                  <span className="sidebar-text">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`sidebar-wrapper ${visible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
          {sidebarContent}
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 250,
              top: '60px',
              height: 'calc(100vh - 60px)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;

