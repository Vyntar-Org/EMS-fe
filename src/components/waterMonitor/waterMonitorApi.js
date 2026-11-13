import { api } from '../../helpers/api';

// The shared client already prefixes VITE_API_BASE_URL. Avoid repeating /api
// when it is included in that base. Keep this endpoint local to WATER_MONITOR.
export function waterDashboardPath(
	baseUrl = import.meta.env.VITE_API_BASE_URL
) {
	const basePath = new URL(
		baseUrl || '/',
		'http://local.invalid'
	).pathname.replace(/\/$/, '');
	return `${
		basePath.endsWith('/api') ? '' : '/api'
	}/applications/water-monitoring/dashboard/`;
}

export async function getWaterDashboard({ signal } = {}) {
	const response = await api.get(waterDashboardPath(), { signal });
	if (response?.success === false) {
		throw new Error('Unable to load Water Monitoring dashboard.');
	}
	// Retain the actual response for inspection. Do not infer telemetry mappings.
	return response;
}

// URLs are supplied by the authorized application, never inferred from MQTT topics.
export const configuredPath = (path) =>
	typeof path === 'string' && /^\/(?!\/)/.test(path) && !path.includes('\\')
		? path
		: null;

export async function getWaterData(path, signal) {
	if (!configuredPath(path)) {
		throw new Error('Water Monitoring API is not configured.');
	}
	const response = await api.get(path, { signal });
	if (response?.success === false) {
		throw new Error('Unable to load Water Monitoring data.');
	}
	return response?.data ?? response;
}

export function normalizeMachines(payload) {
	if (!Array.isArray(payload?.machines)) {
		throw new Error('Invalid Water Monitoring machine response.');
	}
	const machines = new Map();
	for (const machine of payload.machines) {
		const id = machine.slave_id ?? machine.sid;
		if (id === undefined || id === null || id === '') {
			continue;
		}
		const key = String(id);
		const previous = machines.get(key);
		if (
			!previous ||
			Date.parse(machine.latest?.timestamp) >=
				Date.parse(previous.latest?.timestamp) ||
			!previous.latest?.timestamp
		) {
			machines.set(key, { ...machine, slave_id: key });
		}
	}
	return [...machines.values()].sort((a, b) =>
		a.slave_id.localeCompare(b.slave_id)
	);
}

export function numericReading(value) {
	return (typeof value === 'number' ||
		(typeof value === 'string' && value.trim() !== '')) &&
		Number.isFinite(Number(value))
		? Number(value)
		: null;
}

export function metricReading(machine, key, unavailable) {
	const raw = machine.latest?.[key];
	const number = numericReading(raw);
	const config = machine.metrics?.[key] ?? {};
	const precision = config.precision;
	const valid =
		!unavailable &&
		number !== null &&
		(key !== 'TankLevel' ||
			config.unit !== '%' ||
			(number >= 0 && number <= 100));
	return {
		value: valid
			? Number.isInteger(precision) && precision >= 0 && precision <= 20
				? number.toFixed(precision)
				: String(raw)
			: 'N/A',
		number: valid ? number : null,
		// User-confirmed WATER_MONITOR units; explicit backend metadata takes priority.
		unit:
			config.unit ||
			({ totalizer: 'KL', flowrate: 'm³' }[key] ?? 'Unit unverified'),
		percentage: valid && config.unit === '%' ? number : null,
	};
}
