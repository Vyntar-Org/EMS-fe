import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../helpers/api';

const ApplicationContext = createContext();

// A hard refresh re-derives `selectedApp` from scratch every time — without
// this, it always fell back to the API's default landing app, silently
// bouncing the user off whatever page (and app) they were actually on back
// to their default app's dashboard. Reading the app code straight out of
// the URL (routes are always `/<appCode>/<page>`) keeps them exactly where
// they were.
const getAppCodeFromLocation = (appData) => {
	const segment = window.location.pathname.split('/').filter(Boolean)[0];
	if (!segment) {
		return null;
	}
	const match = appData.find(
		(app) => app.code?.toLowerCase() === segment.toLowerCase()
	);
	return match?.code || null;
};

export const ApplicationProvider = ({ children }) => {
	const { user, loading: authLoading } = useAuth();
	const [applications, setApplications] = useState([]);
	const [selectedApp, setSelectedApp] = useState(null);
	const [appLoading, setAppLoading] = useState(true);
	const [appError, setAppError] = useState(null);

	// Fetch applications from /me endpoint
	useEffect(() => {
		// AuthContext hasn't finished checking storage for a logged-in
		// session yet — `user` being null right *now* means "not known yet",
		// not "definitely logged out". Treating it as the latter here was
		// the actual root cause of refresh bouncing to a 403: this effect
		// always fires once on mount with `user` still at its initial
		// `null` value (regardless of whether a session exists), so it set
		// `appLoading` to false with an empty `applications` array for one
		// render — long enough for ProtectedRoute to see no matching app
		// and redirect to /unauthorized, via `replace`, before the real,
		// already-authenticated user's applications ever loaded. Waiting
		// for `authLoading` to resolve first means `user` is guaranteed to
		// be in its final state (real user or genuinely null) before this
		// effect ever acts on it.
		if (authLoading) {
			return;
		}

		const fetchApplications = async () => {
			if (!user) {
				setApplications([]);
				setAppLoading(false);
				return;
			}

			try {
				// const response = await api.get("/auth/me/");

				// let appData =
				//   response.data?.applications || response.applications || [];
				let appData = user?.applications || [];

				// Ensure pages is always an array and normalize page codes
				appData = appData.map((app) => ({
					...app,
					pages: Array.isArray(app.pages)
						? app.pages.map((p) =>
								typeof p === 'string' ? p.toUpperCase() : p
						  )
						: [],
				}));

				if (Array.isArray(appData) && appData.length > 0) {
					setApplications(appData);
					// Preserve existing selected app when possible, otherwise prefer
					// the app the current URL is actually pointing at, and only fall
					// back to the API's default landing app when neither is known
					// (e.g. landing on `/`).
					const defaultApp =
						appData.find((app) => app.default_landing_page) || appData[0];
					const urlAppCode = getAppCodeFromLocation(appData);
					setSelectedApp(
						(prevApp) => prevApp || urlAppCode || defaultApp?.code || null
					);
				} else {
					setApplications([]);
				}
				setAppError(null);
			} catch (error) {
				setAppError(error.message || 'Failed to load applications');
			} finally {
				setAppLoading(false);
			}
		};

		fetchApplications();
	}, [user, authLoading]);

	const switchApp = (appCode) => {
		const app = applications.find((a) => a.code === appCode);
		if (app) {
			setSelectedApp(appCode);
		}
	};

	const getCurrentApp = () => {
		return applications.find((a) => a.code === selectedApp);
	};

	return (
		<ApplicationContext.Provider
			value={{
				applications,
				selectedApp,
				appLoading,
				appError,
				switchApp,
				getCurrentApp,
			}}
		>
			{children}
		</ApplicationContext.Provider>
	);
};

export const useApplications = () => {
	const context = useContext(ApplicationContext);
	if (!context) {
		throw new Error('useApplications must be used within ApplicationProvider');
	}
	return context;
};
