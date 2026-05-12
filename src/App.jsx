import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import { AppRoutes } from "./routes/AppRoutes";
import { ToastProvider } from "./components/common/PremiumToast";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApplicationProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ApplicationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
