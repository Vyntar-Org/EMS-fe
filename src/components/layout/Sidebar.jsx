import React from "react";
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
} from "../../helpers/pageMapping.jsx";
import ResponsiveTextWrapper from "../common/ResponsiveTextWrapper.jsx";

const drawerWidth = 70;

const iconMap = {
  DashboardIcon: <DashboardIcon />,
  ListIcon: <ListIcon />,
  DescriptionIcon: <DescriptionIcon />,
  HistoryIcon: <HistoryIcon />,
  BarChartIcon: <BarChartIcon />,
  SettingsIcon: <SettingsIcon />,
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCurrentApp, selectedApp } = useApplications();

  const currentApp = getCurrentApp();
  const pages = currentApp?.pages || [];

  // Get current page code from path
  const currentPageCode = getPageCodeFromPath(location.pathname);

  // Pages come directly from API response - all pages user sees are authorized
  const visiblePages = pages;

  // Helper to get page display name
  const getPageDisplayName = (pageCode) => {
    const info = pageDisplayInfo[pageCode];
    if (info) return info.name;
    // Fallback: convert page code to readable name
    return pageCode
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper to get page icon
  const getPageIcon = (pageCode) => {
    const info = pageDisplayInfo[pageCode];
    return info?.icon || "DashboardIcon";
  };

  const handlePageClick = (pageCode) => {
    const path = getPagePath(pageCode, selectedApp);
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#fff",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          // boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          boxShadow: "none",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", mt: 1, px: 0.5 }}>
        {/* {currentApp && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                mb: 2,
                color: "#0156A6",
                fontSize: "1.5rem",
                // textAlign: "center",
              }}
            >
              {currentApp.name}
            </Typography>
            <Divider sx={{ mb: 2, backgroundColor: "rgba(10,34,62,0.2)" }} />
          </>
        )} */}

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
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: 2,
                    justifyContent: "center",
                    p: 0,
                    py: 1,
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
                        // backgroundColor: isActive
                        //   ? "rgba(204,199,81,0.2)"
                        //   : "rgba(0,0,0,0.04)",
                        // transform: "translateX(4px)",
                        // transition: "all 0.2s ease",
                      },
                      transition: "all 0.2s ease",
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
                        textAlign: "center",
                        fontSize: "9px",
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
    </Drawer>
  );
};
