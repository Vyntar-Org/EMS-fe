import { Box, Typography } from '@mui/material';

import { ANALYTICS_LOGIC } from '../../../constants/weatherStationDashboard';
import DashboardCard from './DashboardCard';

function AnalyticsLogic() {
	return (
		<DashboardCard title="Recommended Analytics Logic">
			<Box
				component="ul"
				sx={{
					m: 0,
					p: 0,
					listStyle: 'none',
					fontSize: '0.78rem',
					lineHeight: 1.55,
				}}
			>
				{ANALYTICS_LOGIC.map((item) => (
					<Box
						component="li"
						key={item.label}
						sx={{ mb: 0.85, color: 'text.secondary' }}
					>
						<Typography
							component="span"
							sx={{
								color: 'text.primary',
								fontWeight: 600,
								fontSize: '0.85rem',
							}}
						>
							{item.label}:
						</Typography>{' '}
						<Typography
							component="span"
							sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
						>
							{item.text}
						</Typography>
					</Box>
				))}
			</Box>
		</DashboardCard>
	);
}

export default AnalyticsLogic;
