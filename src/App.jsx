import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import { AppRoutes } from "./routes/AppRoutes";
import { ToastProvider } from "./components/common/PremiumToast";
import { CommonDataContextProvider } from "./contexts/CommonDataContext";
import { Box } from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApplicationProvider>
          <CommonDataContextProvider>
            <ToastProvider>
              <Box
                sx={{
                  position: "fixed",
                  inset: 0,
                  border: "5px solid #0156A6",
                  pointerEvents: "none",
                  zIndex: 9999,
                }}
              />
              <AppRoutes />
            </ToastProvider>
          </CommonDataContextProvider>
        </ApplicationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
