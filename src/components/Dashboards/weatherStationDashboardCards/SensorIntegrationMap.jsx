import { SENSOR_INTEGRATION } from '../../../constants/weatherStationDashboard';
import DashboardCard from './DashboardCard';
import DashboardTable from './DashboardTable';

const COLUMNS = [
	{ id: 'data', label: 'Data' },
	{ id: 'sensor', label: 'Sensor / Source' },
];

function SensorIntegrationMap() {
	const rows = SENSOR_INTEGRATION.map((row) => ({
		id: row.data,
		data: row.data,
		sensor: row.sensor,
	}));

	return (
		<DashboardCard title="Sensor Integration Map">
			<DashboardTable columns={COLUMNS} rows={rows} />
		</DashboardCard>
	);
}

export default SensorIntegrationMap;
