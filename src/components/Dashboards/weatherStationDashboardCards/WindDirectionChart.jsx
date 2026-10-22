import { Box, useTheme } from '@mui/material';
import { useMemo } from 'react';

import { mergeChartOptions } from '../../../helpers/weatherStationChartTheme';
import { useChartHeight } from '../../../hooks/useWeatherStationChartHeight';
import ApexChart from './ApexChart';
import DashboardCard from './DashboardCard';

const WIND_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function WindDirectionChart({ data, isTrend = false, minHeight = null }) {
	const theme = useTheme();

	const { height } = useChartHeight({
		xs: 260,
		sm: 260,
		md: 310,
		lg: 300,
	});

	const series = useMemo(() => {
		if (!data?.counts) {
			return [];
		}

		return data.counts.map((v) => {
			const num = Number(v);
			return Number.isFinite(num) ? Math.round(num) : 0;
		});
	}, [data]);

	const options = useMemo(() => {
		if (!data) {
			return null;
		}

		return mergeChartOptions(theme.palette.mode, {
			chart: {
				type: 'polarArea',
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
				dropShadow: {
					enabled: true,
					top: 4,
					left: 0,
					blur: 6,
					opacity: 0.25,
				},
			},

			labels: data?.labels || WIND_LABELS,

			colors: [
				'#1976D2', // N
				'#42A5F5', // NE
				'#26C6DA', // E
				'#26A69A', // SE
				'#66BB6A', // S
				'#FFA726', // SW
				'#EF5350', // W
				'#AB47BC', // NW
			],

			stroke: {
				width: 0,
			},

			fill: {
				opacity: 0.9,
			},

			legend: {
				position: 'bottom',
				horizontalAlign: 'center',
				fontSize: '12px',
				itemMargin: {
					horizontal: 10,
					vertical: 4,
				},
			},

			plotOptions: {
				polarArea: {
					rings: {
						strokeWidth: 1,
						strokeColor: theme.palette.divider,
					},
					spokes: {
						strokeWidth: 1,
						connectorColors: theme.palette.divider,
					},
				},
			},

			yaxis: {
				show: false,
			},

			dataLabels: {
				enabled: false,
				style: {
					fontSize: '11px',
					fontWeight: 600,
				},
				formatter: (val) => (val > 0 ? val : ''),
			},

			tooltip: {
				y: {
					formatter: (val) => `${Math.round(val)} observations`,
				},
			},

			noData: {
				text: 'No wind direction data',
			},
		});
	}, [data, theme]);

	if (!data) {
		return null;
	}

	return isTrend ? (
		<Box sx={{ height: '100%' }}>
			<ApexChart
				chartKey="wind-direction"
				type="polarArea"
				options={options}
				series={series}
				height={minHeight || height}
				width="100%"
				// breakpoint={breakpoint}
			/>
		</Box>
	) : (
		<DashboardCard title="Wind Direction Distribution" sx={{ height: '100%' }}>
			<ApexChart
				chartKey="wind-direction"
				type="polarArea"
				options={options}
				series={series}
				height={minHeight || height}
				width="100%"
				// breakpoint={breakpoint}
			/>
		</DashboardCard>
	);
}

export default WindDirectionChart;
