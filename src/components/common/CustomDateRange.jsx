import React from 'react';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export const CustomDateRange = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
}) => {
  const datePickerStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: '#2A2D34',
      color: '#FFFFFF',
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: '#FCD637',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FCD637',
      },
      '& .MuiSvgIcon-root': {
        color: '#A0AAB4',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#A0AAB4',
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {label && <Typography variant="caption" sx={{ color: '#A0AAB4' }}>{label}</Typography>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={onStartDateChange}
            slotProps={{ textField: { sx: datePickerStyles } }}
          />
          <Typography sx={{ color: '#A0AAB4' }}>to</Typography>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={onEndDateChange}
            slotProps={{ textField: { sx: datePickerStyles } }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
