export const TEMPERATURE_LOG_COLUMN_MAPPING = {
  timestamp: "Timestamp",
  temperature: "Temperature (°C)",
  humidity: "Humidity (%)",
  battery: "Battery (V)",
};

export const TEMPERATURE_LOG_COLUMN_ORDER = [
  "timestamp",
  "temperature",
  "humidity",
  "battery",
];

export const TEMPERATURE_PARAMETER_OPTIONS = [
  { label: "Timestamp", value: "timestamp" },
  { label: "Temperature", value: "temperature" },
  { label: "Humidity", value: "humidity" },
  { label: "Battery", value: "battery" },
];
