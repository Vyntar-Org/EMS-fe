import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  //   palette: {
  //     mode: "light",
  //     primary: {
  //       main: "#FCD637",
  //       contrastText: "#000000",
  //     },
  //     background: {
  //       default: "#F5F7FA",
  //       paper: "#FFFFFF",
  //     },
  //     action: {
  //       active: "#FCD637",
  //     },
  //   },
  //   typography: {
  //     fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  //     button: {
  //       textTransform: "none",
  //       fontWeight: 600,
  //     },
  //   },
  components: {
    // MuiButton: {
    //   styleOverrides: {
    //     root: {
    //       borderRadius: 8,
    //       padding: "10px 24px",
    //     },
    //   },
    // },
    // MuiTextField: {
    //   styleOverrides: {
    //     root: {
    //       "& .MuiOutlinedInput-root": {
    //         borderRadius: 8,
    //         backgroundColor: "#2A2D34",
    //         color: "#FFFFFF",
    //         "& fieldset": {
    //           borderColor: "transparent",
    //         },
    //         "&:hover fieldset": {
    //           borderColor: "#FCD637",
    //         },
    //         "&.Mui-focused fieldset": {
    //           borderColor: "#FCD637",
    //         },
    //         "& input::placeholder": {
    //           color: "#A0AAB4",
    //           opacity: 1,
    //         },
    //       },
    //     },
    //   },
    // },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1A1A1A",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 500,
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        arrow: {
          color: "#1A1A1A",
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "#f3f2f7",
          borderRadius: 8,
          "&::after": {
            background:
              "linear-gradient(90deg, transparent, #FFFFFF, transparent)",
          },
        },
      },
      defaultProps: {
        animation: "wave",
      },
    },
  },
});
