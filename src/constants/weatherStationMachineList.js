import {
	Speed,
	Thermostat,
	Air,
	Navigation,
	WaterDrop,
	WbSunny,
	Umbrella,
	Cloud,
} from '@mui/icons-material';

export const SOLAR_TREND_TAB_OPTIONS = [
	{
		id: 1,
		slave_id: 1,
		name: 'Wind Direction',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'wind_direction',
				name: 'Wind Direction',
				value: 256,
				unit: '°',
				Icon: Navigation,
				color: '#1976d2',
			},
		],
	},
	{
		id: 2,
		slave_id: 2,
		name: 'Wind Speed',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'wind_speed',
				name: 'Wind Speed',
				value: 50,
				unit: 'km/h',
				Icon: Air,
				color: '#1976d2',
			},
		],
	},
	{
		id: 3,
		slave_id: 3,
		name: 'Weather',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'ambient_temperature',
				name: 'Ambient Temperature',
				value: 35.9,
				unit: '°C',
				Icon: Thermostat,
				color: '#d32f2f',
			},
			{
				key: 'humidity',
				name: 'Humidity',
				value: 68,
				unit: '%',
				Icon: WaterDrop,
				color: '#1976d2',
			},
		],
	},
	{
		id: 4,
		slave_id: 4,
		name: 'Solar Irradiance',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'solar_radiation',
				name: 'Solar Irradiance',
				value: 832,
				unit: 'W/m²',
				Icon: WbSunny,
				color: '#f57c00',
			},
		],
	},
	{
		id: 5,
		slave_id: 5,
		name: 'Rain Gauge',
		status: 'offline',
		last_updated: new Date(Date.now() - 3600000).toISOString(),
		metrics: [
			{
				key: 'rain_gauge',
				name: 'Rain Gauge',
				value: 0.5,
				unit: 'mm',
				Icon: Umbrella,
				color: '#1976d2',
			},
		],
	},
	{
		id: 6,
		slave_id: 6,
		name: 'Ambient Pressure',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'pressure',
				name: 'Ambient Pressure',
				value: 992,
				unit: 'hPa',
				Icon: Speed,
				color: '#2e7d32',
			},
		],
	},
	{
		id: 7,
		slave_id: 7,
		name: 'Air Quality',
		status: 'online',
		last_updated: new Date().toISOString(),
		metrics: [
			{
				key: 'pm1',
				name: 'PM1',
				value: 12,
				unit: 'µg/m³',
				Icon: Cloud,
				color: '#595959',
			},
			{
				key: 'pm2_5',
				name: 'PM2.5',
				value: 22,
				unit: 'µg/m³',
				Icon: Cloud,
				color: '#595959',
			},
			{
				key: 'pm10',
				name: 'PM10',
				value: 30,
				unit: 'µg/m³',
				Icon: Cloud,
				color: '#595959',
			},
		],
	},
];

export const MACHINE_LIST_CARD_ICONS = {
	'Wind Speed': {
		icon: '/assets/WEATHER_STATION-ICONS/wind_speed.svg',
		// color: "#3B82F6",
		// bg: "#EEF6FF",
	},
	'Energy Meter': {
		icon: '/assets/WEATHER_STATION-ICONS/energy.svg',
		// color: "#3B82F6",
		// bg: "#EEF6FF",
	},
	'Wind Direction': {
		icon: '/assets/WEATHER_STATION-ICONS/wind_direction.svg',
		// color: "#3B82F6",
		// bg: "#EEF6FF",
	},

	Weather: {
		icon: '/assets/WEATHER_STATION-ICONS/weather.svg',
		// color: "#F59E0B",
		// bg: "#FFF8E6",
	},
	'Solar Irradiance': {
		icon: '/assets/WEATHER_STATION-ICONS/solar_irradiance.svg',
		// color: "#F59E0B",
		// bg: "#FFF8E6",
	},
	'Rain Gauge': {
		icon: '/assets/WEATHER_STATION-ICONS/rain_gauge.svg',
		// color: "#2563EB",
		// bg: "#EEF6FF",
	},
	'Ambient Pressure': {
		icon: '/assets/WEATHER_STATION-ICONS/ambient_pressure.svg',
		// color: "#64748B",
		// bg: "#F3F4F6",
	},
	'Air Quality': {
		icon: '/assets/WEATHER_STATION-ICONS/air_quality.svg',
		// color: "#10B981",
		// bg: "#ECFDF5",
	},
};
