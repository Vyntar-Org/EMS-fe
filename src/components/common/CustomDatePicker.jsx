import React from 'react';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { basePickerStyles } from '../../helpers/common';

export const CustomDatePicker = ({
	mode = 'datepicker', // datepicker | timepicker | datetimepicker | daterangepicker | timerangepicker | datetimerangepicker | monthpicker | yearpicker | monthrangepicker | yearrangepicker
	value, // Single value (dayjs object) OR Array [start, end] for ranges
	onChange, // Callback returns single value OR Array [start, end]
	label = 'Select Date',
	startLabel = 'Start Date',
	endLabel = 'End Date',
	disabled = false,
	minDate,
	maxDate,
}) => {
	const [startDate, endDate] = Array.isArray(value) ? value : [null, null];

	const handleRangeChange = (newValue, type) => {
		if (!onChange) return;
		if (type === 'start') {
			onChange([newValue, endDate]);
		} else {
			onChange([startDate, newValue]);
		}
	};

	const renderPicker = () => {
		switch (mode) {
			case 'monthpicker':
				return (
					<DatePicker
						label={label}
						value={value}
						onChange={onChange}
						disabled={disabled}
						minDate={minDate}
						maxDate={maxDate}
						views={['month']}
						openTo="month"
						slotProps={{
							textField: {
								sx: basePickerStyles,
								size: 'small',
								fullWidth: true,
							},
						}}
					/>
				);

			case 'yearpicker':
				return (
					<DatePicker
						label={label}
						value={value}
						onChange={onChange}
						disabled={disabled}
						minDate={minDate}
						maxDate={maxDate}
						views={['year']}
						openTo="year"
						slotProps={{
							textField: {
								sx: basePickerStyles,
								size: 'small',
								fullWidth: true,
							},
						}}
					/>
				);

			case 'monthrangepicker':
				return (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							width: '100%',
						}}
					>
						<DatePicker
							label={startLabel}
							value={startDate}
							onChange={(val) => handleRangeChange(val, 'start')}
							disabled={disabled}
							maxDate={endDate || maxDate}
							minDate={minDate}
							views={['month']}
							openTo="month"
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
						<DatePicker
							label={endLabel}
							value={endDate}
							onChange={(val) => handleRangeChange(val, 'end')}
							disabled={disabled}
							minDate={startDate || minDate}
							maxDate={maxDate}
							views={['month']}
							openTo="month"
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
					</Box>
				);

			case 'yearrangepicker':
				return (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							width: '100%',
						}}
					>
						<DatePicker
							label={startLabel}
							value={startDate}
							onChange={(val) => handleRangeChange(val, 'start')}
							disabled={disabled}
							maxDate={endDate || maxDate}
							minDate={minDate}
							views={['year']}
							openTo="year"
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
						<DatePicker
							label={endLabel}
							value={endDate}
							onChange={(val) => handleRangeChange(val, 'end')}
							disabled={disabled}
							minDate={startDate || minDate}
							maxDate={maxDate}
							views={['year']}
							openTo="year"
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
					</Box>
				);

			case 'timepicker':
				return (
					<TimePicker
						label={label}
						value={value}
						onChange={onChange}
						disabled={disabled}
						slotProps={{
							textField: {
								sx: basePickerStyles,
								size: 'small',
								fullWidth: true,
							},
						}}
					/>
				);

			case 'datetimepicker':
				return (
					<DateTimePicker
						label={label}
						value={value}
						onChange={onChange}
						disabled={disabled}
						minDateTime={minDate}
						maxDateTime={maxDate}
						slotProps={{
							textField: {
								sx: basePickerStyles,
								size: 'small',
								fullWidth: true,
							},
						}}
					/>
				);

			case 'daterangepicker':
				return (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							width: '100%',
						}}
					>
						<DatePicker
							label={startLabel}
							value={startDate}
							onChange={(val) => handleRangeChange(val, 'start')}
							disabled={disabled}
							maxDate={endDate || maxDate}
							minDate={minDate}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
						<DatePicker
							label={endLabel}
							value={endDate}
							onChange={(val) => handleRangeChange(val, 'end')}
							disabled={disabled}
							minDate={startDate || minDate}
							maxDate={maxDate}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
					</Box>
				);

			case 'timerangepicker':
				return (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							width: '100%',
						}}
					>
						<TimePicker
							label={startLabel}
							value={startDate}
							onChange={(val) => handleRangeChange(val, 'start')}
							disabled={disabled}
							maxTime={endDate || undefined}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
						<TimePicker
							label={endLabel}
							value={endDate}
							onChange={(val) => handleRangeChange(val, 'end')}
							disabled={disabled}
							minTime={startDate || undefined}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
					</Box>
				);

			case 'datetimerangepicker':
				return (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							width: '100%',
						}}
					>
						<DateTimePicker
							label={startLabel}
							value={startDate}
							onChange={(val) => handleRangeChange(val, 'start')}
							disabled={disabled}
							maxDateTime={endDate || maxDate}
							minDateTime={minDate}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
						<DateTimePicker
							label={endLabel}
							value={endDate}
							onChange={(val) => handleRangeChange(val, 'end')}
							disabled={disabled}
							minDateTime={startDate || minDate}
							maxDateTime={maxDate}
							slotProps={{
								textField: {
									sx: basePickerStyles,
									size: 'small',
									fullWidth: true,
								},
							}}
						/>
					</Box>
				);

			case 'datepicker':
			default:
				return (
					<DatePicker
						label={label}
						value={value}
						onChange={onChange}
						disabled={disabled}
						minDate={minDate}
						maxDate={maxDate}
						slotProps={{
							textField: {
								sx: basePickerStyles,
								size: 'small',
								fullWidth: true,
							},
						}}
					/>
				);
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<Box sx={{ width: '100%' }}>{renderPicker()}</Box>
		</LocalizationProvider>
	);
};
