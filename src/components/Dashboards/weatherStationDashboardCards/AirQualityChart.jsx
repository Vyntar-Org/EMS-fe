import { Box, useTheme } from '@mui/material';
import { useMemo } from 'react';

import { getAxisConfig } from '../../../helpers/weatherStationChartAxis';
import { mergeChartOptions } from '../../../helpers/weatherStationChartTheme';
import { useChartHeight } from '../../../hooks/useWeatherStationChartHeight';
import NoDataFound from '../../common/errors/NoDataFound';

import ApexChart from './ApexChart';
import DashboardCard from './DashboardCard';

function AirQualityChart({ data }) {
	const theme = useTheme();

	const { height, breakpoint } = useChartHeight({
		xs: 240,
		sm: 250,
		md: 260,
		lg: 260,
	});
	const hasData = [data?.aqi, data?.pm2_5].some(
		(values) => Array.isArray(values) && values.length > 0
	);

	const aqiAxis = getAxisConfig(data?.aqi);

	const pmAxis = getAxisConfig(data?.pm2_5);

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

			colors: ['#F59E0B', '#EF4444'],

			stroke: {
				width: 3,
				curve: 'straight',
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
					seriesName: 'AQI',
					title: {
						text: 'AQI',
						style: { color: '#F59E0B' },
					},
					labels: {
						style: { colors: '#F59E0B' },
					},
					...aqiAxis,
				},
				{
					seriesName: 'PM2.5 µg/m³',
					opposite: true,
					title: {
						text: 'PM2.5 (µg/m³)',
						style: { color: '#EF4444' },
					},
					labels: {
						style: { colors: '#EF4444' },
					},
					...pmAxis,
				},
			],

			grid: {
				borderColor: theme.palette.divider,
				strokeDashArray: 4,
			},

			legend: {
				position: 'top',
				horizontalAlign: 'center',
			},

			tooltip: {
				shared: true,
				intersect: false,
			},

			noData: {
				text: 'No air quality data available',
			},
		});
	}, [data, theme, xTickAmount]);

	const series = useMemo(() => {
		if (!data) {
			return [];
		}

		return [
			{
				name: 'AQI',
				data: data.aqi ?? [],
			},
			{
				name: 'PM2.5 µg/m³',
				data: data.pm2_5 ?? [],
			},
		];
	}, [data]);

	if (!hasData || !options) {
		return (
			<DashboardCard title="Air Quality Analysis" sx={{ height: '100%' }}>
				<Box height={height}>
					<NoDataFound message="No air-quality readings are available." />
				</Box>
			</DashboardCard>
		);
	}

	return (
		<DashboardCard title="Air Quality Analysis" sx={{ height: '100%' }}>
			<ApexChart
				chartKey="air-quality"
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

export default AirQualityChart;
