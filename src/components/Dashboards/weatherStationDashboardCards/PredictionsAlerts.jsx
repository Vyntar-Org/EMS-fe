import { PREDICTIONS_ALERTS } from '../../../constants/weatherStationDashboard';
import DashboardCard from './DashboardCard';
import DashboardTable, { StatusBadge } from './DashboardTable';

const COLUMNS = [
	{ id: 'parameter', label: 'Parameter' },
	{ id: 'prediction', label: 'Prediction' },
	{
		id: 'status',
		label: 'Status',
		render: (row) => (
			<StatusBadge status={row.status} statusClass={row.statusClass} />
		),
	},
];

function PredictionsAlerts() {
	const rows = PREDICTIONS_ALERTS.map((row) => ({
		id: row.parameter,
		...row,
	}));

	return (
		<DashboardCard title="Prediction & Alerts" sx={{ height: '100%' }}>
			<DashboardTable columns={COLUMNS} rows={rows} variant="alerts" />
		</DashboardCard>
	);
}

export default PredictionsAlerts;
