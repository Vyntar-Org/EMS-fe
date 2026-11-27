import {
	Add,
	DeviceHub,
	Refresh,
	ViewQuiltOutlined,
} from '@mui/icons-material';
import {
	Box,
	Button,
	Chip,
	Skeleton,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import { useCommonData } from '../../../contexts/CommonDataContext';
import {
	KPI_CARD_TYPE,
	KPI_TOP_ROW_SLOTS,
	MAX_ACTIVE_KPI_CARDS,
	countActiveKpiCards,
	getDashboardSlots,
	getDropTargetIndex,
	getKpiCardApiError,
	getNextDisplayOrder,
	hasStationCountCard,
	moveItem,
} from '../../../helpers/waterKpiCards';
import { useWaterKpiCards } from '../../../hooks/useWaterKpiCards';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import FormDialog from '../../common/FormDialog';
import { useToast } from '../../common/PremiumToast';

import KpiCardFormDialog from './KpiCardFormDialog';
import KpiCardRow from './KpiCardRow';

const CAP_REACHED_MESSAGE = `${MAX_ACTIVE_KPI_CARDS} cards are already shown. Hide or delete one first.`;

const toolbarButtonSx = {
	textTransform: 'none',
	fontWeight: 600,
	borderRadius: '8px',
	height: 36,
	whiteSpace: 'nowrap',
};

/**
 * Settings → Dashboard KPI cards (ADMIN only): rename, reorder, show/hide,
 * create, edit and delete the cards on the Water dashboard. The dashboard
 * shows active cards in this order: the first 4 in its top row, the next 4
 * beside the consumption chart. At most 8 can be active.
 */
const ManageKpiCards = () => {
	const { showToast } = useToast();
	const { slavesData, commonDataLoading, commonDataErrors } = useCommonData();
	const {
		cards,
		isLoading,
		error,
		refetch,
		isFetching,
		createCard,
		updateCard,
		deleteCard,
		reorderCards,
	} = useWaterKpiCards();

	const [formDialog, setFormDialog] = useState({ open: false, card: null });
	const [deleteDialog, setDeleteDialog] = useState({ open: false, card: null });
	const [deleting, setDeleting] = useState(false);
	const [savingIds, setSavingIds] = useState(() => new Set());
	const [drag, setDrag] = useState(null); // { from, over, after }

	const activeCount = countActiveKpiCards(cards);
	const isAtCap = activeCount >= MAX_ACTIVE_KPI_CARDS;
	const slots = useMemo(() => getDashboardSlots(cards), [cards]);
	const listReady = !isLoading && !error;
	const canAddStationCount = listReady && !hasStationCountCard(cards);
	const reorderDisabled = reorderCards.isPending;

	const markSaving = (id, saving) =>
		setSavingIds((previous) => {
			const next = new Set(previous);
			if (saving) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});

	const saveCardChanges = async (card, changes) => {
		markSaving(card.id, true);
		try {
			return await updateCard.mutateAsync({ id: card.id, changes });
		} finally {
			markSaving(card.id, false);
		}
	};

	const showError = (requestError, fallback) =>
		showToast(getKpiCardApiError(requestError, fallback).message, 'error');

	const handleToggleActive = async (card, isActive) => {
		try {
			await saveCardChanges(card, { is_active: isActive });
			showToast(
				isActive
					? `"${card.display_name}" is now shown on the dashboard.`
					: `"${card.display_name}" is now hidden from the dashboard.`,
				'success'
			);
		} catch (requestError) {
			showError(requestError, 'Could not update the card.');
		}
	};

	const applyOrder = (orderedCards) => {
		reorderCards.mutate(orderedCards, {
			onError: (requestError) =>
				showError(
					requestError,
					'Could not save the new order. The list was reset.'
				),
		});
	};

	const handleMove = (index, direction) => {
		const nextOrder = moveItem(cards, index, index + direction);
		if (nextOrder !== cards) {
			applyOrder(nextOrder);
		}
	};

	const handleDragOver = (overIndex, after) =>
		setDrag((current) =>
			!current || (current.over === overIndex && current.after === after)
				? current
				: { ...current, over: overIndex, after }
		);

	const handleDrop = (overIndex, after) => {
		if (!drag) {
			return;
		}
		const target = getDropTargetIndex(drag.from, overIndex, after);
		const from = drag.from;
		setDrag(null);
		if (target !== from) {
			applyOrder(moveItem(cards, from, target));
		}
	};

	const getDropPosition = (index) => {
		if (!drag || drag.over !== index) {
			return null;
		}
		return getDropTargetIndex(drag.from, index, drag.after) === drag.from
			? null
			: drag.after
			  ? 'after'
			  : 'before';
	};

	const handleSaveForm = async (payload) => {
		const editingCard = formDialog.card;
		if (editingCard) {
			await saveCardChanges(editingCard, payload);
			showToast('Card saved.', 'success');
		} else {
			await createCard.mutateAsync({
				...payload,
				display_order: getNextDisplayOrder(cards),
			});
			showToast(
				`"${payload.display_name}" was added to the dashboard.`,
				'success'
			);
		}
		setFormDialog((current) => ({ ...current, open: false }));
	};

	const handleAddStationCount = async () => {
		try {
			await createCard.mutateAsync({
				card_type: KPI_CARD_TYPE.STATION_COUNT,
				display_name: 'Total Stations',
				display_order: getNextDisplayOrder(cards),
			});
			showToast('"Total Stations" was added to the dashboard.', 'success');
		} catch (requestError) {
			showError(requestError, 'Could not add the Total Stations card.');
		}
	};

	const handleDelete = async () => {
		const card = deleteDialog.card;
		setDeleting(true);
		try {
			await deleteCard.mutateAsync(card.id);
			showToast(`"${card.display_name}" was deleted.`, 'success');
		} catch (requestError) {
			showError(requestError, 'Could not delete the card.');
		} finally {
			setDeleting(false);
			setDeleteDialog((current) => ({ ...current, open: false }));
		}
	};

	const deletingCard = deleteDialog.card;
	const deletingStationCount =
		deletingCard?.card_type === KPI_CARD_TYPE.STATION_COUNT;

	const renderList = () => {
		if (isLoading) {
			return (
				<Stack gap={1}>
					{[0, 1, 2, 3].map((key) => (
						<Skeleton key={key} variant="rounded" height={64} />
					))}
				</Stack>
			);
		}

		if (error) {
			return (
				<Stack alignItems="center" gap={1.5} py={4}>
					<NoDataFound
						message={
							getKpiCardApiError(error, 'Could not load your KPI cards.')
								.message
						}
					/>
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={() => refetch()}
						disabled={isFetching}
						sx={toolbarButtonSx}
					>
						Try again
					</Button>
				</Stack>
			);
		}

		if (cards.length === 0) {
			return (
				<Box py={4}>
					<NoDataFound message="No cards yet. Create one to show it on the Water dashboard." />
				</Box>
			);
		}

		return (
			<Stack gap={1} role="list" aria-label="Dashboard KPI cards">
				{cards.map((card, index) => (
					<KpiCardRow
						key={card.id}
						card={card}
						index={index}
						count={cards.length}
						slot={slots.get(card.id)}
						isSaving={savingIds.has(card.id)}
						activationBlocked={!card.is_active && isAtCap}
						reorderDisabled={reorderDisabled}
						isDragging={drag?.from === index}
						dropPosition={getDropPosition(index)}
						onRename={(name) => saveCardChanges(card, { display_name: name })}
						onToggleActive={(isActive) => handleToggleActive(card, isActive)}
						onEdit={() => setFormDialog({ open: true, card })}
						onDelete={() => setDeleteDialog({ open: true, card })}
						onMove={(direction) => handleMove(index, direction)}
						onDragStart={(from) => setDrag({ from, over: null, after: false })}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onDragEnd={() => setDrag(null)}
					/>
				))}
			</Stack>
		);
	};

	return (
		<CustomCard
			title="Dashboard KPI cards"
			titleIcon={<ViewQuiltOutlined />}
			childrenOtherProps={{ sx: { display: 'flex', flexDirection: 'column' } }}
		>
			<Stack
				direction={{ xs: 'column', lg: 'row' }}
				gap={1.5}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', lg: 'center' }}
				mb={1.5}
				flexShrink={0}
			>
				<Typography variant="body2" color="text.secondary" maxWidth={720}>
					Rename, reorder and choose which cards the Water dashboard shows.
					Shown cards fill the top row first ({KPI_TOP_ROW_SLOTS} cards), then
					the column beside the consumption chart. Hiding a card keeps its
					setup; deleting removes it.
				</Typography>

				<Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
					{listReady && (
						<Chip
							label={`${activeCount} of ${MAX_ACTIVE_KPI_CARDS} shown`}
							color={isAtCap ? 'warning' : 'default'}
							variant={isAtCap ? 'filled' : 'outlined'}
							sx={{ fontWeight: 600 }}
						/>
					)}
					{canAddStationCount && (
						<Tooltip title={isAtCap ? CAP_REACHED_MESSAGE : ''}>
							<span>
								<Button
									variant="outlined"
									startIcon={<DeviceHub />}
									onClick={handleAddStationCount}
									disabled={isAtCap || createCard.isPending}
									sx={toolbarButtonSx}
								>
									Add Total Stations
								</Button>
							</span>
						</Tooltip>
					)}
					<Tooltip title={isAtCap ? CAP_REACHED_MESSAGE : ''}>
						<span>
							<Button
								variant="contained"
								disableElevation
								startIcon={<Add />}
								onClick={() => setFormDialog({ open: true, card: null })}
								disabled={!listReady || isAtCap}
								sx={{
									...toolbarButtonSx,
									backgroundColor: 'secondary.main',
									color: 'secondary.contrastText',
									'&:hover': { backgroundColor: 'secondary.dark' },
								}}
							>
								New card
							</Button>
						</span>
					</Tooltip>
				</Stack>
			</Stack>

			<Box flex={1} minHeight={0} overflow="auto" pr={0.25}>
				{renderList()}
			</Box>

			<KpiCardFormDialog
				open={formDialog.open}
				card={formDialog.card}
				onClose={() =>
					setFormDialog((current) => ({ ...current, open: false }))
				}
				onSave={handleSaveForm}
				slaves={slavesData}
				slavesLoading={commonDataLoading}
				slavesError={commonDataErrors?.slaves}
			/>

			<FormDialog
				open={deleteDialog.open}
				onClose={() =>
					setDeleteDialog((current) => ({ ...current, open: false }))
				}
				title={
					deletingCard
						? `Delete "${deletingCard.display_name}"?`
						: 'Delete card?'
				}
				onSubmit={handleDelete}
				submitLabel="Delete card"
				busyLabel="Deleting…"
				tone="danger"
				busy={deleting}
				maxWidth="xs"
			>
				<Typography variant="body2" color="text.secondary" lineHeight={1.6}>
					{deletingStationCount
						? 'It will be removed from the dashboard. You can add it back later with "Add Total Stations".'
						: "It will be removed from the dashboard along with its meter formula, and this can't be undone. To keep it for later, hide it instead."}
				</Typography>
			</FormDialog>
		</CustomCard>
	);
};

export default ManageKpiCards;
