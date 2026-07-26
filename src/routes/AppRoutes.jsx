import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

import { useApplications } from '../contexts/ApplicationContext';
import { useAuth } from '../contexts/AuthContext';
import { pageComponentMap, getPagePath } from '../helpers/pageMapping.jsx';
import { PrivateLayout } from '../layouts/PrivateLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import Unauthorized from '../pages/Unauthorized.jsx';

import { routesConfig } from './config';
import { ProtectedRoute } from './ProtectedRoute';

// Renders whichever page a `/:appCode/:pageCode` URL asks for. This used to
// be N separately-registered <Route> elements, one per (app, page) pair,
// built from `applications` — which meant NO route existed at all until
// that data had loaded. On a hard refresh, `<Routes>` could render one or
// more times in that window; a URL like `/water/logs` matched nothing yet,
// fell through to the catch-all `<Navigate replace>`, and permanently
// rewrote the URL to the default app/page before the real data ever
// arrived. A single static route with URL params is registered from the
// very first render — it always matches — so that race is structurally
// impossible now. Only *authorization* (via ProtectedRoute) still needs
// `applications` to be loaded, and that's already gated by `isRouteLoading`
// below (AppRoutes renders nothing at all until then).
const DynamicAppPage = () => {
	const { appCode, pageCode } = useParams();
	const normalizedAppCode = appCode?.toUpperCase();
	const normalizedPageCode = pageCode?.toUpperCase();
	const Component = pageComponentMap[normalizedPageCode];

	if (!Component) {
		return <Navigate to="/unauthorized" replace />;
	}

	return (
		<ProtectedRoute appCode={normalizedAppCode} pageCode={normalizedPageCode}>
			<Component />
		</ProtectedRoute>
	);
};

export const AppRoutes = () => {
	const { user, loading: authLoading } = useAuth();
	const { applications, selectedApp, appLoading } = useApplications();

	const isRouteLoading = authLoading || (user && appLoading);

	// Static public routes
	const publicRoutes = useMemo(
		() => routesConfig.filter((r) => r.layout === 'public'),
		[]
	);

	// Get default page path for current app using only valid routes
	const getDefaultPagePath = useMemo(() => {
		const activeAppCode = selectedApp || applications?.[0]?.code || null;
		const currentApp = applications.find((a) => a.code === activeAppCode);
		if (currentApp && currentApp.pages && currentApp.pages.length > 0) {
			const validPage = currentApp.pages.find(
				(pageCode) => pageComponentMap[pageCode]
			);
			if (validPage) {
				return getPagePath(validPage, activeAppCode);
			}
		}
		return '/login';
	}, [applications, selectedApp]);

	const fallbackPath = user ? getDefaultPagePath : '/login';

	const faviconUrl = user?.branding?.favicon || '';

	useEffect(() => {
		if (!faviconUrl) {
			return;
		}

		let link = document.querySelector("link[rel~='icon']");

		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}

		link.href = faviconUrl;
	}, [faviconUrl]);

	if (isRouteLoading) {
		return null;
	}

	return (
		<Routes>
			{/* Public Routes */}
			<Route element={<PublicLayout />}>
				{publicRoutes.map((route) => (
					<Route
						key={route.path}
						path={route.path}
						element={<route.element />}
					/>
				))}
			</Route>

			{/* Private Routes */}
			<Route element={<PrivateLayout />}>
				{/* Root redirect to first page of selected app */}
				<Route index element={<Navigate to={getDefaultPagePath} replace />} />

				{/* Every app/page URL — see DynamicAppPage above for why this is
				    one static route instead of one per (app, page) pair. */}
				<Route path="/:appCode/:pageCode" element={<DynamicAppPage />} />

				{/* Unauthorized page */}
				<Route
					path="/unauthorized"
					element={
						<ProtectedRoute>
							<Unauthorized />
						</ProtectedRoute>
					}
				/>
			</Route>

			{/* Fallback */}
			<Route path="*" element={<Navigate to={fallbackPath} replace />} />
		</Routes>
	);
};
