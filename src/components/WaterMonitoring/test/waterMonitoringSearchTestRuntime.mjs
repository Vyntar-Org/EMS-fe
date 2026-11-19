import { readFile } from 'node:fs/promises';
import Module, { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSync } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const theme = createTheme({
	palette: {
		primary: { main: '#003366' },
		surface: { zebra: '#f8fbff', muted: '#f6f8fb', tableHead: '#f3f6fa' },
	},
});

// Exercise production handlers with deterministic hooks and real shared MUI
// components. Transport is mocked; production initial filters are left intact.
export async function compileSearchComponent(componentUrl) {
	let current;
	const adapter = {
		useState: (initial) => current.useState(initial),
		useRef: (initial) => current.useRef(initial),
		useMemo: (callback) => callback(),
		useEffect() {},
		useQuery: (options) => current.useQuery(options),
		request: (...args) => current.request(...args),
	};
	globalThis.__waterMonitoringSearchTest = adapter;
	const source = (await readFile(componentUrl, 'utf8'))
		.replace(
			"import { useQuery } from '@tanstack/react-query';",
			'const { useQuery } = globalThis.__waterMonitoringSearchTest;'
		)
		.replace(
			/import\s+{([^}]+)}\s+from 'react';/,
			(_, names) => `const {${names}} = globalThis.__waterMonitoringSearchTest;`
		)
		.replace(
			"import { useAuth } from '../../../contexts/AuthContext';",
			'const useAuth = () => ({ user: { id: 8 } });'
		)
		.replace(
			"import { getWaterMonitoringMachines } from '../../WaterMonitoring/waterMonitoringService';",
			'const getWaterMonitoringMachines = () => {};'
		)
		.replace(
			/import\s+{[^}]+}\s+from '\.\/waterMonitoringLogsApi';/,
			'const getWaterMonitoringLogs = globalThis.__waterMonitoringSearchTest.request; const waterMonitoringLogsError = error => error.message;'
		)
		.replace(
			"import { getWaterReport, waterReportError } from './waterMonitoringReportsApi';",
			'const getWaterReport = globalThis.__waterMonitoringSearchTest.request; const waterReportError = error => error.message;'
		);
	const bundle = buildSync({
		stdin: {
			contents: source,
			loader: 'jsx',
			resolveDir: dirname(fileURLToPath(componentUrl)),
		},
		bundle: true,
		platform: 'node',
		format: 'cjs',
		packages: 'external',
		jsx: 'automatic',
		define: { 'import.meta.env': '{}' },
		write: false,
	});
	const compiled = new Module(import.meta.filename);
	compiled.filename = import.meta.filename;
	compiled.paths = require.resolve.paths('react');
	compiled._compile(bundle.outputFiles[0].text, import.meta.filename);
	delete globalThis.__waterMonitoringSearchTest;
	return function harness({ data, machines } = {}) {
		let cursor = 0;
		const slots = [];
		const runtime = {
			options: null,
			calls: [],
			refreshes: 0,
			// Supply cached/late data even for idle keys: it must remain hidden.
			query: { data, isSuccess: true, isFetching: false, isError: false },
			useState(initial) {
				const index = cursor++;
				if (!(index in slots)) {
					slots[index] = typeof initial === 'function' ? initial() : initial;
				}
				return [
					slots[index],
					(value) => {
						slots[index] =
							typeof value === 'function' ? value(slots[index]) : value;
					},
				];
			},
			useRef(initial) {
				const [ref] = runtime.useState({ current: initial });
				return ref;
			},
			useQuery(options) {
				if (options.queryKey.includes('machine-list')) {
					return { data: { machines: machines ?? [] } };
				}
				runtime.options = options;
				return {
					...runtime.query,
					refetch: () => {
						runtime.refreshes++;
					},
				};
			},
			request(...args) {
				runtime.calls.push(args);
				return Promise.resolve(runtime.query.data);
			},
			render() {
				cursor = 0;
				current = runtime;
				return compiled.exports.default();
			},
			html() {
				return renderToStaticMarkup(
					createElement(ThemeProvider, { theme }, runtime.render())
				);
			},
		};
		return runtime;
	};
}

export function findProps(node, predicate) {
	if (!node || typeof node !== 'object') {
		return undefined;
	}
	if (Array.isArray(node)) {
		return node.map((child) => findProps(child, predicate)).find(Boolean);
	}
	return predicate(node.props ?? {})
		? node.props
		: findProps(node.props?.children, predicate);
}

export const tableProps = (tree) =>
	findProps(tree, (props) => props.totalRowCount !== undefined);
