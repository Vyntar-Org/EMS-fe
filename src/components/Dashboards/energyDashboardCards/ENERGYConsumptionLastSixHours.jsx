import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	CHART_COLORS,
	DEFAULT_MAX_POINTS,
	getChartSeries,
} from '../../../helpers/chartConfig';
import CustomApexChart from '../../common/CustomApexChart';
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

	return (
		<CustomCard
			title="Energy Consumption (Last 6 Hours)"
			accentColor={CHART_COLORS.consumption6h}
		>
			{consumption && consumption?.data?.length ? (
				<Box height="100%" width="100%" overflow="hidden">
					<CustomApexChart
						series={series}
						type="area"
						colors={[CHART_COLORS.consumption6h]}
						xAxesType="category"
						height="100%"
						// title="Energy Consumption (Last 6 Hours)"
					/>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYConsumptionLastSixHours;
