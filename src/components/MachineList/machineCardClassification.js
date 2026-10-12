export const MACHINE_CARD_KIND = {
	WATER_LEVEL: 'WATER_LEVEL',
	WATER_QUALITY: 'WATER_QUALITY',
	STANDARD: 'STANDARD',
};

const WATER_LEVEL_CARD_TYPE = 'TANK_CARD';
const CONSUMPTION_METRIC_KEYS = new Set([
	'today_consumption',
	'mtd_consumption',
]);

export const isWaterQualityMetric = (metric) => {
	const identifiers = [metric?.metric_key, metric?.label]
		.filter(Boolean)
		.map((value) => String(value).trim().toLowerCase());

	return identifiers.some((value) =>
		/(^|[^a-z0-9])(tds|ph|p\.h)(?=$|[^a-z0-9])/.test(value)
	);
};

export const getMachineCardKind = (machine) => {
	if (machine?.ui_card_type === WATER_LEVEL_CARD_TYPE) {
		return MACHINE_CARD_KIND.WATER_LEVEL;
	}

	if (machine?.metrics?.some(isWaterQualityMetric)) {
		return MACHINE_CARD_KIND.WATER_QUALITY;
	}

	return MACHINE_CARD_KIND.STANDARD;
};

export const getOperationalMetrics = (machine) =>
	(machine?.metrics || []).filter(
		(metric) => !CONSUMPTION_METRIC_KEYS.has(metric?.metric_key)
	);

export const getConsumptionMetric = (machine, metricKey) =>
	machine?.metrics?.find((metric) => metric?.metric_key === metricKey);

export const getWaterLevelMetrics = (metrics = []) =>
	metrics.filter((metric) =>
		String(metric?.metric_key || metric?.label || '')
			.trim()
			.toLowerCase()
			.startsWith('level')
	);
