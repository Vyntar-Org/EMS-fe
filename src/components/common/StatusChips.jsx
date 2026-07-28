import { Box, useTheme } from '@mui/material';
import { alpha, darken, lighten } from '@mui/material/styles';

// Semantic tone per status value — resolved against the active theme
// palette so chips stay readable in both light and dark modes.
const STATUS_TONE = {
	// level values
	FULL: 'success',
	LOW: 'warning',
	EMPTY: 'error',
	MEDIUM: 'primary',

	// motor / status values
	ON: 'success',
	OFF: 'error',
	RUNNING: 'success',
	STOPPED: 'error',
	IDLE: 'neutral',
	FAULT: 'error',
	ACTIVE: 'success',
	INACTIVE: 'neutral',
};

const StatusChips = ({ value }) => {
	const theme = useTheme();
	const tone = STATUS_TONE[String(value).toUpperCase()];

	if (!tone) {
		return (
			<Box component="span" sx={{ fontSize: '13px', color: 'text.primary' }}>
				{value ?? '-'}
			</Box>
		);
	}

	const isDark = theme.palette.mode === 'dark';
	const base =
		tone === 'neutral'
			? theme.palette.text.secondary
			: theme.palette[tone].main;

	return (
		<Box
			component="span"
			sx={{
				display: 'inline-block',
				px: 1.25,
				py: 0.25,
				borderRadius: '999px',
				fontSize: '11px',
				fontWeight: 600,
				backgroundColor: alpha(base, isDark ? 0.24 : 0.14),
				color: isDark ? lighten(base, 0.35) : darken(base, 0.3),
				letterSpacing: '0.02em',
			}}
		>
			{value}
		</Box>
	);
};

export default StatusChips;
export const StatusBadge = StatusChips;
