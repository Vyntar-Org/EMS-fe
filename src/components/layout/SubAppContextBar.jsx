import SensorsIcon from '@mui/icons-material/Sensors';
import { Box, Tab, Tabs } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

import { useApplications } from '../../contexts/ApplicationContext';
import { getPagePath } from '../../helpers/pageMapping.jsx';
import {
	getSubAppPagePath,
	getSubAppRouteContext,
	getSubApps,
} from '../../helpers/subApps.jsx';

export const SubAppContextBar = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { applications, getCurrentApp, selectedApp } = useApplications();
	const currentApp = getCurrentApp();
	const subApps = getSubApps(currentApp);
	const routeContext = getSubAppRouteContext(location.pathname, applications);
	const rootSubApp = subApps.find((subApp) => subApp.is_application_root);
	const isApplicationPage =
		location.pathname.split('/').filter(Boolean).length === 2;
	const activeSubAppCode =
		routeContext?.subAppCode ||
		(isApplicationPage ? rootSubApp?.code : false) ||
		false;

	if (!subApps.length) {
		return null;
	}

	const handleSubAppChange = (_event, subAppCode) => {
		const subApp = subApps.find((item) => item.code === subAppCode);
		const landingPage = subApp?.default_landing_page || subApp?.pages?.[0];

		if (landingPage) {
			const path = subApp.is_application_root
				? getPagePath(landingPage, selectedApp)
				: getSubAppPagePath(selectedApp, subAppCode, landingPage);
			navigate(path);
		}
	};

	return (
		<Box
			component="nav"
			aria-label={`${currentApp?.name || selectedApp} sub-applications`}
			sx={{
				flexShrink: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: { xs: 1, sm: 1.5 },
				minHeight: { xs: 46, sm: 50 },
				px: { xs: 1.25, sm: 2 },
				bgcolor: 'background.paper',
				borderBottom: '1px solid',
				borderColor: 'divider',
				boxShadow: (theme) =>
					theme.palette.mode === 'dark'
						? '0 3px 12px rgba(0,0,0,0.24)'
						: '0 3px 12px rgba(15,35,62,0.06)',
			}}
		>
			{/* <Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 0.75,
					color: 'text.secondary',
					flexShrink: 0,
				}}
			>
				<AppsRoundedIcon sx={{ fontSize: 18 }} />
				<Typography
					sx={{
						display: { xs: 'none', sm: 'block' },
						fontSize: '0.72rem',
						fontWeight: 700,
						letterSpacing: '0.08em',
						textTransform: 'uppercase',
					}}
				>
					Sub-apps
				</Typography>
			</Box> */}

			<Tabs
				value={activeSubAppCode}
				onChange={handleSubAppChange}
				variant="scrollable"
				scrollButtons="auto"
				allowScrollButtonsMobile
				aria-label="Sub-application navigation"
				sx={{
					minWidth: 0,
					minHeight: 38,
					flex: 1,
					'& .MuiTabs-indicator': { display: 'none' },
					'& .MuiTabs-flexContainer': {
						gap: 0.5,
						justifyContent: 'center',
					},
					'& .MuiTabs-scrollButtons': { width: 28 },
				}}
			>
				{subApps.map((subApp) => (
					<Tab
						key={subApp.code}
						value={subApp.code}
						disabled={!subApp.pages?.length}
						icon={<SensorsIcon sx={{ fontSize: 17 }} />}
						iconPosition="start"
						label={subApp.name}
						sx={{
							minHeight: 34,
							height: 34,
							minWidth: 'auto',
							px: 1.5,
							borderRadius: '9px',
							border: '1px solid',
							borderColor: 'divider',
							color: 'text.secondary',
							fontSize: '0.82rem',
							fontWeight: 650,
							textTransform: 'none',
							transition: 'all 0.2s ease',
							'&:hover': {
								bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
								borderColor: 'primary.light',
							},
							'&.Mui-selected': {
								color: 'primary.contrastText',
								bgcolor: 'primary.main',
								borderColor: 'primary.main',
								boxShadow: (theme) =>
									`0 3px 10px ${alpha(theme.palette.primary.main, 0.28)}`,
							},
							'& .MuiTab-iconWrapper': { mb: '0 !important', mr: 0.65 },
						}}
					/>
				))}
			</Tabs>
		</Box>
	);
};
