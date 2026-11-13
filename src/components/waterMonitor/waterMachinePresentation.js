export function waterMachineState(
	machine,
	{ preview = false, failed = false, now = Date.now(), staleAfter } = {}
) {
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
