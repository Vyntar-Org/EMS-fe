/* eslint-disable react-refresh/only-export-components */
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';

import { PARAMETER_OPTIONS } from '../constants/parameterOptions';
import { TEMPERATURE_PARAMETER_OPTIONS } from '../constants/temperatureLogs';
import { api } from '../helpers/api';
import { API_URLS } from '../helpers/apiUrls';
import { weatherStationApi } from '../helpers/weatherStationApi';

import { useApplications } from './ApplicationContext';
import { useAuth } from './AuthContext';

const CommonDataContext = createContext();

// Application identifiers are uppercase, while application API paths use
// lowercase names. Underscores in any future application codes become hyphens.
const getApplicationApiName = (applicationCode) =>
	typeof applicationCode === 'string'
		? applicationCode.toLowerCase().replaceAll('_', '-')
		: '';

const getCollection = (response, key) => {
	const payload =
		response &&
		typeof response === 'object' &&
		!Array.isArray(response) &&
		Object.prototype.hasOwnProperty.call(response, 'data')
			? response.data
			: response;

	if (Array.isArray(payload)) {
		return payload;
	}

	return Array.isArray(payload?.[key]) ? payload[key] : [];
};

const normalizeParameter = (parameter) => {
	const value = parameter?.value ?? parameter?.parameter ?? parameter?.key;
	const baseLabel =
		parameter?.label ?? parameter?.display_name ?? parameter?.name ?? value;
	const label =
		parameter?.unit && baseLabel
			? `${baseLabel} (${parameter.unit})`
			: baseLabel;

	return {
		...parameter,
		value,
		label,
	};
};

const getCommonDataErrorMessage = (error, fallback) => {
	const detail = error?.data?.detail || error?.data?.message || error?.message;

	if (typeof detail === 'string') {
		return detail;
	}

	return fallback;
};

const fetchSlaves = async (appName, signal, isWeather) => {
	if (isWeather) {
		return weatherStationApi.getSlaves({ signal });
	}

	try {
		const response = await api.get(API_URLS.SLAVES(appName), { signal });

		if (response?.success === false) {
			throw new Error('Primary slaves API returned an unsuccessful state.');
		}

		return getCollection(response, 'slaves');
	} catch (primaryError) {
		if (signal.aborted) {
			throw primaryError;
		}

		const fallbackResponse = await api.get(API_URLS.SLAVE_LIST(appName), {
			signal,
		});

		if (fallbackResponse?.success === false) {
			throw primaryError;
		}

		return getCollection(fallbackResponse, 'slaves');
	}
};

const fetchParameters = async (appName, signal) => {
	const response = await api.get(API_URLS.PARAMETERS(appName), { signal });

	if (response?.success === false) {
		throw new Error('Parameters API returned an unsuccessful state.');
	}

	return getCollection(response, 'parameters')
		.map(normalizeParameter)
		.filter((parameter) => parameter.value !== undefined);
};

export const CommonDataContextProvider = ({ children }) => {
	const { user } = useAuth();
	const { applications, selectedApp } = useApplications();
	const appName = getApplicationApiName(selectedApp);
	const isWeather = selectedApp === 'WEATHER';
	const usesSharedCommonData =
		isWeather ||
		applications.find((application) => application.code === selectedApp)
			?.uses_shared_common_data !== false;
	const hasDynamicParameters = selectedApp === 'TEMPERATURE';
	const commonQueryEnabled = Boolean(
		user && selectedApp && appName && usesSharedCommonData
	);

	const slavesQuery = useQuery({
		queryKey: ['common-data', appName, 'slaves'],
		queryFn: ({ signal }) => fetchSlaves(appName, signal, isWeather),
		enabled: commonQueryEnabled,
		staleTime: 5 * 60 * 1000,
	});

	const parametersQuery = useQuery({
		queryKey: ['common-data', appName, 'parameters'],
		queryFn: ({ signal }) => fetchParameters(appName, signal),
		enabled: commonQueryEnabled && hasDynamicParameters,
		staleTime: 5 * 60 * 1000,
	});

	const parametersData = useMemo(() => {
		if (!selectedApp) {
			return [];
		}

		if (selectedApp === 'TEMPERATURE') {
			return parametersQuery.data || TEMPERATURE_PARAMETER_OPTIONS;
		}

		return PARAMETER_OPTIONS?.[selectedApp] || [];
	}, [parametersQuery.data, selectedApp]);

	const commonDataErrors = {
		slaves: slavesQuery.error
			? getCommonDataErrorMessage(
					slavesQuery.error,
					'Unable to load application devices.'
			  )
			: null,
		parameters: parametersQuery.error
			? getCommonDataErrorMessage(
					parametersQuery.error,
					'Unable to load application parameters.'
			  )
			: null,
	};
	const commonDataLoading =
		slavesQuery.isLoading ||
		(hasDynamicParameters && parametersQuery.isLoading);

	return (
		<CommonDataContext.Provider
			value={{
				slavesData: slavesQuery.data || [],
				parametersData,
				commonDataLoading,
				commonDataErrors,
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
