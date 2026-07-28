import {
	Card,
	CardContent,
	Box,
	Typography,
	alpha,
	styled,
} from '@mui/material';
import React from 'react';

import { KPI_ACCENT_COLORS, RADIUS, getElevation } from '../../theme/colors';

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

// Stable accent per card: same title always yields the same color, so the
// dashboard reads as a colorful KPI grid without any caller changes.
export const accentFromTitle = (title) => {
	if (!title) {
		return null;
	}
	const s = String(title);
	let h = 0;
	for (let i = 0; i < s.length; i += 1) {
		h = (h + s.charCodeAt(i) * (i + 1)) % 997;
	}
	return KPI_ACCENT_COLORS[h % KPI_ACCENT_COLORS.length];
};

// KPI cards (a single stat/value tile, e.g. Today/Yesterday, Total-style
// cards) stay a plain, theme-neutral surface — no gradient, no colored
// border, no glow, per an explicit product call: those tiles read best flat.
// Every other card (charts, trends, quality grids, maps, ...) keeps the
// colorful accent-wash "premium" look. Callers opt into the flat look with
// `flat`; `accent` still drives the header's icon chip either way, since
// color is reserved for values/icons/charts, never denied outright.
const StyledCard = styled(Card, {
	shouldForwardProp: (prop) => prop !== 'accentcolor' && prop !== 'flat',
})(({ theme, accentcolor, flat }) => {
	const isDark = theme.palette.mode === 'dark';

	const mode = isDark ? 'dark' : 'light';
	const accent = accentcolor || theme.palette.brand.goldMuted;

	if (flat) {
		return {
			position: 'relative',
			borderRadius: `${RADIUS.xxl}px`,
			background: theme.palette.background.paper,
			transition:
				'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
			border: `1px solid ${theme.palette.divider}`,
			// Deeper idle shadow than a truly "flat" surface — cards should read
			// as gently elevated even before interaction.
			boxShadow: `inset 0 1px 0 ${alpha(
				'#FFFFFF',
				isDark ? 0.05 : 0.9
			)}, ${getElevation('md', mode)}`,
			'&:hover': {
				// transform: 'translateY(-3px)',
				borderColor: alpha(accent, isDark ? 0.5 : 0.4),
				// Richer on hover: inner highlight + a soft accent-tinted ring +
				// a wider ambient shadow for real lift, not just a color change.
				boxShadow: `inset 0 1px 0 ${alpha(
					'#FFFFFF',
					isDark ? 0.07 : 0.95
				)}, 0 0 0 1px ${alpha(accent, isDark ? 0.28 : 0.18)}, ${getElevation(
					'lg',
					mode
				)}`,
				'& > .MuiCardContent-root > div:first-of-type > svg, & > .MuiCardContent-root > div:first-of-type .MuiSvgIcon-root':
					{
						transform: 'scale(1.06)',
					},
			},
			height: '100%',
		};
	}

	return {
		position: 'relative',
		overflow: 'hidden',
		borderRadius: `${RADIUS.xxl}px`,
		// KPI-style accent wash flowing into the theme surface
		background: `linear-gradient(155deg, ${alpha(
			accent,
			isDark ? 0.22 : 0.13
		)} 0%, ${theme.palette.background.paper} 62%)`,
		transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		border: `2px solid ${alpha(accent, isDark ? 0.34 : 0.26)}`,
		// Layered elevation: tight key shadow + a subtle inner top highlight
		// for a glass finish
		boxShadow: `inset 0 1px 0 ${alpha(
			'#FFFFFF',
			isDark ? 0.06 : 0.9
		)}, ${getElevation('md', mode)}`,
		// Soft accent glow in the bottom-right corner for depth
		'&::after': {
			content: '""',
			position: 'absolute',
			right: -50,
			bottom: -50,
			width: 160,
			height: 160,
			borderRadius: '50%',
			background: `radial-gradient(circle, ${alpha(
				accent,
				isDark ? 0.16 : 0.1
			)} 0%, transparent 70%)`,
			pointerEvents: 'none',
			transition: 'transform 0.4s ease',
		},
		'&:hover': {
			// transform: 'translateY(-3px)',
			borderColor: alpha(accent, isDark ? 0.6 : 0.5),
			boxShadow: `inset 0 1px 0 ${alpha(
				'#FFFFFF',
				isDark ? 0.08 : 0.95
			)}, ${getElevation('sm', mode)}, 0 18px 44px ${alpha(
				accent,
				isDark ? 0.3 : 0.22
			)}`,
			'&::after': {
				transform: 'scale(1.35)',
			},
			'& > .MuiCardContent-root > div:first-of-type > svg, & > .MuiCardContent-root > div:first-of-type .MuiSvgIcon-root':
				{
					transform: 'scale(1.06)',
				},
		},
		height: '100%',
	};
});

const CustomCard = ({
	title,
	subtitle,
	icon,
	children,
	isPremium = false,
	accentColor,
	flat = false,
	titleIcon,
	childrenOtherProps = {},
	disableContentPadding = false,
	...props
}) => {
	const accent = accentColor || accentFromTitle(title);

	return (
		<StyledCard accentcolor={accent} flat={flat} {...props}>
			<CardContent
				sx={{
					p: disableContentPadding ? '0px !important' : '8px !important',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{(title || subtitle || icon) && (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
							mb: 1,
							// KPI look: large icons in a gradient accent chip with a
							// soft ring; the chip lifts slightly when the card hovers
							'& > svg, & .MuiSvgIcon-root': {
								fontSize: 50,
								padding: '6px',
								borderRadius: '12px',
								// Dark mode: white icons on the tinted chip read better
								// than accent-colored (e.g. violet) glyphs
								color: (t) =>
									t.palette.mode === 'dark'
										? '#FFFFFF'
										: accent || t.palette.primary.main,
								flexShrink: 0,
								background: (t) => {
									const a = accent || t.palette.primary.main;
									const strong = t.palette.mode === 'dark' ? 0.28 : 0.18;
									const soft = t.palette.mode === 'dark' ? 0.1 : 0.06;
									return `linear-gradient(135deg, ${alpha(
										a,
										strong
									)} 0%, ${alpha(a, soft)} 100%)`;
								},
								boxShadow: (t) =>
									`0 0 0 1px ${alpha(
										accent || t.palette.primary.main,
										t.palette.mode === 'dark' ? 0.35 : 0.22
									)}`,
								transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
							},
							// Icons inside interactive controls (toggles, buttons)
							// keep their own styling — no accent chip
							'& button .MuiSvgIcon-root, & .MuiToggleButton-root .MuiSvgIcon-root':
								{
									background: 'none',
									boxShadow: 'none',
									padding: 0,
									borderRadius: 0,
									fontSize: 20,
									color: 'inherit',
								},
						}}
						width="100%"
						minWidth={0}
						flexShrink={0}
					>
						{title && (
							<Box
								sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
								minWidth={0}
								flex={1}
							>
								{titleIcon && titleIcon}

								{/* `minWidth: 0` is what actually lets a flex child shrink
								    below its text's natural width — without it the title can
								    only overflow or wrap instead of the ellipsis
								    ResponsiveTextWrapper is meant to show. */}
								<Box minWidth={0} flex={1}>
									<ResponsiveTextWrapper
										value={title}
										color="text.primary"
										letterSpacing="0.2px"
										fontWeight={700}
										fontSize={{ xs: '13px', md: '14.5px' }}
									/>
								</Box>
							</Box>
						)}
						{subtitle && (
							<Typography
								variant="caption"
								sx={{ color: 'text.secondary', fontWeight: 500, flexShrink: 0 }}
							>
								{subtitle}
							</Typography>
						)}
						{icon && <Box flexShrink={0}>{icon}</Box>}
					</Box>
				)}

				{/* `visible`, not `auto` — an internal scrollbar inside a
				    dashboard card reads as broken; the card should size to fit
				    its content instead of scrolling it. Callers with content
				    that must scroll (e.g. a data table) opt back in via
				    `childrenOtherProps={{ overflow: 'auto' }}`. */}
				<Box flex={1} minHeight={0} overflow="visible" {...childrenOtherProps}>
					{children}
				</Box>
			</CardContent>
		</StyledCard>
	);
};

export default CustomCard;
