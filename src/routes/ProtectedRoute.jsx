import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';

export const ProtectedRoute = ({
	children,
	appCode,
	pageCode,
	subAppCode,
	requiredPermission,
}) => {
	const { user } = useAuth();
	const { applications } = useApplications();

	// User must be authenticated
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// If this is a static route (like /unauthorized), allow access
	if (!appCode && !pageCode) {
		return children;
	}

	// Check if the app exists
	const app = applications.find((a) => a.code === appCode);
	if (!app) {
		return <Navigate to="/unauthorized" replace />;
	}

	const availablePages = subAppCode
		? app.sub_apps?.find((subApp) => subApp.code === subAppCode)?.pages
		: app.pages;

	// Parent pages and sub-app pages are separate grants in the Apps API.
	if (!availablePages?.includes(pageCode)) {
		return <Navigate to="/unauthorized" replace />;
	}

	return children;
};
