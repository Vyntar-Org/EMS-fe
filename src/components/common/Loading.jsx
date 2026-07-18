import { Box, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Premium loader — dual ring (muted track + brand spinner) with a soft
 * gold pulse. All colors come from the theme so it works in both modes.
 */
export const Loading = ({ message = 'Loading...', fullScreen = false }) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: fullScreen ? '100vh' : '100%',
				width: '100%',
				flex: 1,
				gap: 2,
			}}
		>
			<Box
				sx={{
					position: 'relative',
					display: 'inline-flex',
					borderRadius: '50%',
					'@keyframes premiumPulse': {
						'0%': {
							boxShadow: (t) =>
								`0 0 0 0 ${alpha(t.palette.secondary.main, 0.35)}`,
						},
						'70%': {
							boxShadow: (t) =>
								`0 0 0 14px ${alpha(t.palette.secondary.main, 0)}`,
						},
						'100%': {
							boxShadow: (t) => `0 0 0 0 ${alpha(t.palette.secondary.main, 0)}`,
						},
					},
					animation: 'premiumPulse 1.8s ease-out infinite',
				}}
			>
				{/* Track ring */}
				<CircularProgress
					variant="determinate"
					value={100}
					size={52}
					thickness={3.5}
					sx={{ color: (t) => alpha(t.palette.primary.main, 0.15) }}
				/>
				{/* Spinner ring */}
				<CircularProgress
					size={52}
					thickness={3.5}
					disableShrink
					sx={{
						color: 'primary.main',
						position: 'absolute',
						left: 0,
						animationDuration: '900ms',
						'& .MuiCircularProgress-circle': {
							strokeLinecap: 'round',
						},
					}}
				/>
			</Box>
			<Typography
				variant="body2"
				sx={{
					color: 'text.secondary',
					fontWeight: 600,
					letterSpacing: '0.4px',
				}}
			>
				{message}
			</Typography>
		</Box>
	);
};
