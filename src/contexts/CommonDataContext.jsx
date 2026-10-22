/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { PARAMETER_OPTIONS } from '../constants/parameterOptions';
import { TEMPERATURE_PARAMETER_OPTIONS } from '../constants/temperatureLogs';
import { api, weatherStationApi } from '../helpers/api';
import { API_URLS } from '../helpers/apiUrls';

import { useApplications } from './ApplicationContext';
import { useAuth } from './AuthContext';

const CommonDataContext = createContext();

export const CommonDataContextProvider = ({ children }) => {
	const { user } = useAuth();
	const { applications, selectedApp } = useApplications();

	const [slavesData, setSlavesData] = useState(null);
	const [temperatureParametersData, setTemperatureParametersData] =
		useState(null);
	const [weatherStationParametersData, setWeatherStationParametersData] =
		useState({ logs: [], analytics: [] });

	// const fetchData = async (currSelectedApp) => {
	//   try {
	//     const appName = currSelectedApp?.toLowerCase() || "";
	//     const GET_SLAVES = api.get(API_URLS.SLAVES(appName));
	//     const [slavesRes] = await Promise.all([GET_SLAVES]);

	//     if (slavesRes?.success) {
	//       setSlavesData(slavesRes?.data?.slaves || []);
	//     } else {
	//       setSlavesData([]);
	//     }
	//   } catch (error) {
	//     console.error("One of the API calls failed:", error);
	//     setSlavesData([]);
	//   }
	// };

	const fetchData = async (currSelectedApp) => {
		const appName = currSelectedApp?.toLowerCase() || '';

		try {
			const slavesRes = await api.get(API_URLS.SLAVES(appName));

			if (slavesRes?.success) {
				setSlavesData(slavesRes?.data?.slaves || []);
				return;
			}

			throw new Error('Primary API returned unsuccessful state');
		} catch (primaryError) {
			console.warn(
				'Primary API failed, trying slave-list fallback...',
				primaryError
			);

			try {
				const fallbackRes = await api.get(API_URLS.SLAVE_LIST(appName));

				if (fallbackRes?.success) {
					setSlavesData(fallbackRes?.data?.slaves || []);
				} else {
					setSlavesData([]);
				}
			} catch (fallbackError) {
				console.error(
					'Both primary and fallback API routes failed:',
					fallbackError
				);
				setSlavesData([]);
			}
		}
	};

	const fetchTemperatureParameters = async () => {
		try {
			const res = await api.get(API_URLS.TEMPERATURE_PARAMETERS_DATA);

			if (res?.success) {
				setTemperatureParametersData(
					res?.data?.parameters || TEMPERATURE_PARAMETER_OPTIONS
				);
			} else {
				setTemperatureParametersData(TEMPERATURE_PARAMETER_OPTIONS);
			}
		} catch (error) {
			console.error('Failed to fetch temperature parameters:', error);
			setTemperatureParametersData(TEMPERATURE_PARAMETER_OPTIONS);
		}
	};

	const fetchWeatherStationParameters = async () => {
		const normalizeParameters = (response) =>
			(response?.parameters || []).map((parameter) => ({
				...parameter,
				value: parameter.key,
				label: `${parameter.label}${
					parameter.unit ? ` (${parameter.unit})` : ''
				}`,
			}));

		const [logsResult, analyticsResult] = await Promise.allSettled([
			weatherStationApi.get(API_URLS.WEATHER_STATION_LOGS_PARAMETERS),
			weatherStationApi.get(API_URLS.WEATHER_STATION_ANALYTICS_PARAMETERS),
		]);

		setWeatherStationParametersData({
			logs:
				logsResult.status === 'fulfilled'
					? normalizeParameters(logsResult.value)
					: [],
			analytics:
				analyticsResult.status === 'fulfilled'
					? normalizeParameters(analyticsResult.value)
					: [],
		});
	};

	const parametersData = useMemo(() => {
		if (!selectedApp) {
			return [];
		}
		if (selectedApp === 'TEMPERATURE') {
			return (
				temperatureParametersData?.map((param) => ({
					...param,
					label: param.display_name,
					value: param.parameter,
				})) || []
			);
		}
		if (selectedApp === 'WEATHER_STATION') {
			return weatherStationParametersData;
		}
		return PARAMETER_OPTIONS?.[selectedApp] || [];
	}, [selectedApp, temperatureParametersData, weatherStationParametersData]);
	const usesSharedCommonData =
		applications.find((application) => application.code === selectedApp)
			?.uses_shared_common_data !== false;

	useEffect(() => {
		if (user && selectedApp) {
			if (!usesSharedCommonData) {
				setSlavesData([]);
				if (selectedApp === 'WEATHER_STATION') {
					fetchWeatherStationParameters();
				}
				return;
			}

			fetchData(selectedApp);

			if (selectedApp === 'TEMPERATURE') {
				fetchTemperatureParameters();
			}
		}
	}, [user, selectedApp, usesSharedCommonData]);

	return (
		<CommonDataContext.Provider
			value={{
				slavesData,
				parametersData,
			}}
		>
			{children}
		</CommonDataContext.Provider>
	);
};

export const useCommonData = () => {
	const context = useContext(CommonDataContext);
	if (!context) {
		throw new Error('useCommonData must be used within CommonDataProvider');
	}
	return context;
};
