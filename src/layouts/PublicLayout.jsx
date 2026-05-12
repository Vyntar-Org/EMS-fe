import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useApplications } from "../contexts/ApplicationContext";
import { getPagePath, pageComponentMap } from "../helpers/pageMapping.jsx";
import { Box } from "@mui/material";

export const PublicLayout = () => {
  const { user } = useAuth();
  const { applications, selectedApp, appLoading } = useApplications();

  const activeAppCode = selectedApp || applications?.[0]?.code;
  const currentApp = applications.find((app) => app.code === activeAppCode);
  const defaultPage = currentApp?.pages?.find(
    (pageCode) => pageComponentMap[pageCode],
  );
  const defaultPath = defaultPage
    ? getPagePath(defaultPage, activeAppCode)
    : "/login";

  if (user && !appLoading) {
    return <Navigate to={defaultPath} replace />;
  }

  if (user && appLoading) {
    return null;
  }

  return (
    <Box
      sx={{
        border: "5px solid #0156A6",
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: "url(/assets/login-background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // backgroundColor: "rgba(103, 103, 103, 0.4)", // Dark overlay for better visibility
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
