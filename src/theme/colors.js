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

// ── Data-viz ────────────────────────────────────────────────────────────
// Categorical series palette for multi-parameter charts (works on both modes)
export const CHART_SERIES_COLORS = [
	'#2563EB',
	'#B91C1C',
	'#D97706',
	'#15803D',
	'#9333EA',
	'#0891B2',
	'#C2410C',
	'#4338CA',
];

export const getPaletteForMode = (mode) => (mode === 'dark' ? DARK : LIGHT);
