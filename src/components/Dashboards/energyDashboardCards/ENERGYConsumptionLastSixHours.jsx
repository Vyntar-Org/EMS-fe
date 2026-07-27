import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	CHART_COLORS,
	DEFAULT_MAX_POINTS,
	getChartOptions,
	getChartSeries,
} from '../../../helpers/chartConfig';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

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

	const hourlyData = consumption?.data || [];

	const series = getChartSeries(
		hourlyData,
		{
			actual: 'consumption',
			actualLabel: '(kWh)',
			includeTarget: false,
		},
		DEFAULT_MAX_POINTS
	);

	const options = getChartOptions('area', hourlyData, {
		yLabel: 'kWh',
		xLabel: 'Hour',
		colors: [CHART_COLORS.consumption6h],
		// The API returns one point per hour as an ISO timestamp under
		// `hour` — format it as a bare "HH.00" tick (brackets escape the
		// literal ".00" from dayjs's token parser) instead of a full date.
		categoryOpts: { key: 'hour', customFormat: 'HH.[00]' },
		chartTitle: 'Energy Consumption (Last 6 Hours)',
	});

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
