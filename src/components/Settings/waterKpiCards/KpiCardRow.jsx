import {
	ArrowDownward,
	ArrowUpward,
	Check,
	Close,
	DeleteOutline,
	DragIndicator,
	EditOutlined,
	TuneOutlined,
} from '@mui/icons-material';
import {
	Box,
	Chip,
	CircularProgress,
	IconButton,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Typography,
	alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';

import {
	KPI_CARD_NAME_MAX_LENGTH,
	KPI_CARD_TYPE,
	MAX_ACTIVE_KPI_CARDS,
	formatKpiFormula,
	getCalculationOption,
	getKpiCardApiError,
} from '../../../helpers/waterKpiCards';

const iconButtonSx = {
	color: 'text.secondary',
	'&:hover': { color: 'text.primary' },
};

const RowIconButton = ({ title, children, ...props }) => (
	<Tooltip title={title}>
		<span>
			<IconButton size="small" aria-label={title} sx={iconButtonSx} {...props}>
				{children}
			</IconButton>
		</span>
	</Tooltip>
);

/**
 * One card in the management list. Reordering works by dragging the handle
 * (mouse) or with the arrow buttons (keyboard and touch, where HTML5 drag and
 * drop isn't available).
 */
const KpiCardRow = ({
	card,
	index,
	count,
	slot,
	isSaving,
	activationBlocked,
	reorderDisabled,
	isDragging,
	dropPosition,
	onRename,
	onToggleActive,
	onEdit,
	onDelete,
	onMove,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
}) => {
	const [isRenaming, setIsRenaming] = useState(false);
	const [draftName, setDraftName] = useState(card.display_name);
	const [renameError, setRenameError] = useState(null);
	const [renaming, setRenaming] = useState(false);
	// HTML5 drag starts from the whole row, so it's only armed while the handle
	// is pressed. Otherwise selecting text or using a control could start a drag.
	const [dragArmed, setDragArmed] = useState(false);

	// A press on the handle released anywhere else must not leave the row
	// armed. During a real drag the browser fires dragend instead of mouseup.
	useEffect(() => {
		if (!dragArmed) {
			return undefined;
		}
		const disarm = () => setDragArmed(false);
		window.addEventListener('mouseup', disarm);
		return () => window.removeEventListener('mouseup', disarm);
	}, [dragArmed]);

	const isStationCount = card.card_type === KPI_CARD_TYPE.STATION_COUNT;
	const calculation = getCalculationOption(card.calculation_type);
	const formula = isStationCount
		? 'Counts the stations connected to your account'
		: formatKpiFormula(card.slave_roles) || 'No meters mapped';

	const startRename = () => {
		setDraftName(card.display_name);
		setRenameError(null);
		setIsRenaming(true);
	};

	const cancelRename = () => {
		setIsRenaming(false);
		setRenameError(null);
	};

	const saveRename = async () => {
		const trimmed = draftName.trim();
		if (!trimmed) {
			setRenameError('Enter a name.');
			return;
		}
		if (trimmed === card.display_name) {
			setIsRenaming(false);
			return;
		}
		setRenaming(true);
		try {
			await onRename(trimmed);
			setIsRenaming(false);
			setRenameError(null);
		} catch (error) {
			setRenameError(
				getKpiCardApiError(error, 'Could not rename the card.').message
			);
		} finally {
			setRenaming(false);
		}
	};

	const handleDragOver = (event) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		const rect = event.currentTarget.getBoundingClientRect();
		onDragOver(index, event.clientY > rect.top + rect.height / 2);
	};

	const handleDrop = (event) => {
		event.preventDefault();
		const rect = event.currentTarget.getBoundingClientRect();
		onDrop(index, event.clientY > rect.top + rect.height / 2);
	};

	return (
		<Box
			role="listitem"
			draggable={dragArmed && !reorderDisabled && !isRenaming}
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = 'move';
				// Firefox won't start a drag without data.
				event.dataTransfer.setData('text/plain', String(card.id));
				onDragStart(index);
			}}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			onDragEnd={() => {
				setDragArmed(false);
				onDragEnd();
			}}
			sx={{
				display: 'flex',
				alignItems: { xs: 'flex-start', md: 'center' },
				flexWrap: { xs: 'wrap', md: 'nowrap' },
				gap: { xs: 1, md: 1.5 },
				p: 1.25,
				pl: 0.75,
				borderRadius: 2,
				border: '1px solid',
				borderColor: 'divider',
				bgcolor: 'background.paper',
				opacity: isDragging ? 0.45 : 1,
				transition: 'opacity 120ms ease, box-shadow 120ms ease',
				boxShadow: (theme) =>
					dropPosition === 'before'
						? `inset 0 3px 0 ${theme.palette.primary.main}`
						: dropPosition === 'after'
						  ? `inset 0 -3px 0 ${theme.palette.primary.main}`
						  : 'none',
			}}
		>
			<Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
				<Box
					aria-hidden
					onMouseDown={() => setDragArmed(true)}
					sx={{
						display: { xs: 'none', md: 'flex' },
						cursor: reorderDisabled ? 'default' : 'grab',
						color: 'text.disabled',
						'&:hover': {
							color: reorderDisabled ? 'text.disabled' : 'text.secondary',
						},
					}}
				>
					<DragIndicator fontSize="small" />
				</Box>
				<Tooltip
					title={
						slot
							? `Position ${
									slot.slot
							  } on the dashboard (${slot.area.toLowerCase()})`
							: 'Hidden from the dashboard'
					}
				>
					<Box
						sx={{
							width: 26,
							height: 26,
							borderRadius: '8px',
							display: 'grid',
							placeItems: 'center',
							fontSize: 12,
							fontWeight: 700,
							color: slot ? 'primary.main' : 'text.disabled',
							bgcolor: (theme) =>
								slot ? alpha(theme.palette.primary.main, 0.1) : 'action.hover',
						}}
					>
						{slot ? slot.slot : '–'}
					</Box>
				</Tooltip>
			</Stack>

			<Box flex={1} minWidth={0} sx={{ opacity: card.is_active ? 1 : 0.6 }}>
				{isRenaming ? (
					<Stack direction="row" alignItems="flex-start" gap={0.5}>
						<TextField
							size="small"
							autoFocus
							fullWidth
							value={draftName}
							onChange={(event) => setDraftName(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									saveRename();
								} else if (event.key === 'Escape') {
									event.preventDefault();
									cancelRename();
								}
							}}
							error={Boolean(renameError)}
							helperText={renameError}
							disabled={renaming}
							inputProps={{
								maxLength: KPI_CARD_NAME_MAX_LENGTH,
								'aria-label': 'Card name',
							}}
							sx={{ maxWidth: 360 }}
						/>
						<RowIconButton
							title="Save name"
							onClick={saveRename}
							disabled={renaming}
						>
							{renaming ? (
								<CircularProgress size={16} />
							) : (
								<Check fontSize="small" />
							)}
						</RowIconButton>
						<RowIconButton
							title="Cancel"
							onClick={cancelRename}
							disabled={renaming}
						>
							<Close fontSize="small" />
						</RowIconButton>
					</Stack>
				) : (
					<Stack direction="row" alignItems="center" gap={0.25} minWidth={0}>
						<Typography
							fontWeight={700}
							fontSize={14}
							noWrap
							title={card.display_name}
						>
							{card.display_name}
						</Typography>
						<RowIconButton
							title="Rename"
							aria-label={`Rename ${card.display_name}`}
							onClick={startRename}
							disabled={isSaving}
						>
							<EditOutlined sx={{ fontSize: 16 }} />
						</RowIconButton>
					</Stack>
				)}

				<Stack
					direction="row"
					alignItems="center"
					flexWrap="wrap"
					columnGap={1}
					rowGap={0.5}
					mt={0.25}
					minWidth={0}
				>
					<Chip
						size="small"
						label={isStationCount ? 'Station count' : calculation.shortLabel}
						sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
					/>
					{card.unit && (
						<Typography fontSize={12} color="text.secondary" fontWeight={600}>
							{card.unit}
						</Typography>
					)}
					<Typography
						fontSize={12}
						color="text.secondary"
						noWrap
						title={formula}
						sx={{ minWidth: 0, flex: { md: 1 }, maxWidth: '100%' }}
					>
						{formula}
					</Typography>
				</Stack>
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				gap={0.25}
				flexShrink={0}
				// On small screens the controls wrap to their own full-width line,
				// indented under the title. Padding, not margin, so the 100% width
				// doesn't overflow the row.
				sx={{ pl: { xs: 4.5, md: 0 }, width: { xs: '100%', md: 'auto' } }}
			>
				<Tooltip
					title={
						activationBlocked
							? `${MAX_ACTIVE_KPI_CARDS} cards are already shown. Hide one first.`
							: ''
					}
				>
					<Stack
						direction="row"
						alignItems="center"
						component="label"
						sx={{ cursor: activationBlocked ? 'default' : 'pointer', mr: 0.5 }}
					>
						<Switch
							size="small"
							checked={Boolean(card.is_active)}
							disabled={activationBlocked || isSaving}
							onChange={(event) => onToggleActive(event.target.checked)}
							inputProps={{
								'aria-label': `Show ${card.display_name} on the dashboard`,
							}}
						/>
						<Typography
							fontSize={12}
							fontWeight={600}
							color={card.is_active ? 'success.main' : 'text.secondary'}
							minWidth={44}
						>
							{card.is_active ? 'Shown' : 'Hidden'}
						</Typography>
					</Stack>
				</Tooltip>

				{isSaving && <CircularProgress size={14} sx={{ mx: 0.5 }} />}

				<Box flex={{ xs: 1, md: 'none' }} />

				{isStationCount ? (
					// Total Stations has no formula. The empty slot keeps this row's
					// controls lined up with the other rows.
					<Box aria-hidden sx={{ visibility: 'hidden' }}>
						<IconButton size="small" tabIndex={-1} disabled>
							<TuneOutlined fontSize="small" />
						</IconButton>
					</Box>
				) : (
					<RowIconButton
						title="Edit formula"
						aria-label={`Edit the formula of ${card.display_name}`}
						onClick={onEdit}
						disabled={isSaving}
					>
						<TuneOutlined fontSize="small" />
					</RowIconButton>
				)}
				<RowIconButton
					title="Delete"
					aria-label={`Delete ${card.display_name}`}
					onClick={onDelete}
					disabled={isSaving}
				>
					<DeleteOutline fontSize="small" />
				</RowIconButton>
				<RowIconButton
					title="Move up"
					aria-label={`Move ${card.display_name} up`}
					onClick={() => onMove(-1)}
					disabled={reorderDisabled || index === 0}
				>
					<ArrowUpward sx={{ fontSize: 18 }} />
				</RowIconButton>
				<RowIconButton
					title="Move down"
					aria-label={`Move ${card.display_name} down`}
					onClick={() => onMove(1)}
					disabled={reorderDisabled || index === count - 1}
				>
					<ArrowDownward sx={{ fontSize: 18 }} />
				</RowIconButton>
			</Stack>
		</Box>
	);
};

export default KpiCardRow;
