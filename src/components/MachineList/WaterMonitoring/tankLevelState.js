const numeric = (value) =>
	(typeof value === 'number' ||
		(typeof value === 'string' && value.trim() !== '')) &&
	Number.isFinite(Number(value))
		? Number(value)
		: null;

// OHTTankConfig.capacity is documented in the backend as the same unit as
// tank_level. Other callers must explicitly confirm that relationship.
export function tankLevelState({
	level,
	fillPercent,
	capacity,
	unit,
	capacityUnitMatchesLevel = false,
	unavailable = false,
}) {
	const raw = numeric(level);
	const fill = numeric(fillPercent);
	const full = numeric(capacity);
	let percentage = null;
	let source = null;
	if (!unavailable) {
		if (fill !== null) {
			percentage = fill;
			source = 'fill_percent';
		} else if (
			raw !== null &&
			full !== null &&
			full > 0 &&
			capacityUnitMatchesLevel
		) {
			percentage = (raw / full) * 100;
			source = 'capacity';
		} else if (raw !== null && unit === '%') {
			// Only an explicitly verified percentage unit permits this fallback.
			percentage = raw;
			source = 'level_percent';
		}
	}
	return {
		percentage:
			percentage !== null && Number.isFinite(percentage)
				? Math.min(100, Math.max(0, percentage))
				: null,
		source,
		capacityMissing: full === null || full <= 0,
	};
}
