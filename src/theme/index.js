import { alpha, createTheme } from '@mui/material/styles';

import { BRAND, RADIUS, getElevation, getPaletteForMode } from './colors';

/**
 * Build the app theme for a mode ('light' | 'dark') from the color tokens
 * in src/theme/colors.js — the single source of truth for every color.
 * All component styling below derives from those tokens; never hardcode
 * a hex here or in components.
 */
export const buildTheme = (mode) => {
	const palette = getPaletteForMode(mode);
	const isDark = mode === 'dark';

	return createTheme({
		palette: {
			mode,
			primary: palette.primary,
			secondary: palette.secondary,
			success: palette.success,
			warning: palette.warning,
			error: palette.error,
			background: palette.background,
			text: palette.text,
			divider: palette.divider,
			action: palette.action,
			// Custom tokens — usable in sx: "surface.muted", "brand.gold", ...
			surface: palette.surface,
			brand: BRAND,
		},
		shape: {
			borderRadius: 12,
		},
		typography: {
			fontFamily:
				'"Inter", "Roboto", "Helvetica", "Arial", system-ui, sans-serif',
			button: {
				textTransform: 'none',
				fontWeight: 600,
			},
			h6: { fontWeight: 700 },
			subtitle1: { fontWeight: 600 },
		},
		components: {
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundImage: 'none',
					},
				},
			},
			MuiCard: {
				styleOverrides: {
					root: {
						borderRadius: RADIUS.xl,
						border: `1px solid ${palette.divider}`,
						boxShadow: getElevation('md', mode),
					},
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: {
						borderRadius: RADIUS.xl,
						border: `1px solid ${palette.divider}`,
						boxShadow: getElevation('xl', mode),
					},
				},
			},
			MuiPopover: {
				styleOverrides: {
					paper: {
						borderRadius: RADIUS.lg,
						border: `1px solid ${palette.divider}`,
						boxShadow: getElevation('lg', mode),
					},
				},
			},
			MuiMenu: {
				styleOverrides: {
					paper: {
						borderRadius: RADIUS.lg,
						border: `1px solid ${palette.divider}`,
					},
					list: {
						padding: 6,
					},
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					root: {
						borderRadius: RADIUS.xs,
						margin: '1px 2px',
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					root: {
						borderRadius: RADIUS.sm,
						fontWeight: 600,
						transition: 'all 0.25s ease',
					},
					contained: {
						boxShadow: 'none',
						'&:hover': {
							transform: 'translateY(-1px)',
							boxShadow: `0 6px 16px ${alpha(palette.primary.main, 0.35)}`,
						},
						'&:active': {
							transform: 'translateY(0)',
						},
					},
					containedSecondary: {
						'&:hover': {
							boxShadow: `0 6px 16px ${alpha(palette.secondary.main, 0.4)}`,
						},
					},
					outlined: {
						'&:hover': {
							backgroundColor: alpha(palette.primary.main, 0.06),
							transform: 'translateY(-1px)',
						},
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						transition: 'all 0.2s ease',
					},
				},
			},
			MuiBackdrop: {
				styleOverrides: {
					root: {
						// Frosted backdrop behind modals/drawers (never blur the
						// invisible backdrops used by popovers/menus)
						'&:not(.MuiBackdrop-invisible)': {
							backdropFilter: 'blur(5px)',
							backgroundColor: isDark
								? 'rgba(6, 10, 20, 0.6)'
								: 'rgba(15, 35, 62, 0.35)',
						},
					},
				},
			},
			MuiLinearProgress: {
				styleOverrides: {
					root: {
						borderRadius: 99,
						backgroundColor: alpha(palette.primary.main, isDark ? 0.2 : 0.1),
					},
					bar: {
						borderRadius: 99,
					},
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						borderRadius: RADIUS.sm,
						backgroundColor: palette.background.paper,
						transition: 'box-shadow 0.2s ease',
						'& .MuiOutlinedInput-notchedOutline': {
							borderColor: palette.divider,
							transition: 'border-color 0.2s ease',
						},
						'&:hover .MuiOutlinedInput-notchedOutline': {
							borderColor: palette.primary.main,
						},
						'&.Mui-focused': {
							boxShadow: `0 0 0 3px ${alpha(palette.primary.main, 0.15)}`,
						},
						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: palette.primary.main,
							borderWidth: 1.5,
						},
					},
					input: {
						color: palette.text.primary,
						'&::placeholder': {
							color: palette.text.secondary,
							opacity: 1,
						},
					},
				},
			},
			MuiInputLabel: {
				styleOverrides: {
					root: {
						color: palette.text.secondary,
						'&.Mui-focused': {
							color: palette.primary.main,
						},
					},
				},
			},
			MuiSvgIcon: {
				styleOverrides: {
					root: {
						'&.MuiSelect-icon': {
							color: palette.text.secondary,
						},
					},
				},
			},
			MuiAutocomplete: {
				styleOverrides: {
					paper: {
						borderRadius: RADIUS.md,
						border: `1px solid ${palette.divider}`,
						boxShadow: getElevation('lg', mode),
					},
					option: {
						borderRadius: RADIUS.xs,
						margin: '1px 4px',
						'&[aria-selected="true"]': {
							backgroundColor: alpha(palette.secondary.main, 0.18),
						},
					},
					tag: {
						backgroundColor: alpha(palette.primary.main, isDark ? 0.25 : 0.08),
						color: palette.text.primary,
					},
				},
			},
			MuiTableCell: {
				styleOverrides: {
					root: {
						color: palette.text.primary,
					},
					head: {
						fontWeight: 700,
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						fontWeight: 600,
						borderRadius: RADIUS.xs,
						transition: 'all 0.2s ease',
					},
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: {
						backgroundColor: isDark
							? palette.surface.tableHead
							: BRAND.navyDeep,
						color: '#FFFFFF',
						fontSize: '12px',
						fontWeight: 500,
						padding: '8px 12px',
						borderRadius: `${RADIUS.xs}px`,
						boxShadow: getElevation('sm', mode),
						border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
					},
					arrow: {
						color: isDark ? palette.surface.tableHead : BRAND.navyDeep,
					},
				},
			},
			MuiSkeleton: {
				styleOverrides: {
					root: {
						backgroundColor: isDark
							? palette.surface.muted
							: alpha(BRAND.navy, 0.06),
						borderRadius: 8,
						'&::after': {
							background: isDark
								? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
								: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
						},
					},
				},
				defaultProps: {
					animation: 'wave',
				},
			},
		},
	});
};

// Backwards-compatible static theme (light) for non-reactive imports.
export const theme = buildTheme('light');
