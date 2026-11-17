import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { transform } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Use the JSX transformer already installed with Vite, without a browser or
// new test dependency, to check the actual existing tank illustration output.
const require = createRequire(import.meta.url);
const source = await readFile(
	new URL('./WaterTankGraphic.jsx', import.meta.url),
	'utf8'
);
const compiled = await transform(source, {
	loader: 'jsx',
	jsx: 'automatic',
	format: 'esm',
});
const code = compiled.code.replace(
	/from "(react(?:\/jsx-runtime)?)"/g,
	(_, name) =>
		`from ${JSON.stringify(pathToFileURL(require.resolve(name)).href)}`
);
const { default: Graphic } = await import(
	`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
const render = (props) => renderToStaticMarkup(createElement(Graphic, props));

test('tank SVG renders valid and zero percentages distinctly from unavailable readings', () => {
	assert.match(
		render({ percentage: 47.5, rawValue: '47.5', unit: '%' }),
		/47\.5% full/
	);
	assert.match(render({ percentage: 0, rawValue: '0', unit: '%' }), /0% full/);
	assert.match(
		render({ percentage: null, rawValue: 'N/A', unavailable: true }),
		/Tank level unavailable/
	);
});

test('indeterminate tank retains real raw level and hides percentage scale', () => {
	const html = render({ percentage: null, rawValue: '47.5', unit: 'cm' });
	assert.match(html, /Tank reading 47\.5 cm, fill percentage unavailable/);
	assert.match(html, /47\.5 cm<\/span>/);
	assert.doesNotMatch(html, /47\.5%|100%|>N\/A<\/span>/);
});

test('percentage readout is outside the SVG and follows battery color boundaries including zero', () => {
	for (const [percentage, band] of [
		[0, 'red'],
		[25, 'red'],
		[25.5, 'orange'],
		[26, 'orange'],
		[50, 'orange'],
		[50.5, 'yellow'],
		[51, 'yellow'],
		[75, 'yellow'],
		[75.5, 'green'],
		[76, 'green'],
		[100, 'green'],
	]) {
		const html = render({
			percentage,
			rawValue: String(percentage),
			unit: '%',
		});
		assert.match(
			html,
			new RegExp(`</svg><figcaption class="wm-tank-reading wm-level-${band}"`)
		);
		assert.match(html, new RegExp(`>${percentage}%</span>`));
	}
	assert.match(
		render({ percentage: null, unavailable: true }),
		/wm-level-unavailable/
	);
});

test('tank SVG clamps graphic without modifying raw measurement passed separately by the card', () => {
	assert.match(render({ percentage: 120, rawValue: '120' }), /100% full/);
	assert.match(render({ percentage: -5, rawValue: '-5' }), /0% full/);
	assert.doesNotMatch(render({ percentage: NaN, rawValue: '47.5' }), /NaN%/);
});
