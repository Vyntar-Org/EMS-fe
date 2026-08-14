import {
	Box,
	ToggleButton,
	ToggleButtonGroup,
	Grow,
	Fade,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';

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
import { BarChart, ShowChart, SsidChart } from '@mui/icons-material';

const ENERGYConsumptionLastSixHours = () => {
	const [consumption, setConsumption] = useState(null);
	const [chartType, setChartType] = useState('line');

	const fetchConsumptionData = async () => {
		try {
			const getConsumptionData = await api.get(
				API_URLS.EMS_DASHBOARD_HOURLY_CONSUMPTION + '?hours=24'
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

	const options = getChartOptions(
		chartType === 'bar' ? 'bar' : 'area',
		hourlyData,
		{
			yLabel: 'kWh',
			xLabel: 'Hour',
			colors: [CHART_COLORS.consumption6h],
			// The API returns one point per hour as an ISO timestamp under
			// `hour` — format it as a bare "HH.00" tick (brackets escape the
			// literal ".00" from dayjs's token parser) instead of a full date.
			categoryOpts: { key: 'hour', customFormat: 'HH.[00]' },
			chartTitle: 'Energy Consumption (Last 24 Hours)',
		}
	);

	const handleChartTypeChange = (_e, val) => {
		if (val) {
			setChartType(val);
		}
	};

	// Small toggle placed in the card header (passed as `icon` prop to CustomCard)
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
					bgcolor: CHART_COLORS.consumption6h,
					color: '#FFFFFF',
					'&:hover': { bgcolor: CHART_COLORS.consumption6h },
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
			title="Energy Consumption (Last 24 Hours)"
			accentColor={CHART_COLORS.consumption6h}
			icon={chartToggle}
		>
			{consumption && consumption?.data?.length ? (
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

export default ENERGYConsumptionLastSixHours;
