import React from 'react';
import {
	Card,
	CardContent,
	Box,
	Typography,
	alpha,
	styled,
} from '@mui/material';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

// Curated KPI accent palette — vivid enough to color the wash and icon
// chip, and readable on both light and dark surfaces.
const ACCENT_PALETTE = [
	'#2563EB', // blue
	'#16A34A', // green
	'#E3B13E', // gold
	'#7C3AED', // purple
	'#0891B2', // teal
	'#EA580C', // orange
];

// Stable accent per card: same title always yields the same color, so the
// dashboard reads as a colorful KPI grid without any caller changes.
const accentFromTitle = (title) => {
	if (!title) {
		return null;
	}
	const s = String(title);
	let h = 0;
	for (let i = 0; i < s.length; i += 1) {
		h = (h + s.charCodeAt(i) * (i + 1)) % 997;
	}
	return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
};

const StyledCard = styled(Card)(({ theme, accentcolor }) => {
	const accent = accentcolor || theme.palette.brand.goldMuted;
	const isDark = theme.palette.mode === 'dark';

	return {
		position: 'relative',
		overflow: 'hidden',
		borderRadius: '18px',
		// KPI-style accent wash flowing into the theme surface
		background: `linear-gradient(155deg, ${alpha(
			accent,
			isDark ? 0.22 : 0.13
		)} 0%, ${theme.palette.background.paper} 62%)`,
		transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		border: `1px solid ${alpha(accent, isDark ? 0.34 : 0.26)}`,
		// Layered elevation: tight key shadow + wide soft ambient + a subtle
		// inner top highlight for a glass finish
		boxShadow: isDark
			? `inset 0 1px 0 ${alpha('#FFFFFF', 0.06)}, 0 2px 6px ${alpha(
					'#000',
					0.3
			  )}, 0 12px 32px ${alpha('#000', 0.28)}`
			: `inset 0 1px 0 ${alpha('#FFFFFF', 0.9)}, 0 1px 3px ${alpha(
					'#0F233E',
					0.06
			  )}, 0 10px 28px ${alpha('#0F233E', 0.07)}`,
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
			boxShadow: isDark
				? `inset 0 1px 0 ${alpha('#FFFFFF', 0.08)}, 0 4px 10px ${alpha(
						'#000',
						0.35
				  )}, 0 18px 44px ${alpha(accent, 0.3)}`
				: `inset 0 1px 0 ${alpha('#FFFFFF', 0.95)}, 0 4px 10px ${alpha(
						'#0F233E',
						0.08
				  )}, 0 18px 44px ${alpha(accent, 0.22)}`,
			// '&::after': {
			// 	transform: 'scale(1.35)',
			// },
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
	titleIcon,
	childrenOtherProps = {},
	...props
}) => {
	const accent = accentColor || accentFromTitle(title);

	return (
		<StyledCard accentcolor={accent} {...props}>
			<CardContent sx={{ p: '8px !important', height: '100%' }}>
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
								fontSize: 36,
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
								// transition: 'transform 0.3s ease',
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
							// '.MuiCard-root:hover & > svg, .MuiCard-root:hover & .MuiSvgIcon-root':
							// 	{
							// 		transform: 'scale(1.08)',
							// 	},
						}}
						width="100%"
					>
						{title && (
							<Box
								sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
								width="100%"
							>
								{titleIcon && titleIcon}

								<Box width={titleIcon ? 'calc(100% - 36px - 8px)' : '100%'}>
									<ResponsiveTextWrapper
										value={title}
										sx={{ color: 'text.primary', letterSpacing: '0.2px' }}
										fontWeight={700}
									/>
								</Box>

								{/* <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#0A223E",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography> */}
							</Box>
						)}
						{subtitle && (
							<Typography
								variant="caption"
								sx={{ color: 'text.secondary', fontWeight: 500 }}
							>
								{subtitle}
							</Typography>
						)}
						{icon && icon}
					</Box>
				)}

				<Box
					height={`calc(100% ${
						title || subtitle || icon ? '- 14px - 18px' : ''
					}  )`}
					overflow="auto"
					{...childrenOtherProps}
				>
					{children}
				</Box>
			</CardContent>
		</StyledCard>
	);
};

export default CustomCard;
