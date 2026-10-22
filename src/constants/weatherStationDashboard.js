/** Site coordinates — edit for your weather station / solar PV location */
// export const SITE_LAT = 9.9252
// export const SITE_LON = 78.1198

export const SITE_LAT = 9.882433172319399;
export const SITE_LON = 78.08168571904616;

export const SITE_SUMMARY_ROWS = [
	{ item: 'Site Type', value: 'Independent weather station + solar PV plant' },
	{ item: 'Map Layer', value: 'Satellite imagery' },
	{ item: 'Default Coordinates', value: 'Madurai, Tamil Nadu placeholder' },
	{
		item: 'Use Case',
		value: 'Field monitoring, weather correlation, PV yield analysis',
	},
];

export const PREDICTIONS_ALERTS = [
	{
		parameter: 'Rainfall',
		prediction: 'High rain likely in 6–12h',
		status: 'Watch',
		statusClass: 'badge--watch',
	},
	{
		parameter: 'Irradiance',
		prediction: 'Reduced after 15:00',
		status: 'Cloud Impact',
		statusClass: 'badge--cloud',
	},
	{
		parameter: 'Wind Speed',
		prediction: 'Normal range',
		status: 'OK',
		statusClass: 'badge--ok',
	},
	{
		parameter: 'AQI',
		prediction: 'May rise at night',
		status: 'Monitor',
		statusClass: 'badge--monitor',
	},
	{
		parameter: 'PV Generation',
		prediction: '10% below ideal curve',
		status: 'Inspect',
		statusClass: 'badge--inspect',
	},
];

export const ANALYTICS_LOGIC = [
	{
		label: 'Rainfall forecast',
		text: 'rainfall + humidity + pressure fall + cloud cover',
	},
	{
		label: 'Solar power estimate',
		text: 'Power = Irradiance × Panel Area × Efficiency × Loss Factor',
	},
	{
		label: 'PV loss detection',
		text: 'compare actual kWh with expected kWh from irradiance curve',
	},
	{
		label: 'Wind alert',
		text: 'trigger when gust speed exceeds safe structural threshold',
	},
	{
		label: 'AQI alert',
		text: 'trigger when PM2.5, PM10, CO₂, NO₂, or O₃ crosses limits',
	},
];

export const SENSOR_INTEGRATION = [
	{ data: 'Rainfall', sensor: 'Tipping bucket rain gauge' },
	{ data: 'Irradiance', sensor: 'Pyranometer' },
	{ data: 'Wind', sensor: 'Anemometer + wind vane' },
	{ data: 'AQI', sensor: 'PM2.5/PM10 + gas sensors' },
	{ data: 'Temp/Pressure', sensor: 'BME280/BMP388/SHT sensor' },
	{ data: 'Solar Energy', sensor: 'Inverter/MPPT meter' },
];

/** PV model assumptions for estimated daily energy (kWh) */
export const PV_PANEL_AREA_M2 = 28;
export const PV_EFFICIENCY = 0.18;
export const PV_LOSS_FACTOR = 0.85;
