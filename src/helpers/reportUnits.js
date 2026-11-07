const DEVICE_COLLECTION_KEYS = ['machines', 'cards', 'devices', 'results'];
const DEVICE_NAME_KEYS = [
	'machine_name',
	'slave_name',
	'device_name',
	'card_name',
	'name',
];
const UNIT_FIELDS = [
	'display_unit',
	'preferred_unit',
	'unit',
	'measurement_unit',
	'unit_name',
];
const METRIC_KEY_FIELDS = [
	'metric_key',
	'key',
	'parameter',
	'value_key',
	'name',
	'label',
];

const normalizeLookupKey = (value) =>
	typeof value === 'string'
		? value
				.normalize('NFKC')
				.trim()
				.toLocaleLowerCase()
				.replace(/[^a-z0-9]+/g, '')
		: '';

const normalizeUnit = (value) =>
	typeof value === 'string' ? value.trim() : '';

export const normalizeReportDeviceName = (value) =>
	typeof value === 'string'
		? value
				.normalize('NFKC')
				.trim()
				.toLocaleLowerCase()
				.replace(/[‐‑‒–—−]/g, '-')
				.replace(/\s*-\s*/g, '-')
				.replace(/\s+/g, ' ')
		: '';

export const reportDeviceNamesMatch = (left, right) => {
	const normalizedLeft = normalizeReportDeviceName(left);
	return Boolean(
		normalizedLeft && normalizedLeft === normalizeReportDeviceName(right)
	);
};

export const getReportDisplayUnit = (value) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return '';
	}

	for (const field of UNIT_FIELDS) {
		const unit = normalizeUnit(value[field]);
		if (unit) {
			return unit;
		}
	}

	return '';
};

const getUnitValue = (value) => {
	const directUnit = normalizeUnit(value);
	if (directUnit) {
		return directUnit;
	}

	return getReportDisplayUnit(value);
};

const getDeviceRecords = (payload) => {
	let current = payload;

	for (let depth = 0; depth < 3; depth += 1) {
		if (Array.isArray(current)) {
			return current;
		}

		if (!current || typeof current !== 'object') {
			return [];
		}

		const collectionKey = DEVICE_COLLECTION_KEYS.find((key) =>
			Array.isArray(current[key])
		);
		if (collectionKey) {
			return current[collectionKey];
		}

		if (!current.data || typeof current.data !== 'object') {
			return [];
		}

		current = current.data;
	}

	return [];
};

const getDeviceNames = (device) =>
	Array.from(
		new Set(
			DEVICE_NAME_KEYS.map((key) => device?.[key]).filter(
				(value) => typeof value === 'string' && value.trim()
			)
		)
	);

const getUnitFromObject = (units, normalizedUnitKeys) => {
	if (!units || typeof units !== 'object' || Array.isArray(units)) {
		return '';
	}

	const unitValuesByKey = new Map(
		Object.entries(units).map(([key, value]) => [
			normalizeLookupKey(key),
			value,
		])
	);
	for (const key of normalizedUnitKeys) {
		const unit = getUnitValue(unitValuesByKey.get(key));
		if (unit) {
			return unit;
		}
	}

	return '';
};

const getUnitFromMetrics = (metrics, normalizedUnitKeys) => {
	if (!Array.isArray(metrics)) {
		return '';
	}

	for (const key of normalizedUnitKeys) {
		const metric = metrics.find((item) =>
			METRIC_KEY_FIELDS.some(
				(field) => normalizeLookupKey(item?.[field]) === key
			)
		);
		const unit = getReportDisplayUnit(metric);
		if (unit) {
			return unit;
		}
	}

	return '';
};

const getDeviceUnit = (device, machineUnitKeys) => {
	const normalizedUnitKeys = Array.from(
		new Set(machineUnitKeys.map(normalizeLookupKey).filter(Boolean))
	);
	if (!normalizedUnitKeys.length) {
		return '';
	}

	return (
		getUnitFromObject(device?.units, normalizedUnitKeys) ||
		getUnitFromMetrics(device?.metrics, normalizedUnitKeys) ||
		getUnitFromObject(device, normalizedUnitKeys)
	);
};

export const createReportDeviceUnitMap = (
	machineListPayload,
	machineUnitKeys = []
) => {
	const unitsByDevice = new Map();

	getDeviceRecords(machineListPayload).forEach((device) => {
		const unit = getDeviceUnit(device, machineUnitKeys);
		if (!unit) {
			return;
		}

		const normalizedUnit = unit.toLocaleLowerCase();
		getDeviceNames(device).forEach((deviceName) => {
			const normalizedName = normalizeReportDeviceName(deviceName);
			const existing = unitsByDevice.get(normalizedName);
			if (!existing) {
				unitsByDevice.set(normalizedName, {
					unit,
					normalizedUnits: new Set([normalizedUnit]),
				});
				return;
			}

			existing.normalizedUnits.add(normalizedUnit);
		});
	});

	return new Map(
		Array.from(unitsByDevice.entries())
			.filter(([, entry]) => entry.normalizedUnits.size === 1)
			.map(([name, entry]) => [name, entry.unit])
	);
};

export const resolveReportDeviceUnit = (
	machineListPayload,
	deviceName,
	machineUnitKeys = []
) =>
	createReportDeviceUnitMap(machineListPayload, machineUnitKeys).get(
		normalizeReportDeviceName(deviceName)
	) || '';

export const resolveUnambiguousReportUnit = (
	machineListPayload,
	machineUnitKeys = []
) => {
	const normalizedUnits = new Map();

	getDeviceRecords(machineListPayload).forEach((device) => {
		const unit = getDeviceUnit(device, machineUnitKeys);
		if (unit) {
			normalizedUnits.set(unit.toLocaleLowerCase(), unit);
		}
	});

	return normalizedUnits.size === 1
		? Array.from(normalizedUnits.values())[0]
		: '';
};
