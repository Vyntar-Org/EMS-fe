export const WATER_MONITORING_LOG_FIELDS = [
	{ key: 'timestamp', label: 'Date & Time', size: 220 },
	{ key: 'tank_level', label: 'Tank Level', size: 130 },
	{ key: 'flowrate', label: 'Flow Rate (m³/h)', size: 130 },
	{ key: 'totalizer', label: 'Totalizer', size: 130 },
	{ key: 'control_mode', label: 'Control Mode', size: 130 },
	{ key: 'control_strategy', label: 'Control Strategy', size: 145 },
	{ key: 'motor_run_state', label: 'Motor Status', size: 130 },
];

export function waterMonitoringControlMode(value) {
	const mode = String(value ?? '')
		.trim()
		.toLowerCase();
	return mode === 'auto' ? 'Auto' : mode === 'manual' ? 'Manual' : 'Unknown';
}

export function waterMonitoringMotorStatus(value) {
	return [true, 1, '1'].includes(value)
		? 'Running'
		: [false, 0, '0'].includes(value)
		  ? 'Stopped'
		  : 'Unknown';
}

function formatControlStrategy(value) {
	const strategy = typeof value === 'string' ? value.trim().toUpperCase() : '';
	switch (strategy) {
		case 'LEVEL':
			return 'Level';
		case 'REMOTE':
			return 'Remote';
		default:
			return '—';
	}
}

export function waterMonitoringLogTimestamp(value) {
	if (typeof value !== 'string' || !value.trim()) {
		return '—';
	}
	// Preserve the backend wall clock and explicitly show any supplied zone.
	// A naive device timestamp is never interpreted as UTC or shifted by the browser.
	const match =
		/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.exec(
			value
		);
	if (!match) {
		return value;
	}
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const zone = match[6] === 'Z' ? ' UTC' : match[6] ? ` ${match[6]}` : '';
	return `${match[3]} ${months[Number(match[2]) - 1] ?? match[2]} ${match[1]} ${
		match[4]
	}${match[5] ?? ''}${zone}`;
}

export function waterMonitoringLogValue(row, key) {
	if (key === 'timestamp') {
		return waterMonitoringLogTimestamp(row[key]);
	}
	if (key === 'control_mode') {
		return waterMonitoringControlMode(row[key]);
	}
	if (key === 'control_strategy') {
		return formatControlStrategy(row[key]);
	}
	if (key === 'motor_run_state') {
		return waterMonitoringMotorStatus(row[key]);
	}
	return row[key] ?? null;
}

export function validateWaterMonitoringLogFilters(filters) {
	if (
		!Number.isInteger(Number(filters?.slave_id)) ||
		Number(filters.slave_id) <= 0
	) {
		throw new Error('Please select a machine to view logs.');
	}
	const start = Date.parse(filters.start_datetime);
	const end = Date.parse(filters.end_datetime);
	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		throw new Error('Please select valid start and end dates and times.');
	}
	if (start > end) {
		throw new Error(
			'Start date and time must be before the end date and time.'
		);
	}
	return {
		slave_id: Number(filters.slave_id),
		start_datetime: filters.start_datetime,
		end_datetime: filters.end_datetime,
	};
}

export function makeWaterMonitoringLogFilters(slaveId, range) {
	return validateWaterMonitoringLogFilters({
		slave_id: slaveId,
		// Same local wall-clock request format used by the existing Water Logs.
		start_datetime: range?.[0]?.isValid?.()
			? range[0].format('YYYY-MM-DD[T]HH:mm:ss')
			: '',
		end_datetime: range?.[1]?.isValid?.()
			? range[1].format('YYYY-MM-DD[T]HH:mm:ss')
			: '',
	});
}

export function waterMonitoringMachineOptions(machines) {
	const names = new Map();
	for (const machine of machines) {
		names.set(machine.slave_name, (names.get(machine.slave_name) ?? 0) + 1);
	}
	return machines
		.filter(
			(machine) =>
				Number.isInteger(Number(machine.slave_id)) &&
				Number(machine.slave_id) > 0
		)
		.map((machine) => ({
			value: Number(machine.slave_id),
			label:
				(machine.slave_name || `Machine ${machine.slave_id}`) +
				(names.get(machine.slave_name) > 1
					? ` (${machine.device_uid || 'Device'} · #${machine.slave_id})`
					: ''),
		}));
}

export function waterMonitoringLogUnits(meta = {}, machine = {}) {
	return Object.fromEntries(
		['tank_level', 'flowrate', 'totalizer'].map((key) => {
			const value = [
				meta?.units?.[key],
				machine?.units?.[key],
				machine?.[`${key}_unit`],
			].find((unit) => typeof unit === 'string' && unit.trim());
			return [key, typeof value === 'string' ? value.trim() : ''];
		})
	);
}

export function waterMonitoringLogHeaders(units = {}) {
	return WATER_MONITORING_LOG_FIELDS.map(({ key, label }) =>
		units[key] ? `${label} (${units[key]})` : label
	);
}

export function waterMonitoringLogsFilename(machine, filters) {
	const name = (machine.slave_name || `Machine_${filters.slave_id}`).replace(
		/[^\p{L}\p{N}_-]+/gu,
		'_'
	);
	return `OHT_${name}_Logs_${filters.start_datetime.slice(
		0,
		10
	)}_to_${filters.end_datetime.slice(0, 10)}`;
}
