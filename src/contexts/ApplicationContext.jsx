import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../helpers/api";

const ApplicationContext = createContext();

export const ApplicationProvider = ({ children }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  // Fetch applications from /me endpoint
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
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
                typeof p === "string" ? p.toUpperCase() : p,
              )
            : [],
        }));

        if (Array.isArray(appData) && appData.length > 0) {
          setApplications(appData);
          // Preserve existing selected app when possible.
          const defaultApp =
            appData.find((app) => app.default_landing_page) || appData[0];
          setSelectedApp((prevApp) => prevApp || defaultApp?.code || null);
        } else {
          setApplications([]);
        }
        setAppError(null);
      } catch (error) {
        setAppError(error.message || "Failed to load applications");
      } finally {
        setAppLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

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
    throw new Error("useApplications must be used within ApplicationProvider");
  }
  return context;
};
