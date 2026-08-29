import { BarChart, SsidChart } from '@mui/icons-material';
import { Box, Fade, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

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
	const [chartType, setChartType] = useState('line');

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

	const yAxisMax = useMemo(() => {
		if (!seriesData.length) {
			return 14;
		}

		const maxValue = Math.max(...seriesData.map((point) => point.y));
		return maxValue <= 0 ? 14 : Math.ceil(maxValue * 1.2);
	}, [seriesData]);

	const series = [
		{
			name: 'Peak Demand',
			data: seriesData,
		},
	];

	const handleChartTypeChange = (_e, val) => {
		if (val) {
			setChartType(val);
		}
	};

	const chartToggle = (
		<ToggleButtonGroup
			value={chartType}
			exclusive
			onChange={handleChartTypeChange}
			size="small"
			aria-label="chart type"
			sx={{
				height: '28px',
				bgcolor: 'background.paper',
				border: '1px solid',
				borderColor: 'divider',
				'& .MuiToggleButton-root': {
					border: 'none',
					color: 'text.secondary',
				},
				'& .MuiToggleButton-root.Mui-selected': {
					bgcolor: CHART_COLORS.demand,
					color: '#FFFFFF',
					'&:hover': { bgcolor: CHART_COLORS.demand },
				},
			}}
		>
			<ToggleButton value="line" aria-label="line">
				<SsidChart fontSize="small" />
			</ToggleButton>
			<ToggleButton value="bar" aria-label="bar">
				<BarChart fontSize="small" />
			</ToggleButton>
		</ToggleButtonGroup>
	);

	return (
		<CustomCard
			title={`Demand Indicator ${slavesDisplayName}`}
			accentColor={CHART_COLORS.demand}
			icon={chartToggle}
		>
			{demandIndicator && demandIndicator?.data?.length ? (
				<Fade in key={chartType} timeout={300}>
					<Box height="100%" width="100%" overflow="hidden">
						<CustomApexChart
							key={chartType}
							series={series}
							type={chartType === 'bar' ? 'bar' : 'area'}
							colors={[CHART_COLORS.demand]}
							xAxesType="datetime"
							granularity="time"
							unit="kW"
							tickAmount={4}
							showToolbar={false}
							customOptions={{ yaxis: { min: 0, max: yAxisMax } }}
							height="100%"
						/>
					</Box>
				</Fade>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYDemandIndicator;
