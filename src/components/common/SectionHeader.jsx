import { Box, Stack, Typography } from '@mui/material';

/**
 * Small heading used to group content within a page/card grid (e.g. "Today's
 * Overview", "Trends"). Lighter-weight than PageHeader — no icon chip.
 */
const SectionHeader = ({ title, subtitle, actions, sx = {} }) => {
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			gap={1}
			sx={{ width: '100%', mb: 1, ...sx }}
		>
			<Box minWidth={0}>
				<Typography
					variant="subtitle1"
					sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '0.2px' }}
				>
					{title}
				</Typography>
				{subtitle && (
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						{subtitle}
					</Typography>
				)}
			</Box>
			{actions && (
				<Stack direction="row" alignItems="center" gap={1} flexShrink={0}>
					{actions}
				</Stack>
			)}
		</Stack>
	);
};

export default SectionHeader;
