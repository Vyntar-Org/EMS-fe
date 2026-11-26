import {
	Alert,
	Box,
	Chip,
	FormControlLabel,
	FormHelperText,
	Radio,
	RadioGroup,
	Stack,
	Typography,
	alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import {
	CALCULATION_TYPE_OPTIONS,
	KPI_CARD_NAME_MAX_LENGTH,
	buildSlaveRoles,
	formatKpiFormula,
	getCalculationOption,
	getKpiCardApiError,
	isSameSlaveRoles,
	splitSlaveRoles,
	validateKpiCardForm,
} from '../../../helpers/waterKpiCards';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import { CustomInput } from '../../common/CustomInput';
import FormDialog from '../../common/FormDialog';

const NO_SERVER_ERROR = { message: null, fieldErrors: {} };
const NO_SLAVE_ROLES = [];

const sectionLabelSx = { fontSize: 13, fontWeight: 600, color: 'text.primary' };

// Picker options: the admin's meters plus any meter already on the card. A
// mapped meter missing from the slaves list must stay selectable, or saving
// would silently drop it from the formula. Duplicate names get their id
// appended so two meters called "Inlet" can be told apart.
const buildMeterOptions = (slaves, cardSlaveRoles) => {
	const nameById = new Map();
	slaves.forEach((slave) => {
		if (slave?.slave_id !== undefined && slave?.slave_id !== null) {
			nameById.set(slave.slave_id, slave.slave_name ?? slave.name ?? '');
		}
	});
	cardSlaveRoles.forEach((entry) => {
		if (!nameById.has(entry.slave_id)) {
			nameById.set(entry.slave_id, entry.slave_name ?? '');
		}
	});

	const nameCounts = new Map();
	nameById.forEach((name) =>
		nameCounts.set(name, (nameCounts.get(name) || 0) + 1)
	);

	return [...nameById.entries()]
		.map(([id, name]) => ({
			value: id,
			label: !name
				? `Meter #${id}`
				: nameCounts.get(name) > 1
				  ? `${name} (#${id})`
				  : name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
};

const MeterPicker = ({
	label,
	placeholder,
	selectedIds,
	options,
	labelById,
	onChange,
	loading,
	hasError,
	chipColor,
}) => (
	<Box flex={1} minWidth={0}>
		<CustomAutocomplete
			multiple
			label={label}
			placeholder={selectedIds.length ? '' : placeholder}
			options={options}
			value={selectedIds}
			onChange={(selected) => onChange(selected.map((option) => option.value))}
			loading={loading}
			error={hasError}
			// The field is 40px tall; the small size positions its label to match.
			size="small"
			noOptionsText={loading ? 'Loading meters…' : 'No meters left to pick'}
		/>
		{selectedIds.length > 0 && (
			<Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
				{selectedIds.map((id) => {
					const name = labelById.get(id) || `Meter #${id}`;
					return (
						<Chip
							key={id}
							size="small"
							variant="outlined"
							color={chipColor}
							label={name}
							onDelete={() => onChange(selectedIds.filter((x) => x !== id))}
							sx={{ maxWidth: '100%' }}
						/>
					);
				})}
			</Stack>
		)}
	</Box>
);

/**
 * Create or edit a FORMULA card: name, calculation and meters. Total Stations
 * cards have no formula and are only renamed inline in the list.
 *
 * `onSave(payload)` gets the request body (create) or only the changed fields
 * (edit), and the dialog shows the error if that promise rejects.
 */
const KpiCardFormDialog = ({
	open,
	onClose,
	card = null,
	slaves = [],
	slavesLoading = false,
	slavesError = null,
	onSave,
}) => {
	const isEdit = Boolean(card);
	const [name, setName] = useState('');
	const [calculationType, setCalculationType] = useState('SUM');
	const [addIds, setAddIds] = useState([]);
	const [subtractIds, setSubtractIds] = useState([]);
	const [showValidation, setShowValidation] = useState(false);
	const [serverError, setServerError] = useState(NO_SERVER_ERROR);
	const [saving, setSaving] = useState(false);

	// Reset when opened. Keyed on the card id, not the object: a background
	// refetch hands over a new object for the same card and must not wipe
	// edits in progress.
	useEffect(() => {
		if (!open) {
			return;
		}
		const { add, subtract } = splitSlaveRoles(card?.slave_roles || []);
		setName(card?.display_name || '');
		setCalculationType(card?.calculation_type || 'SUM');
		setAddIds(add.map((entry) => entry.slave_id));
		setSubtractIds(subtract.map((entry) => entry.slave_id));
		setShowValidation(false);
		setServerError(NO_SERVER_ERROR);
		setSaving(false);
	}, [open, card?.id]);

	const cardSlaveRoles = card?.slave_roles || NO_SLAVE_ROLES;
	const meterOptions = useMemo(
		() => buildMeterOptions(slaves, cardSlaveRoles),
		[slaves, cardSlaveRoles]
	);
	const labelById = useMemo(
		() => new Map(meterOptions.map((option) => [option.value, option.label])),
		[meterOptions]
	);

	const slaveRoles = buildSlaveRoles({
		addIds,
		subtractIds,
		previousRoles: cardSlaveRoles,
	});
	const formula = formatKpiFormula(
		slaveRoles,
		(entry) => labelById.get(entry.slave_id) || `Meter #${entry.slave_id}`
	);
	const calculation = getCalculationOption(calculationType);
	const unit = isEdit ? card.unit : calculation.unit;
	const validationErrors = validateKpiCardForm({ name, addIds });

	const nameError =
		(showValidation && validationErrors.name) || serverError.fieldErrors.name;
	const metersError =
		(showValidation && validationErrors.addIds) ||
		serverError.fieldErrors.slaveRoles;
	const calculationError = serverError.fieldErrors.calculationType;
	const alertMessage = [nameError, metersError, calculationError].includes(
		serverError.message
	)
		? null
		: serverError.message;

	const handleSubmit = async () => {
		setShowValidation(true);
		if (Object.keys(validationErrors).length > 0) {
			return;
		}

		const trimmedName = name.trim();
		let payload;

		if (isEdit) {
			payload = {};
			if (trimmedName !== card.display_name) {
				payload.display_name = trimmedName;
			}
			if (!isSameSlaveRoles(slaveRoles, cardSlaveRoles)) {
				payload.slave_roles = slaveRoles;
			}
			if (Object.keys(payload).length === 0) {
				onClose();
				return;
			}
		} else {
			payload = {
				display_name: trimmedName,
				calculation_type: calculationType,
				slave_roles: slaveRoles,
			};
		}

		setSaving(true);
		setServerError(NO_SERVER_ERROR);
		try {
			await onSave(payload);
		} catch (error) {
			setServerError(
				getKpiCardApiError(
					error,
					isEdit ? 'Could not save the card.' : 'Could not create the card.'
				)
			);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit card' : 'New card'}
			subtitle={
				isEdit
					? 'The dashboard picks up changes the next time it loads.'
					: 'Combine meters from any of your devices into one dashboard value.'
			}
			onSubmit={handleSubmit}
			submitLabel={isEdit ? 'Save changes' : 'Create card'}
			busyLabel={isEdit ? 'Saving…' : 'Creating…'}
			busy={saving}
		>
			<Stack gap={2.5}>
				{alertMessage && <Alert severity="error">{alertMessage}</Alert>}

				<CustomInput
					label="Card name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					error={nameError}
					helperText={nameError || 'Shown as the card title on the dashboard.'}
					size="small"
					autoFocus
					inputProps={{ maxLength: KPI_CARD_NAME_MAX_LENGTH }}
				/>

				<Box>
					<Typography sx={sectionLabelSx} mb={1}>
						Calculation
					</Typography>
					{isEdit ? (
						<Box
							sx={{
								p: 1.25,
								borderRadius: 2,
								border: '1px solid',
								borderColor: 'divider',
							}}
						>
							<Typography fontSize={13.5} fontWeight={600}>
								{calculation.label}
								<Typography
									component="span"
									fontSize={12}
									color="text.secondary"
									ml={0.75}
								>
									in {unit || calculation.unit}
								</Typography>
							</Typography>
							<Typography fontSize={12} color="text.secondary" mt={0.25}>
								{
									"Fixed once a card exists, because the card's unit is set from it. To use another calculation, create a new card."
								}
							</Typography>
						</Box>
					) : (
						<RadioGroup
							value={calculationType}
							onChange={(event) => setCalculationType(event.target.value)}
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
								gap: 1,
							}}
						>
							{CALCULATION_TYPE_OPTIONS.map((option) => {
								const selected = option.value === calculationType;
								return (
									<FormControlLabel
										key={option.value}
										value={option.value}
										control={<Radio size="small" />}
										label={
											<Box py={0.25}>
												<Typography fontSize={13.5} fontWeight={600}>
													{option.label}
													<Typography
														component="span"
														fontSize={11.5}
														color="text.secondary"
														ml={0.75}
													>
														{option.unit}
													</Typography>
												</Typography>
												<Typography fontSize={12} color="text.secondary">
													{option.description}
												</Typography>
											</Box>
										}
										sx={{
											m: 0,
											alignItems: 'flex-start',
											border: '1px solid',
											borderColor: selected ? 'primary.main' : 'divider',
											borderRadius: 2,
											p: 1,
											pr: 1.5,
											bgcolor: (theme) =>
												selected
													? alpha(theme.palette.primary.main, 0.06)
													: 'transparent',
											'& .MuiRadio-root': { p: 0.5, mr: 0.5 },
										}}
									/>
								);
							})}
						</RadioGroup>
					)}
					{calculationError && (
						<FormHelperText error sx={{ mx: 0 }}>
							{calculationError}
						</FormHelperText>
					)}
				</Box>

				<Box>
					<Typography sx={sectionLabelSx}>Meters</Typography>
					<Typography fontSize={12} color="text.secondary" mb={1.25}>
						Added meters are combined, then subtracted meters are taken away.
						Meters can come from different devices.
					</Typography>
					{slavesError && (
						<Alert severity="warning" sx={{ mb: 1.5 }}>
							{slavesError}
						</Alert>
					)}
					<Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
						<MeterPicker
							label="Add"
							placeholder="Pick meters"
							selectedIds={addIds}
							options={meterOptions.filter(
								(option) => !subtractIds.includes(option.value)
							)}
							labelById={labelById}
							onChange={setAddIds}
							loading={slavesLoading}
							hasError={Boolean(metersError)}
							chipColor="primary"
						/>
						<MeterPicker
							label="Subtract (optional)"
							placeholder="Pick meters"
							selectedIds={subtractIds}
							options={meterOptions.filter(
								(option) => !addIds.includes(option.value)
							)}
							labelById={labelById}
							onChange={setSubtractIds}
							loading={slavesLoading}
							chipColor="error"
						/>
					</Stack>
					{metersError && (
						<FormHelperText error sx={{ mx: 0, mt: 0.75 }}>
							{metersError}
						</FormHelperText>
					)}
				</Box>

				<Box
					sx={{
						p: 1.5,
						borderRadius: 2,
						bgcolor: 'surface.muted',
						border: '1px solid',
						borderColor: 'surface.mutedBorder',
					}}
				>
					<Typography
						fontSize={11}
						fontWeight={700}
						color="text.secondary"
						sx={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}
					>
						Dashboard value
					</Typography>
					<Typography
						fontSize={13.5}
						fontWeight={600}
						mt={0.5}
						sx={{ wordBreak: 'break-word' }}
						color={formula ? 'text.primary' : 'text.secondary'}
					>
						{formula || 'Pick meters to see the formula'}
					</Typography>
					<Typography fontSize={12} color="text.secondary" mt={0.25}>
						{calculation.label}, in {unit || calculation.unit}
					</Typography>
				</Box>
			</Stack>
		</FormDialog>
	);
};

export default KpiCardFormDialog;
