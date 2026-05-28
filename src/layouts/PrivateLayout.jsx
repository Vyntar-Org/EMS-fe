import React, { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box, Toolbar } from "@mui/material";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { useApplications } from "../contexts/ApplicationContext";
import { getPagePath, pageComponentMap } from "../helpers/pageMapping";

export const PrivateLayout = () => {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { applications, switchApp } = useApplications();
  const navigate = useNavigate();

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

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header
        setIsMobileOpen={setIsMobileOpen}
        isMobileOpen={isMobileOpen}
        handleAppChange={handleAppChange}
      />
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        handleAppChange={handleAppChange}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1,
          backgroundColor: "background.default",
          minHeight: "100vh",
          ml: { sm: "70px" },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </>
  );
};
