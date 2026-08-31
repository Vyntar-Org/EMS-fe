export const FUEL_PARAMETER_OPTIONS = [
	// {
	// 	label: 'Consumed',
	// 	value: 'consumed',
	// 	desc: 'Last 6 hours Consumed data',
	// },
	{
		label: 'Temperature',
		value: 'temperature',
		desc: 'Last 6 hours Temperature data',
	},
	{
		label: 'Battery Voltage',
		value: 'battery_voltage',
		desc: 'Last 6 hours Battery Voltage data',
	},
	{
		label: 'Fuel Level',
		value: 'fuel_level',
		desc: 'Last 6 hours Fuel Level data',
	},
];

export const FUEL_LOG_COLUMN_MAPPING = {
	timestamp: 'Timestamp',
	// consumed: 'Consumed',
	temperature: 'Temperature',
	battery_voltage: 'Battery Voltage',
	fuel_level: 'Fuel Level',
};
