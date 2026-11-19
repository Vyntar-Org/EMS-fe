// Match the chart's local-time labels; timeZone is optional for deterministic
// tests. Formatting never changes the underlying API timestamps or chart points.
export function formatTrendTimestamp(value, timeZone) {
	if (typeof value !== 'string' || !value.trim()) {
		return 'N/A';
	}
	const timestamp = Date.parse(value);
	if (!Number.isFinite(timestamp)) {
		return 'N/A';
	}
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
		timeZoneName: 'short',
		...(timeZone ? { timeZone } : {}),
	}).format(timestamp);
}
