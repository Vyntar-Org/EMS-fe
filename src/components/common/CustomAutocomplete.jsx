import React from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { List } from 'react-window';

const LISTBOX_PADDING = 8; // px

function renderRow(props) {
  const { data, index, style } = props;
  const dataRow = data[index];
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  };

  return (
    <Typography component="li" {...dataRow[0]} noWrap style={inlineStyle}>
      {dataRow[1]}
    </Typography>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window to MUI Autocomplete
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const itemCount = itemData.length;
  const itemSize = 48;

  const getChildSize = () => {
    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemCount * itemSize;
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <List
          rowCount={itemCount}
          rowHeight={itemSize}
          rowComponent={renderRow}
          rowProps={{ data: itemData }}
          style={{ height: getHeight() + 2 * LISTBOX_PADDING, width: '100%' }}
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          overscanCount={5}
        />
      </OuterElementContext.Provider>
    </div>
  );
});

export const CustomAutocomplete = ({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  name,
  error,
  helperText,
  fullWidth = true,
  multiple = false,
  ...props
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
      <Autocomplete
        multiple={multiple}
        options={options}
        value={value}
        onChange={(event, newValue) => onChange(newValue)}
        onBlur={onBlur}
        fullWidth={fullWidth}
        ListboxComponent={ListboxComponent}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            name={name}
            variant="outlined"
            error={!!error}
            helperText={helperText}
            InputLabelProps={{
              style: { color: '#A0AAB4' },
            }}
            sx={{
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
              },
              '& .MuiSvgIcon-root': {
                color: '#A0AAB4',
              },
            }}
          />
        )}
        renderOption={(props, option) => [props, option.label]}
        // Disable built-in filtering if options are already filtered externally
        // filterOptions={(x) => x} 
        {...props}
      />
    </Box>
  );
};
