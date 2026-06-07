export const SOLAR_LOG_COLUMN_MAPPING = {
  timestamp: "Timestamp",
  inlet_temperature: "Inlet Temperature",
  outlet_temperature: "Outlet Temperature",
  flow_temperature: "Flow Temperature",
  instant_flow: "Instant Flow",
  pressure: "Pressure",
};

export const SOLAR_PARAMETER_OPTIONS = [
  { label: "Timestamp", value: "timestamp" },
  { label: "Instant Flow", value: "instant_flow" },
  { label: "Flow Temperature", value: "flow_temperature" },
  { label: "Pressure", value: "pressure" },
  { label: "Inlet Temperature", value: "inlet_temperature" },
  { label: "Outlet Temperature", value: "outlet_temperature" },
];
