import assert from 'node:assert/strict';
import test from 'node:test';

import dayjs from 'dayjs';

import {
	makeOHTLogFilters,
	ohtControlMode,
	ohtLogHeaders,
	ohtLogsFilename,
	ohtLogTimestamp,
	ohtLogUnits,
	ohtLogValue,
	ohtMachineOptions,
	ohtMotorStatus,
	validateOHTLogFilters,
} from './ohtLogModel.js';

test('picker filters use the established local ISO format and reject missing devices and invalid ranges', () => {
	const range = [dayjs('2026-11-01T07:43:00'), dayjs('2026-11-17T19:43:00')];
	assert.deepEqual(makeOHTLogFilters(12, range), {
		slave_id: 12,
		start_datetime: '2026-11-01T07:43:00',
		end_datetime: '2026-11-17T19:43:00',
	});
	assert.throws(() => makeOHTLogFilters('', range), /select a machine/);
	assert.throws(
		() => makeOHTLogFilters(12, [null, range[1]]),
		/valid start and end/
	);
	assert.throws(
		() => makeOHTLogFilters(12, [...range].reverse()),
		/before the end/
	);
	assert.equal(
		validateOHTLogFilters({
			slave_id: 12,
			start_datetime: '2026-11-01T07:00:00+05:30',
			end_datetime: '2026-11-01T07:00:00+05:30',
		}).start_datetime,
		'2026-11-01T07:00:00+05:30'
	);
});

test('timestamps retain naive device wall clocks and explicitly retain UTC/offset instants', () => {
	assert.equal(ohtLogTimestamp('2026-11-17T19:42:37'), '17 Nov 2026 19:42:37');
	assert.equal(
		ohtLogTimestamp('2026-11-17T14:12:37Z'),
		'17 Nov 2026 14:12:37 UTC'
	);
	assert.equal(
		ohtLogTimestamp('2026-11-17T19:42:37.123+05:30'),
		'17 Nov 2026 19:42:37.123 +05:30'
	);
	assert.equal(ohtLogTimestamp(null), '—');
});

test('numeric zero, raw level and decimal precision remain distinct from unknown; historical states have readable names', () => {
	const row = { tank_level: 1450.123456, flowrate: 0, totalizer: null };
	assert.equal(ohtLogValue(row, 'tank_level'), 1450.123456);
	assert.equal(ohtLogValue(row, 'flowrate'), 0);
	assert.equal(ohtLogValue(row, 'totalizer'), null);
	for (const value of [true, 1, '1']) {
		assert.equal(ohtMotorStatus(value), 'Running');
	}
	for (const value of [false, 0, '0']) {
		assert.equal(ohtMotorStatus(value), 'Stopped');
	}
	for (const value of [null, undefined, '', 'unexpected']) {
		assert.equal(ohtMotorStatus(value), 'Unknown');
	}
	assert.equal(ohtControlMode(' AUTO '), 'Auto');
	assert.equal(ohtControlMode('manual'), 'Manual');
	assert.equal(ohtControlMode(null), 'Unknown');
	assert.equal(
		ohtLogValue(
			{ control_mode: 'manual', control_strategy: 'LEVEL' },
			'control_strategy'
		),
		'Level'
	);
	assert.equal(
		ohtLogValue({ control_strategy: ' remote ' }, 'control_strategy'),
		'Remote'
	);
	for (const value of [null, undefined, 'unexpected', ['LEVEL']]) {
		assert.equal(
			ohtLogValue({ control_strategy: value }, 'control_strategy'),
			'—'
		);
	}
});

test('only verified units label columns; duplicate slave names use device identity and actual IDs', () => {
	assert.deepEqual(ohtLogHeaders(ohtLogUnits()), [
		'Date & Time',
		'Tank Level',
		'Flow Rate (m³/h)',
		'Totalizer',
		'Control Mode',
		'Control Strategy',
		'Motor Status',
	]);
	assert.equal(
		ohtLogHeaders(
			ohtLogUnits({ units: { tank_level: 'cm', flowrate: 'L/min' } })
		)[1],
		'Tank Level (cm)'
	);
	const options = ohtMachineOptions([
		{ slave_id: 12, slave_name: 'Garden', device_uid: 'A' },
		{ slave_id: 15, slave_name: 'Garden', device_uid: 'B' },
	]);
	assert.deepEqual(
		options.map((option) => option.value),
		[12, 15]
	);
	assert.match(options[0].label, /Garden.*A.*12/);
	assert.match(options[1].label, /Garden.*B.*15/);
	assert.match(
		ohtLogsFilename(
			{ slave_name: 'Garden / Outlet' },
			{
				slave_id: 12,
				start_datetime: '2026-11-01T00:00:00',
				end_datetime: '2026-11-17T19:00:00',
			}
		),
		/^OHT_Garden_Outlet_Logs_2026-11-01_to_2026-11-17$/
	);
});
