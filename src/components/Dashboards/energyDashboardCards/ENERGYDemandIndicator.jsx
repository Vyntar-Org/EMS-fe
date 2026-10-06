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
		const payload = demandIndicator?.data ?? demandIndicator;

		const getReadings = (key) => {
			const bucket = Array.isArray(payload)
				? payload.find((item) => item?.[key] !== undefined)?.[key]
				: payload?.[key];

			if (Array.isArray(bucket)) {
				return bucket;
			}

			// The new API groups each series in an object containing its own list.
			return (
				[bucket?.data, bucket?.list, bucket?.points, bucket?.readings].find(
					Array.isArray
				) || []
			);
		};

		const toPoints = (readings, key) => {
			if (!Array.isArray(readings)) {
				return [];
			}

			const points = readings
				.map((item) => {
					const value = item?.value ?? item?.[key];

					return {
						x: new Date(item?.timestamp).getTime(),
						y:
							value === null || value === undefined || value === ''
								? Number.NaN
								: Number(value),
					};
				})
				.filter((point) => !Number.isNaN(point.x) && Number.isFinite(point.y))
				.sort((a, b) => a.x - b.x);

			// Keep each trend readable on a card-sized chart instead of plotting
			// every raw reading.
			return downsample(points);
		};

		return {
			positive: toPoints(getReadings('positive'), 'positive'),
			negative: toPoints(getReadings('negative'), 'negative'),
		};
	}, [demandIndicator]);

	const hasData = seriesData.positive.length + seriesData.negative.length > 0;

	const yAxes = useMemo(() => {
		const getRange = (points, fallback) => {
			if (!points.length) {
				return fallback;
			}

			const values = points.map((point) => point.y);
			const minValue = Math.min(...values);
			const maxValue = Math.max(...values);

			if (minValue === maxValue) {
				const padding = Math.max(Math.abs(minValue) * 0.2, 1);
				return {
					min: Math.floor(Math.min(0, minValue - padding)),
					max: Math.ceil(Math.max(0, maxValue + padding)),
				};
			}

			const padding = (maxValue - minValue) * 0.1;
			return {
				min: Math.floor(Math.min(0, minValue - padding)),
				max: Math.ceil(Math.max(0, maxValue + padding)),
			};
		};

		return [
			{
				seriesName: 'Positive Demand',
				...getRange(seriesData.positive, { min: 0, max: 14 }),
				tickAmount: 2,
				title: { text: '' },
				axisBorder: { color: CHART_COLORS.demand },
				axisTicks: { color: CHART_COLORS.demand },
				labels: { style: { colors: CHART_COLORS.demand } },
			},
			{
				seriesName: 'Negative Demand',
				...getRange(seriesData.negative, { min: -14, max: 0 }),
				opposite: true,
				tickAmount: 2,
				title: { text: '' },
				axisBorder: { color: CHART_COLORS.danger },
				axisTicks: { color: CHART_COLORS.danger },
				labels: {
					offsetX: 2,
					style: { colors: CHART_COLORS.danger },
				},
			},
		];
	}, [seriesData]);

	const series = [
		{
			name: 'Positive Demand',
			data: seriesData.positive,
		},
		{
			name: 'Negative Demand',
			data: seriesData.negative,
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
			{hasData ? (
				<Fade in key={chartType} timeout={300}>
					<Box height="100%" width="100%" overflow="hidden">
						<CustomApexChart
							key={chartType}
							series={series}
							type={chartType === 'bar' ? 'bar' : 'line'}
							colors={[CHART_COLORS.demand, CHART_COLORS.danger]}
							xAxesType="datetime"
							granularity="time"
							unit="kW"
							tickAmount={4}
							showToolbar={false}
							customOptions={{
								yaxis: yAxes,
								legend: { show: false },
							}}
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
