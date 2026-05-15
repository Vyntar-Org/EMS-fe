import { Error } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import React from "react";

const NoDataFound = ({ message = "No data available", icon }) => {
  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ opacity: 0.6 }}
      color="warning.main"
    >
      {icon || <Error sx={{ fontSize: { sm: 40, md: 55 } }} />}
      <Typography
        textAlign="center"
        fontSize={{ md: "1.25rem" }}
        fontWeight="bolder"
      >
        {message}
      </Typography>
    </Box>
  );
};

export default NoDataFound;
