import { API_URLS } from './apiUrls';

const getParameterKeys = (parameters) => {
	const values = Array.isArray(parameters)
		? parameters
		: parameters
		? [parameters]
		: [];

	return values
		.flatMap((parameter) => {
			const value =
				typeof parameter === 'string' ? parameter : parameter?.value;
			return typeof value === 'string' ? value.split(',') : [];
		})
		.map((value) => value.trim())
		.filter(Boolean);
};

/**
 * Keeps log-table data aligned with the submitted parameter selection. The
 * timestamp remains available as the required row anchor, while API-only
 * metadata fields are excluded unless they were explicitly selected.
 */
export const filterLogRowsForDisplay = (
	rows,
	parameters,
	configuredKeys = []
) => {
	if (!Array.isArray(rows)) {
		return [];
	}

	const selectedKeys = getParameterKeys(parameters);
	const hasExplicitSelection =
		selectedKeys.length > 0 && !selectedKeys.includes('all');
	const allowedKeys = new Set(
		hasExplicitSelection ? selectedKeys : configuredKeys.filter(Boolean)
	);
	allowedKeys.add('timestamp');

	// Dynamic applications may not expose a static column configuration. In
	// that case an empty selection intentionally means "all API fields".
	if (!hasExplicitSelection && configuredKeys.length === 0) {
		return rows;
	}

	return rows.map((row) =>
		Object.fromEntries(
			Object.entries(row || {}).filter(([key]) => allowedKeys.has(key))
		)
	);
};

export const getLogColumnKeys = (rows) => {
	const availableKeys = Array.from(
		new Set(
			(Array.isArray(rows) ? rows : []).flatMap((row) =>
				Object.keys(row || {})
			)
		)
	);

	return availableKeys.includes('timestamp')
		? ['timestamp', ...availableKeys.filter((key) => key !== 'timestamp')]
		: availableKeys;
};

export const LogUrlBuilder = (apiUrlName) => {
	if (!apiUrlName) {
		return null;
	}

	return {
		parsePayload: (payload) => {
			const slaveId = payload?.slave_id?.value ?? '';
			const parameterValues = payload?.parameters
				? payload.parameters
						.map((p) => p?.value)
						.filter(Boolean)
						.join(',')
				: '';

			const startDateObj = payload?.dateTime?.[0];
			const endDateObj = payload?.dateTime?.[1];
			const formattedStart = startDateObj?.isValid?.()
				? startDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';
			const formattedEnd = endDateObj?.isValid?.()
				? endDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';

			return { slaveId, parameterValues, formattedStart, formattedEnd };
		},

		build: function ({
			payload,
			limit = null,
			offset = null,
			isDownload = false,
		}) {
			const { slaveId, parameterValues, formattedStart, formattedEnd } =
				this.parsePayload(payload);

			if (!slaveId) {
				return '';
			}
			if (typeof API_URLS?.[apiUrlName] !== 'function') {
				console.error(
					`LogUrlBuilder: "${apiUrlName}" is not a valid function inside API_URLS.`
				);
				return '';
			}

			return API_URLS[apiUrlName](
				slaveId,
				parameterValues,
				formattedStart,
				formattedEnd,
				limit,
				offset,
				isDownload
			);
		},
	};
};
