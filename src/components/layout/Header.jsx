import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../contexts/AuthContext";
import { useApplications } from "../../contexts/ApplicationContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getPagePath, pageComponentMap } from "../../helpers/pageMapping.jsx";
import PremiumModal from "../common/PremiumModal";

export const Header = () => {
  const { user, logout } = useAuth();
  const { applications, selectedApp, switchApp, getCurrentApp } =
    useApplications();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleUserClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setAnchorEl(null);
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutModalOpen(false);
    logout();
    navigate("/login");
  };

  const handleAppChange = (event, newAppCode) => {
    switchApp(newAppCode);
    const app = applications.find((a) => a.code === newAppCode);
    if (app) {
      const defaultPage =
        app.default_landing_page ||
        app.pages?.find((pageCode) => pageComponentMap[pageCode]) ||
        app.pages?.[0] ||
        "DASHBOARD";
      const path = getPagePath(defaultPage, newAppCode);
      navigate(path);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#fff",
          color: "#fff",
          // boxShadow: "0 4px 20px rgba(112, 112, 112, 0.2)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
            <img
              src="/assets/vyntar-logo-full.png"
              alt="Vyntar Logo"
              style={{ height: "40px", width: "auto" }}
            />
          </Box>

          {/* Application Tabs */}
          {applications.length > 0 && (
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "rgba(255,255,255,0.2)",
                flex: 1,
                display: "flex",
                justifyContent: "end",
              }}
            >
              <Tabs
                value={selectedApp}
                onChange={handleAppChange}
                variant="scrollable"
                scrollButtons="auto"
                // sx={{
                //   "& .MuiTab-root": {
                //     textTransform: "none",
                //     fontSize: "0.95rem",
                //     fontWeight: 600,
                //     color: "#0156A6",
                //     "&.Mui-selected": {
                //       color: "#CCC751",
                //       fontWeight: "bold",
                //     },
                //   },
                //   "& .MuiTabs-indicator": {
                //     backgroundColor: "#CCC751",
                //   },
                // }}
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: "0.95rem",

                    color: "#0156A6",
                    minHeight: "48px",
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "#0156A6",
                      fontWeight: 1000,
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#CCC751",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                {applications.map((app) => (
                  <Tab
                    sx={{
                      "&.Mui-selected": {
                        background: "#f1ea182c",
                      },
                    }}
                    key={app.code}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {app.name}
                      </Box>
                    }
                    value={app.code}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* User Icon */}
          <Box sx={{ ml: "auto" }}>
            <IconButton onClick={handleUserClick} sx={{ color: "#fff" }}>
              <Avatar sx={{ bgcolor: "#0156A6" }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPopover-paper": {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            overflow: "hidden",
          },
        }}
      >
        <List sx={{ minWidth: 200, pb: 0 }}>
          <ListItem>
            <ListItemText
              primary={`Welcome, ${user?.name || user?.username || "User"}`}
              primaryTypographyProps={{
                fontWeight: 700,
                textAlign: "center",
                fontSize: "14px",
                color: "text.secondary",
              }}
            />
          </ListItem>
        </List>

        <Box sx={{ p: 2, pt: 1 }}>
          <Button
            disableElevation
            size="small"
            fullWidth
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            sx={{
              backgroundColor: "#d32f2f",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Popover>

      {/* Logout Confirmation Modal */}
      <PremiumModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        content="Are you sure you want to logout?"
        onConfirm={handleLogoutConfirm}
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  );
};
