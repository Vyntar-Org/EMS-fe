import { Box } from '@mui/material';
import { layoutBackgroundSx } from '../../helpers/layoutImages';

// One local page surface; unrelated application layouts pass through unchanged.
export default function WaterMonitorPage({ appCode, children }) {
	if (appCode !== 'WATER_MONITOR') return children;
	return (
		<Box
			className="wm-page"
			sx={(theme) => ({
				height: '100%',
				minHeight: 0,
				minWidth: 0,
				boxSizing: 'border-box',
				overflow: 'auto',
				p: 1,
				bgcolor: 'background.default',
				color: 'text.primary',
				typography: 'body2',
				...layoutBackgroundSx('main', appCode, theme.palette.mode),
			})}
		>
			{children}
		</Box>
	);
}
