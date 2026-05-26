import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box, Toolbar } from "@mui/material";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";

export const PrivateLayout = () => {
  const { user } = useAuth();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1,
          backgroundColor: "background.default",
          minHeight: "100vh",
          ml: "70px",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </>
  );
};
