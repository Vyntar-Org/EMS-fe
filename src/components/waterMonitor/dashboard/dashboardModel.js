export const NODE_WIDTH = 164;
export const NODE_HEIGHT = 184;
export const WORLD = { width: 4000, height: 2400 };
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const uid = (prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`;
export const emptyLayout = (branchId) => ({
	name: 'Water Distribution',
	branch_id: branchId,
	nodes: [],
	edges: [],
});
export const snap = (value) =>
	Math.round(Math.max(0, Math.min(3800, Number(value) || 0)) / 20) * 20;
export const numeric = (value) =>
	(typeof value === 'number' ||
		(typeof value === 'string' && value.trim() !== '')) &&
	Number.isFinite(Number(value))
		? Number(value)
		: null;
export function componentTypes(catalog) {
	return (catalog?.categories ?? []).flatMap(
		(category) => category.components ?? []
	);
}
export function typeFor(catalog, type) {
	return componentTypes(catalog).find((item) => item.type === type);
}
export function assetFor(catalog, id) {
	return id === null
		? null
		: (catalog.assets ?? []).find(
				(asset) => String(asset.asset_id) === String(id)
		  );
}
export function portsFor(catalog, node) {
	return typeFor(catalog, node.type)?.ports ?? [];
}
export function portPoint(node, port) {
	let x =
		port.side === 'bottom' || port.side === 'top'
			? NODE_WIDTH / 2
			: port.direction === 'input'
			  ? 0
			  : NODE_WIDTH;
	if (node.data.orientation === 'left') {
		x = NODE_WIDTH - x;
	}
	return {
		x: node.position.x + x,
		y:
			node.position.y +
			(port.side === 'bottom' ? NODE_HEIGHT : port.side === 'top' ? 0 : 86),
	};
}
export function connectionError(layout, catalog, edge, ignoreId) {
	const source = layout.nodes.find((node) => node.id === edge.source),
		target = layout.nodes.find((node) => node.id === edge.target);
	if (!source || !target) {
		return 'Both connection endpoints must exist.';
	}
	if (source.id === target.id) {
		return 'Equipment cannot connect to itself.';
	}
	const from = portsFor(catalog, source).find(
			(port) => port.id === edge.source_port
		),
		to = portsFor(catalog, target).find((port) => port.id === edge.target_port);
	if (
		!from ||
		!to ||
		from.direction !== 'output' ||
		to.direction !== 'input' ||
		from.medium !== to.medium
	) {
		return 'Choose compatible output and input ports.';
	}
	if (
		(from.allowed_types && !from.allowed_types.includes(target.type)) ||
		(to.allowed_types && !to.allowed_types.includes(source.type))
	) {
		return 'The catalog does not support this equipment connection.';
	}
	const others = layout.edges.filter((item) => item.id !== ignoreId);
	if (
		others.some(
			(item) =>
				item.source === edge.source &&
				item.source_port === edge.source_port &&
				item.target === edge.target &&
				item.target_port === edge.target_port
		)
	) {
		return 'This pipeline already exists.';
	}
	for (const [port, field, portField, id] of [
		[from, 'source', 'source_port', source.id],
		[to, 'target', 'target_port', target.id],
	]) {
		if (
			Number.isInteger(port.max_connections) &&
			others.filter((item) => item[field] === id && item[portField] === port.id)
				.length >= port.max_connections
		) {
			return 'This port has reached its connection limit.';
		}
	}
	return null;
}
export function validateLayout(layout, catalog, branchId) {
	const errors = [];
	if (!layout || !Array.isArray(layout.nodes) || !Array.isArray(layout.edges)) {
		return ['Invalid layout structure.'];
	}
	if (typeof layout.name !== 'string' || !layout.name.trim()) {
		errors.push('Give the layout a name.');
	}
	if (String(layout.branch_id) !== String(branchId)) {
		errors.push('Layout does not belong to the selected Branch.');
	}
	if (
		layout.nodes.some(
			(node) =>
				!node ||
				typeof node.id !== 'string' ||
				!node.position ||
				!node.data ||
				typeof node.data !== 'object'
		) ||
		layout.edges.some((edge) => !edge || typeof edge.id !== 'string')
	) {
		return ['Invalid equipment or connection records.'];
	}
	if (!layout.nodes.length) {
		errors.push('Add at least one equipment component.');
	}
	if (layout.nodes.length > 200 || layout.edges.length > 500) {
		errors.push('Layout exceeds the 200 equipment / 500 connection limit.');
	}
	const ids = new Set(),
		bound = new Set();
	for (const node of layout.nodes) {
		if (typeof node.id !== 'string' || !node.id || ids.has(node.id)) {
			errors.push('Equipment IDs must be unique.');
		}
		ids.add(node.id);
		const type = typeFor(catalog, node.type);
		if (!type) {
			errors.push(`Unsupported equipment type: ${node.type}.`);
		}
		if (
			!Number.isFinite(node.position?.x) ||
			!Number.isFinite(node.position?.y) ||
			node.position.x < 0 ||
			node.position.y < 0 ||
			node.position.x > WORLD.width - NODE_WIDTH ||
			node.position.y > WORLD.height - NODE_HEIGHT
		) {
			errors.push('Equipment position is outside the canvas.');
		}
		if (typeof node.data?.label !== 'string' || !node.data.label.trim()) {
			errors.push('Every component needs a display label.');
		}
		if (
			node.data?.capacity_kl !== null &&
			(!Number.isFinite(node.data.capacity_kl) || node.data.capacity_kl <= 0)
		) {
			errors.push('Tank capacity must be a positive number.');
		}
		if (
			type?.orientations &&
			!type.orientations.includes(node.data?.orientation)
		) {
			errors.push('Unsupported equipment orientation.');
		}
		if (
			node.data.show_metrics !== undefined &&
			typeof node.data.show_metrics !== 'boolean'
		) {
			errors.push('Metric visibility must be a boolean.');
		}
		for (const field of type?.required_fields ?? []) {
			if (node.data[field] === null || node.data[field] === '') {
				errors.push(`Missing required ${field} for ${type.label}.`);
			}
		}
		if (node.data?.asset_id !== null) {
			const asset = assetFor(catalog, node.data.asset_id);
			if (
				!asset ||
				String(asset.branch_id) !== String(branchId) ||
				!asset.compatible_types?.includes(node.type)
			) {
				errors.push(
					'Equipment is bound to an unavailable or incompatible Branch asset.'
				);
			}
			if (
				bound.has(String(node.data.asset_id)) &&
				asset?.allow_multiple_bindings !== true
			) {
				errors.push('This asset cannot be assigned to multiple visual nodes.');
			}
			bound.add(String(node.data.asset_id));
		}
	}
	const edgeIds = new Set();
	for (const edge of layout.edges) {
		if (!edge.id || edgeIds.has(edge.id)) {
			errors.push('Connection IDs must be unique.');
		}
		edgeIds.add(edge.id);
		const error = connectionError(layout, catalog, edge, edge.id);
		if (error) {
			errors.push(error);
		}
		if (edge.flow_asset_id !== null) {
			const asset = assetFor(catalog, edge.flow_asset_id);
			if (
				!asset ||
				asset.kind !== 'meter' ||
				String(asset.branch_id) !== String(branchId) ||
				!layout.nodes.some(
					(node) => String(node.data.asset_id) === String(edge.flow_asset_id)
				)
			) {
				errors.push(
					'Pipeline flow evidence must reference a meter bound in this Branch layout.'
				);
			}
		}
	}
	return [...new Set(errors)];
}
export function parseLayout(payload) {
	if (payload === null) {
		return null;
	}
	const layout = payload.layout === undefined ? payload : payload.layout;
	if (layout === null) {
		return null;
	}
	if (!Array.isArray(layout.nodes) || !Array.isArray(layout.edges)) {
		throw new Error('Invalid saved layout response.');
	}
	return clone(layout);
}
export function readingState(
	record,
	{ preview = false, now = Date.now(), staleAfter = 60 } = {}
) {
	if (!record) {
		return {
			ready: false,
			connection: 'Unavailable',
			motor: 'Unknown',
			mode: 'Unknown',
		};
	}
	const time =
		typeof record.timestamp === 'string' &&
		/(?:Z|[+-]\d{2}:\d{2})$/i.test(record.timestamp)
			? Date.parse(record.timestamp)
			: NaN;
	const fresh = preview
		? record.simulated === true && record.is_stale === false
		: Number.isFinite(time) &&
		  now - time <= staleAfter * 1000 &&
		  time <= now + 5000 &&
		  record.is_stale === false;
	const ready = fresh && record.online === true;
	return {
		ready,
		connection: preview
			? 'Demo'
			: !fresh
			  ? 'Stale'
			  : record.online === false
			    ? 'Offline'
			    : ready
			      ? 'Online'
			      : 'Unknown',
		motor:
			ready && String(record.motorRunState) === '1'
				? 'Running'
				: ready && String(record.motorRunState) === '0'
				  ? 'Stopped'
				  : 'Unknown',
		mode:
			ready && record.controlMode === 'auto'
				? 'Auto'
				: ready && record.controlMode === 'manual'
				  ? 'Manual'
				  : 'Unknown',
		timestamp: time,
	};
}
export function tankPercent(record, state) {
	const value = numeric(record?.TankLevel);
	return state.ready &&
		record.level_unit === '%' &&
		value !== null &&
		value >= 0 &&
		value <= 100
		? value
		: null;
}
export function pipeState(edge, records, options) {
	const record =
		edge.flow_asset_id === null ? null : records[String(edge.flow_asset_id)];
	const state = readingState(record, options),
		value = numeric(record?.flowrate);
	return !state.ready || value === null
		? 'unknown'
		: value === 0
		  ? 'stopped'
		  : value > 0
		    ? 'flowing'
		    : 'unknown';
}
export function commandBlock(
	record,
	{
		preview = false,
		pending = false,
		pathsReady = false,
		now = Date.now(),
		staleAfter = 60,
		action,
	} = {}
) {
	if (preview || record?.simulated === true) {
		return 'Simulated preview: physical commands are disabled.';
	}
	const state = readingState(record, { now, staleAfter });
	if (state.mode === 'Manual') {
		return 'Motor control is disabled in Manual mode.';
	}
	if (!state.ready || state.mode !== 'Auto' || state.motor === 'Unknown') {
		return 'Fresh online telemetry, Auto mode and actual motor feedback are required.';
	}
	if (action && action !== (state.motor === 'Running' ? 'stop' : 'start')) {
		return 'Motor feedback changed. Review the current state and confirm again.';
	}
	if (pending || record.control?.command_pending !== false) {
		return 'A command is pending or its outcome is unknown.';
	}
	const control = record.control ?? {};
	if (
		!pathsReady ||
		![
			'user_allowed',
			'supported',
			'commissioned',
			'device_ready',
			'interlocks_valid',
			'operating_state_allowed',
		].every((key) => control[key] === true)
	) {
		return 'Remote control authorization, commissioning and safety checks are required.';
	}
	return null;
}
export function commandOutcome(command, status, record, options) {
	if (status?.command_id !== command.id) {
		return null;
	}
	if (['failed', 'rejected', 'cancelled'].includes(status.status)) {
		return status.status;
	}
	const state = readingState(record, options);
	if (
		status.status === 'completed' &&
		state.ready &&
		state.timestamp >= command.startedAt &&
		String(record.motorRunState) === (command.action === 'start' ? '1' : '0')
	) {
		return 'confirmed';
	}
	return null; // An HTTP/MQTT acknowledgment alone is never physical success.
}
export function payloadFor(layout) {
	return {
		name: layout.name,
		branch_id: layout.branch_id,
		...(layout.id !== null ? { id: layout.id } : {}),
		...(layout.version !== null ? { version: layout.version } : {}),
		nodes: layout.nodes.map(({ id, type, position, data }) => ({
			id,
			type,
			position: { x: position.x, y: position.y },
			data: {
				label: data.label,
				asset_id: data.asset_id ?? null,
				capacity_kl: data.capacity_kl ?? null,
				orientation: data.orientation,
				show_metrics: data.show_metrics !== false,
			},
		})),
		edges: layout.edges.map(
			({ id, source, target, source_port, target_port, flow_asset_id }) => ({
				id,
				type: 'water_pipe',
				source,
				target,
				source_port,
				target_port,
				flow_asset_id: flow_asset_id ?? null,
			})
		),
	};
}
export function removeElement(layout, selection) {
	if (selection.kind === 'edge') {
		return {
			...layout,
			edges: layout.edges.filter((edge) => edge.id !== selection.id),
		};
	}
	const removed = layout.nodes.find((node) => node.id === selection.id);
	const nodes = layout.nodes.filter((node) => node.id !== selection.id);
	const meterStillBound =
		removed?.data.asset_id !== null &&
		nodes.some(
			(node) => String(node.data.asset_id) === String(removed.data.asset_id)
		);
	return {
		...layout,
		nodes,
		edges: layout.edges
			.filter(
				(edge) => edge.source !== selection.id && edge.target !== selection.id
			)
			.map((edge) =>
				removed?.data.asset_id !== null &&
				!meterStillBound &&
				String(edge.flow_asset_id) === String(removed.data.asset_id)
					? { ...edge, flow_asset_id: null }
					: edge
			),
	};
}
