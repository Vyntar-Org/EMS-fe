import { useTheme } from '@mui/material';
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
			<span style={{ fontSize: '13px', color: theme.palette.text.primary }}>
				{value ?? '-'}
			</span>
		);
	}

	const isDark = theme.palette.mode === 'dark';
	const base =
		tone === 'neutral'
			? theme.palette.text.secondary
			: theme.palette[tone].main;

	return (
		<span
			style={{
				display: 'inline-block',
				padding: '2px 10px',
				borderRadius: '20px',
				fontSize: '11px',
				fontWeight: 600,
				backgroundColor: alpha(base, isDark ? 0.24 : 0.14),
				color: isDark ? lighten(base, 0.35) : darken(base, 0.3),
				letterSpacing: '0.02em',
			}}
		>
			{value}
		</span>
	);
};

export default StatusChips;
