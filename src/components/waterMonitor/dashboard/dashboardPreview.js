// Isolated UI-development catalog. These are not registered production assets.
const waterPorts = [
	{ id: 'in', direction: 'input', medium: 'water', max_connections: 1 },
	{ id: 'out', direction: 'output', medium: 'water' },
];
const group = (id, name, items) => ({
	id,
	name,
	components: items.map(([type, label, kind, description]) => ({
		type,
		label,
		kind,
		description,
		available: true,
		orientations: kind === 'tank' ? ['vertical'] : ['right', 'left'],
		ports:
			kind === 'source'
				? [waterPorts[1]]
				: kind === 'consumption'
				  ? [waterPorts[0]]
				  : kind === 'sensor'
				    ? [
								{
									id: 'signal',
									direction: 'input',
									medium: 'signal',
									side: 'top',
									max_connections: 1,
								},
				      ]
				    : kind === 'tank'
				      ? [
									...waterPorts,
									{
										id: 'level',
										direction: 'output',
										medium: 'signal',
										side: 'bottom',
									},
				        ]
				      : kind === 'junction'
				        ? [{ ...waterPorts[0], max_connections: 8 }, waterPorts[1]]
				        : waterPorts,
	})),
});
export const previewCatalog = {
	simulated: true,
	permissions: { can_edit_layout: false },
	branches: [
		{ id: 'demo-branch', name: 'Demo Branch', can_edit_layout: false },
	],
	categories: [
		group('sources', 'Water sources', [
			['borewell', 'Borewell', 'source', 'Deep borewell water source.'],
			[
				'groundwater',
				'Groundwater',
				'source',
				'Groundwater abstraction point.',
			],
			[
				'surface_water',
				'Surface water',
				'source',
				'River, lake or surface intake.',
			],
			[
				'municipal',
				'Municipal / tap water',
				'source',
				'Municipal supply inlet.',
			],
			['seawater', 'Seawater', 'source', 'Coastal water intake.'],
			[
				'recycled',
				'Recycled / effluent water',
				'source',
				'Municipal wastewater reuse.',
			],
			[
				'harvesting',
				'On-site harvesting',
				'source',
				'Collected rainwater supply.',
			],
			[
				'closed_loop',
				'Closed-loop recycling',
				'source',
				'Recirculated process water.',
			],
		]),
		group('storage', 'Water storage', [
			[
				'underground_tank',
				'Underground tank',
				'tank',
				'Below-ground storage vessel.',
			],
			['overhead_tank', 'Overhead tank', 'tank', 'Elevated water storage.'],
			[
				'main_tank',
				'Main storage tank',
				'tank',
				'Central water distribution reservoir.',
			],
			[
				'household_tank',
				'Household tank',
				'tank',
				'Ribbed rooftop storage tank.',
			],
			[
				'industrial_tank',
				'Industrial storage tank',
				'tank',
				'Industrial vessel with access ladder.',
			],
			[
				'tanker',
				'Lorry / tanker delivery',
				'tanker',
				'Mobile water delivery and storage.',
			],
		]),
		group('pumps', 'Pumps & motors', [
			[
				'borewell_pump',
				'Borewell pump',
				'pump',
				'Extraction pump with motor feedback.',
			],
			[
				'transfer_pump',
				'Water transfer pump',
				'pump',
				'Transfer between storage vessels.',
			],
			[
				'distribution_pump',
				'Distribution pump',
				'pump',
				'Branch distribution pump.',
			],
			['booster_pump', 'Booster pump', 'pump', 'Water pressure booster.'],
			[
				'motor_unit',
				'Motor / pump unit',
				'pump',
				'Generic monitored motor and pump.',
			],
		]),
		group('monitoring', 'Monitoring devices', [
			[
				'flow_meter',
				'Flow meter',
				'meter',
				'Flow rate and cumulative totalizer.',
			],
			[
				'level_sensor',
				'Tank level sensor',
				'sensor',
				'Independent tank-level instrument.',
			],
			[
				'motor_feedback',
				'Motor feedback indicator',
				'sensor',
				'Physical motor-feedback instrument.',
			],
			[
				'water_sensor',
				'Registered water sensor',
				'sensor',
				'Other registered Water Monitoring instrument.',
			],
		]),
		group('distribution', 'Distribution components', [
			['pipeline', 'Water pipeline', 'junction', 'Inline pipe section.'],
			[
				'junction',
				'Pipe junction',
				'junction',
				'Join or split water-distribution paths.',
			],
			[
				'branch',
				'Branch connection',
				'junction',
				'Multiple outgoing distribution connections.',
			],
			['inlet', 'Water inlet', 'source', 'Water inlet connection.'],
			['outlet', 'Water outlet', 'consumption', 'Water outlet connection.'],
			[
				'consumption',
				'Consumption point',
				'consumption',
				'Downstream consumption endpoint.',
			],
			[
				'valve',
				'Valve',
				'valve',
				'Visual valve; no actuator control is implied.',
			],
		]),
	],
	assets: [
		{
			asset_id: 'demo-p0',
			name: 'Borewell pump (demo)',
			kind: 'pump',
			compatible_types: ['borewell_pump', 'motor_unit'],
			branch_id: 'demo-branch',
		},
		{
			asset_id: 'demo-p1',
			name: 'Distribution pump 1 (demo)',
			kind: 'pump',
			compatible_types: ['distribution_pump', 'transfer_pump'],
			branch_id: 'demo-branch',
		},
		{
			asset_id: 'demo-p2',
			name: 'Distribution pump 2 (demo)',
			kind: 'pump',
			compatible_types: ['distribution_pump', 'transfer_pump'],
			branch_id: 'demo-branch',
		},
		{
			asset_id: 'demo-t0',
			name: 'Main storage (demo)',
			kind: 'tank',
			compatible_types: ['main_tank', 'underground_tank', 'industrial_tank'],
			branch_id: 'demo-branch',
		},
		{
			asset_id: 'demo-t1',
			name: 'Overhead tank 1 (demo)',
			kind: 'tank',
			compatible_types: ['overhead_tank', 'household_tank'],
			branch_id: 'demo-branch',
		},
		{
			asset_id: 'demo-t2',
			name: 'Overhead tank 2 (demo)',
			kind: 'tank',
			compatible_types: ['overhead_tank', 'household_tank'],
			branch_id: 'demo-branch',
		},
		...[0, 1, 2].map((i) => ({
			asset_id: `demo-f${i}`,
			name: `FM-${i} (demo)`,
			kind: 'meter',
			compatible_types: ['flow_meter'],
			branch_id: 'demo-branch',
		})),
	],
};
const sample = (fields) => ({
	...fields,
	online: true,
	is_stale: false,
	simulated: true,
});
export const previewTelemetry = {
	simulated: true,
	equipment: [
		sample({ asset_id: 'demo-p0', controlMode: 'manual', motorRunState: '1' }),
		sample({ asset_id: 'demo-p1', controlMode: 'auto', motorRunState: '1' }),
		sample({ asset_id: 'demo-p2', controlMode: 'auto', motorRunState: '0' }),
		sample({ asset_id: 'demo-t0', TankLevel: '75', level_unit: '%' }),
		sample({ asset_id: 'demo-t1', TankLevel: '50', level_unit: '%' }),
		sample({ asset_id: 'demo-t2', TankLevel: '25', level_unit: '%' }),
		sample({
			asset_id: 'demo-f0',
			flowrate: '5.20',
			totalizer: '243.60',
			flow_unit: 'm3/hr',
			totalizer_unit: 'KL',
		}),
		sample({
			asset_id: 'demo-f1',
			flowrate: '2.40',
			totalizer: '115.80',
			flow_unit: 'm3/hr',
			totalizer_unit: 'KL',
		}),
		sample({
			asset_id: 'demo-f2',
			flowrate: '0.00',
			totalizer: '83.20',
			flow_unit: 'm3/hr',
			totalizer_unit: 'KL',
		}),
	],
};
// The initial dashboard is empty. This example is loaded only by explicit user action.
export const previewSavedLayout = null;
const node = (id, type, label, x, y, asset_id = null, capacity_kl = null) => ({
	id,
	type,
	position: { x, y },
	data: {
		label,
		asset_id,
		capacity_kl,
		orientation: type.includes('tank') ? 'vertical' : 'right',
	},
});
const edge = (id, source, target, flow_asset_id = null) => ({
	id,
	type: 'water_pipe',
	source,
	target,
	source_port: 'out',
	target_port: 'in',
	flow_asset_id,
});
export const referenceLayout = {
	name: 'Reference distribution - demo draft',
	branch_id: 'demo-branch',
	nodes: [
		node('ref-source', 'borewell', 'Borewell', 40, 220),
		node('ref-p0', 'borewell_pump', 'Borewell pump', 280, 220, 'demo-p0'),
		node('ref-f0', 'flow_meter', 'FM-0 / Inlet', 520, 220, 'demo-f0'),
		node('ref-t0', 'main_tank', 'Main storage', 760, 220, 'demo-t0', 40),
		node('ref-p1', 'distribution_pump', 'Pump-1', 1020, 60, 'demo-p1'),
		node('ref-t1', 'overhead_tank', 'Tank-1', 1260, 60, 'demo-t1', 15),
		node('ref-f1', 'flow_meter', 'FM-1 / Outlet', 1500, 60, 'demo-f1'),
		node('ref-c1', 'consumption', 'Consumption-1', 1740, 60),
		node('ref-p2', 'distribution_pump', 'Pump-2', 1020, 400, 'demo-p2'),
		node('ref-t2', 'overhead_tank', 'Tank-2', 1260, 400, 'demo-t2', 10),
		node('ref-f2', 'flow_meter', 'FM-2 / Outlet', 1500, 400, 'demo-f2'),
		node('ref-c2', 'consumption', 'Consumption-2', 1740, 400),
		node('ref-l0', 'level_sensor', 'Level sensor', 760, 560),
		node('ref-l1', 'level_sensor', 'Level sensor', 1260, 620),
	],
	edges: [
		edge('ref-e0', 'ref-source', 'ref-p0', 'demo-f0'),
		edge('ref-e1', 'ref-p0', 'ref-f0', 'demo-f0'),
		edge('ref-e2', 'ref-f0', 'ref-t0', 'demo-f0'),
		edge('ref-e3', 'ref-t0', 'ref-p1', 'demo-f1'),
		edge('ref-e4', 'ref-p1', 'ref-t1', 'demo-f1'),
		edge('ref-e5', 'ref-t1', 'ref-f1', 'demo-f1'),
		edge('ref-e6', 'ref-f1', 'ref-c1', 'demo-f1'),
		edge('ref-e7', 'ref-t0', 'ref-p2', 'demo-f2'),
		edge('ref-e8', 'ref-p2', 'ref-t2', 'demo-f2'),
		edge('ref-e9', 'ref-t2', 'ref-f2', 'demo-f2'),
		edge('ref-e10', 'ref-f2', 'ref-c2', 'demo-f2'),
		{
			...edge('ref-e11', 'ref-t0', 'ref-l0'),
			source_port: 'level',
			target_port: 'signal',
		},
		{
			...edge('ref-e12', 'ref-t1', 'ref-l1'),
			source_port: 'level',
			target_port: 'signal',
		},
	],
};
