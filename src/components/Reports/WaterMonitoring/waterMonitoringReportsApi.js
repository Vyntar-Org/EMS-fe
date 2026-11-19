import { api } from '../../../helpers/api';
import { waterMonitoringEndpoint } from '../../WaterMonitoring/waterMonitoringService';

import {
	buildWaterReport,
	reportParams,
	reportTypeFor,
} from './waterMonitoringReportModel';

export async function getWaterReport(id, filters, { signal } = {}) {
	const type = reportTypeFor(id);
	const params = new URLSearchParams(reportParams(type, filters));
	const response = await api.get(`${waterMonitoringEndpoint(type.endpoint)}?${params}`, {
		signal,
	});
	// api.get already returns the JSON envelope (the equivalent of Axios response.data).
	// Unwrap once more here to read the grouped domain data, never the envelope as columns.
	if (response?.success !== true) {
		throw {
			data: response,
			message: response?.message || 'Unable to retrieve the report.',
		};
	}
	return buildWaterReport(response.data, type, response.meta);
}

export const getDailyConsumptionReport = (filters, options) =>
	getWaterReport('daily-consumption', filters, options);
export const getMonthlyConsumptionReport = (filters, options) =>
	getWaterReport('monthly-consumption', filters, options);
export const getDailyMeterReadingReport = (filters, options) =>
	getWaterReport('daily-reading', filters, options);
export const getDailyRunningHoursReport = (filters, options) =>
	getWaterReport('daily-running-hours', filters, options);
export const getMonthlyRunningHoursReport = (filters, options) =>
	getWaterReport('monthly-running-hours', filters, options);

export function waterReportError(error) {
	const detail =
		error?.data?.message ||
		error?.data?.errors?.detail ||
		error?.data?.detail ||
		error?.message;
	if (/shift.*(config|setting|not found|missing)/i.test(detail ?? '')) {
		return 'Reports are unavailable because shift settings have not been configured. Please contact your administrator.';
	}
	const messages = {
		400: 'The report filters are invalid. Check the month and year and try again.',
		401: 'Please sign in to view Water Monitoring reports.',
		403: 'You do not have permission to view this report.',
		404: 'This reporting endpoint is unavailable. Please contact your administrator.',
		500: 'The report could not be generated because of a server error. Please try again.',
	};
	return (
		messages[error?.status] ||
		(typeof detail === 'string'
			? detail
			: 'Unable to load the report. Please try again.')
	);
}
