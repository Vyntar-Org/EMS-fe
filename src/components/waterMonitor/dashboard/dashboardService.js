import { api } from '../../../helpers/api';

import { componentTypes, parseLayout, payloadFor } from './dashboardModel';
import {
	previewCatalog,
	previewSavedLayout,
	previewTelemetry,
} from './dashboardPreview';

export const safePath = (value) =>
	typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\#]/.test(value)
		? value
		: null;
const message = (error) =>
	error?.data?.detail ||
	error?.data?.message ||
	(error?.data && Object.keys(error.data).length ? error.data : null) ||
	error?.message ||
	'The server could not complete this request.';
export const errorMessage = (error) =>
	typeof message(error) === 'string'
		? message(error)
		: JSON.stringify(message(error));
const unpack = (response) => {
	if (response?.success === false) {
		throw new Error(response.message || 'The server rejected this request.');
	}
	return response?.data ?? response;
};
const withQuery = (path, params) =>
	`${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams(params)}`;
export function createDashboardService(config = {}) {
	const names = [
		'components_url',
		'layout_url',
		'telemetry_url',
		'command_url',
		'command_status_url',
	];
	const preview =
		config.provider !== 'api' && !names.some((name) => config[name]);
	const path = (name) => {
		const value = safePath(config[name]);
		if (!value) {
			throw new Error(`Water Monitoring ${name} is not configured.`);
		}
		return value;
	};
	return {
		preview,
		commandPathsReady:
			!preview &&
			Boolean(
				safePath(config.command_url) && safePath(config.command_status_url)
			),
		async getDashboardComponents(signal) {
			const data = preview
				? structuredClone(previewCatalog)
				: unpack(await api.get(path('components_url'), { signal }));
			if (
				!Array.isArray(data?.categories) ||
				!Array.isArray(data?.assets) ||
				!Array.isArray(data?.branches)
			) {
				throw new Error(
					'Invalid equipment catalog: categories, registered assets and Branches are required.'
				);
			}
			if (!preview && data.simulated === true) {
				throw new Error(
					'A simulated catalog cannot be used as a production catalog.'
				);
			}
			const types = componentTypes(data),
				ids = new Set();
			for (const type of types) {
				if (
					typeof type.type !== 'string' ||
					ids.has(type.type) ||
					!Array.isArray(type.ports)
				) {
					throw new Error('Invalid equipment types or ports.');
				}
				ids.add(type.type);
			}
			const branches = new Set();
			for (const branch of data.branches) {
				if (
					branch?.id === null ||
					typeof branch.name !== 'string' ||
					branches.has(String(branch.id))
				) {
					throw new Error('Invalid or duplicate Branch records.');
				}
				branches.add(String(branch.id));
			}
			const assets = new Set();
			for (const asset of data.assets) {
				if (
					asset?.asset_id === null ||
					assets.has(String(asset.asset_id)) ||
					!branches.has(String(asset.branch_id)) ||
					!Array.isArray(asset.compatible_types) ||
					typeof asset.name !== 'string'
				) {
					throw new Error('Invalid or duplicate registered assets.');
				}
				assets.add(String(asset.asset_id));
			}
			for (const type of types) {
				const ports = new Set();
				for (const port of type.ports) {
					if (
						!port ||
						!port.id ||
						ports.has(port.id) ||
						!['input', 'output'].includes(port.direction) ||
						!['water', 'signal'].includes(port.medium)
					) {
						throw new Error('Invalid equipment port definitions.');
					}
					ports.add(port.id);
				}
			}

			return data;
		},
		async getDashboardLayout(branchId, signal) {
			return preview
				? structuredClone(previewSavedLayout)
				: parseLayout(
						unpack(
							await api.get(
								withQuery(path('layout_url'), { branch_id: branchId }),
								{ signal }
							)
						)
				  );
		},
		async saveDashboardLayout(layout) {
			if (preview) {
				throw new Error('Preview layouts can only be saved as browser drafts.');
			}
			const data = parseLayout(
				unpack(await api.post(path('layout_url'), payloadFor(layout)))
			);
			if (!data?.id || data.version === null) {
				throw new Error(
					'The server did not confirm a persisted layout ID/version. Reload to reconcile before retrying.'
				);
			}
			return data;
		},
		async updateDashboardLayout(layoutId, layout) {
			if (preview) {
				throw new Error('Preview layouts can only be saved as browser drafts.');
			}
			const data = parseLayout(
				unpack(
					await api.put(path('layout_url'), {
						...payloadFor(layout),
						id: layoutId,
					})
				)
			);
			if (String(data?.id) !== String(layoutId) || data.version === null) {
				throw new Error(
					'The server did not confirm the saved layout version. Reload to reconcile.'
				);
			}
			return data;
		},
		async getWaterMonitoringTelemetry(branchId, signal) {
			const data = preview
				? structuredClone(previewTelemetry)
				: unpack(
						await api.get(
							withQuery(path('telemetry_url'), { branch_id: branchId }),
							{ signal }
						)
				  );
			if (!preview && data?.simulated === true) {
				throw new Error(
					'Simulated telemetry cannot be used as live equipment feedback.'
				);
			}
			if (!Array.isArray(data?.equipment)) {
				throw new Error('Invalid equipment telemetry response.');
			}
			const ids = new Set();
			for (const item of data.equipment) {
				if (item.asset_id === null || ids.has(String(item.asset_id))) {
					throw new Error('Telemetry asset IDs must be unique.');
				}
				ids.add(String(item.asset_id));
			}
			return data;
		},
		async requestMotorCommand(assetId, action, branchId) {
			if (preview) {
				throw new Error('Physical commands are disabled in preview.');
			}
			if (!['start', 'stop'].includes(action)) {
				throw new Error('Invalid motor action.');
			}
			const data = unpack(
				await api.post(path('command_url'), {
					asset_id: assetId,
					branch_id: branchId,
					action,
					request_id: crypto.randomUUID(),
				})
			);
			if (!data?.command_id) {
				throw new Error(
					'Command outcome unknown: no command identifier was returned.'
				);
			}
			return data;
		},
		async getMotorCommandStatus(commandId, branchId) {
			if (preview) {
				throw new Error('Physical commands are disabled in preview.');
			}
			return unpack(
				await api.get(
					withQuery(path('command_status_url'), {
						command_id: commandId,
						branch_id: branchId,
					})
				)
			);
		},
	};
}
