const ADMINS = {
	SLAVES: (appName) => `/applications/${appName}/slaves/`,
	SLAVE_LIST: (appName) => `/applications/${appName}/slave-list/`,
};

const AUTH = {
	LOGOUT: '/auth/logout',
	LOGIN: '/auth/login/',
	REFRESH: '/auth/refresh/',
	CURRENT_USER: '/auth/me/',
};

const EMS_DASHBOARD = {
	EMS_DASHBOARD_OVERVIEW: '/dashboards/overview/',
	EMS_DASHBOARD_HOURLY_CONSUMPTION:
		'/applications/energy/hourly-consumption-trend/',
	EMS_DASHBOARD_MACHINE_CONSUMPTION:
		'/admin/charts/slave/acte-im-consumption-7days/',
	EMS_DASHBOARD_DEMAND_INDICATOR: '/applications/energy/peak-demand-trend/',
};

const EMS_MACHINE_LIST = {
	EMS_MACHINE_LIST_DATA: '/admin/machine-list/',
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

const EMS_LOGS = {
	EMS_LOGS_DATA: (
		slaveId,
		parameters,
		from_datetime,
		to_datetime,
		limit = 50,
		offset = 0
	) =>
		`/admin/device-logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${from_datetime}&end_datetime=${to_datetime}&limit=${limit}&offset=${offset}`,
};

const EMS_REPORTS = {
	EMS_REPORTS_DATE_WISE_CONSUMPTION_DATA: (year, month) =>
		`/reports/date-wise/consumption?month=${month}&year=${year}`,
	EMS_REPORTS_MONTH_WISE_CONSUMPTION_DATA: (year) =>
		`/reports/month-wise/consumption?year=${year}`,
	EMS_REPORTS_DATE_WISE_READING_DATA: (year, month) =>
		`/reports/date-wise/reading?month=${month}&year=${year}`,
	EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA: (year, month) =>
		`/reports/date-wise/consumption-cost?month=${month}&year=${year}`,
	EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA: (year) =>
		`/reports/month-wise/consumption-cost?year=${year}`,
};

const TEMPERATURE_MACHINE_LIST = {
	TEMPERATURE_MACHINE_LIST_DATA: '/applications/temperature/machine-list/',
	TEMPERATURE_MACHINE_LIST_TREND: (slaveId, parameter, hours = 6) =>
		`/applications/temperature/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}&hours=${hours}`,
};

const TEMPERATURE_LOGS = {
	TEMPERATURE_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/temperature/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const TEMPERATURE_ANALYTICS = {
	TEMPERATURE_ANALYTICS_DATA: (
		slaveId,
		parameters,
		from_datetime,
		to_datetime
	) =>
		`/applications/temperature/analytics/?slave_id=${slaveId}&parameters=${parameters}&from_datetime=${from_datetime}&to_datetime=${to_datetime}`,
};

const SOLAR_MACHINE_LIST = {
	SOLAR_MACHINE_LIST_DATA: '/applications/solar/machine-list/',
	SOLAR_MACHINE_LIST_TREND: (slaveId, parameter, hours = 6) =>
		`/applications/solar/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}&hours=${hours}`,
};

const FIRE_SAFETY_MACHINE_LIST = {
	FIRE_SAFETY_MACHINE_LIST_DATA: '/applications/fire-safety/machine-list/',
	FIRE_SAFETY_MACHINE_LIST_TREND: (slaveId, parameter, hours = 6) =>
		`/applications/fire-safety/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}&hours=${hours}`,
};

const FIRE_SAFETY_ANALYTICS = {
	FIRE_SAFETY_ANALYTICS_DATA: (
		slaveId,
		parameters,
		from_datetime,
		to_datetime
	) =>
		`/applications/fire-safety/analytics/?slave_id=${slaveId}&parameters=${parameters}&from_datetime=${from_datetime}&to_datetime=${to_datetime}`,
};

const FIRE_SAFETY_LOGS = {
	FIRE_SAFETY_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) => {
		return `/applications/fire-safety/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`;
	},
};

const COMPRESSOR_MACHINE_LIST = {
	COMPRESSOR_MACHINE_LIST_DATA: '/applications/compressor/machine-list/',
	COMPRESSOR_MACHINE_LIST_TREND: (slaveId, parameter, hours = 6) =>
		`/applications/compressor/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}&hours=${hours}`,
	COMPRESSOR_DOWNTIME_HISTORY: (slaveId, hours = 48) =>
		`/applications/compressor/downtime/history/?slave_id=${slaveId}&hours=${hours}`,
};

const COMPRESSOR_LOGS = {
	COMPRESSOR_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) => {
		return `/applications/compressor/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`;
	},
};

const COMPRESSOR_ANALYTICS = {
	COMPRESSOR_ANALYTICS_DATA: (
		slaveId,
		parameters,
		from_datetime,
		to_datetime
	) =>
		`/applications/compressor/analytics/?slave_id=${slaveId}&parameters=${parameters}&from=${from_datetime}&to=${to_datetime}`,
};

const SOLAR_LOGS = {
	SOLAR_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/solar/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const SOLAR_ANALYTICS = {
	SOLAR_ANALYTICS_DATA: (slaveId, parameters, from_datetime, to_datetime) =>
		`/applications/solar/analytics/?slave_id=${slaveId}&parameters=${parameters}&from_datetime=${from_datetime}&to_datetime=${to_datetime}`,
};

const WATER_DASHBOARD = {
	WATER_DASHBOARD_OVERVIEW: '/applications/water/dashboard-overview/',
	WATER_DASHBOARD_DAILY_CONSUMPTION: (slaveId) =>
		`/applications/water/daily-consumption/?slave_id=${slaveId}`,
};

const WATER_MACHINE_LIST = {
	WATER_MACHINE_LIST_DATA: '/applications/water/machine-list/',
	WATER_MACHINE_LIST_TREND: (slaveId) =>
		`/applications/water/machine-trend/?slave_id=${slaveId}`,
};

const WATER_ANALYTICS = {
	WATER_ANALYTICS_DATA: (slaveId, parameters, start_datetime, end_datetime) =>
		`/applications/water/analytics/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}`,
};

const WATER_LOGS = {
	WATER_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/water/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const WATER_REPORTS = {
	WATER_REPORTS_DATE_WISE_CONSUMPTION_DATA: (year, month) =>
		`/applications/water/daily-consumption-reports/?month=${month}&year=${year}`,
	WATER_REPORTS_MONTH_WISE_CONSUMPTION_DATA: (year) =>
		`/applications/water/monthly-consumption-reports/?year=${year}`,
	WATER_REPORTS_DATE_WISE_READING_DATA: (year, month) =>
		`/applications/water/daily-reading-reports/?month=${month}&year=${year}`,
};

const FUEL_DASHBOARD = {
	FUEL_DASHBOARD_OVERVIEW: '/applications/water/dashboard-overview/',
	FUEL_DASHBOARD_DAILY_CONSUMPTION: (slaveId) =>
		`/applications/water/daily-consumption/?slave_id=${slaveId}`,
};

const FUEL_MACHINE_LIST = {
	FUEL_MACHINE_LIST_DATA: '/applications/water/machine-list/',
	FUEL_MACHINE_LIST_TREND: (slaveId, parameter) =>
		`/applications/water/machine-trend/?slave_id=${slaveId}&parameter=${parameter}`,
};

const FUEL_ANALYTICS = {
	FUEL_ANALYTICS_DATA: (slaveId, parameters, start_datetime, end_datetime) =>
		`/applications/water/analytics/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}`,
};

const FUEL_LOGS = {
	FUEL_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/water/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const FUEL_REPORTS = {
	FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA: (year, month) =>
		`/applications/water/daily-consumption-reports/?month=${month}&year=${year}`,
	FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA: (year) =>
		`/applications/water/monthly-consumption-reports/?year=${year}`,
	FUEL_REPORTS_DATE_WISE_READING_DATA: (year, month) =>
		`/applications/water/daily-reading-reports/?month=${month}&year=${year}`,
	FUEL_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA: (year, month) =>
		`/reports/date-wise/consumption-cost?month=${month}&year=${year}`,
	FUEL_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA: (year) =>
		`/reports/month-wise/consumption-cost?year=${year}`,
};

const STP_DASHBOARD = {
	STP_DASHBOARD_OVERVIEW: '/applications/stp/dashboard/summary/',
	STP_DASHBOARD_HISTORICAL_TRENDS:
		'/applications/stp/dashboard/historical-trends/',
	STP_DASHBOARD_WATER_COMPARISON:
		'/applications/stp/dashboard/water-comparison/',
};

const STP_MACHINE_LIST = {
	STP_MACHINE_LIST_DATA: '/applications/stp/machine-list/',
	STP_MACHINE_LIST_TREND: (slaveId, parameter) =>
		`/applications/stp/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}`,
};

const STP_ANALYTICS = {
	STP_ANALYTICS_DATA: (slaveId, parameters, start_datetime, end_datetime) =>
		`/applications/stp/analytics/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}`,
};

const STP_LOGS = {
	STP_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/stp/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const FLOWMETER_DASHBOARD = {
	FLOWMETER_DASHBOARD_OVERVIEW: '/applications/flowmeter/dashboard/summary/',
	FLOWMETER_DASHBOARD_WATER_COMPARISON:
		'/applications/flowmeter/dashboard/water-comparison/',
};

const FLOWMETER_MACHINE_LIST = {
	FLOWMETER_MACHINE_LIST_DATA: '/applications/flowmeter/machine-list/',
	FLOWMETER_MACHINE_LIST_TREND: (slaveId, parameter) =>
		`/applications/flowmeter/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}`,
};

const FLOWMETER_ANALYTICS = {
	FLOWMETER_ANALYTICS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime
	) =>
		`/applications/flowmeter/analytics/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}`,
};

const FLOWMETER_LOGS = {
	FLOWMETER_LOGS_DATA: (
		slaveId,
		parameters,
		start_datetime,
		end_datetime,
		limit = 50,
		offset = 0
	) =>
		`/applications/flowmeter/logs/?slave_id=${slaveId}&parameters=${parameters}&start_datetime=${start_datetime}&end_datetime=${end_datetime}&limit=${limit}&offset=${offset}`,
};

const FLOWMETER_REPORTS = {
	FLOWMETER_REPORTS_DATE_WISE_CONSUMPTION_DATA: (year, month) =>
		`/applications/flowmeter/daily-consumption-reports/?month=${month}&year=${year}`,
	FLOWMETER_REPORTS_MONTH_WISE_CONSUMPTION_DATA: (year) =>
		`/applications/flowmeter/monthly-consumption-reports/?year=${year}`,
	FLOWMETER_REPORTS_DATE_WISE_READING_DATA: (year, month) =>
		`/applications/flowmeter/daily-reading-reports/?month=${month}&year=${year}`,
};

export const API_URLS = {
	...ADMINS,
	...AUTH,
	...EMS_DASHBOARD,
	...EMS_MACHINE_LIST,
	...EMS_ANALYTICS,
	...TEMPERATURE_MACHINE_LIST,
	...TEMPERATURE_LOGS,
	...TEMPERATURE_ANALYTICS,
	...EMS_LOGS,
	...EMS_REPORTS,
	...SOLAR_LOGS,
	...SOLAR_ANALYTICS,
	...SOLAR_MACHINE_LIST,
	...FIRE_SAFETY_MACHINE_LIST,
	...FIRE_SAFETY_ANALYTICS,
	...FIRE_SAFETY_LOGS,
	...COMPRESSOR_MACHINE_LIST,
	...COMPRESSOR_LOGS,
	...COMPRESSOR_ANALYTICS,
	...WATER_DASHBOARD,
	...WATER_MACHINE_LIST,
	...WATER_ANALYTICS,
	...WATER_LOGS,
	...WATER_REPORTS,
	...FUEL_REPORTS,
	...FUEL_DASHBOARD,
	...FUEL_MACHINE_LIST,
	...FUEL_ANALYTICS,
	...FUEL_LOGS,
	...STP_DASHBOARD,
	...STP_MACHINE_LIST,
	...STP_ANALYTICS,
	...STP_LOGS,
	...FLOWMETER_DASHBOARD,
	...FLOWMETER_MACHINE_LIST,
	...FLOWMETER_ANALYTICS,
	...FLOWMETER_LOGS,
	...FLOWMETER_REPORTS,
};
