/**
 * Map page codes to permission keys
 * This maps application page codes to the permission system
 */
export const pagePermissionMap = {
  DASHBOARD: "view_dashboard",
  MACHINE_LIST: "view_machines",
  REPORTS: "view_reports",
  LOGS: "view_logs",
  ANALYTICS: "view_analytics",
  SETTINGS: "manage_settings",
};

/**
 * Check if a page should be visible based on permissions
 */
export const canViewPage = (pageCode, permissions = []) => {
  const requiredPermission = pagePermissionMap[pageCode];
  if (!requiredPermission) return true; // If no permission required, allow access
  return permissions.includes(requiredPermission);
};

/**
 * Filter pages by permissions
 */
export const getVisiblePages = (pageList, permissions = []) => {
  return pageList.filter((pageCode) => canViewPage(pageCode, permissions));
};
