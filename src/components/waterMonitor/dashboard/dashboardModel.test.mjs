import assert from 'node:assert/strict';
import test from 'node:test';
import { previewCatalog, referenceLayout } from './dashboardPreview.js';
import {
	clone,
	commandBlock,
	commandOutcome,
	connectionError,
	emptyLayout,
	payloadFor,
	pipeState,
	readingState,
	tankPercent,
	validateLayout,
	removeElement,
} from './dashboardModel.js';

test('initial layout is empty and the optional reference topology validates', () => {
	assert.equal(emptyLayout('demo-branch').nodes.length, 0);
	assert.match(
		validateLayout(
			emptyLayout('demo-branch'),
			previewCatalog,
			'demo-branch'
		)[0],
		/at least one/
	);
	assert.deepEqual(
		validateLayout(referenceLayout, previewCatalog, 'demo-branch'),
		[]
	);
});
test('layout validation rejects duplicate IDs, cross-Branch/duplicate assets and malformed records', () => {
	for (const mutate of [
		(l) => l.nodes.push(clone(l.nodes[0])),
		(l) => (l.nodes[0].data.asset_id = 'not-authorized'),
		(l) => (l.nodes[0].position.x = Infinity),
		(l) => l.nodes.push(null),
		(l) => (l.branch_id = 'another-branch'),
		(l) => (l.nodes[1].data.asset_id = 'demo-p1'),
		(l) => (l.nodes[0].data.label = ''),
	]) {
		const layout = clone(referenceLayout);
		mutate(layout);
		assert.ok(validateLayout(layout, previewCatalog, 'demo-branch').length);
	}
});
test('connections enforce port media, direction, duplicates and input limits', () => {
	const layout = clone(referenceLayout);
	assert.match(
		connectionError(layout, previewCatalog, {
			source: 'ref-t0',
			source_port: 'level',
			target: 'ref-p1',
			target_port: 'in',
		}),
		/compatible/
	);
	assert.match(
		connectionError(layout, previewCatalog, {
			source: 'ref-p0',
			source_port: 'in',
			target: 'ref-f0',
			target_port: 'in',
		}),
		/compatible/
	);
	assert.match(
		connectionError(layout, previewCatalog, layout.edges[0]),
		/already exists/
	);
	assert.match(
		connectionError(layout, previewCatalog, {
			source: 'ref-p2',
			source_port: 'out',
			target: 'ref-f0',
			target_port: 'in',
		}),
		/limit/
	);
	assert.match(
		connectionError(layout, previewCatalog, {
			source: 'ref-p1',
			source_port: 'out',
			target: 'ref-p1',
			target_port: 'in',
		}),
		/itself/
	);
});
const now = Date.parse('2026-11-13T10:00:30Z');
const live = {
	online: true,
	is_stale: false,
	timestamp: '2026-11-13T10:00:20Z',
	controlMode: 'auto',
	motorRunState: '0',
	TankLevel: '75',
	level_unit: '%',
	flowrate: '2.4',
	control: {
		command_pending: false,
		user_allowed: true,
		supported: true,
		commissioned: true,
		device_ready: true,
		interlocks_valid: true,
		operating_state_allowed: true,
	},
};
test('telemetry freshness and verified units gate physical feedback and tank fill', () => {
	assert.equal(readingState(live, { now }).motor, 'Stopped');
	assert.equal(tankPercent(live, readingState(live, { now })), 75);
	assert.equal(
		tankPercent({ ...live, level_unit: 'cm' }, readingState(live, { now })),
		null
	);
	for (const change of [
		{ online: false },
		{ is_stale: true },
		{ timestamp: '2026-11-12T00:00:00Z' },
		{ timestamp: '2026-11-14T00:00:00Z' },
	])
		assert.equal(readingState({ ...live, ...change }, { now }).ready, false);
	assert.equal(
		readingState({ ...live, motorRunState: 'bad' }, { now }).motor,
		'Unknown'
	);
});
test('pipeline motion uses its own assigned flow meter, never pump state', () => {
	const records = {
		meter: live,
		pump: { ...live, motorRunState: '1', flowrate: undefined },
	};
	assert.equal(
		pipeState({ flow_asset_id: 'meter' }, records, { now }),
		'flowing'
	);
	assert.equal(
		pipeState({ flow_asset_id: 'pump' }, records, { now }),
		'unknown'
	);
	assert.equal(pipeState({}, records, { now }), 'unknown');
	assert.equal(
		pipeState(
			{ flow_asset_id: 'meter' },
			{ meter: { ...live, flowrate: '0' } },
			{ now }
		),
		'stopped'
	);
	assert.equal(
		pipeState(
			{ flow_asset_id: 'meter' },
			{ meter: { ...live, is_stale: true } },
			{ now }
		),
		'unknown'
	);
});
test('every control capability is mandatory; Manual, preview and pending always block', () => {
	assert.equal(commandBlock(live, { now, pathsReady: true }), null);
	for (const key of Object.keys(live.control)) {
		const value = { ...live, control: { ...live.control, [key]: undefined } };
		assert.ok(commandBlock(value, { now, pathsReady: true }));
	}
	for (const options of [
		{ preview: true },
		{ pending: true },
		{ pathsReady: false },
	])
		assert.ok(commandBlock(live, { now, pathsReady: true, ...options }));
	assert.match(
		commandBlock(
			{ ...live, controlMode: 'manual', motorRunState: '1' },
			{ now, pathsReady: true }
		),
		/Manual/
	);
});
test('acknowledgment cannot resolve a motor command without independent new feedback', () => {
	const command = {
		id: 'cmd-1',
		action: 'start',
		startedAt: Date.parse('2026-11-13T10:00:10Z'),
	};
	assert.equal(
		commandOutcome(
			command,
			{ command_id: 'cmd-1', status: 'acknowledged' },
			live,
			{ now }
		),
		null
	);
	assert.equal(
		commandOutcome(
			command,
			{ command_id: 'cmd-1', status: 'completed' },
			live,
			{ now }
		),
		null
	);
	assert.equal(
		commandOutcome(
			command,
			{ command_id: 'cmd-1', status: 'completed' },
			{ ...live, motorRunState: '1' },
			{ now }
		),
		'confirmed'
	);
	assert.equal(
		commandOutcome(
			command,
			{ command_id: 'wrong', status: 'completed' },
			{ ...live, motorRunState: '1' },
			{ now }
		),
		null
	);
	assert.equal(
		commandOutcome(command, { command_id: 'cmd-1', status: 'rejected' }, live, {
			now,
		}),
		'rejected'
	);
});
test('save payload contains positions and bindings, never live telemetry or control intent', () => {
	const layout = clone(referenceLayout);
	layout.nodes[0].data.motorRunState = '1';
	layout.nodes[0].selected = true;
	const payload = payloadFor(layout);
	assert.equal(payload.nodes[0].data.motorRunState, undefined);
	assert.equal(payload.nodes[0].selected, undefined);
	assert.deepEqual(payload.nodes[0].position, layout.nodes[0].position);
	assert.equal(payload.edges[0].flow_asset_id, 'demo-f0');
});
test('real feedback rejects timestamps without a timezone and simulated control records', () => {
	assert.equal(
		readingState({ ...live, timestamp: '2026-11-13T10:00:20' }, { now }).ready,
		false
	);
	assert.match(
		commandBlock({ ...live, simulated: true }, { now, pathsReady: true }),
		/Simulated/
	);
	assert.match(
		commandBlock(live, { now, pathsReady: true, action: 'stop' }),
		/feedback changed/
	);
	assert.equal(
		commandBlock(live, { now, pathsReady: true, action: 'start' }),
		null
	);
});

test('deleting a bound meter removes attached edges and clears remaining flow evidence', () => {
	const original = clone(referenceLayout);
	const result = removeElement(original, { kind: 'node', id: 'ref-f1' });
	assert.ok(!result.nodes.some((node) => node.id === 'ref-f1'));
	assert.ok(result.edges.every((edge) => edge.flow_asset_id !== 'demo-f1'));
	assert.deepEqual(validateLayout(result, previewCatalog, 'demo-branch'), []);
	assert.ok(original.nodes.some((node) => node.id === 'ref-f1'));
});
