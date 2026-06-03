export const FUEL_TREND_TAB_OPTIONS = [
  { label: "Consumed", value: "consumed", unit: "Ltrs" },
  { label: "Temperature", value: "temperature", unit: "°C" },
];

export const DUMMY_FUEL_MACHINES = [
  {
    slave_id: "1",
    card_name: "DG 1500 KVA",
    status: "Online",
    last_updated: new Date().toISOString(),
    fuel_level_percent: 91.91,
    fuel_level_ltrs: 780,
    metrics: [
      { label: "Consumed", value: "0", unit: "Ltrs", icon: "LocalGasStation", color: "#d32f2f" },
      { label: "Refilled", value: "0", unit: "Ltrs", icon: "AddCircleOutline", color: "#1976d2" },
      { label: "Temperature", value: "25", unit: "°C", icon: "Thermostat", color: "#ed6c02" },
      { label: "Fuel Level", value: "780", unit: "Ltrs", icon: "PropaneTank", color: "#2e7d32" },
    ],
  },
  {
    slave_id: "2",
    card_name: "DG 380 KVA",
    status: "Offline",
    last_updated: new Date().toISOString(),
    fuel_level_percent: 53,
    fuel_level_ltrs: 583,
    metrics: [
      { label: "Consumed", value: "0", unit: "Ltrs", icon: "LocalGasStation", color: "#d32f2f" },
      { label: "Refilled", value: "0", unit: "Ltrs", icon: "AddCircleOutline", color: "#1976d2" },
      { label: "Temperature", value: "24", unit: "°C", icon: "Thermostat", color: "#ed6c02" },
      { label: "Fuel Level", value: "583", unit: "Ltrs", icon: "PropaneTank", color: "#2e7d32" },
    ],
  },
  {
    slave_id: "3",
    card_name: "DG 625 KVA",
    status: "Offline",
    last_updated: new Date().toISOString(),
    fuel_level_percent: 37.36,
    fuel_level_ltrs: 411,
    metrics: [
      { label: "Consumed", value: "0", unit: "Ltrs", icon: "LocalGasStation", color: "#d32f2f" },
      { label: "Refilled", value: "0", unit: "Ltrs", icon: "AddCircleOutline", color: "#1976d2" },
      { label: "Temperature", value: "24", unit: "°C", icon: "Thermostat", color: "#ed6c02" },
      { label: "Fuel Level", value: "411", unit: "Ltrs", icon: "PropaneTank", color: "#2e7d32" },
    ],
  },
  {
    slave_id: "4",
    card_name: "Mother Tank",
    status: "Offline",
    last_updated: new Date().toISOString(),
    fuel_level_percent: 38.7,
    fuel_level_ltrs: 1548,
    metrics: [
      { label: "Consumed", value: "0", unit: "Ltrs", icon: "LocalGasStation", color: "#d32f2f" },
      { label: "Refilled", value: "0", unit: "Ltrs", icon: "AddCircleOutline", color: "#1976d2" },
      { label: "Temperature", value: "29", unit: "°C", icon: "Thermostat", color: "#ed6c02" },
      { label: "Fuel Level", value: "455", unit: "Ltrs", icon: "PropaneTank", color: "#2e7d32" },
    ],
  },
];
