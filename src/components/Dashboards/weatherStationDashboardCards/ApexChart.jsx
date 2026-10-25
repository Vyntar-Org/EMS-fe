import { Box } from '@mui/material';
import { useEffect, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

import { getResponsiveChartLayout } from '../../../helpers/weatherStationChartTheme';

/**
 * Apex chart that redraws when viewport / MUI breakpoint changes (no reload needed).
 */
function ApexChart({
	chartKey,
	options,
	series,
	type,
	height,
	breakpoint = 'lg',
	width = '100%',
}) {
	const chartInstanceKey = `${chartKey}-${breakpoint}-${height}`;

	const stableOptions = useMemo(() => {
		const responsive = getResponsiveChartLayout(breakpoint);
		return {
			...options,
			...responsive,
			chart: {
				...options?.chart,
				...responsive.chart,
				id: chartKey,
				redrawOnParentResize: true,
				redrawOnWindowResize: true,
				toolbar: {
					...options?.chart?.toolbar,
					...responsive.chart?.toolbar,
				},
			},
			legend: {
				...options?.legend,
				...responsive.legend,
			},
		};
	}, [options, chartKey, breakpoint]);

	const stableSeries = useMemo(() => series, [series]);

	useEffect(() => {
		const timer = setTimeout(() => {
			window.dispatchEvent(new Event('resize'));
		}, 150);
		return () => clearTimeout(timer);
	}, [breakpoint, height]);

	return (
		<Box sx={{ width: '100%', minHeight: height }}>
			<ReactApexChart
				key={chartInstanceKey}
				options={stableOptions}
				series={stableSeries}
				type={type}
				height={height}
				width={width}
			/>
		</Box>
	);
}

export default ApexChart;
