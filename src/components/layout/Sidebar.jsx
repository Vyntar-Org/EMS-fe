import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  MenuItem,
  Menu,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate, useLocation } from "react-router-dom";
import { useApplications } from "../../contexts/ApplicationContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPagePath,
  pageDisplayInfo,
  getPageCodeFromPath,
  pageComponentMap,
} from "../../helpers/pageMapping.jsx";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper.jsx";
import { Close } from "@mui/icons-material";

const drawerWidth = 70;

const iconMap = {
  DashboardIcon: <DashboardIcon />,
  ListIcon: <ListIcon />,
  DescriptionIcon: <DescriptionIcon />,
  HistoryIcon: <HistoryIcon />,
  BarChartIcon: <BarChartIcon />,
  SettingsIcon: <SettingsIcon />,
};

const MobileApplicationsSelectMenu = ({
  applications,
  selectedApp,
  handleAppChange,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileSelect = (event, appCode) => {
    handleAppChange(event, appCode);
    handleMenuClose();
  };

  const currentApp =
    applications.find((app) => app.code === selectedApp) || applications[0];

  return (
    <>
      <Button
        id="premium-menu-button"
        aria-controls={isMenuOpen ? "premium-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? "true" : undefined}
        onClick={handleMenuOpen}
        endIcon={
          <span
            style={{
              fontSize: "0.75rem",
              transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </span>
        }
        sx={{
          py: 0.5,

          textTransform: "none",
          fontSize: "0.92rem",
          fontWeight: 700,
          color: "#0156A6",
          backgroundColor: "rgba(1, 86, 166, 0.05)",
          borderRadius: "8px",
          border: "1px solid rgba(1, 86, 166, 0.12)",
          width: "100%",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          "&:hover": {
            backgroundColor: "rgba(1, 86, 166, 0.08)",
          },
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 500,
              opacity: 0.6,
              color: "#0156A6",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Application
          </span>
          {currentApp?.name}
        </Box>
      </Button>

      <Menu
        id="premium-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "premium-menu-button",
        }}
        PaperProps={{
          sx: {
            width: "70%",
            mt: 0.5,
            borderRadius: "14px",
            boxShadow: "0px 10px 30px rgba(1, 86, 166, 0.12)",
            border: "1px solid rgba(1, 86, 166, 0.06)",
            background: "#FFFFFF",
          },
        }}
      >
        {applications.map((app) => {
          const isSelected = selectedApp === app.code;
          return (
            <MenuItem
              key={app.code}
              selected={isSelected}
              onClick={(e) => handleMobileSelect(e, app.code)}
              sx={{
                py: 1.5,
                px: 2.5,
                mx: 0.5,
                my: 0.2,
                borderRadius: "8px",
                color: isSelected ? "#0156A6" : "rgba(0,0,0,0.75)",

                transition: "all 0.15s ease",

                "&.Mui-selected": {
                  backgroundColor: "rgba(245, 213, 71, 0.2)",
                  color: "#0156A6",
                  "&:hover": {
                    backgroundColor: "rgba(245, 213, 71, 0.3)",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(1, 86, 166, 0.04)",
                },
              }}
            >
              <ResponsiveTextWrapper
                fontSize="0.92rem"
                fontWeight={isSelected ? 700 : 500}
                value={app.name}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, handleAppChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCurrentApp, selectedApp, applications } = useApplications();

  const currentApp = getCurrentApp();
  const pages = currentApp?.pages || [];

  const currentPageCode = getPageCodeFromPath(location.pathname);

  const visiblePages = pages;

  const getPageDisplayName = (pageCode) => {
    const info = pageDisplayInfo[pageCode];
    if (info) return info.name;
    return pageCode
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getPageIcon = (pageCode) => {
    const info = pageDisplayInfo[pageCode];
    return info?.icon || "DashboardIcon";
  };

  const handlePageClick = (pageCode) => {
    const path = getPagePath(pageCode, selectedApp);
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleMobileClose = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: "auto", mt: 1, px: 0.5 }}>
      <List disablePadding>
        {visiblePages.length > 0 ? (
          visiblePages.map((pageCode) => {
            const displayName = getPageDisplayName(pageCode);
            const iconName = getPageIcon(pageCode);
            const isActive = pageCode === currentPageCode;

            return (
              <ListItem
                button
                key={pageCode}
                onClick={() => handlePageClick(pageCode)}
                sx={{
                  mb: 0,
                  flexDirection: { sm: "column" },
                  alignItems: "center",
                  borderRadius: 2,
                  justifyContent: "center",
                  p: { sm: 0 },
                  py: { sm: 1 },
                  backgroundColor: isActive ? "#f1ea182c" : "transparent",
                  border: isActive ? "1px solid rgb(245, 213, 71)" : "none",
                  ":hover": {
                    backgroundColor: isActive ? "#f1ea182c" : "transparent",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#0156A6",
                    minWidth: 0,
                    transition: "color 0.2s ease",
                    borderRadius: 2,
                    "&:hover": {
                      background: "transparent",
                    },
                  }}
                >
                  {iconMap[iconName] || <DashboardIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={<ResponsiveTextWrapper value={displayName} />}
                  sx={{
                    width: "100%",
                    "& .MuiTypography-root": {
                      fontWeight: isActive ? 1000 : 400,
                      color: "#0156A6",
                      transition: "color 0.2s ease",
                      textAlign: { sm: "center" },
                      fontSize: { xs: "12px", sm: "9px" },
                      ml: { xs: 0.5, sm: 0 },
                    },
                  }}
                />
              </ListItem>
            );
          })
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 2, textAlign: "center" }}
          >
            No pages available
          </Typography>
        )}
      </List>
    </Box>
  );

  return (
    <Box component="nav">
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={handleMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          [`& .MuiDrawer-paper`]: {
            width: "95%",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderRight: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "4px 0 12px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Toolbar />

        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            width: "100%",
            justifyContent: "space-between",
            p: 0.5,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <MobileApplicationsSelectMenu
            applications={applications}
            handleAppChange={handleAppChange}
            selectedApp={selectedApp}
          />

          <IconButton color="primary" onClick={() => setIsMobileOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderRight: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "none",
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </Box>
  );
};
