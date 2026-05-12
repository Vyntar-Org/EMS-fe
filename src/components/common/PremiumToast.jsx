import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: "12px",
  fontWeight: "bold",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  "& .MuiAlert-icon": {
    fontSize: "1.5rem",
  },
  ...(severity === "success" && {
    background: "linear-gradient(135deg, #4caf50, #66bb6a)",
    color: "white",
  }),
  ...(severity === "error" && {
    background: "linear-gradient(135deg, #f44336, #e57373)",
    color: "white",
  }),
  ...(severity === "warning" && {
    background: "linear-gradient(135deg, #ff9800, #ffb74d)",
    color: "white",
  }),
  ...(severity === "info" && {
    background: "linear-gradient(135deg, #0156A6, #CCC751)",
    color: "white",
  }),
}));

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  const hideToast = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <StyledAlert
          onClose={hideToast}
          severity={toast.severity}
          variant="filled"
        >
          {toast.message}
        </StyledAlert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
