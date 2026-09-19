import { Box } from '@mui/material';

import AHUMachineList from '../../components/AHU/AHUMachineList';

const AHUMachineListPage = () => (
	<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
		<AHUMachineList />
	</Box>
);

export default AHUMachineListPage;
