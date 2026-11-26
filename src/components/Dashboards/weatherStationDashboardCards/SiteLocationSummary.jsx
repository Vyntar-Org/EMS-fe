// import { WEATHER_SITE_SUMMARY_ROWS } from '../../../constants/weatherStationDashboard';
import { WEATHER_SITE_SUMMARY_FIELDS } from '../../../constants/weatherStationDashboard';
import NoDataFound from '../../common/errors/NoDataFound';

import DashboardCard from './DashboardCard';
import DashboardTable from './DashboardTable';

const COLUMNS = [
	{ id: 'item', label: 'Item' },
	{ id: 'value', label: 'Value' },
];

// Old static version:
// const SiteLocationSummary = () => {
// 	const rows = WEATHER_SITE_SUMMARY_ROWS.map((row) => ({
// 		...row,
// 		id: row.item,
// 	}));
//
// 	return (
// 		<DashboardCard title="Site Location Summary" sx={{ height: '100%' }}>
// 			<DashboardTable columns={COLUMNS} rows={rows} />
// 		</DashboardCard>
// 	);
// };

const SiteLocationSummary = ({
	site,
	latitude,
	longitude,
	loading = false,
}) => {
	const values = {
		...site,
		coordinates:
			latitude !== null && longitude !== null
				? `${latitude}, ${longitude}`
				: null,
	};

	const rows = WEATHER_SITE_SUMMARY_FIELDS.map(({ item, key }) => ({
		id: item,
		item,
		value: values[key] ?? '--',
	}));

	return (
		<DashboardCard title="Site Location Summary" sx={{ height: '100%' }}>
			{site ? (
				<DashboardTable columns={COLUMNS} rows={rows} />
			) : (
				<NoDataFound
					message={
						loading ? 'Loading site details…' : 'Site details not available'
					}
				/>
			)}
		</DashboardCard>
	);
};

export default SiteLocationSummary;
