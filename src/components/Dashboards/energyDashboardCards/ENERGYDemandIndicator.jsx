import { Box } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import { useCommonData } from '../../../contexts/CommonDataContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { CHART_COLORS, downsample } from '../../../helpers/chartConfig';
import CustomApexChart from '../../common/CustomApexChart';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

const ENERGYDemandIndicator = ({ slavesId }) => {
	const { slavesData } = useCommonData();
	const [demandIndicator, setDemandIndicator] = useState(null);

	const slavesDisplayName = useMemo(() => {
		if (!slavesData) {
			return null;
		}

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? ` - ${slave.slave_name}` : '';
	}, [slavesId, slavesData]);

	const fetchDemandIndicator = async () => {
		try {
			const getDemandIndicatorData = await api.get(
				`${API_URLS.EMS_DASHBOARD_DEMAND_INDICATOR}?slave_id=${slavesId || 0}`
			);
			if (getDemandIndicatorData?.success) {
				setDemandIndicator(getDemandIndicatorData?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		}
	};

	useEffect(() => {
		if (!slavesId) {
			return;
		}

		fetchDemandIndicator();
	}, [slavesId]);

	const seriesData = useMemo(() => {
		if (!demandIndicator?.data) {
			return [];
		}

		const points = demandIndicator.data
			.map((item) => ({
				x: new Date(item.timestamp).getTime(),
				y: item.value,
			}))
			.filter(
				(point) =>
					!Number.isNaN(point.x) && point.y !== null && point.y !== undefined
			)
			.sort((a, b) => a.x - b.x);

		// Keep the trend readable on a card-sized chart instead of plotting
		// every raw reading.
		return downsample(points);
	}, [demandIndicator]);

	const series = [
		{
			name: 'Peak Demand',
			data: seriesData,
		},
	];

	return (
		<CustomCard
			title={`Demand Indicator ${slavesDisplayName}`}
			accentColor={CHART_COLORS.demand}
		>
			{demandIndicator && demandIndicator?.data?.length ? (
				<Box height="100%" width="100%" overflow="hidden">
					<CustomApexChart
						series={series}
						type="area"
						colors={[CHART_COLORS.demand]}
						xAxesType="datetime"
						height="100%"
					/>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYDemandIndicator;
