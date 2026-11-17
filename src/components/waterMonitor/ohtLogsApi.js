import { api } from '../../helpers/api';

import { validateOHTLogFilters } from './ohtLogModel';
import { getWaterMachines, waterEndpoint } from './waterMonitorApi';

export const getOHTMachineList = (options) => getWaterMachines(options);

export async function getOHTLogs(filters, { signal } = {}) {
	const selected = validateOHTLogFilters(filters);
	const limit = filters.limit ?? 50;
	const offset = filters.offset ?? 0;
	if (
		!Number.isInteger(limit) ||
		limit < 1 ||
		!Number.isInteger(offset) ||
		offset < 0
	) {
		throw new Error('Invalid logs pagination.');
	}
	const query = new URLSearchParams({ ...selected, limit, offset });
	const response = await api.get(`${waterEndpoint('logs/')}?${query}`, {
		signal,
	});
	// The shared authenticated client returns the JSON envelope, not an Axios wrapper.
	if (response?.success !== true) {
		throw {
			data: response,
			message: response?.message || 'Unable to load logs. Please try again.',
		};
	}
	const logs = response.data?.logs;
	const meta = response.meta;
	if (
		!Array.isArray(logs) ||
		logs.some((row) => !row || typeof row !== 'object' || Array.isArray(row)) ||
		!meta ||
		!['count', 'total', 'limit', 'offset'].every(
			(key) => Number.isInteger(meta[key]) && meta[key] >= 0
		) ||
		meta.limit < 1 ||
		meta.count !== logs.length ||
		logs.length > meta.limit ||
		typeof meta.has_more !== 'boolean' ||
		meta.offset !== offset
	) {
		throw new Error(
			'The logs response is invalid. Please refresh and try again.'
		);
	}
	return { logs, meta };
}

export function ohtLogsError(error) {
	const messages = {
		400: 'The log filters are invalid. Please check the selected machine and date range.',
		401: 'Please sign in to view logs.',
		403: "You do not have permission to view this machine's logs.",
		404: 'The selected machine or logs endpoint could not be found.',
		500: 'Unable to load logs because of a server error. Please try again.',
	};
	return (
		messages[error?.status] ||
		(error?.message && !/fetch|network/i.test(error.message)
			? error.message
			: 'Unable to load logs. Please try again.')
	);
}
