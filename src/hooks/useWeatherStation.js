import { useQueries } from '@tanstack/react-query';

import {
	getWeatherStationErrorMessage,
	weatherStationApi,
} from '../helpers/weatherStationApi';

const DASHBOARD_QUERIES = [
	{
		queryKey: ['weather', 'dashboard', 'kpi-cards'],
		queryFn: ({ signal }) => weatherStationApi.getDashboardKpis({ signal }),
		refetchInterval: 65 * 1000,
	},
	{
		queryKey: ['weather', 'dashboard', 'rainfall-temperature-pressure'],
		queryFn: ({ signal }) =>
			weatherStationApi.getRainfallTemperaturePressureTrend({ signal }),
		refetchInterval: 30 * 60 * 1000,
	},
	{
		queryKey: ['weather', 'dashboard', 'wind-direction'],
		queryFn: ({ signal }) =>
			weatherStationApi.getWindDirectionDistribution({ signal }),
		refetchInterval: 30 * 60 * 1000,
	},
	{
		queryKey: ['weather', 'dashboard', 'air-quality'],
		queryFn: ({ signal }) => weatherStationApi.getAirQualityTrend({ signal }),
		refetchInterval: 30 * 60 * 1000,
	},
	{
		queryKey: ['weather', 'dashboard', 'solar-irradiance'],
		queryFn: ({ signal }) =>
			weatherStationApi.getSolarIrradianceTrend({ signal }),
		refetchInterval: 30 * 60 * 1000,
	},
];

export function useWeatherStation() {
	const queries = useQueries({
		queries: DASHBOARD_QUERIES.map((query) => ({
			...query,
			staleTime: 30 * 1000,
		})),
	});

	const [kpiQuery, rainfallQuery, windQuery, airQualityQuery, solarQuery] =
		queries;
	const errors = queries
		.map((query) => query.error)
		.filter(Boolean)
		.map((queryError) => getWeatherStationErrorMessage(queryError));

	return {
		loading: queries.some((query) => query.isLoading),
		isRefreshing: queries.some((query) => query.isFetching),
		error: errors.length ? [...new Set(errors)].join(' ') : null,
		lastUpdated: kpiQuery.data?.last_updated || null,
		refresh: () => Promise.all(queries.map((query) => query.refetch())),
		kpiCardsData: kpiQuery.data || null,
		chartData: {
			rainfall: rainfallQuery.data || null,
			windDirection: windQuery.data || null,
			airQuality: airQualityQuery.data || null,
			solarIrradiance: solarQuery.data || null,
		},
	};
}
