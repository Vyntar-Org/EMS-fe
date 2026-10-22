const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const WEATHER_CODES = {
	0: 'Clear',
	1: 'Mainly clear',
	2: 'Partly cloudy',
	3: 'Overcast',
	45: 'Fog',
	48: 'Depositing rime fog',
	51: 'Light drizzle',
	53: 'Drizzle',
	55: 'Dense drizzle',
	61: 'Slight rain',
	63: 'Rain',
	65: 'Heavy rain',
	71: 'Slight snow',
	73: 'Snow',
	75: 'Heavy snow',
	80: 'Rain showers',
	81: 'Moderate showers',
	82: 'Violent showers',
	95: 'Thunderstorm',
};

export function describeWeather(code) {
	return WEATHER_CODES[code] ?? 'Unknown';
}

export async function fetchWeatherSolar({ latitude, longitude }) {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		timezone: 'auto',
		current:
			'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,precipitation,uv_index',
		hourly:
			'temperature_2m,cloud_cover,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,shortwave_radiation,direct_radiation,diffuse_radiation,uv_index',
		daily: 'precipitation_sum,shortwave_radiation_sum',
		forecast_days: 2,
	});

	const response = await fetch(`${FORECAST_URL}?${params}`);
	if (!response.ok) {
		throw new Error(`Weather API error (${response.status})`);
	}

	return response.json();
}

export async function fetchAirQuality({ latitude, longitude }) {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		timezone: 'auto',
		current: 'european_aqi,pm2_5,pm10',
		hourly: 'european_aqi,pm2_5,pm10',
		forecast_days: 1,
	});

	const response = await fetch(`${AIR_QUALITY_URL}?${params}`);
	if (!response.ok) {
		return null;
	}

	return response.json();
}

export async function reverseGeocode({ latitude, longitude }) {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		language: 'en',
		format: 'json',
	});

	const response = await fetch(
		`https://geocoding-api.open-meteo.com/v1/reverse?${params}`
	);
	if (!response.ok) {
		return null;
	}

	const data = await response.json();
	const place = data.results?.[0];
	if (!place) {
		return null;
	}

	return [place.name, place.admin1, place.country].filter(Boolean).join(', ');
}
