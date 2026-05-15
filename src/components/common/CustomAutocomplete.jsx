import React from "react";
import { Autocomplete, TextField, Box, Typography } from "@mui/material";
import { List } from "react-window";

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
const ListboxComponent = React.forwardRef(
  function ListboxComponent(props, ref) {
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
            style={{ height: getHeight() + 2 * LISTBOX_PADDING, width: "100%" }}
            ref={gridRef}
            outerElementType={OuterElementType}
            innerElementType="ul"
            overscanCount={5}
          />
        </OuterElementContext.Provider>
      </div>
    );
  },
);

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
  placeholder = "",
  ...props
}) => {
  const getOptionLabel = (option) => {
    if (typeof option === "string") {
      return option;
    }

    return option.label || "";
  };

  const isOptionEqualToValue = (option, val) => {
    if (!val) return false;
    return option.value === val || option.value === val.value;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: fullWidth ? "100%" : "auto",
      }}
    >
      <Autocomplete
        autoComplete={false}
        multiple={multiple}
        options={options}
        onChange={(event, newValue) => onChange(newValue)}
        onBlur={onBlur}
        fullWidth={fullWidth}
        // ListboxComponent={ListboxComponent}
        value={options?.find((option) => option.value == value) || null}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            label={label}
            name={name}
            variant="outlined"
            error={!!error}
            helperText={helperText}
            InputLabelProps={{
              style: { color: "#A0AAB4" },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <li
            {...props}
            key={JSON.stringify(option)}
            style={{ padding: "20px", height: 30, minHeight: "auto" }}
          >
            <Typography
              sx={{ wordBreak: "break-all" }}
              fontSize="14px"
              color="#595959"
              fontWeight="bold"
            >
              {option.label}
            </Typography>
          </li>
        )}
        {...props}
      />
    </Box>
  );
};
