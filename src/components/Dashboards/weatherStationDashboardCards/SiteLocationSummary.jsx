import { WEATHER_SITE_SUMMARY_ROWS } from '../../../constants/weatherStationDashboard';

import DashboardCard from './DashboardCard';
import DashboardTable from './DashboardTable';

const COLUMNS = [
	{ id: 'item', label: 'Item' },
	{ id: 'value', label: 'Value' },
];

const SiteLocationSummary = () => {
	const rows = WEATHER_SITE_SUMMARY_ROWS.map((row) => ({
		...row,
		id: row.item,
	}));

	return (
		<DashboardCard title="Site Location Summary" sx={{ height: '100%' }}>
			<DashboardTable columns={COLUMNS} rows={rows} />
		</DashboardCard>
	);
};

export default SiteLocationSummary;
