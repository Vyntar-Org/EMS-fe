import Analytics from "../pages/Analytics";
import Dashboard from "../pages/Dashboard";
import Logs from "../pages/Logs";
import MachineList from "../pages/MachineList";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Unauthorized from "../pages/Unauthorized";

// Map page codes to components
export const pageComponentMap = {
  DASHBOARD: Dashboard,
  MACHINE_LIST: MachineList,
  REPORTS: Reports,
  LOGS: Logs,
  ANALYTICS: Analytics,
  SETTINGS: Settings,
  UNAUTHORIZED: Unauthorized,
};

// Map page codes to display names and icons
export const pageDisplayInfo = {
  DASHBOARD: { name: "Dashboard", icon: "DashboardIcon" },
  MACHINE_LIST: { name: "Machine List", icon: "ListIcon" },
  REPORTS: { name: "Reports", icon: "DescriptionIcon" },
  LOGS: { name: "Logs", icon: "HistoryIcon" },
  ANALYTICS: { name: "Analytics", icon: "BarChartIcon" },
  SETTINGS: { name: "Settings", icon: "SettingsIcon" },
};

// Get route path from page code
export const getPagePath = (pageCode, appCode = "") => {
  if (!pageCode) return "/dashboard";
  return appCode
    ? `/${appCode.toLowerCase()}/${pageCode.toLowerCase()}`
    : `/${pageCode.toLowerCase()}`;
};

// Get page code from route path
export const getPageCodeFromPath = (path) => {
  const parts = path.split("/").filter((p) => p);
  return parts[parts.length - 1]?.toUpperCase() || "DASHBOARD";
};
