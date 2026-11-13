import assert from 'node:assert/strict';
import test from 'node:test';
import { compareWaterReading } from './waterMachinePresentation.js';

test('previous reading comparison handles increases, decreases and unchanged readings', () => {
	assert.deepEqual(compareWaterReading('5.00', '4.00'), {
		previous: '4.00',
		delta: 1,
		percent: 25,
		direction: 'up',
	});
	assert.equal(compareWaterReading(0, 1.2).percent, -100);
	assert.equal(compareWaterReading(243.6, 243.6).direction, 'flat');
});
test('zero baselines and invalid readings never fabricate a percentage', () => {
	assert.equal(compareWaterReading(5, 0).percent, null);
	assert.equal(compareWaterReading(0, 0).delta, 0);
	for (const value of [null, undefined, '', 'bad', Infinity]) {
		assert.equal(compareWaterReading(5, value), null);
		assert.equal(compareWaterReading(value, 5), null);
	}
	assert.equal(compareWaterReading(Number.MAX_VALUE, -Number.MAX_VALUE), null);
});
