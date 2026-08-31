/**
 * Formats a numeric UI value with a configurable decimal ceiling.
 *
 * The default presentation trims insignificant trailing zeroes:
 * 123.456 -> "123.46", 50.00 -> "50", 50.10 -> "50.1".
 * Set `minimumDecimals` when a fixed visual precision is required.
 */
export const formatNumber = (
	value,
	maxDecimals = 2,
	{ minimumDecimals = 0, fallback = '-', useGrouping = false } = {}
) => {
	if (value === null || value === undefined || value === '') {
		return fallback;
	}
	if (typeof value !== 'number' && typeof value !== 'string') {
		return fallback;
	}

	const numericValue =
		typeof value === 'string' ? Number(value.trim()) : Number(value);
	if (!Number.isFinite(numericValue)) {
		return fallback;
	}

	const safeMaximum = Math.max(0, Math.min(20, Number(maxDecimals) || 0));
	const safeMinimum = Math.max(
		0,
		Math.min(safeMaximum, Number(minimumDecimals) || 0)
	);

	return new Intl.NumberFormat('en-IN', {
		useGrouping,
		minimumFractionDigits: safeMinimum,
		maximumFractionDigits: safeMaximum,
	}).format(numericValue);
};

export const formatNumberWithUnit = (value, unit = '', maxDecimals = 2) => {
	const formatted = formatNumber(value, maxDecimals);
	return formatted === '-' || !unit ? formatted : `${formatted} ${unit}`;
};
