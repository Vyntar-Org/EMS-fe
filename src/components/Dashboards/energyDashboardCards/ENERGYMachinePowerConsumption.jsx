import { BarChart, Search, SsidChart, Bolt } from '@mui/icons-material';
import {
	Box,
	Fade,
	Grid,
	InputAdornment,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useCommonData } from '../../../contexts/CommonDataContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	CHART_COLORS,
	downsample,
	getChartOptions,
	getChartSeries,
} from '../../../helpers/chartConfig';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import CustomCard from '../../common/CustomCard';
import { CustomInput } from '../../common/CustomInput';
import NoDataFound from '../../common/errors/NoDataFound';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = CHART_COLORS.machinePower;

// Premium, rounded search field — same "surface.muted pill that glows on
// hover/focus" treatment used by the Water dashboard's device search.
const searchFieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '12px',
		backgroundColor: 'surface.muted',
		transition: '0.2s ease',
		'&:hover': { backgroundColor: 'background.paper' },
		'&.Mui-focused': {
			backgroundColor: 'background.paper',
			boxShadow: (t) =>
				`0 0 0 3px ${alpha(ACCENT, t.palette.mode === 'dark' ? 0.3 : 0.16)}`,
		},
	},
};

// One selectable device row: icon chip + name, accent-tinted when selected,
// matching the Water dashboard's validated device-list pattern.
const DeviceRow = ({ name, isActive, onClick }) => (
	<Box
		onClick={onClick}
		role="button"
		sx={{
			display: 'flex',
			alignItems: 'center',
			gap: 1,
			px: 1.25,
			py: 1,
			borderRadius: '12px',
			cursor: 'pointer',
			border: '1px solid',
			borderColor: isActive ? alpha(ACCENT, 0.45) : 'divider',
			bgcolor: isActive ? alpha(ACCENT, 0.12) : 'background.paper',
			transition: 'all 0.2s ease',
			'&:hover': {
				borderColor: alpha(ACCENT, 0.5),
				bgcolor: alpha(ACCENT, isActive ? 0.16 : 0.06),
			},
		}}
	>
		<Box
			sx={{
				width: 26,
				height: 26,
				borderRadius: '8px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				bgcolor: alpha(ACCENT, isActive ? 0.28 : 0.14),
				color: ACCENT,
				'& svg': { fontSize: 15 },
			}}
		>
			<Bolt />
		</Box>
		<Box minWidth={0} flex={1}>
			<ResponsiveTextWrapper
				value={name}
				color={isActive ? 'text.primary' : 'text.secondary'}
				fontSize="13px"
				fontWeight={isActive ? 700 : 500}
			/>
		</Box>
	</Box>
);

const ENERGYMachinePowerConsumption = ({ slavesId, setSlavesId }) => {
	const { slavesData } = useCommonData();
	const [mode, setMode] = useState(1);
	const [machineConsumption, setMachineConsumption] = useState(null);
	const [searchDevices, setSearchDevices] = useState(null);

	const slavesDisplayName = useMemo(() => {
		if (!slavesData && mode === 1) {
			return null;
		}

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? `${slave.slave_name}` : '';
	}, [slavesId, slavesData, mode]);

	const filteredSlaves = useMemo(() => {
		if (!searchDevices?.trim()) {
			return slavesData;
		}

		const searchLower = searchDevices.toLowerCase().trim();

		return slavesData.filter((slave) => {
			const nameMatch = slave.slave_name?.toLowerCase().includes(searchLower);

			return nameMatch || null;
		});
	}, [searchDevices, slavesData]);
	const fetchMachineConsumption = async () => {
		try {
			const getMachineConsumptionData = await api.get(
				`${API_URLS.EMS_DASHBOARD_MACHINE_CONSUMPTION}?slave_id=${
					slavesId || 0
				}`
			);
			if (getMachineConsumptionData?.success) {
				setMachineConsumption(getMachineConsumptionData?.data?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		}
	};

	useEffect(() => {
		if (!slavesId) {
			return;
		}

		fetchMachineConsumption();
	}, [slavesId]);

	// Downsample once so the x-axis categories and the bar/line series stay
	// aligned, and a long history doesn't crowd a card-sized chart.
	const chartData = useMemo(
		() =>
			downsample(Array.isArray(machineConsumption) ? machineConsumption : []),
		[machineConsumption]
	);

	const chartTitle =
		mode === 2 ? `${slavesDisplayName} Energy` : 'Power Consumption';

	const chartOptions = getChartOptions(mode === 1 ? 'bar' : 'line', chartData, {
		yLabel: 'kWh',
		xLabel: 'Date',
		colors: [CHART_COLORS.machinePower],
		categoryOpts: { key: 'date', customFormat: 'MMM DD' },
		chartTitle,
	});

	const series = getChartSeries(chartData, {
		actual: 'value',
		actualLabel: '(kWh)',
		includeTarget: false,
	});

	return (
		<CustomCard
			title={chartTitle}
			accentColor={ACCENT}
			icon={
				<ToggleButtonGroup
					value={mode}
					exclusive
					onChange={(e, newMode) => newMode !== null && setMode(newMode)}
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
							bgcolor: ACCENT,
							color: '#FFFFFF',
							'&:hover': { bgcolor: ACCENT },
						},
						...(slavesData?.length
							? { marginRight: { sm: '212px', md: '0', lg: '212px' } }
							: {}),
					}}
				>
					<ToggleButton value={1}>
						<BarChart sx={{ width: 20, height: 20 }} />
					</ToggleButton>
					<ToggleButton value={2}>
						<SsidChart sx={{ width: 20, height: 20 }} />
					</ToggleButton>
				</ToggleButtonGroup>
			}
		>
			{machineConsumption && machineConsumption?.length ? (
				<Box
					display="flex"
					gap={1.5}
					flexDirection={{ xs: 'column-reverse', sm: 'row' }}
					height="100%"
				>
					<Fade in key={mode === 1 ? 'bar' : 'line'} timeout={300}>
						<Box
							// flex={1}
							height="100%"
							width={{ sm: 'calc(100% - 200px - 12px)' }}
							overflow="hidden"
						>
							<ReactApexChart
								key={`chart-${mode}`}
								options={chartOptions}
								series={series}
								type={mode === 1 ? 'bar' : 'line'}
								height="100%"
								width="100%"
							/>
						</Box>
					</Fade>

					<Box
						width={{ sm: '200px' }}
						height={{ sm: '100%' }}
						position={{ sm: 'absolute', md: 'unset', lg: 'absolute' }}
						right={{ sm: 14 }}
						top={{ sm: 0 }}
						display="flex"
						flexDirection="column"
						minHeight={0}
					>
						<CustomAutocomplete
							options={filteredSlaves?.map((f) => ({
								label: f?.slave_name,
								value: f?.slave_id,
							}))}
							onChange={(e) => {
								setSlavesId(e?.value || '');
							}}
							value={slavesId || ''}
							placeholder="Search Devices..."
							size="small"
							sx={{
								display: { sm: 'none' },
								mt: 1,
								flexShrink: 0,
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
								},
							}}
						/>

						<CustomInput
							onChange={(e) => setSearchDevices(e.target.value)}
							value={searchDevices || ''}
							autoComplete="off"
							placeholder="Search devices"
							size="small"
							icon={
								<InputAdornment position="end">
									<Search sx={{ fontSize: 18, color: 'text.secondary' }} />
								</InputAdornment>
							}
							sx={{
								display: { xs: 'none', sm: 'block' },
								mt: 1,
								flexShrink: 0,
								...searchFieldSx,
							}}
						/>

						{/* flex:1 fills whatever space the search field above didn't
						    use — no need to hardcode its height. Only this list
						    scrolls, never the field above it. */}
						<Box
							flex={1}
							minHeight={0}
							overflow="auto"
							display={{ xs: 'none', sm: 'block' }}
						>
							{filteredSlaves?.length ? (
								<Grid container rowGap={1} mt={1}>
									{filteredSlaves.map((s) => {
										const isActive = slavesId === s.slave_id;
										return (
											<Grid item xs={12} key={`slaves-option-${s.slave_id}`}>
												<DeviceRow
													name={s.slave_name}
													isActive={isActive}
													onClick={() => setSlavesId(s.slave_id)}
												/>
											</Grid>
										);
									})}
								</Grid>
							) : (
								<NoDataFound message="Waiting for live device data — readings appear automatically" />
							)}
						</Box>
					</Box>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYMachinePowerConsumption;
