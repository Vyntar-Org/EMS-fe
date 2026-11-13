import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
let handler;
globalThis.__scadaTransport = {
	get: (...args) => handler('get', ...args),
	post: (...args) => handler('post', ...args),
	put: (...args) => handler('put', ...args),
};
const source = (
	await readFile(new URL('./dashboardService.js', import.meta.url), 'utf8')
)
	.replace(
		"import { api } from '../../../helpers/api';",
		'const api=globalThis.__scadaTransport;'
	)
	.replace(
		"'./dashboardPreview'",
		JSON.stringify(new URL('./dashboardPreview.js', import.meta.url).href)
	)
	.replace(
		"'./dashboardModel'",
		JSON.stringify(new URL('./dashboardModel.js', import.meta.url).href)
	);
const { createDashboardService, safePath } = await import(
	'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);
delete globalThis.__scadaTransport;
test('preview starts empty, separates catalog/telemetry and never simulates server saves or commands', async () => {
	handler = () => {
		throw new Error('Preview must not call transport');
	};
	const service = createDashboardService();
	assert.equal(service.preview, true);
	assert.equal(await service.getDashboardLayout('demo-branch'), null);
	assert.ok((await service.getDashboardComponents()).simulated);
	assert.ok(
		(await service.getWaterMonitoringTelemetry('demo-branch')).simulated
	);
	await assert.rejects(service.saveDashboardLayout({}), /browser drafts/);
	await assert.rejects(
		service.requestMotorCommand('asset', 'start', 'branch'),
		/disabled/
	);
});
test('configured API reads are Branch-scoped, authenticated-client based and failures stay failures', async () => {
	const service = createDashboardService({
		provider: 'api',
		layout_url: '/scada/layout',
		telemetry_url: '/scada/telemetry',
	});
	const signal = new AbortController().signal;
	handler = async (method, path, options) => {
		assert.equal(method, 'get');
		assert.equal(path, '/scada/layout?branch_id=9');
		assert.equal(options.signal, signal);
		return { data: { layout: null } };
	};
	assert.equal(await service.getDashboardLayout(9, signal), null);
	handler = async () => {
		throw new Error('server offline');
	};
	await assert.rejects(service.getDashboardLayout(9), /server offline/);
	await assert.rejects(service.getDashboardComponents(), /not configured/);
});
test('server persistence must return a confirmed layout ID and version', async () => {
	const service = createDashboardService({
		provider: 'api',
		layout_url: '/scada/layout',
	});
	const layout = { name: 'A', branch_id: 9, nodes: [], edges: [] };
	handler = async (method, path, payload) => {
		assert.equal(method, 'post');
		assert.equal(payload.branch_id, 9);
		return { data: { ...layout, id: 'layout-1', version: 1 } };
	};
	assert.equal((await service.saveDashboardLayout(layout)).version, 1);
	handler = async () => ({ data: layout });
	await assert.rejects(service.saveDashboardLayout(layout), /did not confirm/);
});
test('requests reject external or missing API paths and invalid motor actions', async () => {
	assert.equal(safePath('https://evil.test'), null);
	assert.equal(safePath('//evil.test'), null);
	assert.equal(safePath('/path\\bad'), null);
	const service = createDashboardService({
		provider: 'api',
		command_url: '/scada/command',
	});
	await assert.rejects(
		service.requestMotorCommand(1, 'toggle', 9),
		/Invalid motor action/
	);
});
test('production mode refuses simulated telemetry and malformed registered catalogs', async () => {
	const { previewCatalog } = await import('./dashboardPreview.js');
	const service = createDashboardService({
		provider: 'api',
		components_url: '/scada/catalog',
		telemetry_url: '/scada/telemetry',
	});
	handler = async () => ({ data: previewCatalog });
	await assert.rejects(service.getDashboardComponents(), /simulated catalog/);
	const catalog = structuredClone(previewCatalog);
	catalog.simulated = false;
	catalog.assets.push({ ...catalog.assets[0] });
	handler = async () => ({ data: catalog });
	await assert.rejects(service.getDashboardComponents(), /registered assets/);
	handler = async () => ({ data: { simulated: true, equipment: [] } });
	await assert.rejects(
		service.getWaterMonitoringTelemetry(9),
		/Simulated telemetry/
	);
});
