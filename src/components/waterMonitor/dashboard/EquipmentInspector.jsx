import { useEffect, useState } from 'react';
import {
	Button,
	TextField,
	MenuItem,
	Alert,
	FormControlLabel,
	Switch,
} from '@mui/material';
import {
	assetFor,
	typeFor,
	readingState,
	snap,
	pipeState,
	commandBlock,
	WORLD,
	NODE_WIDTH,
	NODE_HEIGHT,
} from './dashboardModel';

export default function EquipmentInspector({
	selection,
	layout,
	catalog,
	monitoring,
	preview,
	records,
	now,
	staleAfter,
	onUpdate,
	onEdgeUpdate,
	onDelete,
	onDuplicate,
	onClose,
	command,
	commandPathsReady,
	onCheckCommand,
}) {
	const node =
		selection?.kind === 'node'
			? layout.nodes.find((item) => item.id === selection.id)
			: null;
	const edge =
		selection?.kind === 'edge'
			? layout.edges.find((item) => item.id === selection.id)
			: null;
	const [values, setValues] = useState({}),
		[error, setError] = useState('');
	useEffect(() => {
		setValues(
			node
				? {
						label: node.data.label,
						asset_id: node.data.asset_id ?? '',
						capacity_kl: node.data.capacity_kl ?? '',
						orientation: node.data.orientation,
						show_metrics: node.data.show_metrics !== false,
						x: node.position.x,
						y: node.position.y,
				  }
				: { flow_asset_id: edge?.flow_asset_id ?? '' }
		);
		setError('');
	}, [
		node?.id,
		JSON.stringify(node?.data),
		node?.position.x,
		node?.position.y,
		edge?.id,
		edge?.flow_asset_id,
	]);
	if (!node && !edge) return null;
	const type = node && typeFor(catalog, node.type),
		asset = node && assetFor(catalog, node.data.asset_id),
		record = asset ? records[String(asset.asset_id)] : null,
		state = readingState(record, { preview, now, staleAfter });
	const set = (key, value) =>
		setValues((current) => ({ ...current, [key]: value }));
	const save = () => {
		if (node) {
			const x = Number(values.x),
				y = Number(values.y),
				capacity =
					values.capacity_kl === '' ? null : Number(values.capacity_kl);
			if (
				!values.label?.trim() ||
				!Number.isFinite(x) ||
				!Number.isFinite(y) ||
				x < 0 ||
				y < 0 ||
				x > WORLD.width - NODE_WIDTH ||
				y > WORLD.height - NODE_HEIGHT ||
				(capacity !== null && (!Number.isFinite(capacity) || capacity <= 0))
			) {
				setError(
					'Provide a label, valid canvas position and positive capacity.'
				);
				return;
			}
			const result = onUpdate(node.id, {
				position: {
					x: snap(x),
					y: Math.min(WORLD.height - NODE_HEIGHT, snap(y)),
				},
				data: {
					...node.data,
					label: values.label.trim(),
					asset_id: values.asset_id || null,
					capacity_kl: capacity,
					orientation: values.orientation,
					show_metrics: values.show_metrics !== false,
				},
			});
			if (result) setError(result);
		} else
			onEdgeUpdate(edge.id, { flow_asset_id: values.flow_asset_id || null });
	};
	return (
		<aside className="sc-inspector" aria-label="Equipment properties">
			<div className="sc-panel-title">
				<strong>
					{node
						? monitoring
							? 'Equipment details'
							: 'Equipment properties'
						: 'Pipeline properties'}
				</strong>
				<button onClick={onClose} aria-label="Close properties">
					×
				</button>
			</div>
			{error && <Alert severity="error">{error}</Alert>}
			{node ? (
				<>
					<span className="sc-property-type">{type?.label || node.type}</span>
					{monitoring ? (
						<>
							<h3>{node.data.label}</h3>
							<dl>
								<dt>Registered asset</dt>
								<dd>{asset?.name || 'Unbound'}</dd>
								<dt>Connection</dt>
								<dd>{state.connection}</dd>
								<dt>Motor feedback</dt>
								<dd>{state.motor}</dd>
								<dt>Control mode</dt>
								<dd>{state.mode}</dd>
								<dt>Last reading</dt>
								<dd>
									{preview
										? 'Simulated sample'
										: Number.isFinite(state.timestamp)
										  ? new Date(state.timestamp).toLocaleString()
										  : 'Unavailable'}
								</dd>
								{node.data.capacity_kl != null && (
									<>
										<dt>Configured capacity</dt>
										<dd>{node.data.capacity_kl} kL</dd>
									</>
								)}
							</dl>
							{type?.kind === 'pump' && (
								<Alert severity="info">
									{commandBlock(record, {
										preview,
										pending: Boolean(
											command &&
												![
													'confirmed',
													'failed',
													'rejected',
													'cancelled',
												].includes(command.phase)
										),
										pathsReady: commandPathsReady,
										now,
										staleAfter,
									}) ||
										'Motor control is eligible; use the equipment switch to request confirmation.'}
								</Alert>
							)}
							{!asset && (
								<Alert severity="info">
									Unbound component. No live telemetry or commands.
								</Alert>
							)}
							{command && (
								<Alert
									severity={command.phase === 'unknown' ? 'warning' : 'info'}
								>
									<strong>Command: {command.phase}</strong>
									<p>{command.message}</p>
									{command.id && (
										<Button size="small" onClick={onCheckCommand}>
											Check command status
										</Button>
									)}
								</Alert>
							)}
						</>
					) : (
						<>
							<TextField
								size="small"
								label="Display label"
								value={values.label ?? ''}
								onChange={(event) => set('label', event.target.value)}
								inputProps={{ maxLength: 80 }}
							/>
							<TextField
								size="small"
								select
								label="Registered asset"
								value={values.asset_id ?? ''}
								onChange={(event) => set('asset_id', event.target.value)}
							>
								<MenuItem value="">Unbound / visual only</MenuItem>
								{catalog.assets
									.filter(
										(item) =>
											String(item.branch_id) === String(layout.branch_id) &&
											item.compatible_types?.includes(node.type)
									)
									.map((item) => (
										<MenuItem key={item.asset_id} value={String(item.asset_id)}>
											{item.name}
										</MenuItem>
									))}
							</TextField>
							<div className="sc-position-fields">
								<TextField
									size="small"
									type="number"
									label="X position"
									value={values.x ?? ''}
									onChange={(event) => set('x', event.target.value)}
								/>
								<TextField
									size="small"
									type="number"
									label="Y position"
									value={values.y ?? ''}
									onChange={(event) => set('y', event.target.value)}
								/>
							</div>
							<TextField
								size="small"
								select
								label="Orientation"
								value={values.orientation ?? ''}
								onChange={(event) => set('orientation', event.target.value)}
							>
								{(type?.orientations || ['right']).map((value) => (
									<MenuItem key={value} value={value}>
										{value}
									</MenuItem>
								))}
							</TextField>
							{type?.kind === 'tank' && (
								<TextField
									size="small"
									type="number"
									label="Capacity (kL)"
									value={values.capacity_kl ?? ''}
									onChange={(event) => set('capacity_kl', event.target.value)}
								/>
							)}
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={values.show_metrics !== false}
										onChange={(event) =>
											set('show_metrics', event.target.checked)
										}
									/>
								}
								label="Show telemetry labels"
							/>
							<Button variant="contained" onClick={save}>
								Apply properties
							</Button>
							<Button variant="outlined" onClick={() => onDuplicate(node)}>
								Duplicate visual (unbound)
							</Button>
						</>
					)}
				</>
			) : (
				<>
					<h3>Water pipeline</h3>
					<p>
						{layout.nodes.find((item) => item.id === edge.source)?.data.label} →{' '}
						{layout.nodes.find((item) => item.id === edge.target)?.data.label}
					</p>
					<span className="sc-property-type">
						{pipeState(edge, records, { preview, now, staleAfter }) ===
						'unknown'
							? 'Flow Unknown'
							: pipeState(edge, records, { preview, now, staleAfter }) ===
							    'flowing'
							  ? 'Flowing'
							  : 'No flow'}
						{preview ? ' / demo' : ''}
					</span>
					{!monitoring && (
						<>
							<TextField
								size="small"
								select
								label="Flow evidence meter"
								value={values.flow_asset_id ?? ''}
								onChange={(event) => set('flow_asset_id', event.target.value)}
							>
								<MenuItem value="">None / Flow Unknown</MenuItem>
								{catalog.assets
									.filter(
										(item) =>
											item.kind === 'meter' &&
											String(item.branch_id) === String(layout.branch_id) &&
											layout.nodes.some(
												(n) => String(n.data.asset_id) === String(item.asset_id)
											)
									)
									.map((item) => (
										<MenuItem key={item.asset_id} value={String(item.asset_id)}>
											{item.name}
										</MenuItem>
									))}
							</TextField>
							<small>
								Bind only the meter that measures this specific pipeline. Pump
								state is not flow evidence.
							</small>
							<Button variant="contained" onClick={save}>
								Apply pipeline
							</Button>
						</>
					)}
				</>
			)}
			{!monitoring && (
				<Button color="error" onClick={() => onDelete(selection)}>
					{node ? 'Delete equipment' : 'Delete pipeline'}
				</Button>
			)}
		</aside>
	);
}
