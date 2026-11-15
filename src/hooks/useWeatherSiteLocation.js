import { useQuery } from '@tanstack/react-query';

import { WEATHER_SITE_LOCATIONS_BY_USERNAME } from '../constants/weatherStationDashboard';
import { useAuth } from '../contexts/AuthContext';
import { weatherStationApi } from '../helpers/weatherStationApi';

const toCoordinate = (value) => {
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
};

// Site location changes rarely, so it is fetched independently of the live
// dashboard queries: it never blocks the dashboard loader, and a failure
// here only affects the location cards.
export function useWeatherSiteLocation() {
	const { user } = useAuth();
	const query = useQuery({
		queryKey: ['weather', 'dashboard', 'site-location', user?.id],
		queryFn: ({ signal }) => weatherStationApi.getSiteLocations({ signal }),
		staleTime: 10 * 60 * 1000,
		refetchInterval: 30 * 60 * 1000,
		retry: 1,
	});

	const apiSite = query.data?.[0] || null;
	const staticSite =
		WEATHER_SITE_LOCATIONS_BY_USERNAME[user?.username?.toUpperCase()] || null;

	// API data wins once the device has coordinates configured; until then
	// (or if the API fails) use the static location for this login.
	const apiHasCoordinates =
		toCoordinate(apiSite?.latitude) !== null &&
		toCoordinate(apiSite?.longitude) !== null;
	const site = apiHasCoordinates ? apiSite : staticSite || apiSite;

	const latitude = toCoordinate(site?.latitude);
	const longitude = toCoordinate(site?.longitude);

	return {
		loading: query.isLoading && !staticSite,
		error: query.error,
		site,
		hasCoordinates: latitude !== null && longitude !== null,
		latitude,
		longitude,
	};
}
