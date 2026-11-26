import { ViewQuiltOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';

import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser } from '../../helpers/userRole';
import CustomCard from '../common/CustomCard';
import NoDataFound from '../common/errors/NoDataFound';

import ManageKpiCards from './waterKpiCards/ManageKpiCards';

const WaterSettings = () => {
	const { user } = useAuth();

	return (
		<Box
			sx={{
				height: '100%',
				minHeight: 0,
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			{isAdminUser(user) ? (
				<ManageKpiCards />
			) : (
				// The KPI-card API only accepts ADMIN tokens, so other roles get an
				// explanation instead of a screen that would fail on every call.
				<CustomCard
					title="Dashboard KPI cards"
					titleIcon={<ViewQuiltOutlined />}
				>
					<NoDataFound message="Only administrators can change the Water dashboard's KPI cards." />
				</CustomCard>
			)}
		</Box>
	);
};

export default WaterSettings;
