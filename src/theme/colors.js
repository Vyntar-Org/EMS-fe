/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH for every color in the application.
 *
 *  Change a value here and it propagates through the MUI theme
 *  (src/theme/index.js) and every component that reads theme tokens.
 *  Do NOT hardcode hex values in components — add a token here instead.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Brand (mode-independent identity colors) ────────────────────────────
export const BRAND = {
	navy: '#003366', // primary — buttons, table headers, key accents
	navyHover: '#002952', // primary hover / pressed
	navyDeep: '#12233E', // header strip / sidebar deep navy
	navySoft: '#5D7A99', // disabled state of navy buttons

	gold: '#F5D547', // secondary — CTAs (Sign in, modal confirm)
	goldHover: '#E8C011', // secondary hover
	goldMuted: '#E3B13E', // subtle gold accents (tabs, beacons)
	goldDisabled: '#EBD48A', // disabled state of gold buttons

	danger: '#DC2626', // destructive actions (logout confirm)
	dangerHover: '#B91C1C',
};

// ── Light mode ──────────────────────────────────────────────────────────
export const LIGHT = {
	primary: {
		main: BRAND.navy,
		light: '#1A4D80',
		dark: BRAND.navyHover,
		contrastText: '#FFFFFF',
	},
	secondary: {
		main: BRAND.gold,
		light: '#F9E27E',
		dark: BRAND.goldHover,
		contrastText: '#1A1F36',
	},
	success: { main: '#16A34A' },
	warning: { main: '#EA580C' },
	error: { main: BRAND.danger },
	background: {
		default: '#F8FAFC',
		paper: '#FFFFFF',
	},
	text: {
		primary: '#1E293B',
		secondary: '#64748B',
		// Emphasis text on cards (KPI values/titles): brand navy in light,
		// switches to white in dark mode
		accent: BRAND.navy,
	},
	divider: '#E2E8F0',
	// Custom surface tokens (usable in sx as "surface.muted" etc.)
	surface: {
		muted: '#F8FAFC', // mild inset panels (analytics readout, wind panel)
		mutedBorder: '#EEF2F6',
		tableHead: '#F5F6F8', // small in-card table headers
		zebra: '#E7F3FF4A', // table row striping / pagination strip
		successTint: '#E8F5E9', // "online" / healthy status chip backgrounds
	},
	action: {
		hover: 'rgba(0, 0, 0, 0.04)',
	},
};

// ── Dark mode ───────────────────────────────────────────────────────────
export const DARK = {
	primary: {
		// Raw #003366 is too dark against dark surfaces — use a lifted navy for
		// interactive elements while BRAND.navy stays available via palette.brand
		main: '#2E6FCC',
		light: '#5B93E0',
		dark: '#1A4D80',
		contrastText: '#FFFFFF',
	},
	secondary: {
		main: BRAND.gold,
		light: '#F9E27E',
		dark: BRAND.goldHover,
		contrastText: '#1A1F36',
	},
	success: { main: '#4ADE80' },
	warning: { main: '#FB923C' },
	error: { main: '#F87171' },
	// "Mild" dark — lifted navy surfaces instead of near-black, softer contrast
	background: {
		default: '#131C31',
		paper: '#1D2845',
	},
	text: {
		primary: '#E8EDF5',
		secondary: '#9FACC2',
		// Emphasis text on cards — white in dark mode instead of blue
		accent: '#FFFFFF',
	},
	divider: 'rgba(255, 255, 255, 0.14)',
	surface: {
		muted: '#182238',
		mutedBorder: 'rgba(255, 255, 255, 0.10)',
		tableHead: '#25325A',
		zebra: 'rgba(255, 255, 255, 0.04)',
		successTint: 'rgba(74, 222, 128, 0.16)',
	},
	action: {
		hover: 'rgba(255, 255, 255, 0.08)',
	},
};

// ── Data-viz / accent tokens ────────────────────────────────────────────
// Curated KPI accent palette — vivid enough to color a card's gradient wash
// and icon chip, and readable on both light and dark surfaces. Consumed by
// CustomCard's hash-based per-title accent picker.
export const KPI_ACCENT_COLORS = [
	'#2563EB', // blue
	'#16A34A', // green
	'#E3B13E', // gold
	'#7C3AED', // purple
	'#0891B2', // teal
	'#EA580C', // orange
];

// Per-application semantic brand accent — one fixed color per app code, used
// wherever a machine card/chart needs to identify which app it belongs to
// (as opposed to KPI_ACCENT_COLORS' arbitrary per-title rotation).
export const APP_ACCENT_COLOR = {
	ENERGY: '#E3B13E',
	WATER: '#2E90E5',
	FUEL: '#EA580C',
	SOLAR: '#F5A524',
	STP: '#0891B2',
	TEMPERATURE: '#DC2626',
	'FIRE-SAFETY': '#DC2626',
	FLOWMETER: '#7C3AED',
	COMPRESSOR: '#16A34A',
};

// ── Elevation scale ─────────────────────────────────────────────────────
// Shared shadow tokens so every card/dialog/popover/menu derives its
// elevation from one place instead of hand-rolling rgba() strings per file.
// Each tuple is [light, dark].
export const ELEVATION = {
	sm: {
		light: '0 2px 8px rgba(15, 35, 62, 0.06)',
		dark: '0 2px 8px rgba(0, 0, 0, 0.3)',
	},
	md: {
		light: '0 4px 20px rgba(15, 35, 62, 0.08)',
		dark: '0 4px 20px rgba(0, 0, 0, 0.35)',
	},
	lg: {
		light: '0 12px 32px rgba(15, 35, 62, 0.12)',
		dark: '0 12px 32px rgba(0, 0, 0, 0.5)',
	},
	xl: {
		light: '0 24px 60px rgba(15, 35, 62, 0.18)',
		dark: '0 24px 60px rgba(0, 0, 0, 0.6)',
	},
};

export const getElevation = (level, mode) => ELEVATION[level][mode];

// ── Radius scale ────────────────────────────────────────────────────────
// One consistent corner-radius ramp for the whole app (px). Replaces the
// previous ad-hoc mix of 1/2/8/10/12/14/16/18/20 scattered across files.
export const RADIUS = {
	xs: 8, // chips, menu items, small inputs
	sm: 10, // buttons, inputs
	md: 12, // autocomplete/select popovers, standard cards
	lg: 14, // menus, popovers
	xl: 16, // cards, dialogs
	xxl: 18, // premium/KPI cards
};

// ── Spacing scale ───────────────────────────────────────────────────────
// One rhythm for every gap/padding/margin in the design system, expressed
// in MUI spacing units (× theme.spacing, 8px base) so `sx={{ p: SPACING.md }}`
// and `theme.spacing(SPACING.md)` agree. Replaces ad-hoc numbers (0.25, 0.75,
// 1.25, ...) scattered per component.
export const SPACING = {
	xs: 0.5, // 4px  — tight inline gaps (icon + adjacent glyph)
	sm: 1, // 8px  — within a text cluster (label → value)
	md: 1.5, // 12px — between related elements (header → value block)
	lg: 2, // 16px — card internal padding, section gaps
	xl: 3, // 24px — page-level gaps, between major sections
};

// ── Typography scale ────────────────────────────────────────────────────
// Every text role in the app maps to exactly one entry here. A given role
// (e.g. "a KPI value") always renders at the same size/weight everywhere,
// instead of each dashboard picking its own numbers.
export const TYPE_SCALE = {
	// PageHeader — top-of-page title
	pageTitle: { fontSize: '19px', fontWeight: 700 },
	// SectionHeader — groups content within a page
	sectionTitle: { fontSize: '15px', fontWeight: 700 },
	// Chart/graph card titles (CustomCard's standard header) — unchanged from
	// the design-system pass, kept here so it's documented alongside the rest
	chartCardTitle: { fontSize: '14.5px', fontWeight: 700 },
	// KPI card eyebrow label (small, uppercase, above the value — the value
	// is what should dominate, not the title)
	kpiLabel: {
		fontSize: '11px',
		fontWeight: 700,
		letterSpacing: '0.5px',
		textTransform: 'uppercase',
	},
	// KPI hero value — the single most prominent thing on the card
	kpiValue: { fontSize: '30px', fontWeight: 800, letterSpacing: '-0.3px' },
	kpiValueCompact: {
		fontSize: '22px',
		fontWeight: 800,
		letterSpacing: '-0.2px',
	},
	// Unit suffix next to/under a value — present but visually secondary
	unit: { fontSize: '13px', fontWeight: 600 },
	// Trend/analytics text inside a card's footer zone
	analytics: { fontSize: '12px', fontWeight: 600 },
	// Smallest supporting text (timestamps, secondary-metric chips)
	caption: { fontSize: '11px', fontWeight: 500 },
};

export const getPaletteForMode = (mode) => (mode === 'dark' ? DARK : LIGHT);
