export const WATER_REPORTS_TAB_OPTIONS = [
	{
		label: 'Day-Wise Consumption',
		tab: 'WATER_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Month-Wise Consumption',
		tab: 'WATER_REPORTS_MONTH_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Daily Meter Reading',
		tab: 'WATER_REPORTS_DATE_WISE_READING_DATA',
	},
];

export const WATER_REPORTS_ALLOW_MONTH = [
	'WATER_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	'WATER_REPORTS_DATE_WISE_READING_DATA',
];

export const WATER_REPORTS_API_DATA_KEY_CONFIG = {
	WATER_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
		dateKey: 'date',
		valueKey: 'value',
	},
	WATER_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
		dateKey: 'month',
		valueKey: 'value',
	},
	WATER_REPORTS_DATE_WISE_READING_DATA: {
		dateKey: 'date',
		valueKey: 'value',
	},
};
