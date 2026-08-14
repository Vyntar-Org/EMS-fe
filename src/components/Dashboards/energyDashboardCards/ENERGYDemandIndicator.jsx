import {
	Box,
	ToggleButtonGroup,
	ToggleButton,
	Grow,
	Fade,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useCommonData } from '../../../contexts/CommonDataContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	CHART_COLORS,
	buildPremiumTooltip,
	downsample,
	formatChartValue,
} from '../../../helpers/chartConfig';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { BarChart, SsidChart } from '@mui/icons-material';

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

	const baseOptions = {
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
		dataLabels: { enabled: false },
		colors: [CHART_COLORS.demand],
		stroke: {
			curve: 'smooth',
			width: 3,
			colors: [CHART_COLORS.demand],
		},
		markers: {
			size: 0,
			strokeColors: '#fff',
			strokeWidth: 2,
			hover: { size: 7 },
		},
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.2,
				opacityTo: 0,
				stops: [0, 90, 100],
			},
		},
		xaxis: {
			type: 'datetime',
			title: {
				text: 'Time',
				style: { color: CHART_COLORS.secondary, fontWeight: 'bold' },
			},
			labels: {
				format: 'HH:mm',
				datetimeUTC: false,
				style: { colors: CHART_COLORS.secondary },
			},
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: {
			min: 0,
			max: yAxisMax,
			tickAmount: 4,
			title: {
				text: 'Demand (kW)',
				style: { color: CHART_COLORS.secondary, fontWeight: 'bold' },
			},
			labels: {
				style: { colors: CHART_COLORS.secondary },
				formatter: (val) => formatChartValue(val),
			},
		},
		tooltip: {
			shared: true,
			intersect: false,
			fixed: { enabled: true, position: 'topRight', offsetX: 0, offsetY: 0 },
			custom: buildPremiumTooltip({
				unit: 'kW',
				chartTitle: 'Peak Demand Indicator',
			}),
		},
		// grid: { show: false },
	};

	// If user selects 'bar', adjust a few props for bar rendering while
	// preserving the colors/tooltip/axis styling the component currently uses.
	const options =
		chartType === 'bar'
			? {
					...baseOptions,
					chart: { ...baseOptions.chart, type: 'bar' },
					plotOptions: {
						bar: { borderRadius: 6, columnWidth: '60%' },
					},
					fill: {
						type: 'gradient',
						gradient: { shadeIntensity: 1, opacityFrom: 1, opacityTo: 0.85 },
					},
					stroke: { show: false, width: 0 },
					markers: { size: 0 },
			  }
			: baseOptions;

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
						<ReactApexChart
							options={options}
							series={series}
							type={chartType === 'bar' ? 'bar' : 'area'}
							height="100%"
							width="100%"
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
