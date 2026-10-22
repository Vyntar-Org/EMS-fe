import { SITE_SUMMARY_ROWS } from '../../../constants/weatherStationDashboard';
import DashboardCard from './DashboardCard';
import DashboardTable from './DashboardTable';

const COLUMNS = [
	{ id: 'item', label: 'Item' },
	{ id: 'value', label: 'Value' },
];

function SiteLocationSummary() {
	const rows = SITE_SUMMARY_ROWS.map((row) => ({
		id: row.item,
		item: row.item,
		value: row.value,
	}));

	return (
		<DashboardCard title="Site Location Summary" sx={{ height: '100%' }}>
			<DashboardTable columns={COLUMNS} rows={rows} />
		</DashboardCard>
	);
}

export default SiteLocationSummary;
