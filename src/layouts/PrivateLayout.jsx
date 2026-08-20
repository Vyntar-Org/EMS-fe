import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, useTheme } from '@mui/material';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { useApplications } from '../contexts/ApplicationContext';
import { getPagePath, pageComponentMap } from '../helpers/pageMapping';
import { layoutBackgroundSx } from '../helpers/layoutImages';
import { preloadAppImages } from '../helpers/preloadImages';
import { useIdleAutoCycle } from '../hooks/useIdleAutoCycle.js';

export const PrivateLayout = () => {
	const { user } = useAuth();
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [isDesktopOpen, setIsDesktopOpen] = useState(true);
	const { applications, selectedApp, switchApp } = useApplications();
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();

	// Warm the cache with every app's layout artwork + shared assets so
	// switching applications never flashes an unloaded background.
	useEffect(() => {
		preloadAppImages(
			applications.map((app) => app.code),
			[user?.branding?.logo, user?.branding?.favicon]
		);
	}, [applications, user]);

	const changeApplication = useCallback(
		(newAppCode) => {
			switchApp(newAppCode);
			const app = applications.find((a) => a.code === newAppCode);
			if (app) {
				const defaultPage =
					app.default_landing_page ||
					app.pages?.find((pageCode) => pageComponentMap[pageCode]) ||
					app.pages?.[0] ||
					'DASHBOARD';
				const path = getPagePath(defaultPage, newAppCode);
				navigate(path);
			}
		},
		[applications, navigate, switchApp]
	);

	const handleAppChange = useCallback(
		(_event, newAppCode) => changeApplication(newAppCode),
		[changeApplication]
	);

	useIdleAutoCycle({
		apps: applications.map((app) => app.code),
		activeApp: selectedApp,
		onAppChange: changeApplication,
		idleTimeoutMs: 30_000,
		cycleIntervalMs: 12_000,
	});

	// If not authenticated, redirect to login
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return (
		// Fixed app shell: the viewport never scrolls — the header stays put
		// on every screen size while main and the sidebar scroll internally.
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
			<Sidebar
				isMobileOpen={isMobileOpen}
				setIsMobileOpen={setIsMobileOpen}
				isDesktopOpen={isDesktopOpen}
				handleAppChange={handleAppChange}
				setIsDesktopOpen={setIsDesktopOpen}
			/>
			<Box
				sx={{
					flexGrow: 1,
					minWidth: 0,
					height: '100vh',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Header
					setIsMobileOpen={setIsMobileOpen}
					isMobileOpen={isMobileOpen}
					setIsDesktopOpen={setIsDesktopOpen}
					isDesktopOpen={isDesktopOpen}
					handleAppChange={handleAppChange}
				/>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						minHeight: 0,
						overflow: 'hidden',
						p: 1,
						backgroundColor: 'background.default',
						...layoutBackgroundSx('main', selectedApp, theme.palette.mode),
					}}
				>
					{/* Keyed on the route so it re-triggers on every navigation —
					    a purely compositor-cost fade (opacity + transform only,
					    no layout properties), so it can't introduce jank. */}
					<Box
						key={location.pathname}
						sx={{
							height: '100%',
							animation: 'pageFadeIn 0.25s ease',
							'@keyframes pageFadeIn': {
								from: { opacity: 0, transform: 'translateY(4px)' },
								to: { opacity: 1, transform: 'translateY(0)' },
							},
						}}
					>
						<Outlet />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
