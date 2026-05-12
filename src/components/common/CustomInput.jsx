import React from 'react';
import { TextField, Box } from '@mui/material';

export const CustomInput = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
  helperText,
  type = 'text',
  placeholder,
  fullWidth = true,
  icon,
  ...props
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        variant="outlined"
        label={label}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={!!error}
        helperText={helperText}
        placeholder={placeholder}
        fullWidth={fullWidth}
        InputLabelProps={{
          style: { color: '#A0AAB4' },
        }}
        InputProps={{
          endAdornment: icon,
        }}
        {...props}
      />
    </Box>
  );
};
