import { lazy } from 'react';

// Components are necessarily a frontend concern. Navigation metadata is not:
// names, hierarchy, availability and pages all come from the Apps API.
const SUB_APP_PAGE_COMPONENTS = {
	AHU: {
		MACHINE_LIST: lazy(() => import('../pages/AHU/MachineList')),
		LOGS: lazy(() => import('../pages/AHU/Logs')),
		ANALYTICS: lazy(() => import('../pages/AHU/Analytics')),
	},
};

export const getSubApps = (application) => application?.sub_apps || [];

export const getSubApp = (application, subAppCode) =>
	getSubApps(application).find(
		(subApp) => subApp.code === subAppCode?.toUpperCase()
	);

export const getSubAppPageComponent = (subAppCode, pageCode) =>
	SUB_APP_PAGE_COMPONENTS[subAppCode?.toUpperCase()]?.[pageCode?.toUpperCase()];

export const getSubAppPagePath = (appCode, subAppCode, pageCode) =>
	`/${appCode.toLowerCase()}/${subAppCode.toLowerCase()}/${pageCode.toLowerCase()}`;

export const getSubAppRouteContext = (pathname, applications = []) => {
	const segments = pathname.split('/').filter(Boolean);
	if (segments.length !== 3) return null;

	const [appCode, subAppCode, pageCode] = segments.map((part) =>
		part.toUpperCase()
	);
	const application = applications.find((app) => app.code === appCode);
	const subApp = getSubApp(application, subAppCode);

	return subApp?.pages.includes(pageCode)
		? { appCode, subAppCode, pageCode, application, subApp }
		: null;
};
