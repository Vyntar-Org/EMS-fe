// Deliberate preview source, independent of the dashboard request result.
// Percent units are configured only for this static reference preview.
// This does not confirm real device units or connectivity.
export const waterMonitorMockMachines = [
	{
		slave_id: 'water-monitor-preview',
		name: 'Main Borewell Motor ',
		status: 'unknown',
		metrics: { TankLevel: { unit: '%' } },
		details: {
			location: 'Under Ground',
			sensor_label: 'Sample 01',
			gateway: 'DEMO-GW-01',
			firmware: 'demo-1.0',
		},
		// Fictional previous readings for the explicitly labeled demo only.
		previous: {
			comparison_label: 'vs. last hour',
			flowrate: '4.00',
			totalizer: '240.00',
		},
		// Fictional consumption data for this explicitly labeled demo only.
		summary: {
			today: {
				value: '27',
				unit: 'KLD',
				previous: '26',
				comparison_label: 'vs. yesterday',
			},
			mtd: {
				value: '465',
				unit: 'KL',
				previous: '438',
				comparison_label: 'vs. last month',
			},
		},
		latest: {
			TankLevel: '25',
			flowrate: '5.00',
			totalizer: '243.60',
			controlMode: 'manual',
			motorRunState: '0',
		},
	},

	{
		slave_id: 'water-monitor-preview2',
		name: 'Top Head Tank Motor1',
		status: 'unknown',
		metrics: { TankLevel: { unit: '%' } },
		details: {
			location: 'Teerace zone A',
			sensor_label: 'Sample 02',
			gateway: 'DEMO-GW-02',
			firmware: 'demo-1.0',
		},
		// Fictional previous readings for the explicitly labeled demo only.
		previous: {
			comparison_label: 'vs. last hour',
			flowrate: '1.20',
			totalizer: '29155.60',
		},
		// Fictional consumption data for this explicitly labeled demo only.
		summary: {
			today: {
				value: '8',
				unit: 'KLD',
				previous: '7',
				comparison_label: 'vs. yesterday',
			},
			mtd: {
				value: '224',
				unit: 'KL',
				previous: '210',
				comparison_label: 'vs. last month',
			},
		},
		latest: {
			TankLevel: '50',
			flowrate: '0.00',
			totalizer: '29158.60',
			controlMode: 'auto',
			motorRunState: '1',
		},
	},
	{
		slave_id: 'water-monitor-preview3',
		name: 'Storage Tank Motor1',
		status: 'unknown',
		metrics: { TankLevel: { unit: '%' } },
		details: {
			location: 'Teerace zone B',
			sensor_label: 'Sample 03',
			gateway: 'DEMO-GW-03',
			firmware: 'demo-1.0',
		},
		// Fictional previous readings for the explicitly labeled demo only.
		previous: {
			comparison_label: 'vs. last hour',
			flowrate: '0.00',
			totalizer: '242.10',
		},
		// Fictional consumption data for this explicitly labeled demo only.
		summary: {
			today: {
				value: '0',
				unit: 'KLD',
				previous: '0',
				comparison_label: 'vs. yesterday',
			},
			mtd: {
				value: '18',
				unit: 'KL',
				previous: '16',
				comparison_label: 'vs. last month',
			},
		},
		latest: {
			TankLevel: '75',
			flowrate: '0.00',
			totalizer: '243.60',
			controlMode: 'manual',
			motorRunState: '0',
		},
	},
	{
		slave_id: 'water-monitor-preview4',
		name: 'Secondary Borewell Motor ',
		status: 'unknown',
		metrics: { TankLevel: { unit: '%' } },
		details: {
			location: 'Teerrace zone C',
			sensor_label: 'Sample 04',
			gateway: 'DEMO-GW-03',
			firmware: 'demo-1.0',
		},
		// Fictional previous readings for the explicitly labeled demo only.
		previous: {
			comparison_label: 'vs. last hour',
			flowrate: '0.00',
			totalizer: '241.00',
		},
		// Fictional consumption data for this explicitly labeled demo only.
		summary: {
			today: {
				value: '3',
				unit: 'KLD',
				previous: '4',
				comparison_label: 'vs. yesterday',
			},
			mtd: {
				value: '28',
				unit: 'KL',
				previous: '25',
				comparison_label: 'vs. last month',
			},
		},
		latest: {
			TankLevel: '100',
			flowrate: '0.00',
			totalizer: '243.60',
			controlMode: 'auto',
			motorRunState: '0',
		},
	},
];
