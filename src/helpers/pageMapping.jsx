import { lazy } from 'react';

import Unauthorized from '../pages/Unauthorized';

// Code-split per page — these eagerly imported together (Analytics,
// Dashboard, MachineList, Reports, Logs, Settings) were the entire reason
// the main bundle hit ~2.4MB in one chunk, forcing the browser to parse all
// of them up front regardless of which single page a user actually opens.
// Unauthorized stays eager: it's the immediate fallback target whenever a
// route/permission check fails and must never itself wait on a lazy chunk.
export const pageComponentMap = {
	DASHBOARD: lazy(() => import('../pages/Dashboard')),
	MACHINE_LIST: lazy(() => import('../pages/MachineList')),
	REPORTS: lazy(() => import('../pages/Reports')),
	LOGS: lazy(() => import('../pages/Logs')),
	ANALYTICS: lazy(() => import('../pages/Analytics')),
	SETTINGS: lazy(() => import('../pages/Settings')),
	UNAUTHORIZED: Unauthorized,
};

// Map page codes to display names and icons
export const pageDisplayInfo = {
	DASHBOARD: { name: 'Dashboard', icon: 'DashboardIcon' },
	MACHINE_LIST: { name: 'Machine List', icon: 'ListIcon' },
	REPORTS: { name: 'Reports', icon: 'DescriptionIcon' },
	LOGS: { name: 'Logs', icon: 'HistoryIcon' },
	ANALYTICS: { name: 'Analytics', icon: 'BarChartIcon' },
	SETTINGS: { name: 'Settings', icon: 'SettingsIcon' },
};

// Get route path from page code
export const getPagePath = (pageCode, appCode = '') => {
	if (!pageCode) return '/dashboard';
	return appCode
		? `/${appCode.toLowerCase()}/${pageCode.toLowerCase()}`
		: `/${pageCode.toLowerCase()}`;
};

// Get page code from route path
export const getPageCodeFromPath = (path) => {
	const parts = path.split('/').filter((p) => p);
	return parts[parts.length - 1]?.toUpperCase() || 'DASHBOARD';
};

// Get app code from route path — routes are always `/<appCode>/<pageCode>`,
// so the URL is the single source of truth for which app's content a page
// wrapper (Dashboard/MachineList/Analytics/Reports) should render. Reading
// this directly instead of trusting `selectedApp` context state means a
// hard refresh (or any moment before that context resolves) can never show
// the wrong app's content, no matter how ApplicationContext's own state
// settles.
export const getAppCodeFromPath = (path) => {
	const parts = path.split('/').filter((p) => p);
	return parts[0]?.toUpperCase() || null;
};
