import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildSync } from 'esbuild';
import {
	previewCatalog,
	previewTelemetry,
	referenceLayout,
} from './dashboardPreview.js';
const require = createRequire(import.meta.url);
const result = buildSync({
	entryPoints: [
		new URL('./DashboardCanvas.jsx', import.meta.url).pathname.replace(
			/^\/([A-Za-z]:)/,
			'$1'
		),
	],
	bundle: true,
	platform: 'node',
	format: 'cjs',
	packages: 'external',
	jsx: 'automatic',
	write: false,
});
const compiled = new Module(import.meta.filename);
compiled.filename = import.meta.filename;
compiled.paths = require.resolve.paths('react');
compiled._compile(result.outputFiles[0].text, import.meta.filename);
const Canvas = compiled.exports.default;
const props = {
	layout: referenceLayout,
	catalog: previewCatalog,
	records: Object.fromEntries(
		previewTelemetry.equipment.map((item) => [item.asset_id, item])
	),
	preview: true,
	monitoring: true,
	selection: null,
	commands: {},
	commandPathsReady: false,
	now: Date.now(),
	staleAfter: 60,
	fitToken: 0,
};
test('monitoring renders independent SVG equipment at saved positions with disabled preview commands', () => {
	const html = renderToStaticMarkup(React.createElement(Canvas, props));
	assert.equal(
		(html.match(/<article /g) || []).length,
		referenceLayout.nodes.length
	);
	assert.ok(html.includes('translate(760px, 220px)'));
	assert.ok(html.includes('sc-pipe-flow'));
	assert.ok(html.includes('sc-art-running'));
	assert.match(html, /role="switch"[^>]*disabled=""/);
	assert.ok(!html.includes('sc-canvas-empty'));
	const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
	assert.equal(new Set(ids).size, ids.length);
});
test('empty layouts render instructions and no invented equipment or flow particles', () => {
	const html = renderToStaticMarkup(
		React.createElement(Canvas, {
			...props,
			layout: { name: 'Empty', branch_id: 'demo-branch', nodes: [], edges: [] },
			monitoring: false,
		})
	);
	assert.ok(html.includes('Build your water network'));
	assert.equal((html.match(/<article /g) || []).length, 0);
	assert.ok(!html.includes('class="sc-pipe-flow"'));
});
test('unbound or unavailable meter data never creates pipeline movement', () => {
	const html = renderToStaticMarkup(
		React.createElement(Canvas, { ...props, records: {} })
	);
	assert.ok(!html.includes('class="sc-pipe-flow"'));
	assert.ok(!html.includes('sc-art-running'));
});
