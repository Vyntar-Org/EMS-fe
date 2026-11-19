import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTrendTimestamp } from './trendTimestamp.js';

test('Django microsecond timestamps display readable dates, times and timezone', () => {
	const value = '2026-11-16T10:40:32.667781Z';
	const utc = formatTrendTimestamp(value, 'UTC');
	assert.match(utc, /16 Nov 2026/);
	assert.match(utc, /10:40:32\s*am/);
	assert.match(utc, /UTC/);
	const india = formatTrendTimestamp(value, 'Asia/Kolkata');
	assert.match(india, /16 Nov 2026/);
	assert.match(india, /04:10:32\s*pm/);
	assert.doesNotMatch(india, /T10:40|667781Z/);
	assert.equal(value, '2026-11-16T10:40:32.667781Z');
});

test('missing and invalid range timestamps never display an epoch date or Invalid Date', () => {
	for (const value of [null, undefined, '', ' ', 'invalid', 0]) {
		assert.equal(formatTrendTimestamp(value), 'N/A');
	}
});
