import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#FCD637",
      contrastText: "#000000",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    action: {
      active: "#FCD637",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "#2A2D34", // Dark input backgrounds like screenshot
            color: "#FFFFFF",
            "& fieldset": {
              borderColor: "transparent",
            },
            "&:hover fieldset": {
              borderColor: "#FCD637",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FCD637",
            },
            "& input::placeholder": {
              color: "#A0AAB4",
              opacity: 1,
            },
          },
        },
      },
    },
  },
});
