import { Box } from '@mui/material';
import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useApplications } from '../contexts/ApplicationContext';
import { useAuth } from '../contexts/AuthContext';
import { getPagePath, pageComponentMap } from '../helpers/pageMapping.jsx';

// Day window: 06:00–17:59 shows the light background, otherwise the dark one
const isDayTime = () => {
	const hour = new Date().getHours();
	return hour >= 6 && hour < 18;
};

export const PublicLayout = () => {
	const { user } = useAuth();
	const { applications, selectedApp, appLoading } = useApplications();

	const isDay = useMemo(isDayTime, []);

	const activeAppCode = selectedApp || applications?.[0]?.code;
	const currentApp = applications.find((app) => app.code === activeAppCode);
	const defaultPage = currentApp?.pages?.find(
		(pageCode) => pageComponentMap[pageCode]
	);
	const defaultPath = defaultPage
		? getPagePath(defaultPage, activeAppCode)
		: '/login';

	if (user && !appLoading) {
		return <Navigate to={defaultPath} replace />;
	}

	if (user && appLoading) {
		return null;
	}

	return (
		<Box
			sx={{
				minHeight: '100vh',
				width: '100vw',
				backgroundColor: isDay ? '#F8FAFC' : '#131C31',
				backgroundImage: `url(/assets/login-bg-${isDay ? 'day' : 'night'}.png)`,
				backgroundSize: 'cover',
				backgroundPosition: 'center bottom',
				display: 'flex',
				alignItems: 'center',
				// The background art keeps its subjects on the right, so anchor
				// the form in the empty left area on larger screens
				justifyContent: { xs: 'center', md: 'flex-start' },
				position: 'relative',
				px: { xs: 2, sm: 3 },
				py: { xs: 3, sm: 4 },
				pl: { md: '7vw', lg: '9vw' },
			}}
		>
			<Box
				sx={{
					position: 'relative',
					zIndex: 1,
					width: '100%',
					maxWidth: { xs: '100%', sm: '420px' },
				}}
			>
				<Outlet context={{ isDay }} />
			</Box>
		</Box>
	);
};
