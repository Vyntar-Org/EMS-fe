import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import NoDataFound from '../components/common/errors/NoDataFound';
import WaterSettings from '../components/Settings/WaterSettings';
import { getAppCodeFromPath } from '../helpers/pageMapping.jsx';

const SETTINGS_CONFIG = {
	WATER: WaterSettings,
};

const Settings = () => {
	// Driven by the URL (route is always `/<appCode>/settings`), like the
	// Dashboard page, so the right app's settings show even on a hard refresh.
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const SettingsComponent = SETTINGS_CONFIG[appCode];

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{SettingsComponent ? (
				<SettingsComponent />
			) : (
				<NoDataFound message="There are no settings for this application yet." />
			)}
		</Box>
	);
};

export default Settings;
