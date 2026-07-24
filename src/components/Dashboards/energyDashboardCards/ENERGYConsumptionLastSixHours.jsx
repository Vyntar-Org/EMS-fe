import {
	CHART_COLORS,
	buildPremiumTooltip,
	downsample,
} from '../../../helpers/chartConfig';
import React, { useEffect, useState } from 'react';
import CustomCard from '../../common/CustomCard';
import { API_URLS } from '../../../helpers/apiUrls';
import { api } from '../../../helpers/api';
import NoDataFound from '../../common/errors/NoDataFound';
import ReactApexChart from 'react-apexcharts';
import { Box } from '@mui/material';

const ENERGYConsumptionLastSixHours = () => {
	const [consumption, setConsumption] = useState(null);

	const fetchConsumptionData = async () => {
		try {
			const getConsumptionData = await api.get(
				API_URLS.EMS_DASHBOARD_HOURLY_CONSUMPTION
			);
			if (getConsumptionData?.success) {
				setConsumption(getConsumptionData?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		}
	};

	useEffect(() => {
		fetchConsumptionData();
	}, []);

	// Safety cap — the API is expected to return one point per hour, but
	// guard against a larger payload crowding a card-sized chart.
	const hourlyData = downsample(consumption?.data || []);

	const series = [
		{
			name: '(kWh)',
			data: hourlyData.map((item) => Math.round(item.consumption)),
		},
	];

	const options = {
		chart: {
			type: 'area',
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
			zoom: { enabled: false },
			redrawOnParentResize: true,
			redrawOnWindowResize: true,
		},
		stroke: {
			curve: 'smooth',
			width: 3,
			colors: [CHART_COLORS.consumption6h],
		},
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.1,
				opacityTo: 0,
				stops: [0, 90, 100],
			},
		},
		dataLabels: { enabled: false },
		markers: {
			size: 0,
			strokeWidth: 0,
			hover: { size: 6 },
		},
		xaxis: {
			categories: hourlyData.map((item) => {
				const date = new Date(item.hour);
				return date.getHours().toString().padStart(2, '0') + '.00';
			}),
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: {
			labels: {
				formatter: (val) => Math.round(val),
			},
		},
		tooltip: {
			shared: true,
			intersect: false,
			fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 },
			custom: buildPremiumTooltip({ unit: 'kWh' }),
		},
		colors: [CHART_COLORS.consumption6h],
		grid: {
			show: false,
		},
	};

	return (
		<CustomCard
			title="Energy Consumption (Last 6 Hours)"
			accentColor={CHART_COLORS.consumption6h}
		>
			{consumption && consumption?.data?.length ? (
				<Box height="100%" width="100%" overflow="hidden">
					<ReactApexChart
						options={options}
						series={series}
						type="area"
						height="100%"
						width="100%"
					/>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYConsumptionLastSixHours;
