import React, { useEffect, useMemo, useState } from 'react';
import CustomCard from '../../common/CustomCard';
import { useCommonData } from '../../../contexts/CommonDataContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	Box,
	Button,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { BarChart, SsidChart } from '@mui/icons-material';
import ReactApexChart from 'react-apexcharts';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import { CustomInput } from '../../common/CustomInput';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import NoDataFound from '../../common/errors/NoDataFound';
import { getChartOptions, getChartSeries } from '../../../helpers/chartConfig';

const WATERMonthlyConsumption = ({ slavesId, setSlavesId }) => {
	const { slavesData } = useCommonData();
	const [mode, setMode] = useState(1);
	const [machineConsumption, setMachineConsumption] = useState(null);
	const [searchDevices, setSearchDevices] = useState(null);

	const slavesDisplayName = useMemo(() => {
		if (!slavesData) return null;

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? `${slave.slave_name}` : '';
	}, [slavesId, slavesData]);

	const filteredSlaves = useMemo(() => {
		if (!searchDevices?.trim()) return slavesData;

		const searchLower = searchDevices.toLowerCase().trim();

		return slavesData.filter((slave) => {
			const nameMatch = slave.slave_name?.toLowerCase().includes(searchLower);

			return nameMatch || null;
		});
	}, [searchDevices, slavesData]);
	const fetchMachineConsumption = async () => {
		try {
			const getMachineConsumptionData = await api.get(
				`${API_URLS.WATER_DASHBOARD_DAILY_CONSUMPTION(slavesId || 0)}`
			);
			if (getMachineConsumptionData?.success) {
				setMachineConsumption(getMachineConsumptionData?.data?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		}
	};

	useEffect(() => {
		if (!slavesId) return;

		fetchMachineConsumption();
	}, [slavesId]);

	return (
		<CustomCard
			title={`Monthly Water Consumption ${
				slavesDisplayName ? `- ${slavesDisplayName}` : ''
			}`}
			icon={
				<ToggleButtonGroup
					value={mode}
					exclusive
					onChange={(e, newMode) => newMode !== null && setMode(newMode)}
					sx={{
						height: '28px',
						bgcolor: 'background.paper',
						'& .MuiToggleButton-root.Mui-selected': {
							bgcolor: 'primary.main',
							color: 'white',
							'&:hover': { bgcolor: 'primary.dark' },
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
					<Box
						// flex={1}
						height="100%"
						width={{ sm: 'calc(100% - 200px - 12px)' }}
						overflow="hidden"
					>
						<ReactApexChart
							key={`chart-${mode}`}
							options={getChartOptions(
								mode === 1 ? 'bar' : 'line',
								machineConsumption,
								{ yLabel: 'Liters', xLabel: 'Day' }
							)}
							series={getChartSeries(machineConsumption, {
								actual: 'consumption',
								target: 'target',
								actualLabel: 'Actual Consumption',
								targetLabel: 'Target',
							})}
							type={mode === 1 ? 'bar' : 'line'}
							height="100%"
							width="100%"
						/>
					</Box>

					<Box
						width={{ sm: '200px' }}
						height={{ sm: '100%' }}
						position={{ sm: 'absolute', md: 'unset', lg: 'absolute' }}
						// bgcolor="#fff"
						right={{ sm: 14 }}
						top={{ sm: 6 }}
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
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
								},
							}}
						/>

						<CustomInput
							onChange={(e) => setSearchDevices(e.target.value)}
							value={searchDevices || ''}
							autoComplete="off"
							placeholder="Search Devices"
							size="small"
							sx={{
								display: { xs: 'none', sm: 'block' },
								mt: 1,
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
								},
							}}
						/>

						<Box
							height={{ sm: 'calc(100% - 40px - 24px)' }}
							overflow="auto"
							display={{ xs: 'none', sm: 'block' }}
						>
							{filteredSlaves?.length ? (
								<Grid container rowGap={1} mt={1}>
									{filteredSlaves.map((s) => {
										const isActive = slavesId === s.slave_id;
										return (
											<Grid item xs={12} key={`slaves-option-${s.slave_id}`}>
												<Button
													onClick={() => {
														setSlavesId(s.slave_id);
													}}
													disableElevation
													sx={{
														justifyContent: 'start',
														borderRadius: 2,
														textTransform: 'none',
														bgcolor: isActive ? '#0a223e' : '#fff',
														border: '2px solid',
														borderColor: isActive ? '#0a223e' : '#ccc',
														':hover': {
															bgcolor: isActive ? '#0a223e' : '#fff',
														},
													}}
													variant="contained"
													fullWidth
												>
													<ResponsiveTextWrapper
														value={s.slave_name}
														color={isActive ? '#fff' : '#0a223e'}
														fontSize="14px"
														textAlign="start"
														fontWeight={600}
													/>
												</Button>
											</Grid>
										);
									})}
								</Grid>
							) : (
								<NoDataFound />
							)}
						</Box>
					</Box>
				</Box>
			) : (
				<NoDataFound />
			)}
		</CustomCard>
	);
};

export default WATERMonthlyConsumption;
