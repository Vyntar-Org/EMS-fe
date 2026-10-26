import { Box, useTheme } from '@mui/material';
import { useMemo } from 'react';

import { getAxisConfig } from '../../../helpers/weatherStationChartAxis';
import { mergeChartOptions } from '../../../helpers/weatherStationChartTheme';
import { useChartHeight } from '../../../hooks/useWeatherStationChartHeight';
import NoDataFound from '../../common/errors/NoDataFound';

import ApexChart from './ApexChart';
import DashboardCard from './DashboardCard';

function RainfallTempPressureChart({ data }) {
	const theme = useTheme();

	const { height, breakpoint } = useChartHeight({
		xs: 240,
		sm: 270,
		md: 315,
		lg: 300,
	});
	const hasData = [data?.rainfall, data?.temperature, data?.pressure].some(
		(values) => Array.isArray(values) && values.length > 0
	);

	const rainfallAxis = getAxisConfig(data?.rainfall, {
		forceZero: true,
	});

	const temperatureAxis = getAxisConfig(data?.temperature);

	const pressureAxis = getAxisConfig(data?.pressure);

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

			colors: ['#2563EB', '#B91C1C', '#9333EA'],

			stroke: {
				curve: 'straight',
				width: 3,
				lineCap: 'round',
			},

			markers: {
				size: 0,
				hover: {
					size: 6,
				},
			},

			dataLabels: {
				enabled: false,
			},

			legend: {
				position: 'top',
				horizontalAlign: 'left',
			},

			grid: {
				borderColor: theme.palette.divider,
				strokeDashArray: 4,
				padding: {
					left: 0,
					right: 0,
				},
			},

			xaxis: {
				categories: data.labels,
				tickAmount: xTickAmount,
				tickPlacement: 'on',
				labels: {
					rotate: -45,
					hideOverlappingLabels: true,
					style: {
						colors: theme.palette.text.secondary,
						fontSize: '11px',
					},
				},
				axisBorder: {
					color: theme.palette.divider,
				},
				axisTicks: {
					color: theme.palette.divider,
				},
			},

			yaxis: [
				{
					seriesName: 'Rainfall mm',

					title: {
						text: 'Rainfall (mm)',
						style: { color: '#2563EB' },
					},
					labels: {
						style: { colors: '#2563EB' },
					},
					...rainfallAxis,
				},
				{
					seriesName: 'Temperature °C',
					opposite: true,

					title: {
						text: 'Temperature (°C)',
						style: { color: '#B91C1C' },
					},
					labels: {
						style: { colors: '#B91C1C' },
					},
					...temperatureAxis,
				},
				{
					seriesName: 'Pressure hPa',
					opposite: true,

					title: {
						text: 'Pressure (hPa)',
						style: { color: '#9333EA' },
					},
					labels: {
						style: { colors: '#9333EA' },
					},
					...pressureAxis,
				},
			],

			tooltip: {
				shared: true,
				intersect: false,
				followCursor: true,
				x: {
					show: true,
				},
			},

			noData: {
				text: 'No data available',
			},
		});
	}, [data, theme, xTickAmount]);

	const series = useMemo(() => {
		if (!data) {
			return [];
		}

		return [
			{
				name: 'Rainfall mm',
				type: 'line',
				data: data.rainfall,
				yAxisIndex: 0,
			},
			{
				name: 'Temperature °C',
				type: 'line',
				data: data.temperature,
				yAxisIndex: 1,
			},
			{
				name: 'Pressure hPa',
				type: 'line',
				data: data.pressure,
				yAxisIndex: 2,
			},
		];
	}, [data]);

	if (!hasData) {
		return (
			<DashboardCard title="Rainfall, Temperature & Pressure Trend">
				<Box height={height}>
					<NoDataFound message="No rainfall, temperature, or pressure readings are available." />
				</Box>
			</DashboardCard>
		);
	}

	return (
		<DashboardCard title="Rainfall, Temperature & Pressure Trend">
			<ApexChart
				chartKey="rainfall-temp-pressure"
				type="line"
				options={options}
				series={series}
				height={height}
				width="100%"
				// breakpoint={breakpoint}
			/>
		</DashboardCard>
	);
}

export default RainfallTempPressureChart;
