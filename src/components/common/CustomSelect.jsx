import React from 'react';
import { CustomAutocomplete } from './CustomAutocomplete';

export const CustomSelect = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
  helperText,
  options = [],
  fullWidth = true,
  ...props
}) => {
  // We use the virtualized Autocomplete to handle the Select functionality with virtualization
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <CustomAutocomplete
      label={label}
      options={options}
      value={selectedOption}
      onChange={(val) => onChange({ target: { value: val ? val.value : '' } })}
      fullWidth={fullWidth}
      disableClearable
      {...props}
    />
  );
};
