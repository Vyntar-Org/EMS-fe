export const FLOWMETER_REPORTS_TAB_OPTIONS = [
	{
		label: 'Day-Wise Consumption',
		tab: 'FLOWMETER_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Month-Wise Consumption',
		tab: 'FLOWMETER_REPORTS_MONTH_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Daily Meter Reading',
		tab: 'FLOWMETER_REPORTS_DATE_WISE_READING_DATA',
	},
];

export const FLOWMETER_REPORTS_ALLOW_MONTH = [
	'FLOWMETER_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	'FLOWMETER_REPORTS_DATE_WISE_READING_DATA',
];

export const FLOWMETER_REPORTS_API_DATA_KEY_CONFIG = {
	FLOWMETER_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
		dateKey: 'date',
		valueKey: 'value',
	},
	FLOWMETER_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
		dateKey: 'month',
		valueKey: 'value',
	},
	FLOWMETER_REPORTS_DATE_WISE_READING_DATA: {
		dateKey: 'date',
		valueKey: 'value',
	},
};
