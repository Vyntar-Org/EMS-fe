export const getAxisConfig = (
	values = [],
	{ minPadding = 0.1, maxPadding = 0.1, minTicks = 5, forceZero = false } = {}
) => {
	const nums = values.map(Number).filter((v) => Number.isFinite(v));

	if (!nums.length) {
		return {
			min: 0,
			max: 10,
			tickAmount: minTicks,
		};
	}

	let min = Math.min(...nums);
	let max = Math.max(...nums);

	if (forceZero) {
		min = 0;
	}

	if (min === max) {
		const pad = Math.max(1, Math.abs(max) * 0.2);
		min -= pad;
		max += pad;
	}

	const range = max - min;

	return {
		min: Math.floor(min - range * minPadding),
		max: Math.ceil(max + range * maxPadding),
		tickAmount: minTicks,
	};
};
