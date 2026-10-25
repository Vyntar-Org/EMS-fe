import { alpha, Box, Typography } from '@mui/material';

/**
 * Weather/solar flavored loader — a pulsing "sun" core inside two
 * counter-rotating rings. Fully theme-driven (gold secondary + primary),
 * works in light and dark mode.
 */
const PremiumLoader = ({ message = 'Loading…', size = 88 }) => {
	return (
		<Box
			sx={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 2,
				py: 3,

				'@keyframes plSpin': {
					to: { transform: 'rotate(360deg)' },
				},
				'@keyframes plSpinRev': {
					to: { transform: 'rotate(-360deg)' },
				},
				'@keyframes plPulse': {
					'0%, 100%': { transform: 'scale(1)', opacity: 1 },
					'50%': { transform: 'scale(0.88)', opacity: 0.85 },
				},
				'@keyframes plDots': {
					'0%': { content: '""' },
					'25%': { content: '"."' },
					'50%': { content: '".."' },
					'75%': { content: '"..."' },
				},
			}}
		>
			<Box sx={{ position: 'relative', width: size, height: size }}>
				{/* Outer sweeping arc — brand gold */}
				<Box
					sx={{
						position: 'absolute',
						inset: 0,
						borderRadius: '50%',
						border: '3px solid transparent',
						borderTopColor: 'secondary.main',
						borderRightColor: 'secondary.main',
						animation: 'plSpin 1.1s linear infinite',
					}}
				/>

				{/* Inner dashed ring — primary, slow counter-rotation */}
				<Box
					sx={{
						position: 'absolute',
						inset: '10px',
						borderRadius: '50%',
						border: '2px dashed',
						borderColor: 'primary.main',
						opacity: 0.5,
						animation: 'plSpinRev 3.4s linear infinite',
					}}
				/>

				{/* Sun core */}
				<Box
					sx={{
						position: 'absolute',
						inset: '24px',
						borderRadius: '50%',
						background: (theme) =>
							`radial-gradient(circle at 35% 35%, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
						boxShadow: (theme) =>
							`0 0 20px 3px ${alpha(theme.palette.secondary.main, 0.45)}`,
						animation: 'plPulse 1.8s ease-in-out infinite',
					}}
				/>
			</Box>

			{message && (
				<Typography
					variant="body2"
					sx={{
						color: 'text.secondary',
						fontWeight: 600,
						letterSpacing: '0.04em',
						'&::after': {
							display: 'inline-block',
							width: '1.2em',
							textAlign: 'left',
							content: '""',
							animation: 'plDots 1.6s steps(1) infinite',
						},
					}}
				>
					{message}
				</Typography>
			)}
		</Box>
	);
};

export default PremiumLoader;
