import { useCallback, useEffect, useState } from 'react';

import { SITE_LAT, SITE_LON } from '../constants/weatherStationDashboard';
import { weatherStationApi as api } from '../helpers/api';
import { API_URLS } from '../helpers/apiUrls';
import { reverseGeocode } from '../helpers/weatherStationOpenMeteo';

const DEFAULT_COORDS = { latitude: SITE_LAT, longitude: SITE_LON };
const DEFAULT_LOCATION = 'Madurai, Tamil Nadu, India';

const requestLocation = () =>
	new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported'));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}),
			reject,
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	});

export function useWeatherStation() {
	const [coords, setCoords] = useState(DEFAULT_COORDS);
	const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION);
	const [chartData, setChartData] = useState(null);
	const [kpiCardsData, setKpiCardsData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);

	const loadKpiCards = useCallback(async () => {
		try {
			const overview = await api.get(
				API_URLS.WEATHER_STATION_DASHBOARD_OVERVIEW
			);
			setKpiCardsData(overview || null);
			setLastUpdated(
				overview?.last_updated ? new Date(overview.last_updated) : new Date()
			);
		} catch (requestError) {
			console.error('KPI cards fetch failed:', requestError);
		}
	}, [setLastUpdated]);

	const loadCharts = useCallback(async (nextCoords, label) => {
		setLoading(true);
		setError(null);

		try {
			const [rainfall, windDirection, airQuality, solarIrradiance, place] =
				await Promise.all([
					api.get(API_URLS.WEATHER_STATION_DASHBOARD_RAINFALL),
					api.get(API_URLS.WEATHER_STATION_DASHBOARD_WIND_DIRECTION),
					api.get(API_URLS.WEATHER_STATION_DASHBOARD_AIR_QUALITY),
					api.get(API_URLS.WEATHER_STATION_DASHBOARD_IRRADIANCE),
					label ?? reverseGeocode(nextCoords),
				]);

			setChartData({ rainfall, windDirection, airQuality, solarIrradiance });
			setCoords(nextCoords);
			if (place) {
				setLocationLabel(place);
			}
		} catch (requestError) {
			setChartData(null);
			setError(
				requestError instanceof Error
					? requestError.message
					: 'Failed to load Weather Station data'
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCharts(DEFAULT_COORDS, DEFAULT_LOCATION);
		loadKpiCards();

		const chartInterval = window.setInterval(
			() => loadCharts(DEFAULT_COORDS, DEFAULT_LOCATION),
			30 * 60 * 1000
		);
		const kpiInterval = window.setInterval(loadKpiCards, 65 * 1000);

		return () => {
			window.clearInterval(chartInterval);
			window.clearInterval(kpiInterval);
		};
	}, [loadCharts, loadKpiCards]);

	const useMyLocation = async () => {
		try {
			const position = await requestLocation();
			await loadCharts(position);
		} catch {
			setError('Could not access your location. Using the default site.');
			await loadCharts(DEFAULT_COORDS, DEFAULT_LOCATION);
		}
	};

	return {
		loading,
		error,
		locationLabel,
		coords,
		lastUpdated,
		useMyLocation,
		refresh: () => loadCharts(coords, locationLabel),
		kpiCardsData,
		chartData,
	};
}
