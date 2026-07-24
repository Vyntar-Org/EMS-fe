// Industrial/HVAC-style temperature banding, shared by every place in the
// app that displays a °C reading, so the same value always reads the same
// way regardless of which screen it's shown on.
export const TEMPERATURE_STATUS_TIERS = [
	{ key: 'cold', label: 'Too Cold', range: '< 18°C', color: '#2563EB' }, // blue
	{ key: 'normal', label: 'Normal', range: '18–25°C', color: '#16A34A' }, // green
	{ key: 'warning', label: 'Warning', range: '25–30°C', color: '#E3B13E' }, // yellow
	{ key: 'high', label: 'High', range: '30–35°C', color: '#EA580C' }, // orange
	{ key: 'critical', label: 'Critical', range: '> 35°C', color: '#DC2626' }, // red
];

// Visual scale bounds used to place a reading's marker on the 0–100% band —
// clamped so a reading past either end still shows at the bar's edge.
export const TEMPERATURE_SCALE_MIN = 10;
export const TEMPERATURE_SCALE_MAX = 40;

export const getTemperatureScalePercent = (value) => {
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return 0;
	}

	const clamped = Math.min(
		Math.max(num, TEMPERATURE_SCALE_MIN),
		TEMPERATURE_SCALE_MAX
	);
	return (
		((clamped - TEMPERATURE_SCALE_MIN) /
			(TEMPERATURE_SCALE_MAX - TEMPERATURE_SCALE_MIN)) *
		100
	);
};

/**
 * @param {number|string} value - temperature reading in °C
 * @returns {{key:string,label:string,color:string}|null}
 */
export const getTemperatureStatus = (value) => {
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return null;
	}

	if (num < 18) {
		return TEMPERATURE_STATUS_TIERS[0];
	}
	if (num <= 25) {
		return TEMPERATURE_STATUS_TIERS[1];
	}
	if (num <= 30) {
		return TEMPERATURE_STATUS_TIERS[2];
	}
	if (num <= 35) {
		return TEMPERATURE_STATUS_TIERS[3];
	}
	return TEMPERATURE_STATUS_TIERS[4];
};
