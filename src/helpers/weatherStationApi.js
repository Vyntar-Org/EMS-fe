import { api } from './api';
import { API_URLS } from './apiUrls';

const withQuery = (endpoint, params = {}) => {
	const query = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			query.set(key, String(value));
		}
	});

	const queryString = query.toString();
	return queryString ? `${endpoint}?${queryString}` : endpoint;
};

// The main API commonly wraps domain responses in `data`, while several
// Weather Station resources are returned at the root. Normalize only when
// the wrapper is actually present.
const unwrapPayload = (response) => {
	if (
		response &&
		typeof response === 'object' &&
		!Array.isArray(response) &&
		Object.prototype.hasOwnProperty.call(response, 'data')
	) {
		return response.data;
	}

	return response;
};

const getJson = async (endpoint, params, options) => {
	const response = await api.get(withQuery(endpoint, params), options);
	return unwrapPayload(response);
};

const getCollection = (response, key) => {
	if (Array.isArray(response)) {
		return response;
	}

	return Array.isArray(response?.[key]) ? response[key] : [];
};

const normalizeParameterOption = (parameter) => {
	if (typeof parameter === 'string') {
		return { label: parameter, value: parameter };
	}

	const value = parameter?.value ?? parameter?.parameter ?? parameter?.key;
	const baseLabel =
		parameter?.label ?? parameter?.display_name ?? parameter?.name ?? value;
	const label =
		parameter?.unit && baseLabel
			? `${baseLabel} (${parameter.unit})`
			: baseLabel;

	return { ...parameter, label, value };
};

const getParameterOptions = async (endpoint, options) => {
	const response = await getJson(endpoint, undefined, options);

	return getCollection(response, 'parameters')
		.map(normalizeParameterOption)
		.filter(
			(parameter) =>
				parameter.value !== undefined &&
				parameter.value !== null &&
				parameter.value !== ''
		);
};

const getBlob = (endpoint, params, options) =>
	api.get(withQuery(endpoint, params), {
		...options,
		responseType: 'blob',
	});

export const weatherStationApi = {
	getSlaves: async (options) => {
		const response = await getJson(
			API_URLS.WEATHER_SLAVES_DATA,
			undefined,
			options
		);
		return getCollection(response, 'slaves');
	},
	getMachineList: (options) =>
		getJson(API_URLS.WEATHER_MACHINE_LIST_DATA, undefined, options),
	getMachineListTrend: ({ slaveId, parameter }, options) =>
		getJson(
			API_URLS.WEATHER_MACHINE_LIST_TREND,
			{ slave_id: slaveId, parameter },
			options
		),
	getDashboardKpis: (options) =>
		getJson(API_URLS.WEATHER_DASHBOARD_OVERVIEW, undefined, options),
	getRainfallTemperaturePressureTrend: (options) =>
		getJson(API_URLS.WEATHER_DASHBOARD_RAINFALL, undefined, options),
	getWindDirectionDistribution: (options) =>
		getJson(API_URLS.WEATHER_DASHBOARD_WIND_DIRECTION, undefined, options),
	getAirQualityTrend: (options) =>
		getJson(API_URLS.WEATHER_DASHBOARD_AIR_QUALITY, undefined, options),
	getSolarIrradianceTrend: (options) =>
		getJson(API_URLS.WEATHER_DASHBOARD_IRRADIANCE, undefined, options),
	getLogsParameters: (options) =>
		getParameterOptions(API_URLS.WEATHER_LOGS_PARAMETERS_DATA, options),
	getLogs: (
		{ parameters, startDatetime, endDatetime, limit = 50, offset = 0 },
		options
	) =>
		getJson(
			API_URLS.WEATHER_LOGS_DATA,
			{
				parameters,
				start_datetime: startDatetime,
				end_datetime: endDatetime,
				limit,
				offset,
			},
			options
		),
	downloadLogs: ({ parameters, startDatetime, endDatetime }, options) =>
		getBlob(
			API_URLS.WEATHER_DOWNLOAD_LOGS_DATA,
			{
				parameters,
				start_datetime: startDatetime,
				end_datetime: endDatetime,
			},
			options
		),
	getAnalyticsParameters: (options) =>
		getParameterOptions(API_URLS.WEATHER_ANALYTICS_PARAMETERS_DATA, options),
	getAnalytics: ({ parameters, startDatetime, endDatetime }, options) =>
		getJson(
			API_URLS.WEATHER_ANALYTICS_DATA,
			{
				parameters,
				start_datetime: startDatetime,
				end_datetime: endDatetime,
			},
			options
		),
	getDaywiseRainfallReport: ({ year, month }, options) =>
		getJson(API_URLS.WEATHER_DAYWISE_RAINFALL_REPORT, { year, month }, options),
	downloadDaywiseRainfallReport: ({ year, month }, options) =>
		getBlob(
			API_URLS.WEATHER_DAYWISE_RAINFALL_DOWNLOAD,
			{ year, month },
			options
		),
	getMonthwiseRainfallReport: ({ year }, options) =>
		getJson(API_URLS.WEATHER_MONTHWISE_RAINFALL_REPORT, { year }, options),
	downloadMonthwiseRainfallReport: ({ year }, options) =>
		getBlob(API_URLS.WEATHER_MONTHWISE_RAINFALL_DOWNLOAD, { year }, options),
};

export const getWeatherStationErrorMessage = (
	error,
	fallback = 'Unable to load Weather Station data.'
) => {
	const detail = error?.data?.detail || error?.data?.message || error?.message;

	if (typeof detail === 'string') {
		return detail;
	}
	if (Array.isArray(detail)) {
		const messages = detail
			.map((item) => (typeof item === 'string' ? item : item?.msg))
			.filter(Boolean);
		return messages.length ? messages.join(' ') : fallback;
	}

	return fallback;
};

export const getDownloadFileName = (headers, fallback) => {
	const contentDisposition = headers?.get?.('content-disposition') || '';
	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
	const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
	const encodedName = utf8Match?.[1] || basicMatch?.[1];

	if (!encodedName) {
		return fallback;
	}

	try {
		return decodeURIComponent(encodedName.trim());
	} catch {
		return encodedName.trim();
	}
};
