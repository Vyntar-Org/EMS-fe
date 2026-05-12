import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullScreen ? '100vh' : '100%',
        width: '100%',
        flex: 1,
      }}
    >
      <CircularProgress sx={{ color: 'primary.main', mb: 2 }} />
      <Typography variant="body1" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};
