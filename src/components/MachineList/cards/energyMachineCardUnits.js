/**
 * Energy machine-list telemetry fields and their descriptive unit aliases.
 * The raw response key is checked first so units can follow either the
 * telemetry field names or the API's semantic unit names.
 */
export const ENERGY_MACHINE_UNIT_KEYS = Object.freeze({
	totalEnergy: ['acte_im', 'active_energy', 'total_energy', 'energy'],
	phaseRV: ['rv', 'r_voltage', 'voltage'],
	phaseRA: ['ir', 'r_current', 'current'],
	phaseYV: ['yv', 'y_voltage', 'voltage'],
	phaseYA: ['iy', 'y_current', 'current'],
	phaseBV: ['bv', 'b_voltage', 'voltage'],
	phaseBA: ['ib', 'b_current', 'current'],
	activePower: ['actpr_t', 'active_power'],
	powerFactor: ['pf_t', 'power_factor', 'pf'],
	frequency: ['fq', 'frequency'],
	today: ['acte_im', 'today', 'today_energy', 'energy'],
	mtd: ['acte_im', 'mtd', 'mtd_energy', 'energy'],
});

const normalizeUnit = (unit) => (typeof unit === 'string' ? unit.trim() : '');

/**
 * @param {unknown} units
 * @param {readonly string[]} keys
 * @param {string} fallbackUnit
 */
export const resolveEnergyMachineUnit = (units, keys, fallbackUnit) => {
	if (units && typeof units === 'object' && !Array.isArray(units)) {
		for (const key of keys) {
			const unit = normalizeUnit(units[key]);
			if (unit) {
				return unit;
			}
		}
	}

	return normalizeUnit(fallbackUnit);
};

export const withEnergyMachineUnit = (value, unit) => {
	const normalizedUnit = normalizeUnit(unit);
	return normalizedUnit ? `${value} ${normalizedUnit}` : String(value);
};
