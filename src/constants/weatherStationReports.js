export const WEATHER_SOLAR_REPORTS_TAB_OPTIONS = [
	{
		label: 'Day-Wise Generation',
		tab: 'WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Month-Wise Generation',
		tab: 'WEATHER_SOLAR_REPORTS_MONTH_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Daily Meter Reading',
		tab: 'WEATHER_SOLAR_REPORTS_DATE_WISE_READING_DATA',
	},
	{
		label: 'Day-Wise Revenue',
		tab: 'WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA',
	},
	{
		label: 'Month-Wise Revenue',
		tab: 'WEATHER_SOLAR_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA',
	},
];

export const WEATHER_SOLAR_REPORTS_ALLOW_MONTH = [
	'WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	'WEATHER_SOLAR_REPORTS_DATE_WISE_READING_DATA',
	'WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA',
];

export const WEATHER_SOLAR_REPORTS_API_DATA_KEY_CONFIG = {
	WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
		dateKey: 'date',
		valueKey: 'energy_kwh',
		valueKey1: 'rainfall_mm',
	},
	WEATHER_SOLAR_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
		dateKey: 'month',
		valueKey: 'energy_kwh',
		valueKey1: 'rainfall_mm',
	},
	WEATHER_SOLAR_REPORTS_DATE_WISE_READING_DATA: {
		dateKey: 'date',
		valueKey: 'opening_reading_kwh',
	},
	WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA: {
		dateKey: 'date',
		valueKey: 'energy_kwh',
		valueKey1: 'revenue',
	},
	WEATHER_SOLAR_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA: {
		dateKey: 'month',
		valueKey: 'energy_kwh',
		valueKey1: 'revenue',
	},
};

export const parameterConfig = {
	energy_kwh: 'Energy',
	rainfall_mm: 'Rainfall',
	revenue: 'Revenue',
	opening_reading_kwh: 'Reading',
};
