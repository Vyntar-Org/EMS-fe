const ADMINS = {
  SLAVES: (appName) => `/applications/${appName}/slaves/`,
};

const AUTH = {
  LOGOUT: "/auth/logout",
  LOGIN: "/auth/login/",
  REFRESH: "/auth/refresh/",
  CURRENT_USER: "/auth/me/",
};

const EMS_DASHBOARD = {
  EMS_DASHBOARD_OVERVIEW: "/dashboards/overview/",
  EMS_DASHBOARD_HOURLY_CONSUMPTION:
    "/applications/energy/hourly-consumption-trend/",
  EMS_DASHBOARD_MACHINE_CONSUMPTION:
    "/admin/charts/slave/acte-im-consumption-7days/",
  EMS_DASHBOARD_DEMAND_INDICATOR: "/applications/energy/peak-demand-trend/",
};

const EMS_MACHINE_LIST = {
  EMS_MACHINE_LIST_DATA: "/admin/machine-list/",
  EMS_MACHINE_LIST_ACTIVE_POWER: (slaveId) =>
    `/admin/machine-list/active-power-chart/?slave_id=${slaveId}`,
  EMS_MACHINE_LIST_VOLTAGE: (slaveId) =>
    `/admin/machine-list/voltage/?slave_id=${slaveId}`,
  EMS_MACHINE_LIST_CURRENT: (slaveId) =>
    `/admin/machine-list/current/?slave_id=${slaveId}`,
  EMS_MACHINE_LIST_POWER_FACTOR: (slaveId) =>
    `/admin/machine-list/power-factor/?slave_id=${slaveId}`,
  EMS_MACHINE_LIST_FREQUENCY: (slaveId) =>
    `/admin/machine-list/frequency/?slave_id=${slaveId}`,
};

const EMS_ANALYTICS = {
  EMS_ANALYTICS_DATA: (slaveId, parameters, from_datetime, to_datetime) =>
    `/applications/energy/analytics/?slave_id=${slaveId}&parameters=${parameters}&from_datetime=${from_datetime}&to_datetime=${to_datetime}`,
};

export const API_URLS = {
  ...ADMINS,
  ...AUTH,
  ...EMS_DASHBOARD,
  ...EMS_MACHINE_LIST,
  ...EMS_ANALYTICS,
};
