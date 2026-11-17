import assert from 'node:assert/strict';
import test from 'node:test';

import { tankLevelState } from './tankLevelState.js';

test('backend fill percentage has precedence, preserves zero and clamps graphic only', () => {
	for (const [fillPercent, expected] of [
		[47.5, 47.5],
		[0, 0],
		[120, 100],
		[-3, 0],
		['41.8', 41.8],
	]) {
		const input = { level: 50.2, fillPercent, capacity: null };
		assert.equal(tankLevelState(input).percentage, expected);
		assert.equal(tankLevelState(input).source, 'fill_percent');
		assert.equal(input.level, 50.2);
	}
});

test('capacity ratio requires explicitly verified compatible units and positive capacity', () => {
	const input = { level: 25, capacity: 50, fillPercent: null };
	assert.equal(tankLevelState(input).percentage, null);
	assert.equal(
		tankLevelState({ ...input, capacityUnitMatchesLevel: true }).percentage,
		50
	);
	for (const capacity of [null, '', 0, -1, 'invalid', Infinity]) {
		assert.equal(
			tankLevelState({ ...input, capacity, capacityUnitMatchesLevel: true })
				.percentage,
			null
		);
	}
});

test('missing capacity never turns unknown-unit measurements into percentages', () => {
	for (const level of [47.5, 41.8, 50.2, 0]) {
		const input = { level, fillPercent: null, capacity: null };
		assert.equal(tankLevelState(input).percentage, null);
		assert.equal(tankLevelState(input).capacityMissing, true);
		// Backend OHT constants explicitly document the raw level series as %.
		assert.equal(tankLevelState({ ...input, unit: '%' }).percentage, level);
	}
});

test('invalid/null measurements remain unavailable; fresh API values replace previous fill', () => {
	for (const level of [null, undefined, '', 'invalid', NaN, Infinity]) {
		assert.equal(tankLevelState({ level, unit: '%' }).percentage, null);
	}
	assert.equal(
		tankLevelState({ level: 47.5, unit: '%', unavailable: true }).percentage,
		null
	);
	assert.equal(tankLevelState({ level: 47.5, unit: '%' }).percentage, 47.5);
	assert.equal(tankLevelState({ level: 50.2, unit: '%' }).percentage, 50.2);
	assert.equal(tankLevelState({ level: null, unit: '%' }).percentage, null);
});
