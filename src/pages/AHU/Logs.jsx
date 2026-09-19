import { Box } from '@mui/material';

import AHULogs from '../../components/AHU/AHULogs';

const AHULogsPage = () => (
	<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
		<AHULogs />
	</Box>
);

export default AHULogsPage;
