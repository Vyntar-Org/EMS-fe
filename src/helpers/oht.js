import { api } from './api';
import { API_URLS } from './apiUrls';
export async function getWaterMonitoringMachines({ signal } = {}) {
	const response = await api.get(API_URLS.WATER_MONITORING_MACHINE_LIST, {
		signal,
	});
	if (response?.success === false) {
		throw new Error('Unable to load Water Monitoring machines.');
	}
	const payload = response?.data ?? response;
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

function normalizeMachines(payload) {
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

export function waterMachineState(
	machine,
	{ preview = false, failed = false, now = Date.now(), staleAfter } = {}
) {
	// OHT REST contract: connectivity is decided by the backend. Retain last
	// reported readings/feedback even when offline; controls check connectivity.
	if (Object.hasOwn(machine, 'latest_ts')) {
		const connection = String(machine.status ?? '').toUpperCase();
		const mode =
			typeof machine.control_mode === 'string'
				? machine.control_mode.trim().toLowerCase()
				: '';
		const motor = machine.motor_run_state;
		return {
			connection:
				connection === 'ONLINE'
					? 'Online'
					: connection === 'OFFLINE'
					  ? 'Offline'
					  : 'Unknown',
			timestamp: Date.parse(machine.latest_ts),
			stale: false,
			unavailable: failed,
			mode: mode === 'auto' ? 'Auto' : mode === 'manual' ? 'Manual' : 'Unknown',
			motor: ['1', 1, true].includes(motor)
				? 'Running'
				: ['0', 0, false].includes(motor)
				  ? 'Stopped'
				  : 'Unknown',
		};
	}
	const latest = machine.latest ?? {};
	const timestamp = Date.parse(latest.timestamp);
	const stale =
		machine.is_stale === true ||
		(Number.isFinite(timestamp) &&
			Number.isFinite(staleAfter) &&
			staleAfter > 0 &&
			now - timestamp > staleAfter * 1000);
	const connected =
		machine.status === 'online' && machine.is_device_connected !== false;
	const connection = preview
		? 'Unverified'
		: machine.is_device_connected === false || machine.status === 'offline'
		  ? 'Offline'
		  : connected
		    ? 'Online'
		    : 'Unknown';
	const unavailable =
		!preview && (failed || stale || !Number.isFinite(timestamp) || !connected);
	return {
		connection,
		unavailable,
		stale,
		timestamp,
		mode:
			!unavailable && latest.controlMode === 'manual'
				? 'Manual'
				: !unavailable && latest.controlMode === 'auto'
				  ? 'Auto'
				  : 'Unknown',
		motor:
			!unavailable && String(latest.motorRunState) === '1'
				? 'Running'
				: !unavailable && String(latest.motorRunState) === '0'
				  ? 'Stopped'
				  : 'Unknown',
	};
}

export function matchesWaterMachine(machine, search) {
	return [
		machine.name,
		machine.slave_name,
		machine.slave_id,
		machine.device_name,
		machine.device_code,
		machine.device_uid,
		machine.device_id,
		machine.slave_index,
		machine.details?.gateway,
		machine.details?.location,
		machine.details?.sensor_label,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
		.includes(search.trim().toLowerCase());
}

export function waterMachineTitle(machine, preview = false) {
	const title =
		machine.name || machine.slave_name || `Slave ${machine.slave_id}`;
	return preview
		? title.replace(/\s*[\u2014\u2013-]\s*Sample\s*(\d+)$/i, ' $1')
		: title;
}
// Compare paired readings in the same configured unit. A zero baseline has no percent change.
export function compareWaterReading(current, previous) {
	const number = (value) =>
		(typeof value === 'number' ||
			(typeof value === 'string' && value.trim() !== '')) &&
		Number.isFinite(Number(value))
			? Number(value)
			: null;
	const latest = number(current);
	const before = number(previous);
	if (latest === null || before === null) {
		return null;
	}
	const delta = latest - before;
	if (!Number.isFinite(delta)) {
		return null;
	}
	const percent = before === 0 ? null : (delta / Math.abs(before)) * 100;
	return {
		previous: String(previous),
		delta,
		percent: Number.isFinite(percent) ? percent : null,
		direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
	};
}
