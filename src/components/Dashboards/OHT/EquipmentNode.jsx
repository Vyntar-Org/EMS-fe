import {
	NODE_WIDTH,
	NODE_HEIGHT,
	portsFor,
	readingState,
	tankPercent,
	numeric,
	commandBlock,
} from './dashboardModel';
import EquipmentArt from './EquipmentArt';

export default function EquipmentNode({
	node,
	type,
	catalog,
	record,
	preview,
	monitoring,
	selected,
	now,
	staleAfter,
	pending,
	commandPathsReady,
	onSelect,
	onDragStart,
	onPortDown,
	onPortClick,
	onCommand,
	onNudge,
}) {
	const state = readingState(record, { preview, now, staleAfter });
	const asset = node.data.asset_id;
	const bound = asset !== null && asset !== undefined;
	const running = state.motor === 'Running';
	const level = tankPercent(record, state);
	const value = (key, unit) =>
		!bound || !state.ready || numeric(record?.[key]) === null
			? 'N/A'
			: `${record[key]} ${record[unit] || 'Unit N/A'}`;
	const block = commandBlock(record, {
		preview,
		pending: Boolean(pending),
		pathsReady: commandPathsReady,
		now,
		staleAfter,
	});
	return (
		<article
			onClick={() => onSelect(node.id)}
			data-water-ui={`node ${selected ? 'node-selected' : ''} ${
				running ? 'node-running' : ''
			}`}
			style={{
				width: NODE_WIDTH,
				height: NODE_HEIGHT,
				transform: `translate(${node.position.x}px, ${node.position.y}px)`,
			}}
			aria-label={`${node.data.label}, ${bound ? state.connection : 'Unbound'}`}
		>
			<button
				type="button"
				data-water-ui="node-title"
				onClick={() => onSelect(node.id)}
				onPointerDown={
					monitoring ? undefined : (event) => onDragStart(event, node)
				}
				onKeyDown={(event) => {
					if (
						!monitoring &&
						['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
							event.key
						)
					) {
						event.preventDefault();
						onNudge(node.id, event.key);
					}
				}}
				title={
					monitoring
						? 'Inspect equipment'
						: 'Drag to move. Arrow keys move by one grid step.'
				}
			>
				{node.data.label}
			</button>
			<div
				data-water-ui="node-art"
				style={
					node.data.orientation === 'left'
						? { transform: 'scaleX(-1)' }
						: undefined
				}
			>
				<EquipmentArt
					kind={type?.kind || 'sensor'}
					type={node.type}
					percentage={level}
					running={running}
				/>
			</div>
			{node.data.show_metrics !== false && (
				<div data-water-ui="node-readings">
					{type?.kind === 'tank' ? (
						<>
							<strong>
								{level !== null
									? `${level}%`
									: value('TankLevel', 'level_unit')}
							</strong>
							<small>
								{node.data.capacity_kl !== null &&
								node.data.capacity_kl !== undefined
									? `Capacity ${node.data.capacity_kl} kL`
									: 'Capacity not set'}
							</small>
						</>
					) : type?.kind === 'pump' ? (
						<>
							<strong data-water-ui={running ? 'text-green' : ''}>
								{state.motor}
							</strong>
							<small>{state.mode} mode</small>
						</>
					) : type?.kind === 'meter' ? (
						<>
							<strong>{value('flowrate', 'flow_unit')}</strong>
							<small>Total {value('totalizer', 'totalizer_unit')}</small>
						</>
					) : type?.kind === 'sensor' ? (
						<>
							<strong>
								{!bound
									? 'Unbound'
									: !state.ready
									  ? 'N/A'
									  : node.type === 'motor_feedback'
									    ? state.motor
									    : value('TankLevel', 'level_unit')}
							</strong>
							<small>Sensor feedback</small>
						</>
					) : (
						<small>{bound ? 'Registered equipment' : 'Visual component'}</small>
					)}
				</div>
			)}
			<span
				data-water-ui={`node-connection ${
					state.connection === 'Online' ? 'good' : ''
				}`}
			>
				{bound ? state.connection : 'Unbound'}
			</span>
			{monitoring && type?.kind === 'pump' && (
				<button
					data-water-ui={`motor-switch ${running ? 'switch-on' : ''} ${
						state.mode !== 'Auto' ? 'switch-manual' : ''
					}`}
					role="switch"
					aria-checked={running}
					aria-label={`${node.data.label} motor control: ${state.motor}. ${
						block || 'Request a state change'
					}`}
					disabled={Boolean(block)}
					title={
						pending
							? `Command ${pending.phase}`
							: block || 'Request a motor state change'
					}
					onClick={() => onCommand(node)}
				>
					<span>
						{pending?.phase === 'unknown'
							? 'Unknown'
							: pending
							  ? 'Pending'
							  : state.motor === 'Unknown'
							    ? 'Unknown'
							    : running
							      ? 'ON'
							      : 'OFF'}
					</span>
					<i
						data-water-ui={
							pending && pending.phase !== 'unknown'
								? 'command-spinner'
								: undefined
						}
					/>
				</button>
			)}
			{portsFor(catalog, node).map((port) => {
				let side = port.side || (port.direction === 'input' ? 'left' : 'right');
				if (
					node.data.orientation === 'left' &&
					(side === 'left' || side === 'right')
				) {
					side = side === 'left' ? 'right' : 'left';
				}
				return (
					<button
						key={port.id}
						type="button"
						disabled={monitoring}
						data-node-id={node.id}
						data-port-id={port.id}
						data-water-ui={`port port-${side} port-${port.medium}`}
						aria-label={`${node.data.label} ${port.medium} ${port.direction} ${port.id}`}
						title={`${port.medium} ${port.direction} - ${
							monitoring ? 'monitoring locked' : 'drag or click to connect'
						}`}
						onPointerDown={
							monitoring ? undefined : (event) => onPortDown(event, node, port)
						}
						onClick={
							monitoring
								? undefined
								: (event) => {
										event.stopPropagation();
										onPortClick(node, port);
								  }
						}
					/>
				);
			})}
		</article>
	);
}
