import { useEffect, useRef, useState } from 'react';
import EquipmentNode from './EquipmentNode';
import {
	NODE_WIDTH,
	NODE_HEIGHT,
	WORLD,
	portPoint,
	portsFor,
	typeFor,
	pipeState,
	snap,
} from './dashboardModel';

export default function DashboardCanvas({
	layout,
	catalog,
	records,
	preview,
	monitoring,
	selection,
	onSelect,
	onMove,
	onMoveStart,
	onMoveEnd,
	onAdd,
	onConnect,
	onDelete,
	onCommand,
	onNudge,
	commands,
	commandPathsReady,
	now,
	staleAfter,
	fitToken,
}) {
	const root = useRef(null),
		gesture = useRef(null),
		points = useRef(new Map()),
		pinch = useRef(null),
		suppressClick = useRef(0);
	const [view, setView] = useState({ x: 40, y: 40, zoom: 0.85 }),
		viewRef = useRef(view);
	viewRef.current = view;
	const [connection, setConnection] = useState(null),
		[cursor, setCursor] = useState(null),
		[panTool, setPanTool] = useState(false);
	const world = (x, y, v = viewRef.current) => {
		const rect = root.current.getBoundingClientRect();
		return {
			x: (x - rect.left - v.x) / v.zoom,
			y: (y - rect.top - v.y) / v.zoom,
		};
	};
	const zoomAt = (factor, x, y) =>
		setView((current) => {
			const zoom = Math.max(0.25, Math.min(1.8, current.zoom * factor));
			return {
				zoom,
				x: x - ((x - current.x) * zoom) / current.zoom,
				y: y - ((y - current.y) * zoom) / current.zoom,
			};
		});
	const fit = () => {
		const rect = root.current?.getBoundingClientRect();
		if (!rect) return;
		if (!layout.nodes.length) {
			setView({ x: 40, y: 40, zoom: 0.85 });
			return;
		}
		const minX = Math.min(...layout.nodes.map((n) => n.position.x)),
			minY = Math.min(...layout.nodes.map((n) => n.position.y)),
			maxX = Math.max(...layout.nodes.map((n) => n.position.x + NODE_WIDTH)),
			maxY = Math.max(...layout.nodes.map((n) => n.position.y + NODE_HEIGHT));
		const zoom = Math.max(
			0.25,
			Math.min(
				1.1,
				(rect.width - 80) / (maxX - minX),
				(rect.height - 80) / (maxY - minY)
			)
		);
		setView({
			zoom,
			x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom,
			y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom,
		});
	};
	useEffect(() => {
		fit();
	}, [fitToken]);
	useEffect(() => {
		const element = root.current;
		const wheel = (event) => {
			event.preventDefault();
			const rect = element.getBoundingClientRect();
			if (event.ctrlKey || event.metaKey)
				zoomAt(
					Math.exp(-event.deltaY * 0.003),
					event.clientX - rect.left,
					event.clientY - rect.top
				);
			else
				setView((current) => ({
					...current,
					x: current.x - event.deltaX,
					y: current.y - event.deltaY,
				}));
		};
		element.addEventListener('wheel', wheel, { passive: false });
		return () => element.removeEventListener('wheel', wheel);
	}, []);
	useEffect(() => {
		if (monitoring) {
			setConnection(null);
			gesture.current = null;
		}
	}, [monitoring]);
	const startPan = (event) => {
		if (event.button !== 0 && event.pointerType !== 'touch') return;
		points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
		root.current.setPointerCapture(event.pointerId);
		if (points.current.size === 2) {
			const pair = [...points.current.values()];
			pinch.current = {
				distance: Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y),
				view: { ...viewRef.current },
			};
			gesture.current = null;
			return;
		}
		gesture.current = {
			kind: 'pan',
			x: event.clientX,
			y: event.clientY,
			view: { ...viewRef.current },
		};
	};
	const startNode = (event, node) => {
		event.stopPropagation();
		if (panTool) {
			startPan(event);
			return;
		}
		if (event.button !== 0 && event.pointerType !== 'touch') return;
		onSelect({ kind: 'node', id: node.id });
		onMoveStart();
		const point = world(event.clientX, event.clientY);
		gesture.current = {
			kind: 'node',
			id: node.id,
			offset: { x: point.x - node.position.x, y: point.y - node.position.y },
		};
		root.current.setPointerCapture(event.pointerId);
	};
	const startPort = (event, node, port) => {
		event.stopPropagation();
		if (port.direction !== 'output') return;
		setConnection({ node, port });
		setCursor(portPoint(node, port));
		gesture.current = { kind: 'connect', node, port };
		root.current.setPointerCapture(event.pointerId);
	};
	const connectTo = (from, node, port) => {
		if (from && port.direction === 'input') {
			onConnect({
				source: from.node.id,
				source_port: from.port.id,
				target: node.id,
				target_port: port.id,
			});
			setConnection(null);
			setCursor(null);
			return true;
		}
		return false;
	};
	const portClick = (node, port) => {
		if (Date.now() < suppressClick.current) return;
		if (port.direction === 'output') {
			setConnection({ node, port });
			setCursor(portPoint(node, port));
		} else connectTo(connection, node, port);
	};
	const pointerMove = (event) => {
		if (points.current.has(event.pointerId))
			points.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
		if (points.current.size === 2 && pinch.current) {
			const pair = [...points.current.values()],
				rect = root.current.getBoundingClientRect(),
				mid = {
					x: (pair[0].x + pair[1].x) / 2 - rect.left,
					y: (pair[0].y + pair[1].y) / 2 - rect.top,
				},
				distance = Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y),
				prior = pinch.current.view,
				zoom = Math.max(
					0.25,
					Math.min(
						1.8,
						(prior.zoom * distance) / Math.max(1, pinch.current.distance)
					)
				);
			setView({
				zoom,
				x: mid.x - ((mid.x - prior.x) * zoom) / prior.zoom,
				y: mid.y - ((mid.y - prior.y) * zoom) / prior.zoom,
			});
			return;
		}
		const g = gesture.current;
		if (!g) {
			if (connection) setCursor(world(event.clientX, event.clientY));
			return;
		}
		if (g.kind === 'pan')
			setView({
				...g.view,
				x: g.view.x + event.clientX - g.x,
				y: g.view.y + event.clientY - g.y,
			});
		else if (g.kind === 'node') {
			const p = world(event.clientX, event.clientY);
			onMove(g.id, {
				x: Math.min(WORLD.width - NODE_WIDTH, snap(p.x - g.offset.x)),
				y: Math.min(WORLD.height - NODE_HEIGHT, snap(p.y - g.offset.y)),
			});
		} else if (g.kind === 'connect')
			setCursor(world(event.clientX, event.clientY));
	};
	const pointerEnd = (event) => {
		const g = gesture.current;
		points.current.delete(event.pointerId);
		pinch.current = null;
		if (g?.kind === 'node') onMoveEnd();
		if (g?.kind === 'connect') {
			const target = document
				.elementFromPoint(event.clientX, event.clientY)
				?.closest('[data-port-id]');
			const node = layout.nodes.find(
					(item) => item.id === target?.dataset.nodeId
				),
				port =
					node &&
					portsFor(catalog, node).find(
						(item) => item.id === target.dataset.portId
					);
			if (node && port && connectTo(g, node, port))
				suppressClick.current = Date.now() + 500;
		}
		gesture.current = null;
		if (root.current.hasPointerCapture(event.pointerId))
			root.current.releasePointerCapture(event.pointerId);
	};
	return (
		<div className="sc-canvas-shell">
			<div
				className="sc-canvas"
				ref={root}
				tabIndex={0}
				aria-label="Water distribution design canvas. Drag equipment or use library Add buttons. Select output then input ports to connect. Arrow keys on a node title move it. Control plus wheel zooms."
				style={{
					backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
					backgroundPosition: `${view.x}px ${view.y}px`,
				}}
				onPointerDown={(event) => {
					if (event.target === event.currentTarget) {
						onSelect(null);
						startPan(event);
					}
				}}
				onPointerMove={pointerMove}
				onPointerUp={pointerEnd}
				onPointerCancel={(event) => {
					if (gesture.current?.kind === 'node') onMoveEnd();
					gesture.current = null;
					points.current.delete(event.pointerId);
					pinch.current = null;
				}}
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setConnection(null);
						onSelect(null);
					}
					if (event.key === 'Delete' && !monitoring) {
						event.preventDefault();
						onDelete();
					}
				}}
				onDragOver={(event) => {
					if (!monitoring) event.preventDefault();
				}}
				onDrop={(event) => {
					event.preventDefault();
					if (monitoring) return;
					const type = event.dataTransfer.getData(
						'application/water-equipment'
					);
					if (typeFor(catalog, type)) {
						const point = world(event.clientX, event.clientY);
						onAdd(type, {
							x: snap(point.x - NODE_WIDTH / 2),
							y: Math.min(WORLD.height - NODE_HEIGHT, snap(point.y - 60)),
						});
					}
				}}
			>
				<div
					className="sc-world"
					style={{
						width: WORLD.width,
						height: WORLD.height,
						transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
					}}
				>
					<svg
						className="sc-pipelines"
						width={WORLD.width}
						height={WORLD.height}
						aria-label="Water pipelines"
					>
						<defs>
							<marker
								id="sc-water-arrow"
								viewBox="0 0 10 10"
								refX="9"
								refY="5"
								markerWidth="6"
								markerHeight="6"
								orient="auto-start-reverse"
							>
								<path d="M0 0 10 5 0 10Z" fill="#1488bf" />
							</marker>
							<marker
								id="sc-signal-arrow"
								viewBox="0 0 10 10"
								refX="9"
								refY="5"
								markerWidth="5"
								markerHeight="5"
								orient="auto"
							>
								<path d="M0 0 10 5 0 10Z" fill="#8298ac" />
							</marker>
						</defs>
						{layout.edges.map((edge) => {
							const source = layout.nodes.find(
									(node) => node.id === edge.source
								),
								target = layout.nodes.find((node) => node.id === edge.target),
								from =
									source &&
									portsFor(catalog, source).find(
										(port) => port.id === edge.source_port
									),
								to =
									target &&
									portsFor(catalog, target).find(
										(port) => port.id === edge.target_port
									);
							if (!source || !target || !from || !to) return null;
							const a = portPoint(source, from),
								b = portPoint(target, to),
								mid = (a.x + b.x) / 2,
								d = `M${a.x} ${a.y}H${mid}V${b.y}H${b.x}`,
								flow = pipeState(edge, records, { preview, now, staleAfter }),
								signal = from.medium === 'signal';
							return (
								<g
									key={edge.id}
									className={`sc-pipe sc-pipe-${flow} ${
										signal ? 'sc-pipe-signal' : ''
									} ${
										selection?.kind === 'edge' && selection.id === edge.id
											? 'sc-pipe-selected'
											: ''
									}`}
								>
									<path
										className="sc-pipe-hit"
										d={d}
										tabIndex={0}
										role="button"
										aria-label={`${source.data.label} to ${
											target.data.label
										}, ${
											signal
												? 'sensor signal'
												: preview
												  ? 'demo flow ' + flow
												  : flow === 'unknown'
												    ? 'Flow Unknown'
												    : flow
										}`}
										onPointerDown={(event) => event.stopPropagation()}
										onClick={() => onSelect({ kind: 'edge', id: edge.id })}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												onSelect({ kind: 'edge', id: edge.id });
												event.stopPropagation();
											}
											if (event.key === 'Delete' && !monitoring) {
												onDelete({ kind: 'edge', id: edge.id });
												event.stopPropagation();
											}
										}}
									/>
									<path
										className="sc-pipe-body"
										d={d}
										markerEnd={`url(#${
											signal ? 'sc-signal-arrow' : 'sc-water-arrow'
										})`}
									/>
									{!signal && flow === 'flowing' && (
										<path className="sc-pipe-flow" d={d} />
									)}
								</g>
							);
						})}
						{connection && cursor && (
							<path
								className="sc-connection-ghost"
								d={`M${portPoint(connection.node, connection.port).x} ${
									portPoint(connection.node, connection.port).y
								}L${cursor.x} ${cursor.y}`}
							/>
						)}
					</svg>
					{layout.nodes.map((node) => (
						<EquipmentNode
							key={node.id}
							node={node}
							type={typeFor(catalog, node.type)}
							catalog={catalog}
							record={
								node.data.asset_id != null
									? records[String(node.data.asset_id)]
									: null
							}
							preview={preview}
							monitoring={monitoring}
							selected={selection?.kind === 'node' && selection.id === node.id}
							now={now}
							staleAfter={staleAfter}
							pending={commands[String(node.data.asset_id)]}
							commandPathsReady={commandPathsReady}
							onSelect={(id) => onSelect({ kind: 'node', id })}
							onDragStart={startNode}
							onPortDown={startPort}
							onPortClick={portClick}
							onCommand={onCommand}
							onNudge={onNudge}
						/>
					))}
				</div>
				{!layout.nodes.length && (
					<div className="sc-canvas-empty">
						<span className="sc-empty-symbol">+</span>
						<h2>
							{monitoring
								? 'No saved equipment layout'
								: 'Build your water network'}
						</h2>
						<p>
							{monitoring
								? 'An authorized editor can configure this Branch.'
								: 'Drag equipment here, or select Add in the library.'}
						</p>
						<small>Place equipment. Connect ports. Configure assets.</small>
					</div>
				)}
			</div>
			{connection && (
				<div className="sc-connect-hint" role="status">
					Connect {connection.node.data.label}: choose a compatible input port.{' '}
					<button onClick={() => setConnection(null)}>Cancel</button>
				</div>
			)}
			<div className="sc-canvas-controls">
				<button
					onClick={() => {
						const rect = root.current.getBoundingClientRect();
						zoomAt(1.2, rect.width / 2, rect.height / 2);
					}}
					aria-label="Zoom in"
				>
					+
				</button>
				<span>{Math.round(view.zoom * 100)}%</span>
				<button
					onClick={() => {
						const rect = root.current.getBoundingClientRect();
						zoomAt(1 / 1.2, rect.width / 2, rect.height / 2);
					}}
					aria-label="Zoom out"
				>
					−
				</button>
				<button onClick={fit}>Fit</button>
				<button
					className={panTool ? 'sc-control-active' : ''}
					aria-pressed={panTool}
					onClick={() => setPanTool((value) => !value)}
				>
					Pan
				</button>
			</div>
			<span className="sc-canvas-caption">
				{monitoring
					? 'MONITORING / positions locked'
					: 'EDIT LAYOUT / 20 px grid'}{' '}
				· Ctrl + wheel to zoom
			</span>
		</div>
	);
}
