export const FUEL_REPORTS_TAB_OPTIONS = [
	{
		label: 'Day-Wise Consumption',
		tab: 'FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA',
	},
	{
		label: 'Month-Wise Consumption',
		tab: 'FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA',
	},
];

export const FUEL_REPORTS_ALLOW_MONTH = [
	'FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA',
];

export const FUEL_REPORTS_API_DATA_KEY_CONFIG = {
	FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
		dateKey: 'date',
		machineUnitKeys: [
			'consumed',
			'refilled',
			'fuel_consumption',
			'consumption',
			'volume',
			'fuel_level',
		],
		valueKeys: [
			{ key: 'consumed', label: 'Consumed' },
			{ key: 'refilled', label: 'Refilled' },
		],
	},
	FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
		dateKey: 'month',
		machineUnitKeys: [
			'consumed',
			'refilled',
			'fuel_consumption',
			'consumption',
			'volume',
			'fuel_level',
		],
		valueKeys: [
			{ key: 'consumed', label: 'Consumed' },
			{ key: 'refilled', label: 'Refilled' },
		],
	},
};
