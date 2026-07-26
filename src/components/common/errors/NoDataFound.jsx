import { QueryStatsRounded } from '@mui/icons-material';
import { Box, Typography, alpha } from '@mui/material';

// Theme-matched empty state — a soft icon chip (same "gradient wash" chip
// language CustomCard uses for its title icons) instead of a cartoon-style
// gif with a baked-in white background, which read as cheap/inconsistent on
// a dark premium dashboard, especially in sparse no-data screens where it's
// the only thing on screen.
const NoDataFound = ({
	message = 'Nothing to show here yet — adjust your selections above',
	icon,
}) => {
	return (
		<Box
			width="100%"
			height="100%"
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			gap={1.25}
		>
			{icon || (
				<Box
					sx={{
						width: 56,
						height: 56,
						borderRadius: '16px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: (t) =>
							`linear-gradient(135deg, ${alpha(
								t.palette.text.secondary,
								t.palette.mode === 'dark' ? 0.18 : 0.1
							)} 0%, ${alpha(
								t.palette.text.secondary,
								t.palette.mode === 'dark' ? 0.06 : 0.04
							)} 100%)`,
						boxShadow: (t) =>
							`0 0 0 1px ${alpha(t.palette.text.secondary, 0.14)}`,
					}}
				>
					<QueryStatsRounded
						sx={{ fontSize: 28, color: 'text.secondary', opacity: 0.7 }}
					/>
				</Box>
			)}
			<Typography
				textAlign="center"
				sx={{
					fontSize: '0.85rem',
					fontWeight: 600,
					color: 'text.secondary',
					letterSpacing: '0.2px',
					px: 2,
				}}
			>
				{message}
			</Typography>
		</Box>
	);
};

export default NoDataFound;
