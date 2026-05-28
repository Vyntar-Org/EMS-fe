import { SOLAR_PARAMETER_OPTIONS } from "./solarLogs";
import { TEMPERATURE_PARAMETER_OPTIONS } from "./temperatureLogs";
import { FIRE_SAFETY_PARAMETER_OPTIONS } from "./fireSafetyLogs";
import { COMPRESSOR_PARAMETER_OPTIONS } from "./compressorLogs";

export const PARAMETER_OPTIONS = {
  ENERGY: [
    {
      label: "Timestamp",
      value: "timestamp",
    },
    {
      label: "Active Power (kW)",
      value: "actpr_t",
    },
    {
      label: "Apparent Power (kVA)",
      value: "apppr_t",
    },
    {
      label: "Energy",
      value: "acte_im,reacte_im",
    },
    {
      label: "Power Factor",
      value: "pf_t",
    },
    {
      label: "Frequency (Hz)",
      value: "fq",
    },
    {
      label: "Voltage (Line to Neutral)",
      value: "rv,yv,bv",
    },
    {
      label: "Voltage (Line to Line)",
      value: "ry_v,yb_v,br_v,avg_l_l_v",
    },
    {
      label: "Current (A)",
      value: "i_b,i_r,i_y,avg_i",
    },
  ],
  SOLAR: SOLAR_PARAMETER_OPTIONS,
  TEMPERATURE: TEMPERATURE_PARAMETER_OPTIONS,
  "FIRE-SAFETY": FIRE_SAFETY_PARAMETER_OPTIONS,
  COMPRESSOR: COMPRESSOR_PARAMETER_OPTIONS,
};

export const KEY_PARAMETER_OPTIONS_MAPPING = {
  timestamp: "Timestamp",
  actpr_t: "Active Power (kW)",
  apppr_t: "Apparent Power (kVA)",
  acte_im: "Active Energy Import (kWh)",
  reacte_im: "Reactive Energy Import (kVArh)",
  pf_t: "Power Factor",
  fq: "Frequency (Hz)",
  rv: "R Phase Voltage (V)",
  yv: "Y Phase Voltage (V)",
  bv: "B Phase Voltage (V)",
  ry_v: "R-Y Voltage (V)",
  yb_v: "Y-B Voltage (V)",
  br_v: "B-R Voltage (V)",
  avg_l_l_v: "Avg Line-to-Line Voltage (V)",
  i_r: "R Phase Current (A)",
  i_y: "Y Phase Current (A)",
  i_b: "B Phase Current (A)",
  avg_i: "Average Current (A)",
  temperature: "Temperature (°C)",
  water_level: "Water Level (m)",
};

export const UNIQUE_PASTEL_BGS = [
  "#f4f8fa",
  "#f7f5fa",
  "#faf8f5",
  "#f5faf6",
  "#faf5f5",
  "#fbfaf4",
];
