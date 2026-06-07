export const WATER_PARAMETER_OPTIONS = [
  {
    label: "Timestamp",
    value: "timestamp",
  },
  {
    label: "Metric Name",
    value: "metric_name",
  },
  {
    label: "Flow Rate (m³/h)",
    value: "flowrate",
  },
  {
    label: "Totalizer",
    value: "totalizer",
  },
  {
    label: "Water Consumption (KLD)",
    value: "water_consumption",
  },
];

export const WATER_LOG_COLUMN_MAPPING = {
  metric_name: "Timestamp",
  inlet_temperature: "Metric Name",
  flowrate: "Flow Rate (m³/h)",
  totalizer: "Totalizer",
  water_consumption: "Water Consumption (KLD)",
};
