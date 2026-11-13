import EquipmentArt from './EquipmentArt';
import {
	NODE_WIDTH,
	NODE_HEIGHT,
	portsFor,
	readingState,
	tankPercent,
	numeric,
	commandBlock,
} from './dashboardModel';

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
	const bound = asset != null;
	const running = state.motor === 'Running';
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
			className={`sc-node ${selected ? 'sc-node-selected' : ''} ${
				running ? 'sc-node-running' : ''
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
				className="sc-node-title"
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
				className="sc-node-art"
				style={
					node.data.orientation === 'left'
						? { transform: 'scaleX(-1)' }
						: undefined
				}
			>
				<EquipmentArt
					kind={type?.kind || 'sensor'}
					type={node.type}
					percentage={tankPercent(record, state)}
					running={running}
					orientation={node.data.orientation}
				/>
			</div>
			{node.data.show_metrics !== false && (
				<div className="sc-node-readings">
					{type?.kind === 'tank' ? (
						<>
							<strong>
								{tankPercent(record, state) != null
									? `${tankPercent(record, state)}%`
									: value('TankLevel', 'level_unit')}
							</strong>
							<small>
								{node.data.capacity_kl != null
									? `Capacity ${node.data.capacity_kl} kL`
									: 'Capacity not set'}
							</small>
						</>
					) : type?.kind === 'pump' ? (
						<>
							<strong className={running ? 'sc-text-green' : ''}>
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
				className={`sc-node-connection ${
					state.connection === 'Online' ? 'sc-good' : ''
				}`}
			>
				{bound ? state.connection : 'Unbound'}
			</span>
			{monitoring && type?.kind === 'pump' && (
				<button
					className={`sc-motor-switch ${running ? 'sc-switch-on' : ''} ${
						state.mode !== 'Auto' ? 'sc-switch-manual' : ''
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
						className={
							pending && pending.phase !== 'unknown'
								? 'sc-command-spinner'
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
				)
					side = side === 'left' ? 'right' : 'left';
				return (
					<button
						key={port.id}
						type="button"
						disabled={monitoring}
						data-node-id={node.id}
						data-port-id={port.id}
						className={`sc-port sc-port-${side} sc-port-${port.medium}`}
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
