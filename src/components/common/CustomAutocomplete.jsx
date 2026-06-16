import React from 'react';
import {
	Autocomplete,
	TextField,
	Box,
	Typography,
	useTheme,
	useMediaQuery,
	styled,
	Popper,
	autocompleteClasses,
	Checkbox,
} from '@mui/material';
import { List, useListRef } from 'react-window';
import { CheckBox, CheckBoxOutlineBlankOutlined } from '@mui/icons-material';

const LISTBOX_PADDING = 8; // px

function RowComponent({ index, itemData, style }) {
	const dataSet = itemData[index];
	const inlineStyle = {
		...style,
		top: (style.top ?? 0) + LISTBOX_PADDING,
	};

	if ('group' in dataSet) {
		return (
			<ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
				{dataSet.group}
			</ListSubheader>
		);
	}

	const { key, ...optionProps } = dataSet[0];

	return (
		<Typography
			key={key}
			component="li"
			{...optionProps}
			noWrap
			style={inlineStyle}
		>
			{dataSet[1]}
		</Typography>
	);
}

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
		const { children, internalListRef, onItemsBuilt, ...other } = props;
		const itemData = [];
		const optionIndexMap = React.useMemo(() => new Map(), []);

		children.forEach((item) => {
			itemData.push(item);
			if ('children' in item && Array.isArray(item.children)) {
				itemData.push(...item.children);
			}
		});

		itemData.forEach((item, index) => {
			if (Array.isArray(item) && item[1]) {
				optionIndexMap.set(item[1], index);
			}
		});

		React.useEffect(() => {
			if (onItemsBuilt) {
				onItemsBuilt(optionIndexMap);
			}
		}, [onItemsBuilt, optionIndexMap]);

		const theme = useTheme();
		const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
			noSsr: true,
		});
		const itemCount = itemData.length;
		const itemSize = smUp ? 36 : 48;

		const getChildSize = (child) => {
			if (child.hasOwnProperty('group')) {
				return 48;
			}
			return itemSize;
		};

		const getHeight = () => {
			if (itemCount > 8) {
				return 8 * itemSize;
			}
			return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
		};

		const { className, style, ...otherProps } = other;

		return (
			<div ref={ref} {...otherProps}>
				<List
					className={className}
					listRef={internalListRef}
					key={itemCount}
					rowCount={itemCount}
					rowHeight={(index) => getChildSize(itemData[index])}
					rowComponent={RowComponent}
					rowProps={{ itemData }}
					style={{
						height: getHeight() + 2 * LISTBOX_PADDING,
						width: '100%',
					}}
					overscanCount={5}
					tagName="ul"
				/>
			</div>
		);
	}
);

const StyledPopper = styled(Popper)({
	[`& .${autocompleteClasses.listbox}`]: {
		boxSizing: 'border-box',
		'& ul': {
			padding: 0,
			margin: 0,
		},
	},
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
	placeholder = '',
	...props
}) => {
	const internalListRef = useListRef(null);
	const optionIndexMapRef = React.useRef(new Map());

	const handleItemsBuilt = React.useCallback((optionIndexMap) => {
		optionIndexMapRef.current = optionIndexMap;
	}, []);

	const handleHighlightChange = (event, option) => {
		if (option && internalListRef.current) {
			const index = optionIndexMapRef.current.get(option);
			if (index !== undefined) {
				internalListRef.current.scrollToRow({ index, align: 'auto' });
			}
		}
	};

	const getOptionLabel = (option) => {
		if (typeof option === 'string') {
			return option;
		}

		return option.label || '';
	};

	const isOptionEqualToValue = (option, val) => {
		if (!val) return false;
		return option.value === val || option.value === val.value;
	};

	const selectedValues = multiple
		? Array.isArray(value)
			? options.filter((opt) =>
					value.some((v) => v === opt.value || (v && v.value === opt.value))
			  )
			: []
		: options?.find(
				(option) => option.value === value || option.value === value.value
		  ) || null;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: fullWidth ? '100%' : 'auto',
			}}
		>
			<Autocomplete
				disableCloseOnSelect={multiple}
				autoComplete={false}
				disableListWrap
				multiple={multiple}
				options={options}
				onChange={(event, newValue) => {
					if (onChange) onChange(newValue);
				}}
				onBlur={onBlur}
				fullWidth={fullWidth}
				value={selectedValues}
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
						// InputLabelProps={{
						//   style: { color: "#A0AAB4" },
						// }}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 2,
								height: '40px',
								overflowY: 'auto',
								display: 'flex',
								flexWrap: 'nowrap',
								alignItems: 'center',
								paddingRight: '65px !important',
							},
							'& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
								minWidth: '30px',
							},
						}}
					/>
				)}
				renderOption={(renderProps, option, { selected }) => (
					<li
						{...renderProps}
						key={option.value}
						style={{
							paddingLeft: '16px',
							paddingRight: '16px',
							height: '100%',
						}}
					>
						{multiple && (
							<Checkbox
								icon={<CheckBoxOutlineBlankOutlined fontSize="small" />}
								checkedIcon={<CheckBox fontSize="small" />}
								style={{ marginRight: 8, padding: 0 }}
								checked={selected}
							/>
						)}
						<Typography
							sx={{
								wordBreak: 'break-all',
								fontSize: '14px',
								color: '#595959',
								fontWeight: 500,
							}}
							noWrap
						>
							{option.label}
						</Typography>
					</li>
				)}
				onHighlightChange={handleHighlightChange}
				slots={{
					popper: StyledPopper,
				}}
				slotProps={{
					listbox: {
						component: ListboxComponent,
						internalListRef,
						onItemsBuilt: handleItemsBuilt,
					},
				}}
				renderTags={(value, getTagProps) => {
					if (value.length === 0) return null;
					return (
						<Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
							{value.length} items selected
						</Typography>
					);
				}}
				{...props}
			/>
		</Box>
	);
};
