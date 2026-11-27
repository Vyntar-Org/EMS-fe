import {
	AddRounded,
	EditRounded,
	HubRounded,
	RedoRounded,
	RefreshRounded,
	SaveRounded,
	UndoRounded,
	VisibilityRounded,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	MenuItem,
	Skeleton,
	TextField,
	Tooltip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../helpers/api';
import { getWaterMonitoringDashboardUrls } from '../../../helpers/apiUrls';
import { useOHTConfig } from '../../OHT/useOHTConfig';

import DashboardCanvas from './DashboardCanvas';
import {
	componentTypes,
	parseLayout,
	assetFor,
	clone,
	connectionError,
	emptyLayout,
	payloadFor,
	snap,
	typeFor,
	uid,
	validateLayout,
	commandBlock,
	readingState,
	removeElement,
} from './dashboardModel';
import {
	previewCatalog,
	previewSavedLayout,
	previewTelemetry,
	referenceLayout,
} from './dashboardPreview';
import { DashboardSurface } from './dashboardStyles';
import EquipmentInspector from './EquipmentInspector';
import EquipmentLibrary from './EquipmentLibrary';
import useMotorCommands, { errorMessage } from './useMotorCommands';

export default function OHTDashboard() {
	const config = useOHTConfig(),
		{ user } = useAuth();
	const requests = useMemo(
		() => createDashboardRequests(config.scada ?? {}),
		[JSON.stringify(config.scada ?? {})]
	);
	const identity = String(
		user?.id ?? user?.user?.id ?? user?.email ?? user?.user?.email ?? ''
	);
	const tenant = String(user?.tenant?.id ?? '');
	const [branch, setBranch] = useState(''),
		[loadedBranch, setLoadedBranch] = useState(null),
		[draft, setDraft] = useState(emptyLayout(null)),
		[checkpoint, setCheckpoint] = useState(emptyLayout(null)),
		[serverSaved, setServerSaved] = useState(false),
		[mode, setMode] = useState('edit'),
		[selection, setSelection] = useState(null),
		[libraryOpen, setLibraryOpen] = useState(true),
		[dialog, setDialog] = useState(null),
		[notice, setNotice] = useState(null),
		[loadProblem, setLoadProblem] = useState(''),
		[saving, setSaving] = useState(false),
		[saveUncertain, setSaveUncertain] = useState(false),
		[fitToken, setFitToken] = useState(0),
		[now, setNow] = useState(Date.now()),
		[, setHistoryRevision] = useState(0);
	const past = useRef([]),
		future = useRef([]),
		moveSnapshot = useRef(null),
		saveLock = useRef(false);
	const toast = (message, severity = 'info') =>
		setNotice({ message, severity });
	const catalogQuery = useQuery({
		queryKey: [
			'water-scada',
			'catalog',
			identity,
			tenant,
			requests.preview,
			config.scada?.components_url,
		],
		queryFn: ({ signal }) => requests.getDashboardComponents(signal),
		retry: false,
		refetchOnWindowFocus: false,
	});
	const catalog = catalogQuery.data;
	const selectedBranch = catalog?.branches.find(
		(item) => String(item.id) === String(branch)
	);
	const branchId = selectedBranch?.id ?? null;
	const canEdit = Boolean(
		requests.preview ||
			(catalog?.permissions?.can_edit_layout === true &&
				selectedBranch?.can_edit_layout === true)
	);
	const monitoring = mode === 'monitoring' || !canEdit;
	const scope = useRef(branchId);
	scope.current = branchId;
	const draftKey =
		identity && branchId !== null && branchId !== undefined
			? `ems:water-scada:draft:${tenant}:${identity}:${
					requests.preview ? 'preview' : 'api'
			  }:${branchId}`
			: null;
	useEffect(() => {
		setBranch('');
		setLoadedBranch(null);
		setSelection(null);
	}, [requests, identity, tenant]);
	useEffect(() => {
		if (catalog && !branch) {
			setBranch(
				String(
					catalog.branches.find(
						(item) => String(item.id) === String(config.scada?.branch_id)
					)?.id ??
						catalog.branches[0]?.id ??
						''
				)
			);
		}
	}, [catalog, branch, config.scada?.branch_id]);
	const layoutQuery = useQuery({
		queryKey: [
			'water-scada',
			'layout',
			identity,
			tenant,
			requests.preview,
			config.scada?.layout_url,
			branchId,
		],
		queryFn: ({ signal }) => requests.getDashboardLayout(branchId, signal),
		enabled: branchId !== null && branchId !== undefined,
		retry: false,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});
	const telemetry = useQuery({
		queryKey: [
			'water-scada',
			'telemetry',
			identity,
			tenant,
			requests.preview,
			config.scada?.telemetry_url,
			branchId,
		],
		queryFn: ({ signal }) =>
			requests.getWaterMonitoringTelemetry(branchId, signal),
		enabled: branchId !== null && branchId !== undefined,
		refetchInterval: requests.preview
			? false
			: Math.max(
					5000,
					(Number(config.scada?.poll_interval_seconds) || 10) * 1000
			  ),
		refetchIntervalInBackground: false,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const staleAfter =
		Number.isFinite(config.scada?.stale_after_seconds) &&
		config.scada.stale_after_seconds > 0
			? config.scada.stale_after_seconds
			: 60;
	const records = useMemo(
		() =>
			Object.fromEntries(
				(telemetry.isError ? [] : telemetry.data?.equipment ?? [])
					.filter((item) => {
						const assetBranch = assetFor(
							catalog ?? {},
							item.asset_id
						)?.branch_id;
						return (
							assetBranch !== null &&
							assetBranch !== undefined &&
							String(assetBranch) === String(branchId)
						);
					})
					.map((item) => [String(item.asset_id), item])
			),
		[telemetry.data, telemetry.isError, catalog, branchId]
	);
	const dirty =
		JSON.stringify(payloadFor(draft)) !==
		JSON.stringify(payloadFor(checkpoint));
	const validation = catalog ? validateLayout(draft, catalog, branchId) : [];
	const commandPathsReady = requests.commandPathsReady && serverSaved && !dirty;
	const motor = useMotorCommands({
		service: requests,
		branchId,
		records,
		staleAfter,
		pathsReady: commandPathsReady,
		onNotice: toast,
		onRefresh: () => telemetry.refetch({ cancelRefetch: false }),
	});
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);
	useEffect(() => {
		const beforeUnload = (event) => {
			if (dirty) {
				event.preventDefault();
				event.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', beforeUnload);
		return () => window.removeEventListener('beforeunload', beforeUnload);
	}, [dirty]);
	useEffect(() => {
		if (
			!catalog ||
			branchId === null ||
			branchId === undefined ||
			layoutQuery.isPending ||
			layoutQuery.isError
		) {
			return;
		}
		const server = layoutQuery.data;
		if (server) {
			const errors = validateLayout(server, catalog, branchId);
			if (errors.length) {
				setLoadProblem(`Saved layout could not be loaded: ${errors.join(' ')}`);
				setLoadedBranch(branchId);
				return;
			}
		}
		let initial = server ? clone(server) : emptyLayout(branchId);
		let restored = false;
		if (!server && canEdit && draftKey) {
			try {
				const stored = localStorage.getItem(draftKey);
				if (stored) {
					const value = JSON.parse(stored);
					if (!validateLayout(value, catalog, branchId).length) {
						initial = value;
						restored = true;
					}
				}
			} catch {
				toast(
					'A browser draft could not be read. The server layout has not been changed.',
					'warning'
				);
			}
		}
		setDraft(initial);
		setCheckpoint(clone(initial));
		setServerSaved(Boolean(server));
		setMode(canEdit && !server ? 'edit' : 'monitoring');
		setSelection(null);
		setLoadedBranch(branchId);
		setLoadProblem('');
		setSaveUncertain(false);
		past.current = [];
		future.current = [];
		setHistoryRevision((value) => value + 1);
		setFitToken((value) => value + 1);
		if (restored) {
			toast('Browser draft restored. It is not saved to the server.');
		}
	}, [layoutQuery.dataUpdatedAt, branchId, catalog]);
	const recordHistory = (previous) => {
		past.current = [...past.current.slice(-49), clone(previous)];
		future.current = [];
		setHistoryRevision((value) => value + 1);
	};
	const apply = (next) => {
		recordHistory(draft);
		setDraft(next);
	};
	const add = (type, position) => {
		const definition = typeFor(catalog, type);
		if (
			!canEdit ||
			monitoring ||
			!definition ||
			definition.available === false ||
			draft.nodes.length >= 200
		) {
			return;
		}
		const index = draft.nodes.length;
		const node = {
			id: uid('node'),
			type,
			position: position ?? {
				x: 80 + (index % 12) * 220,
				y: 80 + (Math.floor(index / 12) % 10) * 220,
			},
			data: {
				label: definition.label,
				asset_id: null,
				capacity_kl: null,
				orientation: definition.orientations?.[0] || 'right',
			},
		};
		apply({ ...draft, nodes: [...draft.nodes, node] });
		setSelection({ kind: 'node', id: node.id });
	};
	const connect = (edge) => {
		if (monitoring || !canEdit) {
			return;
		}
		const error = connectionError(draft, catalog, edge);
		if (error) {
			toast(error, 'warning');
			return;
		}
		apply({
			...draft,
			edges: [
				...draft.edges,
				{ ...edge, id: uid('pipe'), type: 'water_pipe', flow_asset_id: null },
			],
		});
	};
	const updateNode = (id, changes) => {
		if (monitoring || !canEdit) {
			return 'Layout editing is unavailable.';
		}
		const next = {
			...draft,
			nodes: draft.nodes.map((node) =>
				node.id === id ? { ...node, ...changes } : node
			),
		};
		const errors = validateLayout(next, catalog, branchId);
		if (errors.length) {
			return errors.join(' ');
		}
		apply(next);
		return null;
	};
	const updateEdge = (id, changes) => {
		if (monitoring || !canEdit) {
			return;
		}
		const next = {
			...draft,
			edges: draft.edges.map((edge) =>
				edge.id === id ? { ...edge, ...changes } : edge
			),
		};
		const errors = validateLayout(next, catalog, branchId);
		if (errors.length) {
			toast(errors.join(' '), 'warning');
			return;
		}
		apply(next);
	};
	const undo = () => {
		if (!past.current.length || monitoring || saving) {
			return;
		}
		future.current.push(clone(draft));
		setDraft(past.current.pop());
		setSelection(null);
		setHistoryRevision((value) => value + 1);
	};
	const redo = () => {
		if (!future.current.length || monitoring || saving) {
			return;
		}
		past.current.push(clone(draft));
		setDraft(future.current.pop());
		setSelection(null);
		setHistoryRevision((value) => value + 1);
	};
	const askDelete = (target = selection) => {
		if (target && !monitoring && canEdit) {
			setDialog({ kind: 'delete', target });
		}
	};
	const confirmAction = () => {
		const action = dialog;
		setDialog(null);
		if (action.kind === 'delete') {
			const { target } = action;
			apply(removeElement(draft, target));
			setSelection(null);
		}
		if (action.kind === 'clear') {
			apply(emptyLayout(branchId));
			setSelection(null);
		}
		if (action.kind === 'example') {
			apply(clone(referenceLayout));
			setSelection(null);
			setFitToken((value) => value + 1);
			toast('Reference example loaded as an unsaved simulated draft.');
		}
		if (action.kind === 'branch') {
			setBranch(action.branch);
		}
		if (action.kind === 'cancel') {
			setDraft(clone(checkpoint));
			past.current = [];
			future.current = [];
			setSelection(null);
			setMode('monitoring');
			setHistoryRevision((value) => value + 1);
		}
		if (action.kind === 'reload') {
			layoutQuery.refetch();
		}
	};
	const saveDraft = () => {
		if (validation.length) {
			toast(validation.join(' '), 'warning');
			return;
		}
		if (draftKey) {
			try {
				localStorage.setItem(draftKey, JSON.stringify(payloadFor(draft)));
				setCheckpoint(clone(draft));
				setServerSaved(false);
				toast(
					'Draft saved in this browser for this user and Branch only. No server persistence or equipment operation.',
					'success'
				);
			} catch {
				toast(
					'Browser storage is unavailable. Your draft remains on this page.',
					'warning'
				);
			}
		} else {
			setCheckpoint(clone(draft));
			setServerSaved(false);
			toast(
				'Draft kept for this open page only. It will be lost when this page closes.'
			);
		}
	};
	const saveServer = async () => {
		if (
			saveLock.current ||
			saveUncertain ||
			saving ||
			monitoring ||
			!canEdit ||
			requests.preview ||
			validation.length
		) {
			return;
		}
		saveLock.current = true;
		setSaving(true);
		const saveBranch = branchId;
		try {
			const saved =
				draft.id !== null && draft.id !== undefined
					? await requests.updateDashboardLayout(draft.id, draft)
					: await requests.saveDashboardLayout(draft);
			if (scope.current !== saveBranch) {
				return;
			}
			const errors = validateLayout(saved, catalog, branchId);
			if (errors.length) {
				throw new Error('Saved layout validation failed: ' + errors.join(' '));
			}
			setDraft(saved);
			setCheckpoint(clone(saved));
			setServerSaved(true);
			setMode('monitoring');
			past.current = [];
			future.current = [];
			setSelection(null);
			toast(
				'Layout saved to the server. Monitoring mode is active.',
				'success'
			);
			if (draftKey) {
				try {
					localStorage.removeItem(draftKey);
				} catch {
					toast(
						'Layout saved to the server; the old browser draft could not be cleared.',
						'warning'
					);
				}
			}
		} catch (error) {
			if (!error?.status || error.status >= 500) {
				setSaveUncertain(true);
			}
			toast(errorMessage(error) + ' Your draft has been preserved.', 'error');
		} finally {
			saveLock.current = false;
			setSaving(false);
		}
	};
	const commandRequest = (node) => {
		const asset = assetFor(catalog, node.data.asset_id);
		const record = records[String(asset?.asset_id)];
		const key = String(asset?.asset_id);
		const block = commandBlock(record, {
			preview: requests.preview,
			pending: Boolean(motor.unresolved[key]),
			pathsReady: commandPathsReady,
			staleAfter,
		});
		if (block) {
			toast(block, 'warning');
			return;
		}
		setDialog({
			kind: 'command',
			nodeId: node.id,
			assetId: asset.asset_id,
			action:
				readingState(record, { staleAfter }).motor === 'Running'
					? 'stop'
					: 'start',
		});
	};
	const sendCommand = async () => {
		const current = dialog;
		setDialog(null);
		const node = draft.nodes.find((item) => item.id === current.nodeId);
		if (
			!node ||
			String(node.data.asset_id) !== String(current.assetId) ||
			!monitoring
		) {
			toast(
				'Equipment binding or mode changed. Command was not submitted.',
				'warning'
			);
			return;
		}
		try {
			await motor.request(current.assetId, current.action);
		} catch (error) {
			toast(errorMessage(error), 'error');
		}
	};
	if (catalogQuery.isPending) {
		return (
			<DashboardSurface>
				<Skeleton height={64} />
				<Skeleton variant="rounded" height="65vh" />
			</DashboardSurface>
		);
	}
	if (catalogQuery.isError) {
		return (
			<Alert
				severity="error"
				action={<Button onClick={() => catalogQuery.refetch()}>Retry</Button>}
			>
				Equipment catalog unavailable. {errorMessage(catalogQuery.error)} No
				preview equipment was substituted.
			</Alert>
		);
	}
	const selectedNode =
		selection?.kind === 'node'
			? draft.nodes.find((node) => node.id === selection.id)
			: null;
	const selectedCommand = selectedNode
		? motor.commands[String(selectedNode.data.asset_id)]
		: null;
	return (
		<DashboardSurface
			component="section"
			aria-label="Water Distribution Dashboard"
		>
			<Box component="header" data-water-ui="header">
				<div data-water-ui="heading-icon">
					<HubRounded />
				</div>
				<div data-water-ui="heading">
					<h1>Water Distribution</h1>
					<p>Design your network. Monitor every connection.</p>
				</div>
				<Chip
					label={requests.preview ? 'Simulated preview' : 'Backend connected'}
					size="small"
					color={requests.preview ? 'warning' : 'info'}
					variant="outlined"
				/>
				<span data-water-ui={`mode-badge ${monitoring ? 'mode-monitor' : ''}`}>
					{monitoring ? 'Monitoring' : 'Layout editor'}
				</span>
			</Box>
			<Box data-water-ui="toolbar">
				<TextField
					select
					size="small"
					label="Branch"
					value={branch}
					disabled={saving || Object.keys(motor.unresolved).length > 0}
					onChange={(event) =>
						dirty
							? setDialog({ kind: 'branch', branch: event.target.value })
							: setBranch(event.target.value)
					}
				>
					{catalog.branches.map((item) => (
						<MenuItem key={item.id} value={String(item.id)}>
							{item.name}
						</MenuItem>
					))}
				</TextField>
				<TextField
					size="small"
					label="Layout name"
					value={draft.name}
					disabled={monitoring || saving}
					onChange={(event) =>
						setDraft((current) => ({ ...current, name: event.target.value }))
					}
					inputProps={{ maxLength: 100 }}
				/>
				<div data-water-ui="toolbar-modes">
					{!monitoring ? (
						<>
							<Button
								startIcon={<VisibilityRounded />}
								onClick={() => {
									if (validation.length) {
										toast(validation.join(' '), 'warning');
									} else {
										setMode('monitoring');
										setSelection(null);
										setFitToken((value) => value + 1);
									}
								}}
								disabled={saving || !draft.nodes.length}
							>
								View monitoring
							</Button>
							<Button
								startIcon={<SaveRounded />}
								variant="contained"
								onClick={requests.preview ? saveDraft : saveServer}
								disabled={
									saving ||
									validation.length > 0 ||
									(!requests.preview && saveUncertain)
								}
							>
								{saving ? (
									<CircularProgress size={16} color="inherit" />
								) : requests.preview ? (
									'Save browser draft'
								) : (
									'Save layout'
								)}
							</Button>
							{!requests.preview && (
								<Button
									onClick={saveDraft}
									disabled={saving || validation.length > 0}
								>
									Save draft locally
								</Button>
							)}
						</>
					) : (
						canEdit && (
							<Button
								startIcon={<EditRounded />}
								variant="outlined"
								onClick={() => {
									setMode('edit');
									setSelection(null);
								}}
							>
								Edit layout
							</Button>
						)
					)}
				</div>
				<span data-water-ui="layout-status">
					{dirty
						? 'Unsaved changes'
						: serverSaved
						  ? 'Server layout'
						  : 'Local draft / not server saved'}
				</span>
				<Tooltip title="Refresh processed telemetry; equipment positions remain fixed">
					<span>
						<IconButton
							disabled={
								telemetry.isFetching ||
								branchId === null ||
								branchId === undefined
							}
							onClick={() => telemetry.refetch({ cancelRefetch: false })}
							aria-label="Refresh equipment telemetry"
						>
							<RefreshRounded />
						</IconButton>
					</span>
				</Tooltip>
			</Box>
			{requests.preview && (
				<div data-water-ui="preview-note">
					<span />
					Simulated catalog and telemetry. Physical controls are disabled.
					Drafts are not saved to the server.
				</div>
			)}
			{saveUncertain && (
				<Alert severity="warning">
					The last save outcome is uncertain. Save is blocked until you reload
					the server layout to reconcile it. Your draft is still available; save
					it locally before reloading.
				</Alert>
			)}
			{notice && (
				<Alert severity={notice.severity} onClose={() => setNotice(null)}>
					{notice.message}
				</Alert>
			)}
			{telemetry.isError && (
				<Alert
					severity="warning"
					action={
						<Button
							disabled={telemetry.isFetching}
							onClick={() => telemetry.refetch()}
						>
							Retry
						</Button>
					}
				>
					Telemetry unavailable. Readings and commands are disabled.{' '}
					{errorMessage(telemetry.error)}
				</Alert>
			)}
			{!catalog.branches.length ? (
				<Alert severity="info">No authorized Branches are available.</Alert>
			) : layoutQuery.isError ? (
				<Alert
					severity="error"
					action={
						<Button onClick={() => layoutQuery.refetch()}>Retry layout</Button>
					}
				>
					The layout could not be loaded. This is not an empty-layout response.{' '}
					{errorMessage(layoutQuery.error)}
				</Alert>
			) : loadProblem ? (
				<Alert
					severity="error"
					action={<Button onClick={() => layoutQuery.refetch()}>Reload</Button>}
				>
					{loadProblem}
				</Alert>
			) : loadedBranch !== branchId || layoutQuery.isPending ? (
				<Skeleton variant="rounded" height="60vh" />
			) : (
				<>
					{!monitoring && (
						<div data-water-ui="editor-actions">
							<Button
								size="small"
								startIcon={<AddRounded />}
								onClick={() => setLibraryOpen((value) => !value)}
								aria-expanded={libraryOpen}
							>
								{libraryOpen ? 'Hide library' : 'Equipment library'}
							</Button>
							<IconButton
								size="small"
								aria-label="Undo layout change"
								disabled={!past.current.length || saving}
								onClick={undo}
							>
								<UndoRounded />
							</IconButton>
							<IconButton
								size="small"
								aria-label="Redo layout change"
								disabled={!future.current.length || saving}
								onClick={redo}
							>
								<RedoRounded />
							</IconButton>
							<Button
								size="small"
								disabled={!selection || saving}
								onClick={() => askDelete()}
							>
								Delete selected
							</Button>
							<Button
								size="small"
								disabled={!draft.nodes.length || saving}
								onClick={() => setDialog({ kind: 'clear' })}
							>
								Clear canvas
							</Button>
							<Button
								size="small"
								onClick={() =>
									dirty
										? setDialog({ kind: 'cancel' })
										: (setDraft(clone(checkpoint)), setMode('monitoring'))
								}
								disabled={saving}
							>
								Cancel changes
							</Button>
							<Button
								size="small"
								onClick={() =>
									dirty ? setDialog({ kind: 'reload' }) : layoutQuery.refetch()
								}
								disabled={saving || layoutQuery.isFetching}
							>
								Reload server layout
							</Button>
							<span>
								{draft.nodes.length} equipment · {draft.edges.length}{' '}
								connections
							</span>
						</div>
					)}
					<div
						data-water-ui={`workspace ${
							!monitoring && libraryOpen ? 'with-library' : ''
						} ${selection ? 'with-inspector' : ''}`}
						aria-busy={saving}
					>
						{!monitoring && libraryOpen && (
							<EquipmentLibrary
								catalog={catalog}
								preview={requests.preview}
								onAdd={add}
								disabled={saving}
								onExample={() => setDialog({ kind: 'example' })}
							/>
						)}
						<DashboardCanvas
							layout={draft}
							catalog={catalog}
							records={records}
							preview={requests.preview}
							monitoring={monitoring || saving}
							selection={selection}
							onSelect={setSelection}
							onAdd={add}
							onConnect={connect}
							onDelete={askDelete}
							onCommand={commandRequest}
							onMoveStart={() => {
								moveSnapshot.current = clone(draft);
							}}
							onMove={(id, position) =>
								setDraft((current) => ({
									...current,
									nodes: current.nodes.map((node) =>
										node.id === id ? { ...node, position } : node
									),
								}))
							}
							onMoveEnd={() => {
								if (moveSnapshot.current) {
									if (
										JSON.stringify(payloadFor(moveSnapshot.current)) !==
										JSON.stringify(payloadFor(draft))
									) {
										recordHistory(moveSnapshot.current);
									}
									moveSnapshot.current = null;
								}
							}}
							onNudge={(id, key) => {
								const node = draft.nodes.find((item) => item.id === id);
								if (node) {
									updateNode(id, {
										position: {
											x: snap(
												node.position.x +
													(key === 'ArrowRight'
														? 20
														: key === 'ArrowLeft'
														  ? -20
														  : 0)
											),
											y: Math.min(
												2200,
												snap(
													node.position.y +
														(key === 'ArrowDown'
															? 20
															: key === 'ArrowUp'
															  ? -20
															  : 0)
												)
											),
										},
									});
								}
							}}
							commands={motor.unresolved}
							commandPathsReady={commandPathsReady}
							now={now}
							staleAfter={staleAfter}
							fitToken={fitToken}
						/>
						{selection && (
							<EquipmentInspector
								selection={selection}
								layout={draft}
								catalog={catalog}
								monitoring={monitoring || saving}
								preview={requests.preview}
								records={records}
								now={now}
								staleAfter={staleAfter}
								onUpdate={updateNode}
								onEdgeUpdate={updateEdge}
								onDelete={askDelete}
								onDuplicate={(node) => {
									if (
										!canEdit ||
										monitoring ||
										saving ||
										draft.nodes.length >= 200
									) {
										return;
									}
									const copy = {
										...clone(node),
										id: uid('node'),
										position: {
											x: snap(node.position.x + 40),
											y: Math.min(2200, snap(node.position.y + 40)),
										},
										data: {
											...node.data,
											label: node.data.label + ' copy',
											asset_id: null,
										},
									};
									apply({ ...draft, nodes: [...draft.nodes, copy] });
									setSelection({ kind: 'node', id: copy.id });
								}}
								onClose={() => setSelection(null)}
								command={selectedCommand}
								commandPathsReady={commandPathsReady}
								onCheckCommand={() =>
									motor.check(String(selectedNode?.data.asset_id))
								}
							/>
						)}
					</div>
					<Box component="footer" data-water-ui="footer">
						<span>
							<i data-water-ui="legend-flow" /> Flow confirmed{' '}
							<i data-water-ui="legend-still" /> No flow{' '}
							<i data-water-ui="legend-unknown" /> Flow unknown
						</span>
						<span>
							{requests.preview
								? 'Demo signals / no physical equipment operation'
								: telemetry.isFetching
								  ? 'Refreshing telemetry'
								  : telemetry.dataUpdatedAt
								    ? `API checked ${new Date(
												telemetry.dataUpdatedAt
								      ).toLocaleTimeString()}`
								    : 'Telemetry not received'}
						</span>
					</Box>
				</>
			)}
			<Dialog
				open={Boolean(dialog)}
				onClose={() => setDialog(null)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>
					{dialog?.kind === 'command'
						? `${dialog.action === 'start' ? 'Start' : 'Stop'} motor?`
						: dialog?.kind === 'delete'
						  ? 'Delete selected component?'
						  : dialog?.kind === 'example'
						    ? 'Load the reference example?'
						    : dialog?.kind === 'clear'
						      ? 'Clear this layout?'
						      : 'Discard unsaved changes?'}
				</DialogTitle>
				<DialogContent>
					{dialog?.kind === 'command' ? (
						<>
							<p>
								{
									draft.nodes.find((node) => node.id === dialog.nodeId)?.data
										.label
								}
							</p>
							<p>Motor asset: {String(dialog.assetId)}</p>
							<p>
								Current feedback:{' '}
								{
									readingState(records[String(dialog.assetId)], { staleAfter })
										.motor
								}{' '}
								· Mode:{' '}
								{
									readingState(records[String(dialog.assetId)], { staleAfter })
										.mode
								}
							</p>
							<p>
								The request is sent for authorization and equipment safety
								checks. Acknowledgment does not confirm physical operation.
							</p>
						</>
					) : (
						<p>
							{dialog?.kind === 'delete'
								? 'Deleting equipment also removes its connected pipelines. This does not operate any equipment.'
								: dialog?.kind === 'example'
								  ? 'Replace the current draft with the optional simulated reference topology. This does not save anything to the server.'
								  : 'The current unsaved layout changes will be discarded. Equipment operation is unaffected.'}
						</p>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialog(null)}>Cancel</Button>
					<Button
						variant="contained"
						color={dialog?.kind === 'delete' ? 'error' : 'primary'}
						onClick={dialog?.kind === 'command' ? sendCommand : confirmAction}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</DashboardSurface>
	);
}

const unpack = (response) => {
	if (response?.success === false) {
		throw new Error(response.message || 'The server rejected this request.');
	}
	return response?.data ?? response;
};
const withQuery = (path, params) =>
	`${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams(params)}`;
function createDashboardRequests(config = {}) {
	const { urls, preview } = getWaterMonitoringDashboardUrls(config);
	const path = (name) => {
		const value = urls[name];
		if (!value) {
			throw new Error(`Water Monitoring ${name} is not configured.`);
		}
		return value;
	};
	return {
		preview,
		commandPathsReady:
			!preview && Boolean(urls.command_url && urls.command_status_url),
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
