import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const WEEKDAY_NAMES = new Set([
	'sun',
	'mon',
	'tue',
	'wed',
	'thu',
	'fri',
	'sat',
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
]);

const MIN_PLAUSIBLE_YEAR = 2000;
const MAX_PLAUSIBLE_YEAR = 2100;
const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const YEAR_IN_VALUE_RE = /\b(?:19|20|21)\d{2}\b/;

// Auto-detects unix-seconds vs unix-ms vs ISO/date strings vs bare HH:mm:ss
// time strings, and only accepts the result if it lands in a real-world year
// range. This is what actually prevents the "1970 bug": a raw category index
// like `5` is technically a valid dayjs input (parsed as an epoch offset), so
// validity alone isn't enough — the plausible-year guard rejects it instead
// of formatting it.
export const smartParseDate = (val) => {
	if (val === undefined || val === null || val === '') {
		return null;
	}
	const str = typeof val === 'string' ? val.trim() : null;
	if (str && WEEKDAY_NAMES.has(str.toLowerCase())) {
		return null;
	}

	let parsed;
	const timeOnlyMatch = str?.match(TIME_ONLY_RE);
	if (typeof val === 'number' || (str && /^\d+$/.test(str))) {
		const num = Number(val);
		// 10-or-fewer-digit numbers are unix seconds; 13-digit are unix ms.
		parsed =
			String(Math.trunc(Math.abs(num))).length <= 10
				? dayjs.unix(num)
				: dayjs(num);
	} else if (timeOnlyMatch) {
		const [, hh, mm, ss] = timeOnlyMatch;
		parsed = dayjs()
			.hour(Number(hh))
			.minute(Number(mm))
			.second(Number(ss || 0))
			.millisecond(0);
	} else {
		parsed = dayjs(val);
	}

	if (!parsed.isValid()) {
		return null;
	}
	const year = parsed.year();
	if (year < MIN_PLAUSIBLE_YEAR || year > MAX_PLAUSIBLE_YEAR) {
		return null;
	}
	return parsed;
};

// Common field names the backend uses for a row's point-in-time across the
// various trend/analytics endpoints — checked in priority order.
const TIME_FIELD_CANDIDATES = [
	'timestamp',
	'ts',
	'datetime',
	'date_time',
	'recorded_at',
	'created_at',
	'event_time',
	'measured_at',
	'sampled_at',
	'logged_at',
	'reading_at',
	'reading_time',
	'start_time',
	'time',
	'date',
	'start',
	// Some aggregation endpoints call a full ISO/unix timestamp `hour`.
	// Bare hour-of-day values are rejected by hasCalendarDate(), below.
	'hour',
];

const hasCalendarDate = (value) => {
	if (typeof value === 'number') {
		return Math.abs(value) >= 1_000_000_000;
	}
	if (typeof value !== 'string') {
		return false;
	}
	const trimmed = value.trim();
	return (
		YEAR_IN_VALUE_RE.test(trimmed) ||
		(/^\d{10,13}$/.test(trimmed) && Number(trimmed) >= 1_000_000_000)
	);
};

// Inspects the first row of `data` and returns the first candidate key whose
// value across the sample actually parses to a plausible real-world date —
// deliberately excludes category-like fields (day names, bare hour indices)
// since smartParseDate already rejects those.
export const detectTimeField = (data) => {
	if (!Array.isArray(data) || !data.length) {
		return null;
	}
	const sample = data.find((row) => row && typeof row === 'object') || data[0];
	if (!sample || typeof sample !== 'object') {
		return null;
	}
	const keys = Object.keys(sample);
	for (const candidate of TIME_FIELD_CANDIDATES) {
		const key = keys.find((k) => k.toLowerCase() === candidate);
		if (key && hasCalendarDate(sample[key]) && smartParseDate(sample[key])) {
			return key;
		}
	}
	return null;
};
