import { BarChart, Search, SsidChart, WaterDrop } from '@mui/icons-material';
import {
	Box,
	Grid,
	InputAdornment,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useCommonData } from '../../../contexts/CommonDataContext';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import {
	CHART_COLORS,
	DEFAULT_MAX_POINTS,
	getChartOptions,
	getChartSeries,
} from '../../../helpers/chartConfig';
import { CustomAutocomplete } from '../../common/CustomAutocomplete';
import CustomCard from '../../common/CustomCard';
import { CustomInput } from '../../common/CustomInput';
import NoDataFound from '../../common/errors/NoDataFound';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = CHART_COLORS.waterUsage;

// Premium, rounded search field for the device list — same "surface.muted
// pill that glows on hover/focus" treatment used by the main machine-list
// search boxes, instead of a plain bare TextField.
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

// One selectable device row: icon chip + name, accent-tinted when selected
// instead of a flat solid-primary fill, with a soft hover lift — matches
// the same "pill list item" language used elsewhere in the app rather than
// a plain full-width contained Button.
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
			<WaterDrop />
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

const WATERMonthlyConsumption = ({ slavesId, setSlavesId }) => {
	const { slavesData } = useCommonData();
	const [mode, setMode] = useState(1);
	const [machineConsumption, setMachineConsumption] = useState(null);
	const [searchDevices, setSearchDevices] = useState(null);

	const slavesDisplayName = useMemo(() => {
		if (!slavesData) {
			return null;
		}

		const slave = slavesData.find((s) => s.slave_id === slavesId);
		return slave ? `${slave.slave_name}` : '';
	}, [slavesId, slavesData]);

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
		if (!slavesId) {
			return;
		}

		fetchMachineConsumption();
	}, [slavesId]);

	return (
		<CustomCard
			// CustomCard already renders `title` through ResponsiveTextWrapper
			// internally — no separate/raw text node for the title here.
			title={`Monthly Water Consumption ${
				slavesDisplayName ? `- ${slavesDisplayName}` : ''
			}`}
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
						// `theme.palette.text.accent` is a *text* color (navy in light
						// mode, white in dark mode) — using it as a background here made
						// the selected button a white box with white text (invisible)
						// in dark mode. The card's own accent color is a fixed brand
						// blue that works as a background in both themes.
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
					<Box height="100%" width={{ sm: 'calc(100% - 200px - 12px)' }}>
						<ReactApexChart
							key={`chart-${mode}`}
							options={getChartOptions(
								mode === 1 ? 'bar' : 'line',
								machineConsumption,
								{
									yLabel: 'Liters',
									xLabel: 'Day',
									colors: [CHART_COLORS.waterUsage, CHART_COLORS.secondary],
									// No fixed `key` here on purpose — the API's date field
									// name isn't guaranteed, and getChartCategories/autoFormat
									// already searches common label fields (date, timestamp,
									// label, ...) on each row automatically.
									categoryOpts: { maxPoints: DEFAULT_MAX_POINTS },
									chartTitle: 'Monthly Water Consumption',
								}
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
						    use — no need to hardcode its height, so this stays
						    correct even if the field's own rendered height ever
						    changes. Only this list scrolls, never the field above it. */}
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

export default WATERMonthlyConsumption;
