import { API_URLS } from './apiUrls';

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
