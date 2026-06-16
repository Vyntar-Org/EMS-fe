export const ENERGY_REPORTS_TAB_OPTIONS = [
	{
		label: 'Day-Wise Consumption',
		tab: 'EMS_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Month-Wise Consumption',
		tab: 'EMS_REPORTS_MONTH_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Daily Meter Reading',
		tab: 'EMS_REPORTS_DATE_WISE_READING_DATA',
	},
	{
		label: 'Day-Wise Cost Consumption',
		tab: 'EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA',
	},
	{
		label: 'Month-Wise Cost Consumption',
		tab: 'EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA',
	},
];

export const ENERGY_REPORTS_ALLOW_MONTH = [
	'EMS_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	'EMS_REPORTS_DATE_WISE_READING_DATA',
	'EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA',
];

export const ENERGY_REPORTS_API_DATA_KEY_CONFIG = {
	EMS_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
		dateKey: 'date',
		valueKey: 'consumption',
	},
	EMS_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
		dateKey: 'month',
		valueKey: 'consumption_kwh',
	},
	EMS_REPORTS_DATE_WISE_READING_DATA: {
		dateKey: 'date',
		valueKey: 'first_meter_reading',
	},
	EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA: {
		dateKey: 'date',
		valueKey: 'cost',
	},
	EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA: {
		dateKey: 'month',
		valueKey: 'cost',
	},
};
