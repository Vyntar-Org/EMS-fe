import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../helpers/api";
import { API_URLS } from "../helpers/apiUrls";
import { useAuth } from "./AuthContext";
import { useApplications } from "./ApplicationContext";
import { PARAMETER_OPTIONS } from "../constants/energyAnalytics";

const CommonDataContext = createContext();

export const CommonDataContextProvider = ({ children }) => {
  const { user } = useAuth();
  const { selectedApp } = useApplications();

  const [slavesData, setSlavesData] = useState(null);

  const fetchData = async (currSelectedApp) => {
    try {
      const appName = currSelectedApp?.toLowerCase() || "";
      const GET_SLAVES = api.get(API_URLS.SLAVES(appName));
      const [slavesRes] = await Promise.all([GET_SLAVES]);

      if (slavesRes?.success) {
        setSlavesData(slavesRes?.data?.slaves || []);
      }
    } catch (error) {
      console.error("One of the API calls failed:", error);
    }
  };

  const parametersData = useMemo(
    () => (selectedApp ? PARAMETER_OPTIONS?.[selectedApp] || [] : []),
    [selectedApp],
  );

  useEffect(() => {
    if ((user, selectedApp)) {
      fetchData(selectedApp);
    }
  }, [user, selectedApp]);

  return (
    <CommonDataContext.Provider
      value={{
        slavesData,
        parametersData,
      }}
    >
      {children}
    </CommonDataContext.Provider>
  );
};

export const useCommonData = () => {
  const context = useContext(CommonDataContext);
  if (!context) {
    throw new Error("useCommonData must be used within CommonDataProvider");
  }
  return context;
};
