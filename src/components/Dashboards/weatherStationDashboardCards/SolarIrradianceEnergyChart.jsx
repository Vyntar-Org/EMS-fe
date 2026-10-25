import { Box, useTheme } from '@mui/material';
import { useMemo } from 'react';

import { getAxisConfig } from '../../../helpers/weatherStationChartAxis';
import { mergeChartOptions } from '../../../helpers/weatherStationChartTheme';
import { useChartHeight } from '../../../hooks/useWeatherStationChartHeight';
import NoDataFound from '../../common/errors/NoDataFound';

import ApexChart from './ApexChart';
import DashboardCard from './DashboardCard';

function SolarIrradianceEnergyChart({ data }) {
	const theme = useTheme();

	const { height, breakpoint } = useChartHeight({
		xs: 240,
		sm: 270,
		md: 315,
		lg: 300,
	});
	const hasIrradiance =
		Array.isArray(data?.irradiance) && data.irradiance.length > 0;
	const hasEnergy = Array.isArray(data?.energy) && data.energy.length > 0;

	const irradianceAxis = getAxisConfig(data?.irradiance, {
		forceZero: true,
	});

	const energyAxis = getAxisConfig(data?.energy, {
		forceZero: true,
	});

	const maxXTicks = breakpoint === 'xs' ? 5 : breakpoint === 'sm' ? 6 : 8;
	const xTickAmount = Math.max(
		1,
		Math.min(maxXTicks, (data?.labels?.length || maxXTicks) - 1)
	);

	const options = useMemo(() => {
		if (!data) {
			return null;
		}

		return mergeChartOptions(theme.palette.mode, {
			chart: {
				type: 'line',
				background: 'transparent',
				toolbar: {
					show: true,
					tools: {
						download: true,
						selection: false,
						zoom: false,
						zoomin: false,
						zoomout: false,
						pan: false,
						reset: false,
					},
				},
				zoom: {
					enabled: false,
				},
				dropShadow: {
					enabled: true,
					top: 6,
					left: 0,
					blur: 6,
					opacity: 0.12,
				},
			},

			colors: ['#D97706', '#C2410C'],

			stroke: {
				width: [0, 3],
				curve: 'straight',
				lineCap: 'round',
			},

			markers: {
				size: 0,
			},

			plotOptions: {
				bar: {
					columnWidth: '50%',
					borderRadius: 3,
				},
			},

			dataLabels: {
				enabled: false,
			},

			xaxis: {
				categories: data.labels,
				tickAmount: xTickAmount,
				labels: {
					style: {
						colors: theme.palette.text.secondary,
						fontSize: '11px',
					},
				},
			},

			yaxis: [
				{
					seriesName: 'Irradiance W/m²',
					title: {
						text: 'Irradiance (W/m²)',
						style: { color: '#D97706' },
					},
					labels: {
						style: { colors: '#D97706' },
					},
					...irradianceAxis,
				},
				...(hasEnergy
					? [
							{
								seriesName: 'Energy kWh',
								opposite: true,
								title: {
									text: 'Energy (kWh)',
									style: { color: '#C2410C' },
								},
								labels: {
									style: { colors: '#C2410C' },
								},
								...energyAxis,
							},
					  ]
					: []),
			],

			grid: {
				borderColor: theme.palette.divider,
				strokeDashArray: 4,
			},

			legend: {
				position: 'top',
				horizontalAlign: 'left',
			},

			tooltip: {
				shared: true,
				intersect: false,
				followCursor: true,
			},

			noData: {
				text: 'No solar data available',
			},
		});
	}, [data, energyAxis, hasEnergy, irradianceAxis, theme, xTickAmount]);

	const series = useMemo(() => {
		if (!data) {
			return [];
		}

		const nextSeries = [
			{
				name: 'Irradiance W/m²',
				type: 'column',
				data: data.irradiance ?? [],
			},
		];

		if (hasEnergy) {
			nextSeries.push({
				name: 'Energy kWh',
				type: 'line',
				data: data.energy ?? [],
			});
		}

		return nextSeries;
	}, [data, hasEnergy]);

	if ((!hasIrradiance && !hasEnergy) || !options) {
		return (
			<DashboardCard title="Solar Irradiance Trend">
				<Box height={height}>
					<NoDataFound message="No solar-irradiance readings are available." />
				</Box>
			</DashboardCard>
		);
	}

	return (
		<DashboardCard
			title={
				hasEnergy
					? 'Solar Irradiance vs Energy Generation'
					: 'Solar Irradiance Trend'
			}
		>
			<ApexChart
				chartKey="solar-irradiance-energy"
				options={options}
				series={series}
				type="line"
				height={height}
				width="100%"
				// breakpoint={breakpoint}
			/>
		</DashboardCard>
	);
}

export default SolarIrradianceEnergyChart;
