import { useQuery } from '@tanstack/react-query';

import { api } from '../helpers/api';
import { API_URLS } from '../helpers/apiUrls';

const MACHINE_LIST_ENDPOINTS = Object.freeze({
	ENERGY: API_URLS.EMS_MACHINE_LIST_DATA,
	WATER: API_URLS.WATER_MACHINE_LIST_DATA,
	FUEL: API_URLS.FUEL_MACHINE_LIST_DATA,
	FLOWMETER: API_URLS.FLOWMETER_MACHINE_LIST_DATA,
	WEATHER: API_URLS.WEATHER_MACHINE_LIST_DATA,
});

const getMachineListPayload = async (endpoint, signal) => {
	const response = await api.get(endpoint, { signal });
	if (response?.success === false) {
		throw new Error('Machine list API returned an unsuccessful state.');
	}

	return response?.data ?? response;
};

export const useReportMachineList = (applicationCode) => {
	const endpoint = MACHINE_LIST_ENDPOINTS[applicationCode];
	const queryNamespace = applicationCode?.toLocaleLowerCase();

	return useQuery({
		queryKey: [queryNamespace, 'machine-list'],
		queryFn: ({ signal }) => getMachineListPayload(endpoint, signal),
		enabled: Boolean(endpoint),
		staleTime: 5 * 60 * 1000,
	});
};
