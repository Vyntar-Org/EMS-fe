import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
      }}
    >
      <Typography variant="h3" color="error">
        403
      </Typography>
      <Typography variant="h6">Unauthorized Access</Typography>
      <Typography variant="body1">
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/")}>
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default Unauthorized;
