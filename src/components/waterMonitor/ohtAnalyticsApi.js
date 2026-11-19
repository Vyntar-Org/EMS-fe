import { api } from '../../helpers/api';

import { numericReading, waterEndpoint } from './waterMonitorApi';

export async function getOHTAnalytics(
	{ slave_id, parameters, start_datetime, end_datetime },
	{ signal } = {}
) {
	const query = new URLSearchParams({
		slave_id,
		parameters,
		start_datetime,
		end_datetime,
	});
	const response = await api.get(`${waterEndpoint('analytics/')}?${query}`, {
		signal,
	});
	const readings = response?.data?.data;
	if (response?.success !== true || !Array.isArray(readings)) {
		throw { data: response };
	}

	const points = readings
		.map((reading) => ({
			x: Date.parse(reading?.timestamp),
			y: numericReading(reading?.[parameters]),
			shiftDay: reading?.shift_day,
		}))
		.filter(({ x }) => Number.isFinite(x))
		.sort((a, b) => a.x - b.x);
	return { points, unit: response.meta?.unit };
}

export function ohtAnalyticsError(error) {
	const detail =
		error?.data?.errors?.detail || error?.data?.detail || error?.data?.message;
	if (error?.status === 403) {
		return 'You do not have permission to view analytics for this device.';
	}
	if (/shift.*(config|setting)/i.test(detail ?? '')) {
		return 'Analytics is unavailable because shift settings have not been configured. Please contact your administrator.';
	}
	if (error?.status === 400 && typeof detail === 'string') {
		return detail;
	}
	return 'Unable to load analytics. Please try again.';
}
