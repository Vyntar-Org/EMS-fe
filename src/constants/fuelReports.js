export const FUEL_REPORTS_TAB_OPTIONS = [
  {
    label: "Day-Wise Consumption",
    tab: "FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA",
  },
  {
    label: "Month-Wise Consumption",
    tab: "FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA",
  },
  {
    label: "Daily Meter Reading",
    tab: "EMS_REPORTS_DATE_WISE_READING_DATA",
  },
  {
    label: "Day-Wise Cost Consumption",
    tab: "EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA",
  },
  {
    label: "Month-Wise Cost Consumption",
    tab: "EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA",
  },
];

export const FUEL_REPORTS_ALLOW_MONTH = [
  "FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA",
  "EMS_REPORTS_DATE_WISE_READING_DATA",
  "EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA",
];

export const FUEL_REPORTS_API_DATA_KEY_CONFIG = {
  FUEL_REPORTS_DATE_WISE_CONSUMPTION_DATA: {
    dateKey: "date",
    valueKey: "consumption",
  },
  FUEL_REPORTS_MONTH_WISE_CONSUMPTION_DATA: {
    dateKey: "month",
    valueKey: "consumption",
  },
  EMS_REPORTS_DATE_WISE_READING_DATA: {
    dateKey: "date",
    valueKey: "reading",
  },
  EMS_REPORTS_DATE_WISE_CONSUMPTION_COST_DATA: {
    dateKey: "date",
    valueKey: "cost_consumption",
  },
  EMS_REPORTS_MONTH_WISE_CONSUMPTION_COST_DATA: {
    dateKey: "month",
    valueKey: "consumption",
  },
};
