export const ENERGY_PARAMETER_OPTIONS = [
	{
		label: 'Timestamp',
		value: 'timestamp',
	},
	{
		label: 'Active Power (kW)',
		value: 'actpr_t',
	},
	{
		label: 'Apparent Power (kVA)',
		value: 'apppr_t',
	},
	{
		label: 'Energy',
		value: 'acte_im,reacte_im,acte_ex,reacte_ex',
	},
	// {
	// 	label: 'Power Factor',
	// 	value: 'pf_t',
	// },
	{
		label: 'Frequency (Hz)',
		value: 'fq',
	},
	{
		label: 'Voltage (Line to Neutral)',
		value: 'rv,yv,bv',
	},
	{
		label: 'Voltage (Line to Line)',
		value: 'ry_v,yb_v,br_v,avg_l_l_v',
	},
	{
		label: 'TDH',
		value: 'thd_vr,thd_vy,thd_vb,thd_volt_avg,thd_ir,thd_iy,thd_ib,thd_cur_avg',
	},
	{
		label: 'Current (A)',
		value: 'i_b,i_r,i_y,avg_i',
	},
	{
		label: 'Power Factor',
		value: 'pf_r,pf_y,pf_b,pf_t',
	},
];

export const KEY_PARAMETER_OPTIONS_MAPPING = {
	timestamp: 'Timestamp',
	actpr_t: 'Active Power (kW)',
	apppr_t: 'Apparent Power (kVA)',
	acte_im: 'Active Energy Import (kWh)',
	acte_ex: 'Active Energy Export (kWh)',
	reacte_ex:'Reactive Energy Export (kVArh)',
	reacte_im: 'Reactive Energy Import (kVArh)',
	pf_t: 'Total Power Factor',
	pf_r: 'Power Factor (R Phase)',
	pf_y: 'Power Factor (Y Phase)',
	pf_b: 'Power Factor (B Phase)',
	fq: 'Frequency (Hz)',
	rv: 'R Phase Voltage (V)',
	yv: 'Y Phase Voltage (V)',
	bv: 'B Phase Voltage (V)',
	ry_v: 'R-Y Voltage (V)',
	yb_v: 'Y-B Voltage (V)',
	br_v: 'B-R Voltage (V)',
	avg_l_l_v: 'Avg Line-to-Line Voltage (V)',
	i_r: 'R Phase Current (A)',
	i_y: 'Y Phase Current (A)',
	i_b: 'B Phase Current (A)',
	avg_i: 'Average Current (A)',
	temperature: 'Temperature (°C)',
	water_level: 'Water Level (m)',
	thd_vr: 'R Phase Voltage THD',
	thd_vy: 'Y Phase Voltage THD',
	thd_vb: 'B Phase Voltage THD',
	thd_volt_avg: 'Average Voltage THD',
	thd_ir: 'R Phase Current THD',
	thd_iy: 'Y Phase Current THD',
	thd_ib: 'B Phase Current THD',
	thd_cur_avg: 'Average Current THD',
};

// Theme-reactive analytics section backgrounds. The actual colors are CSS
// variables defined per theme mode in main.jsx (GlobalStyles) — light mode
// keeps the original soft pastels, dark mode uses subtle navy tints.
export const UNIQUE_PASTEL_BGS = [
	'var(--analytics-panel-0)',
	'var(--analytics-panel-1)',
	'var(--analytics-panel-2)',
	'var(--analytics-panel-3)',
	'var(--analytics-panel-4)',
	'var(--analytics-panel-5)',
];
