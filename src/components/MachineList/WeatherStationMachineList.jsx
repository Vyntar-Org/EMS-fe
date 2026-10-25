import { FileDownload, Insights } from '@mui/icons-material';
import {
	Avatar,
	Box,
	Button,
	Chip,
	Grid,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { MACHINE_LIST_CARD_ICONS } from '../../constants/weatherStationMachineList';
import { useCommonData } from '../../contexts/CommonDataContext';
import { basePickerStyles, formatTimestamp } from '../../helpers/common';
import {
	getWeatherStationErrorMessage,
	weatherStationApi,
} from '../../helpers/weatherStationApi';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import CustomCard from '../common/CustomCard';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import PremiumModal from '../common/PremiumModal';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import WindDirectionChart from '../Dashboards/weatherStationDashboardCards/WindDirectionChart';
import WeatherStationMachineListSkeleton from '../skeletonLoaders/WeatherStationMachineListSkeleton';

const getMachineSlaveId = (machine) => machine?.slave_id ?? machine?.id;

const MachineListHeader = ({
	slaveOptions,
	setDeviceId,
	deviceId,
	handleDownload,
	isDownloadDisabled,
	loading,
	selectorError,
}) => {
	return (
		<Box
			sx={{
				pb: 1,
				borderBottom: '2px dashed',
				borderColor: 'divider',
			}}
		>
			<Stack
				direction="row"
				spacing={2}
				alignItems="center"
				justifyContent="space-between"
			>
				<Box sx={{ flexGrow: 1, maxWidth: { sm: 350 } }}>
					<CustomAutocomplete
						disabled={loading}
						error={Boolean(selectorError)}
						helperText={selectorError || ''}
						options={slaveOptions}
						onChange={(option) =>
							setDeviceId(
								option?.value === undefined || option?.value === null
									? null
									: option.value
							)
						}
						value={deviceId ?? ''}
						label="Search Devices..."
						size="small"
						sx={basePickerStyles}
					/>
				</Box>

				{/* <Tooltip title="Download Report">
          <span>
            <IconButton
              size="large"
              disabled={isDownloadDisabled || loading}
              color="primary"
              onClick={handleDownload}
              sx={{ width: 36, height: 36 }}
            >
              <DownloadForOffline sx={{ width: 36, height: 36 }} />
            </IconButton>
          </span>
        </Tooltip> */}

				<Button
					disableElevation
					disabled={isDownloadDisabled || loading}
					variant="contained"
					startIcon={<FileDownload sx={{ fontSize: 20 }} />}
					onClick={handleDownload}
					sx={{
						height: 42,
						px: 2.5,
						borderRadius: '12px',
						textTransform: 'none',
						fontWeight: 600,
						fontSize: '0.9rem',
						letterSpacing: '0.2px',
						color: '#fff',
						bgcolor: 'primary.main',
						minWidth: 180,

						'&:hover': {
							bgcolor: 'primary.dark',
						},

						'&.Mui-disabled': {
							bgcolor: 'brand.navySoft',
							color: '#fff',
						},
					}}
				>
					Download
				</Button>
			</Stack>
		</Box>
	);
};

const WeatherSolarMetricBlock = ({
	label,
	status,
	metrics = [],
	lastUpdated,
	handleOpenModal,
}) => {
	const isOnline = status?.toLowerCase() === 'online';
	// const cardConfig =
	//   MACHINE_LIST_CARD_ICONS[label] || MACHINE_LIST_CARD_ICONS.default;
	// const CardIcon = cardConfig.Icon;

	return (
		<Box
			sx={{
				p: 1,
				borderRadius: '24px',
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				bgcolor: 'background.paper',
			}}
		>
			<Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
				<Avatar
					src={MACHINE_LIST_CARD_ICONS[label]?.icon || label}
					alt={label}
					sx={{
						width: 70,
						height: 70,
					}}
				/>
				{/* <Avatar
          sx={{
            width: 70,
            height: 70,
            bgcolor: cardConfig.bg,
            border: "1px solid #EEF2F6",
          }}
        >
          <CardIcon
            sx={{
              fontSize: 34,
              color: cardConfig.color,
            }}
          />
        </Avatar> */}
				<Box width="calc(100% - 70px - 13px)">
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Box width="calc(100% - 72px)">
							<ResponsiveTextWrapper
								value={label}
								fontSize="18px"
								fontWeight="bold"
								color="text.primary"
							/>
						</Box>

						<Chip
							label={isOnline ? 'ONLINE' : 'OFFLINE'}
							size="small"
							sx={{
								height: 28,
								borderRadius: '8px',
								fontSize: '12px',
								fontWeight: 700,

								bgcolor: isOnline ? '#ECFDF3' : '#FEF2F2',
								color: isOnline ? '#16A34A' : '#DC2626',
								border: `1px solid ${isOnline ? '#BBF7D0' : '#FECACA'}`,

								'& .MuiChip-label': {
									px: 1.5,
									letterSpacing: '0.3px',
								},
							}}
						/>
					</Stack>

					{lastUpdated && (
						<ResponsiveTextWrapper
							color="text.secondary"
							variant="caption"
							value={formatTimestamp(lastUpdated)}
							fontWeight="bold"
							sx={{ mb: 1, display: 'block' }}
						/>
					)}
				</Box>
			</Box>

			<Box
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 2,
					mb: 1.5,
					width: '100%',
				}}
			>
				{/* Table code remains the same */}
				<Box height={136} overflow="auto">
					<Table size="small" stickyHeader>
						{/* ... TableHead and TableBody code ... */}
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										px: 1,
										fontWeight: 'bold',
										border: 0,
										width: { xs: '50%', lg: '60%' },
										bgcolor: 'surface.tableHead',
										borderTopLeftRadius: 8,
									}}
								>
									<ResponsiveTextWrapper
										fontSize="14px"
										fontWeight={800}
										value="Parameter"
									/>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										px: 1,
										fontWeight: 'bold',
										border: 0,
										width: { xs: '50%', lg: '40%' },
										bgcolor: 'surface.tableHead',
										borderTopRightRadius: 8,
									}}
								>
									<ResponsiveTextWrapper
										fontSize="14px"
										fontWeight={800}
										value="Value"
									/>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{metrics.map((row, ind) => {
								const RowIcon = row.Icon;
								const hasValue =
									row.value !== null &&
									row.value !== undefined &&
									row.value !== '';
								return (
									<TableRow key={row.key}>
										<TableCell
											sx={{
												border: 0,
												px: 1,
												py: 0.7,
												width: { xs: '50%', lg: '60%' },
												...(metrics?.length - 1 !== ind
													? {
															borderBottom: '1px solid',
															borderBottomColor: 'divider',
													  }
													: {}),
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												{RowIcon && (
													<RowIcon
														sx={{
															fontSize: '14px',
															color: row.color,
															mr: 1,
															flexShrink: 0,
														}}
													/>
												)}
												<Box width="calc(100% - 14px - 8px)">
													<ResponsiveTextWrapper
														fontSize="13px"
														color="text.primary"
														fontWeight={600}
														value={row.name}
													/>
												</Box>
											</Box>
										</TableCell>
										<TableCell
											align="right"
											sx={{
												border: 0,
												px: 1,
												py: 0.9,
												width: { xs: '50%', lg: '40%' },
												...(metrics?.length - 1 !== ind
													? {
															borderBottom: '1px solid',
															borderBottomColor: 'divider',
													  }
													: {}),
											}}
										>
											<ResponsiveTextWrapper
												fontSize="13px"
												color="text.primary"
												fontWeight={600}
												value={
													hasValue
														? `${row.value}${row.unit ? ` ${row.unit}` : ''}`
														: '—'
												}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Box>
			</Box>

			{/* Wrapper to push button to bottom */}
			<Box mt="auto">
				<Button
					onClick={handleOpenModal}
					disabled={!metrics.length}
					size="medium"
					startIcon={<Insights />}
					disableElevation
					variant="contained"
					fullWidth
					sx={{
						border: '2px solid',
						borderColor: 'primary.main',
						bgcolor: 'primary.main',
						fontWeight: 'bold',
						borderRadius: '20px',
						transition: '0.3s',
						':hover': {
							border: '2px solid',
							borderColor: 'primary.main',
							bgcolor: 'background.paper',
							color: 'primary.main',
							'& .MuiButton-icon': {
								color: 'primary.main',
							},
						},
					}}
				>
					TREND
				</Button>
			</Box>
		</Box>
	);
};
const handleDownload = (filteredMachines) => {
	const headers = ['Device Name', 'ID', 'Status', 'Metrics', 'Last Updated'];

	const rows = filteredMachines.map((machine) => [
		machine.name || 'N/A',
		machine.slave_id ?? machine.id,
		machine.status || 'N/A',
		(machine.metrics || [])
			.map((m) => `${m.name}: ${m.value}${m.unit || ''}`)
			.join(', '),
		machine.last_updated ? formatTimestamp(machine.last_updated) : 'N/A',
	]);

	const csvContent = Papa.unparse({
		fields: headers,
		data: rows,
	});

	const blob = new Blob(['\uFEFF', csvContent], {
		type: 'text/csv;charset=utf-8;',
	});
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `weather_list_${new Date()
		.toISOString()
		.slice(0, 10)}.csv`;

	document.body.appendChild(link);
	link.click();

	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const ModalContentForTrend = ({
	handleTabChange,
	tab,
	slaveId,
	slaveName,
	currentMetric,
	parameters,
}) => {
	const {
		data: trendData,
		isLoading: chartLoading,
		error: trendError,
	} = useQuery({
		queryKey: ['weather', 'machine-list-trend', slaveId, tab],
		queryFn: ({ signal }) =>
			weatherStationApi.getMachineListTrend(
				{ slaveId, parameter: tab },
				{ signal }
			),
		enabled: Boolean(slaveId && tab),
	});
	const chartResponse = {
		data: trendData?.trends || [],
		unit: currentMetric?.unit || '',
	};

	// Create dynamic tab options based on available metrics
	const chartOptions = {
		chart: {
			type: 'line',
			toolbar: { show: false },
			dropShadow: {
				enabled: true,
				top: 6,
				left: 0,
				blur: 6,
				opacity: 0.12,
			},
		},
		stroke: {
			curve: 'straight',
			width: 2,
			lineCap: 'round',
		},
		markers: {
			size: 0,
		},
		grid: {
			borderColor: '#ebe5e5',
			strokeDashArray: 0,
			xaxis: { lines: { show: false } },
			yaxis: { lines: { show: false } },
		},
		xaxis: {
			title: {
				text: 'Time',
				style: { color: '#6B7280', fontSize: '12px' },
			},
			categories: chartResponse?.data?.map((item) =>
				new Date(item.timestamp).toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				})
			),
			labels: {
				style: { colors: '#6B7280', fontSize: '11px' },
				rotate: -45,
			},
			tickAmount: 6,
		},
		yaxis: {
			title: {
				text: chartResponse?.unit || '',
				style: { color: '#6B7280', fontSize: '12px' },
			},
			labels: {
				style: { colors: '#6B7280', fontSize: '11px' },
			},
		},
		tooltip: {
			enabled: true,
			theme: 'light',
		},
	};

	const chartSeries = [
		{
			name: `${slaveName} ${currentMetric?.name || ''}`,
			data: chartResponse?.data?.map((item) => item.value),
			color: '#4A90E2',
		},
	];

	return (
		<>
			{parameters?.length > 1 && (
				<Box width={{ xs: '100%', sm: 200 }}>
					<CustomSelect
						label="Parameter"
						value={tab}
						size="small"
						fullWidth
						options={parameters}
						onChange={(e) => {
							const selected = parameters.find(
								(t) => t.value === e.target.value
							);
							if (!selected) {
								return;
							}
							handleTabChange(selected.value, selected.desc);
						}}
					/>
				</Box>
			)}

			<Box height={355} mt={1} overflow="hidden">
				{chartLoading ? (
					<Loading />
				) : trendError ? (
					<NoDataFound
						message={getWeatherStationErrorMessage(
							trendError,
							'Unable to load trend data.'
						)}
					/>
				) : chartResponse?.data?.length ? (
					<ReactApexChart
						options={chartOptions}
						series={chartSeries}
						type="line"
						height={350}
						width="100%"
					/>
				) : (
					<NoDataFound
						message="No trend data"
						description="No readings recorded for this parameter in the last 6 hours."
					/>
				)}
			</Box>
		</>
	);
};

const WIND_DIRECTION_METRIC_KEY = 'wind_direction';

const WindDirectionModalContent = () => {
	const {
		data: windData,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ['weather', 'dashboard', 'wind-direction'],
		queryFn: ({ signal }) =>
			weatherStationApi.getWindDirectionDistribution({ signal }),
		staleTime: 30 * 1000,
	});

	return (
		<Box height={355} mt={1} overflow="hidden">
			{loading ? (
				<Loading />
			) : error ? (
				<NoDataFound
					message={getWeatherStationErrorMessage(
						error,
						'Unable to load wind-direction data.'
					)}
				/>
			) : windData ? (
				<WindDirectionChart data={windData} isTrend={true} />
			) : (
				<NoDataFound
					message="No wind direction data"
					description="No wind observations are available right now."
				/>
			)}
		</Box>
	);
};

const WeatherSolarMachineList = () => {
	const { slavesData, commonDataErrors, commonDataLoading } =
		useCommonData();
	const [deviceId, setDeviceId] = useState(null);
	const [modalDetails, setModalDetails] = useState(null);
	const {
		data: machineListData,
		isLoading: loading,
		error: machineListError,
	} = useQuery({
		queryKey: ['weather', 'machine-list'],
		queryFn: ({ signal }) => weatherStationApi.getMachineList({ signal }),
		refetchInterval: 65 * 1000,
	});

	const machines = machineListData?.cards || [];

	const filteredMachines = useMemo(() => {
		if (
			deviceId === null ||
			deviceId === undefined ||
			deviceId === '' ||
			!machines.length
		) {
			return machines;
		}
		return machines.filter(
			(machine) => String(getMachineSlaveId(machine)) === String(deviceId)
		);
	}, [machines, deviceId]);

	const handleOpenModal = (item, parameters) => {
		const activePower = item?.metrics?.find(
			(m) => m?.key === 'total_active_power'
		);
		const primaryMetric = activePower || item?.metrics?.[0];
		const isWindDirection = primaryMetric?.key === WIND_DIRECTION_METRIC_KEY;

		setModalDetails({
			isOpen: true,
			data: item,
			tab: primaryMetric?.key || 'temperature',
			tabDesc: isWindDirection
				? 'Distribution'
				: `Last 6 hours ${primaryMetric?.name || 'Data'} - TREND`,
			currentMetric: primaryMetric,
			parameterOptions: parameters,
			isWindDirection,
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const handleTabChange = (tab, tabDesc) => {
		setModalDetails((prev) => ({
			...prev,
			tab,
			tabDesc,
			currentMetric: prev?.data?.metrics?.find((metric) => metric.key === tab),
		}));
	};

	return (
		<>
			<Box
				sx={{
					height: {
						xs: 'calc(100vh - 56px - 24px)',
						sm: 'calc(100vh - 64px - 24px)',
					},
				}}
			>
				<MachineListHeader
					slaveOptions={
						(slavesData || []).map((slave) => ({
							label:
								slave?.slave_name ||
								slave?.name ||
								slave?.device_name ||
								String(slave?.slave_id ?? slave?.id),
							value: slave?.slave_id ?? slave?.id,
						})) ?? []
					}
					setDeviceId={setDeviceId}
					deviceId={deviceId}
					handleDownload={() => handleDownload(filteredMachines)}
					isDownloadDisabled={!filteredMachines?.length}
					loading={loading || commonDataLoading}
					selectorError={commonDataErrors?.slaves}
				/>

				<Grid container height="calc(100% - 49px)" pt={1} overflow="auto">
					<Grid item xs={12}>
						{loading ? (
							<WeatherStationMachineListSkeleton />
						) : machineListError ? (
							<NoDataFound
								message={getWeatherStationErrorMessage(
									machineListError,
									'Unable to load Weather Station devices.'
								)}
							/>
						) : filteredMachines?.length ? (
							<Grid container rowGap={1.5} columnSpacing={1.5}>
								{filteredMachines.map((mc) => {
									const paramOptions = mc?.metrics?.map((i) => ({
										value: i.key,
										desc: `Last 6 hours ${i.name || 'Data'} - TREND`,
										label: i.name,
									}));

									return (
										<Grid
											item
											xs={12}
											sm={6}
											md={4}
											lg={3}
											key={`weather-machine-${mc.id}`}
										>
											<CustomCard
												childrenOtherProps={{ height: '100%' }}
												accentcolor="#ccc"
											>
												<WeatherSolarMetricBlock
													label={mc?.name || ''}
													status={mc?.status}
													metrics={mc?.metrics} // Pass the whole metrics array
													lastUpdated={mc?.last_updated}
													handleOpenModal={() =>
														handleOpenModal(mc, paramOptions)
													}
												/>
											</CustomCard>
										</Grid>
									);
								})}
							</Grid>
						) : (
							<NoDataFound
								message="No devices found"
								description="No devices match your search."
							/>
						)}
					</Grid>
				</Grid>
			</Box>

			<PremiumModal
				open={Boolean(modalDetails?.isOpen)}
				onClose={handleCloseModal}
				title={`${modalDetails?.data?.name} - ${modalDetails?.tabDesc}`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					modalDetails?.isWindDirection ? (
						<WindDirectionModalContent />
					) : (
						<ModalContentForTrend
							handleTabChange={handleTabChange}
							tab={modalDetails?.tab}
							slaveId={getMachineSlaveId(modalDetails?.data)}
							slaveName={modalDetails?.data?.name}
							currentMetric={modalDetails?.currentMetric}
							parameters={modalDetails?.parameterOptions}
						/>
					)
				) : null}
			</PremiumModal>
		</>
	);
};

export default WeatherSolarMachineList;
