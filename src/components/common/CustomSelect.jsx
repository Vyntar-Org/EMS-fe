import React from 'react';
import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
} from '@mui/material';

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
	size = 'small',
	...props
}) => {
	const labelId = `${name || 'custom-select'}-label`;

	return (
		<FormControl
			fullWidth={fullWidth}
			error={!!error}
			size={size}
			sx={{
				'& .MuiOutlinedInput-root': {
					borderRadius: 2,
				},
			}}
		>
			{label && <InputLabel id={labelId}>{label}</InputLabel>}

			<Select
				labelId={labelId}
				id={`${name || 'custom-select'}-input`}
				name={name}
				value={value ?? ''}
				label={label}
				onChange={onChange}
				onBlur={onBlur}
				{...props}
			>
				{options.length === 0 ? (
					<MenuItem disabled value="">
						No options available
					</MenuItem>
				) : (
					options.map((opt) => (
						<MenuItem
							sx={{
								fontSize: '14px',
								color: '#595959',
								fontWeight: 'bold',
							}}
							key={opt.value}
							value={opt.value}
						>
							{opt.label || opt.value}
						</MenuItem>
					))
				)}
			</Select>

			{helperText && <FormHelperText>{helperText}</FormHelperText>}
		</FormControl>
	);
};
