import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton, Drawer, useMediaQuery, useTheme, Typography, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SummarizeIcon from '@mui/icons-material/Summarize';
import './Sidebar.css';

function Sidebar({ mobileOpen, onClose, visible, onSidebarHide, onSidebarToggle, activeApp }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = activeApp ? (
    activeApp.code === 'TEMPERATURE' ? [
      { id: 1, name: 'Device Hub', path: '/temperature/machine-list', icon: 'list' },
      { id: 2, name: 'Analytics', path: '/temperature/analytics', icon: 'bar-chart' },
      { id: 3, name: 'Logs', path: '/temperature/logs', icon: 'file-text' },
    ] : activeApp.code === 'FIRE-SAFETY' ? [
      { id: 1, name: 'Device Hub', path: '/fire-safety/machine-list', icon: 'list' },
      { id: 2, name: 'Analytics', path: '/fire-safety/analytics', icon: 'bar-chart' },
      { id: 3, name: 'Logs', path: '/fire-safety/logs', icon: 'file-text' },
    ] : activeApp.code === 'WATER' ? [
      { id: 1, name: 'Dashboard', path: '/water/dashboard', icon: 'home' },
      { id: 2, name: 'Device Hub', path: '/water/machine-list', icon: 'list' },
      { id: 3, name: 'Analytics', path: '/water/analytics', icon: 'bar-chart' },
      { id: 4, name: 'Logs', path: '/water/logs', icon: 'file-text' },
      { id: 5, name: 'Reports', path: '/water/reports', icon: 'reports' },
    ] : activeApp.code === 'FUEL' ? [
      { id: 1, name: 'Dashboard', path: '/fuel/dashboard', icon: 'home' },
      { id: 2, name: 'Device Hub', path: '/fuel/machine-list', icon: 'list' },
      { id: 3, name: 'Analytics', path: '/fuel/analytics', icon: 'bar-chart' },
      { id: 4, name: 'Logs', path: '/fuel/logs', icon: 'file-text' },
      { id: 5, name: 'Reports', path: '/fuel/reports', icon: 'reports' },
    ] : activeApp.code === 'SOLAR' ? [
      { id: 1, name: 'Device Hub', path: '/solar/machine-list', icon: 'list' },
      { id: 2, name: 'Analytics', path: '/solar/analytics', icon: 'bar-chart' },
      { id: 3, name: 'Logs', path: '/solar/logs', icon: 'file-text' },
    ] : activeApp.code === 'COMPRESSOR' ? [
      { id: 1, name: 'Device Hub', path: '/compressor/machine-list', icon: 'list' },
      { id: 2, name: 'Analytics', path: '/compressor/analytics', icon: 'bar-chart' },
      { id: 3, name: 'Logs', path: '/compressor/logs', icon: 'file-text' },
    ] : [ // Default (ENERGY)
      { id: 1, name: 'Dashboard', path: '/dashboard', icon: 'home' },
      { id: 2, name: 'Device Hub', path: '/machine-list', icon: 'list' },
      { id: 3, name: 'Analytics', path: '/analytics', icon: 'bar-chart' },
      { id: 4, name: 'Logs', path: '/logs', icon: 'file-text' },
      { id: 5, name: 'Reports', path: '/reports', icon: 'reports' },
    ]
  ) : [ // Fallback if activeApp is null
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: 'home' },
    { id: 2, name: 'Device Hub', path: '/machine-list', icon: 'list' },
    { id: 3, name: 'Analytics', path: '/analytics', icon: 'bar-chart' },
    { id: 4, name: 'Logs', path: '/logs', icon: 'file-text' },
    { id: 5, name: 'Reports', path: '/reports', icon: 'reports' },
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
      case 'list': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>;
      case 'bar-chart': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
      case 'file-text': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
      case 'reports': return <SummarizeIcon fontSize="small" />;
      default: return null;
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : ''}`}>
      <div className="sidebar-container">
        {isMobile && (
          <div className="sidebar-mobile-header">
            <Typography variant="h6" className="sidebar-mobile-title">Menu</Typography>
            <IconButton onClick={onClose} className="sidebar-close-button" aria-label="close menu">
              <CloseIcon />
            </IconButton>
          </div>
        )}
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const truncatedName = item.name.length > 17 ? item.name.substring(0, 17) + '...' : item.name;
            const linkContent = (
              <Link 
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">{getIcon(item.icon)}</span>
                <span className="sidebar-text">{item.name}</span>
                {!isMobile && !visible && (
                  <span className="sidebar-text-truncated">{truncatedName}</span>
                )}
              </Link>
            );

            return (
              <li key={item.id} className="sidebar-item">
                {!isMobile && !visible ? (
                  <Tooltip title={item.name} placement="right" arrow>{linkContent}</Tooltip>
                ) : (
                  linkContent
                )}
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
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250, top: '5px', height: 'calc(100vh - 60px)'},
          }}
        >
          {sidebarContent}
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;