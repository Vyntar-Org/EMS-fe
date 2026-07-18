import { CHART_COLORS } from '../../../helpers/chartConfig';
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

	const series = [
		{
			name: '(kWh)',
			data:
				consumption?.data?.map((item) => Math.round(item.consumption)) || [],
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
		},
		stroke: {
			curve: 'smooth',
			width: 3,
			colors: [CHART_COLORS.navy],
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
		dataLabels: {
			enabled: true,
			offsetY: -10,
			style: {
				fontSize: '12px',
				colors: [CHART_COLORS.navy],
			},
		},
		xaxis: {
			categories:
				consumption?.data?.map((item) => {
					const date = new Date(item.hour);
					return date.getHours().toString().padStart(2, '0') + '.00';
				}) || [],
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: {
			labels: {
				formatter: (val) => Math.round(val),
			},
		},
		tooltip: {
			x: { show: true },
			y: {
				formatter: (val) => `${val} kWh`,
			},
		},
		colors: [CHART_COLORS.navy],
		grid: {
			show: false,
		},
	};

	return (
		<CustomCard title="Energy Consumption (Last 6 Hours)">
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
