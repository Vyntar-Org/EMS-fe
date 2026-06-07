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
import { PARAMETER_OPTIONS } from "../constants/parameterOptions";

const CommonDataContext = createContext();

export const CommonDataContextProvider = ({ children }) => {
  const { user } = useAuth();
  const { selectedApp } = useApplications();

  const [slavesData, setSlavesData] = useState(null);

  // const fetchData = async (currSelectedApp) => {
  //   try {
  //     const appName = currSelectedApp?.toLowerCase() || "";
  //     const GET_SLAVES = api.get(API_URLS.SLAVES(appName));
  //     const [slavesRes] = await Promise.all([GET_SLAVES]);

  //     if (slavesRes?.success) {
  //       setSlavesData(slavesRes?.data?.slaves || []);
  //     } else {
  //       setSlavesData([]);
  //     }
  //   } catch (error) {
  //     console.error("One of the API calls failed:", error);
  //     setSlavesData([]);
  //   }
  // };

  const fetchData = async (currSelectedApp) => {
    const appName = currSelectedApp?.toLowerCase() || "";

    try {
      const slavesRes = await api.get(API_URLS.SLAVES(appName));

      if (slavesRes?.success) {
        setSlavesData(slavesRes?.data?.slaves || []);
        return;
      }

      throw new Error("Primary API returned unsuccessful state");
    } catch (primaryError) {
      console.warn(
        "Primary API failed, trying slave-list fallback...",
        primaryError,
      );

      try {
        const fallbackRes = await api.get(API_URLS.SLAVE_LIST(appName));

        if (fallbackRes?.success) {
          setSlavesData(fallbackRes?.data?.slaves || []);
        } else {
          setSlavesData([]);
        }
      } catch (fallbackError) {
        console.error(
          "Both primary and fallback API routes failed:",
          fallbackError,
        );
        setSlavesData([]);
      }
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
