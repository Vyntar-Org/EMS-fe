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
	}/applications/oht/dashboard/`;
}

export async function getWaterDashboard({ signal } = {}) {
	const response = await api.get(waterDashboardPath(), { signal });
	if (response?.success === false) {
		throw new Error('Unable to load Water Monitoring dashboard.');
	}
	// Retain the actual response for inspection. Do not infer telemetry mappings.
	return response;
}

export const waterMonitoringEndpoint = (endpoint) =>
	waterDashboardPath().replace(/dashboard\/$/, endpoint);

export async function getWaterMonitoringMachines({ signal } = {}) {
	const payload = await getWaterData(
		waterMonitoringEndpoint('machine-list/'),
		signal
	);
	const machines = normalizeMachines(payload).map((machine) => ({
		...machine,
		latest_ts: machine.latest_ts ?? null,
		name: machine.slave_name,
		device_code: machine.device_uid,
		latest: {
			timestamp: machine.latest_ts,
			TankLevel: machine.tank_level,
			flowrate: machine.flowrate,
			totalizer: machine.totalizer,
			controlMode: machine.control_mode,
			motorRunState: machine.motor_run_state,
		},
		// Verified in apps/applications/oht/constants.py TREND_PARAMETERS:
		// the tank_level series selects the raw tank_level column with unit %.
		metrics: {
			TankLevel: { unit: '%' },
			flowrate: { unit: 'm³/hr' },
			totalizer: { unit: 'm³' },
		},
		summary: Object.fromEntries(
			['today', 'mtd'].map((key) => [
				key,
				{
					value: machine.consumption?.[key],
					unit: 'm³',
					change_pct: machine.consumption?.[`${key}_change_pct`],
				},
			])
		),
	}));
	return { machines, summary: payload.summary };
}

export async function getWaterTrend({
	slaveId,
	parameter,
	hours = 24,
	signal,
}) {
	if (!['tank_level', 'flowrate', 'totalizer'].includes(parameter)) {
		throw new Error('Unsupported trend parameter.');
	}
	const params = new URLSearchParams({ slave_id: slaveId, parameter, hours });
	const response = await api.get(
		`${waterMonitoringEndpoint('machine-list-trend/')}?${params}`,
		{ signal }
	);
	if (response?.success === false || !Array.isArray(response?.data?.data)) {
		throw new Error('Invalid machine trend response.');
	}
	return {
		points: response.data.data.map(({ timestamp, value }) => ({
			timestamp,
			value: numericReading(value),
		})),
		meta: response.meta ?? {},
	};
}

function commandResponse(response) {
	if (response?.success === false) {
		throw new Error('Unable to read motor command.');
	}
	const payload =
		response && Object.hasOwn(response, 'data') ? response.data : response;
	// Accept a command object or an explicitly wrapped command. A null latest
	// command is a valid response when reconciling an uncertain submission.
	const command =
		payload &&
		Object.hasOwn(payload, 'command') &&
		typeof payload.command === 'object'
			? payload.command
			: payload;
	if (command === null) {
		return null;
	}
	if (
		!command ||
		command.id === undefined ||
		command.id === null ||
		!['PENDING', 'PUBLISHED', 'ACKED', 'TIMED_OUT', 'FAILED'].includes(
			command.status
		)
	) {
		throw new Error('Invalid motor command response.');
	}
	return command;
}

export async function postWaterMotorCommand(body) {
	if (
		!body.device_uid ||
		!Number.isInteger(Number(body.motor_id)) ||
		Number(body.motor_id) < 1 ||
		![0, 1].includes(body.command)
	) {
		throw new Error('Device UID and a valid backend motor ID are required.');
	}
	return commandResponse(
		await api.post(waterMonitoringEndpoint('motor-control/'), body)
	);
}

export async function getWaterMotorStatus({ commandId, deviceUid, signal }) {
	const params = new URLSearchParams(
		commandId !== undefined && commandId !== null
			? { command_id: commandId }
			: { device_uid: deviceUid }
	);
	let response;
	try {
		response = await api.get(
			`${waterMonitoringEndpoint('motor-control/status/')}?${params}`,
			{ signal }
		);
	} catch (error) {
		// Actual Django status endpoint returns 404, not data:null, when a
		// device has no command history. Only treat this specific latest-device
		// result as empty; a missing tracked command or authorization error is not.
		if (
			commandId === undefined &&
			deviceUid &&
			error?.status === 404 &&
			error?.data?.message === 'Command not found'
		) {
			return null;
		}
		throw error;
	}
	const command = commandResponse(response);
	if (
		(commandId !== undefined &&
			commandId !== null &&
			String(command?.id) !== String(commandId)) ||
		(deviceUid && command?.device_uid && command.device_uid !== deviceUid)
	) {
		throw new Error(
			'Motor command status does not match the requested device or command.'
		);
	}
	return command;
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
			Date.parse(machine.latest_ts ?? machine.latest?.timestamp) >=
				Date.parse(previous.latest_ts ?? previous.latest?.timestamp) ||
			!(previous.latest_ts ?? previous.latest?.timestamp)
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
	// Preserve raw measurements, including out-of-range percentages. Only the
	// graphical fill is clamped by tankLevelState; the displayed reading is not.
	const valid = !unavailable && number !== null;
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
