import React, { useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { PrivateLayout } from "../layouts/PrivateLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { useApplications } from "../contexts/ApplicationContext";
import { pageComponentMap, getPagePath } from "../helpers/pageMapping.jsx";
import { routesConfig } from "./config";
import Unauthorized from "../pages/Unauthorized.jsx";

export const AppRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { applications, selectedApp, appLoading } = useApplications();

  const isRouteLoading = authLoading || (user && appLoading);

  // Static public routes
  const publicRoutes = useMemo(
    () => routesConfig.filter((r) => r.layout === "public"),
    [],
  );

  // Generate dynamic private routes from applications - memoized
  const dynamicPrivateRoutes = useMemo(() => {
    const routes = [];
    applications.forEach((app) => {
      if (app.pages && Array.isArray(app.pages)) {
        app.pages.forEach((pageCode) => {
          const path = getPagePath(pageCode, app.code);
          const Component = pageComponentMap[pageCode];

          // Only create route if component exists AND page is in API response
          if (Component) {
            routes.push({
              path,
              element: Component,
              appCode: app.code,
              pageCode,
            });
          }
        });
      }
    });
    return routes;
  }, [applications]);

  // Get default page path for current app using only valid routes
  const getDefaultPagePath = useMemo(() => {
    const activeAppCode = selectedApp || applications?.[0]?.code || null;
    const currentApp = applications.find((a) => a.code === activeAppCode);
    if (currentApp && currentApp.pages && currentApp.pages.length > 0) {
      const validPage = currentApp.pages.find(
        (pageCode) => pageComponentMap[pageCode],
      );
      if (validPage) {
        return getPagePath(validPage, activeAppCode);
      }
    }
    return "/login";
  }, [applications, selectedApp]);

  const fallbackPath = user ? getDefaultPagePath : "/login";

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

        {/* Dynamic application page routes */}
        {dynamicPrivateRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute appCode={route.appCode} pageCode={route.pageCode}>
                <route.element />
              </ProtectedRoute>
            }
          />
        ))}

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
