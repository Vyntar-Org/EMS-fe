// Pure helpers for the Water dashboard's admin-managed KPI cards. No imports
// on purpose, so this logic stays easy to test in isolation. API calls live in
// waterKpiCardsApi.js. The server rules mirrored here come from the backend's
// apps/applications/water/apis/kpi_cards.py.

export const MAX_ACTIVE_KPI_CARDS = 8;
export const KPI_CARD_NAME_MAX_LENGTH = 100;

// The dashboard shows the first 4 active cards as large tiles in its top row
// and the rest (up to 4) as compact tiles beside the consumption chart.
export const KPI_TOP_ROW_SLOTS = 4;

export const KPI_CARD_TYPE = Object.freeze({
	FORMULA: 'FORMULA',
	STATION_COUNT: 'STATION_COUNT',
});

// The backend has six slave roles, but only SUBTRACT changes the math: it
// deducts, and every other role adds. The UI exposes just "Add" and
// "Subtract". A newly added meter gets TOTALISER, and a meter that already
// had another adding role (e.g. a preset's MAIN) keeps it.
export const ADD_ROLE = 'TOTALISER';
export const SUBTRACT_ROLE = 'SUBTRACT';

// `unit` is what the backend assigns when a card is created. It can't be
// changed afterwards, which is why the calculation is fixed once a card exists.
export const CALCULATION_TYPE_OPTIONS = [
	{
		value: 'SUM',
		label: 'Total consumption',
		shortLabel: 'Total',
		description: 'Water each meter measured this shift, from its totaliser.',
		unit: 'KLD',
	},
	{
		value: 'AVG',
		label: 'Average flow rate',
		shortLabel: 'Avg flow',
		description: "Each meter's average flow rate over the shift.",
		unit: 'm3/hr',
	},
	{
		value: 'MAX',
		label: 'Peak flow rate',
		shortLabel: 'Peak flow',
		description: "Each meter's highest flow rate over the shift.",
		unit: 'm3/hr',
	},
	{
		value: 'MIN',
		label: 'Lowest flow rate',
		shortLabel: 'Min flow',
		description: "Each meter's lowest flow rate over the shift.",
		unit: 'm3/hr',
	},
];

export const getCalculationOption = (value) =>
	CALCULATION_TYPE_OPTIONS.find((option) => option.value === value) ||
	CALCULATION_TYPE_OPTIONS[0];

export const sortKpiCards = (cards = []) =>
	[...cards].sort(
		(a, b) =>
			(Number(a.display_order) || 0) - (Number(b.display_order) || 0) ||
			a.id - b.id
	);

export const countActiveKpiCards = (cards = []) =>
	cards.filter((card) => card.is_active).length;

export const hasStationCountCard = (cards = []) =>
	cards.some((card) => card.card_type === KPI_CARD_TYPE.STATION_COUNT);

// A card created without display_order lands at 0, i.e. first on the
// dashboard, so new cards are sent with the next free position instead.
export const getNextDisplayOrder = (cards = []) =>
	cards.reduce(
		(highest, card) => Math.max(highest, Number(card.display_order) || 0),
		0
	) + 1;

// Where each active card lands on the dashboard: a 1-based slot plus the area
// it renders in. Inactive cards get no slot.
export const getDashboardSlots = (orderedCards = []) => {
	const slots = new Map();
	let slot = 0;
	orderedCards.forEach((card) => {
		if (!card.is_active) {
			return;
		}
		slot += 1;
		slots.set(card.id, {
			slot,
			area:
				slot <= KPI_TOP_ROW_SLOTS
					? 'Top row'
					: slot <= MAX_ACTIVE_KPI_CARDS
					  ? 'Side column'
					  : 'Not shown',
		});
	});
	return slots;
};

export const moveItem = (items, fromIndex, toIndex) => {
	if (
		fromIndex === toIndex ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= items.length ||
		toIndex >= items.length
	) {
		return items;
	}
	const next = [...items];
	const [moved] = next.splice(fromIndex, 1);
	next.splice(toIndex, 0, moved);
	return next;
};

// Drag and drop: dropping on the top half (after = false) or bottom half
// (after = true) of the row at `overIndex`. Returns the index the dragged card
// moves to, for moveItem. Equal to `fromIndex` means the drop changes nothing.
export const getDropTargetIndex = (fromIndex, overIndex, after) => {
	const target = after ? overIndex + 1 : overIndex;
	return fromIndex < target ? target - 1 : target;
};

// Renumbers the list 1..N and returns only the cards whose display_order
// actually changes, so a move costs the fewest PATCH calls. Renumbering the
// whole list also repairs ties left by cards created at the same position.
export const planReorder = (orderedCards = []) =>
	orderedCards
		.map((card, index) => ({
			id: card.id,
			display_order: index + 1,
			changed: Number(card.display_order) !== index + 1,
		}))
		.filter((entry) => entry.changed)
		.map(({ id, display_order }) => ({ id, display_order }));

export const getSlaveDisplayName = (entry) =>
	entry?.slave_name || `Meter #${entry?.slave_id}`;

export const splitSlaveRoles = (slaveRoles = []) => ({
	add: slaveRoles.filter((entry) => entry.role !== SUBTRACT_ROLE),
	subtract: slaveRoles.filter((entry) => entry.role === SUBTRACT_ROLE),
});

export const buildSlaveRoles = ({
	addIds = [],
	subtractIds = [],
	previousRoles = [],
}) => {
	const keptAddRole = new Map(
		previousRoles
			.filter((entry) => entry.role !== SUBTRACT_ROLE)
			.map((entry) => [entry.slave_id, entry.role])
	);

	return [
		...addIds.map((slaveId) => ({
			slave_id: slaveId,
			role: keptAddRole.get(slaveId) || ADD_ROLE,
		})),
		...subtractIds.map((slaveId) => ({
			slave_id: slaveId,
			role: SUBTRACT_ROLE,
		})),
	];
};

// Compares two mappings as sets of {slave_id, role}, ignoring order. A PATCH
// with slave_roles replaces the whole mapping, so it is only sent when the
// mapping really changed.
export const isSameSlaveRoles = (a = [], b = []) => {
	const toKey = (list) =>
		list
			.map((entry) => `${entry.slave_id}:${entry.role}`)
			.sort()
			.join('|');
	return toKey(a) === toKey(b);
};

// "Inlet A + Inlet B − Meter C"
export const formatKpiFormula = (
	slaveRoles = [],
	getName = getSlaveDisplayName
) => {
	const { add, subtract } = splitSlaveRoles(slaveRoles);
	const added = add.map(getName).join(' + ');
	const subtracted = subtract.map((entry) => `− ${getName(entry)}`).join(' ');
	return [added, subtracted].filter(Boolean).join(' ');
};

// Mirrors the server's checks for instant feedback. The server still has the
// final say (meter ownership, the 8-card cap).
export const validateKpiCardForm = ({ name = '', addIds = [] }) => {
	const errors = {};
	const trimmedName = name.trim();

	if (!trimmedName) {
		errors.name = 'Enter a card name.';
	} else if (trimmedName.length > KPI_CARD_NAME_MAX_LENGTH) {
		errors.name = `Use ${KPI_CARD_NAME_MAX_LENGTH} characters or fewer.`;
	}

	if (addIds.length === 0) {
		errors.addIds = 'Pick at least one meter to add.';
	}

	return errors;
};

const firstMessage = (value) =>
	Array.isArray(value) ? value.filter(Boolean).join(' ') : value;

// Turns a rejected api.* call ({ status, data }) into a message for the user,
// plus per-field messages for the form. The backend sends
// { message, errors: { display_name | calculation_type | slave_roles | detail } }.
// A DRF permission failure sends a top-level { detail } instead.
export const getKpiCardApiError = (error, fallback) => {
	const status = error?.status;
	const data = error?.data || {};
	const errors =
		data.errors && typeof data.errors === 'object' ? data.errors : {};

	const fieldErrors = {
		name: firstMessage(errors.display_name) || null,
		calculationType: firstMessage(errors.calculation_type) || null,
		slaveRoles: firstMessage(errors.slave_roles) || null,
	};

	let message =
		firstMessage(errors.detail) ||
		firstMessage(data.detail) ||
		fieldErrors.name ||
		fieldErrors.calculationType ||
		fieldErrors.slaveRoles ||
		firstMessage(errors.card_type) ||
		firstMessage(errors.display_order) ||
		(typeof data.message === 'string' ? data.message : null);

	if (status === 403) {
		message = 'Only administrators can change the dashboard cards.';
	} else if (status === 404) {
		message = 'That card no longer exists. The list has been refreshed.';
	} else if (!status && !message) {
		message =
			'Could not reach the server. Check your connection and try again.';
	}

	return {
		status,
		message: message || fallback,
		fieldErrors,
	};
};

// The pre-dynamic-cards backend returned fixed keys instead of `cards`. This
// maps that shape to cards in the order the old dashboard showed them, so the
// dashboard works against either backend version. Remove it once every
// environment runs the dynamic-cards backend.
const LEGACY_OVERVIEW_KEYS = [
	['raw_water_inlet', 'RAW_WATER_INLET', 'Raw Water Inlet'],
	['raw_water_outlet', 'RAW_WATER_OUTLET', 'Raw Water Outlet'],
	['filter_water_outlet', 'FILTER_WATER_OUTLET', 'Filter Water Outlet'],
	['water_positivity', 'WATER_POSITIVITY', 'Water Positivity'],
	['sewage_inlet', 'SEWAGE_INLET', 'Sewage Inlet'],
	['sewage_outlet', 'SEWAGE_OUTLET', 'Sewage Outlet'],
	['drinking_ro', 'DRINKING_RO', 'Drinking RO'],
];

// The `cards` from GET /water/dashboard-overview/, in the order given (the
// server applies display_order), capped at the dashboard's 8 slots.
export const getOverviewCards = (overview) => {
	if (Array.isArray(overview?.cards)) {
		return overview.cards.slice(0, MAX_ACTIVE_KPI_CARDS);
	}
	if (!overview || typeof overview !== 'object') {
		return [];
	}

	const cards = LEGACY_OVERVIEW_KEYS.filter(([key]) => overview[key]).map(
		([key, code, title]) => ({
			id: code,
			code,
			title,
			unit: 'KLD',
			card_type: KPI_CARD_TYPE.FORMULA,
			calculation_type: 'SUM',
			current: overview[key]?.current ?? null,
			previous: overview[key]?.previous ?? null,
		})
	);

	if (
		overview.total_stations !== undefined &&
		overview.total_stations !== null
	) {
		cards.push({
			id: 'TOTAL_STATIONS',
			code: 'TOTAL_STATIONS',
			title: 'Total Stations',
			unit: '',
			card_type: KPI_CARD_TYPE.STATION_COUNT,
			calculation_type: 'SUM',
			current: overview.total_stations,
			previous: null,
		});
	}

	return cards;
};
