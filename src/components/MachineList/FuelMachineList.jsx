import {
	DownloadForOffline,
	Insights,
	LocalGasStation,
	Opacity,
	Speed,
} from '@mui/icons-material';
import {
	Box,
	Button,
	Chip,
	Divider,
	Grid,
	IconButton,
	LinearProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { formatTimestamp } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import CustomCard from '../common/CustomCard';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import PremiumModal from '../common/PremiumModal';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

const handleDownload = (filteredMachines, selectedApp) => {
	const headers = [
		'Device UID',
		'MTD',
		'Slave Index',
		'Status',
		'Consumption',
		'Rate of Flow',
		'Latest Timestamp',
		'Totalizer',
	];

	const rows = filteredMachines.map((machine) => [
		machine.device_uid || 'N/A',
		machine.mtd || 'N/A',
		machine.slave_index ?? 'N/A',
		machine.status || 'N/A',
		Number(machine.consumption ?? 0).toFixed(2),
		Number(machine.rate_of_flow ?? 0).toFixed(2),
		machine.latest_ts ? formatTimestamp(machine.latest_ts) : 'N/A',
		Number(machine.totalizer ?? 0).toFixed(2),
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
	link.download = `${selectedApp}_machine_list_${new Date()
		.toISOString()
		.slice(0, 10)}.csv`;

	document.body.appendChild(link);
	link.click();

	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const ModalContentForTrend = ({ handleTabChange, tab, slaveId, slaveName }) => {
	const [chartResponse, setChartResponse] = useState(null);
	const [chartLoading, setChartLoading] = useState(true);
	const { parametersData } = useCommonData();

	const fetchTrendModalChartData = async (parameter) => {
		if (!slaveId || !parameter) {
			setChartResponse(null);
			return;
		}

		try {
			setChartLoading(true);
			const res = await api.get(
				API_URLS.FUEL_MACHINE_LIST_TREND(slaveId, parameter)
			);
			if (res?.success) {
				setChartResponse({
					data: res?.data?.data || [],
					unit: res?.meta?.unit || '',
				});
			}
		} catch (error) {
			console.error('fuel trend API failed:', error);
			setChartResponse(null);
		} finally {
			setChartLoading(false);
		}
	};

	useEffect(() => {
		fetchTrendModalChartData(tab);
	}, [tab, slaveId]);

	const chartOptions = {
		chart: {
			type: 'line',
			toolbar: { show: false },
		},
		stroke: {
			curve: 'smooth',
			width: 2,
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
				formatter: (val) => val,
			},
			tickAmount: 6,
			tooltip: { enabled: false },
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
			style: { fontSize: '12px' },
			shared: true,
			intersect: false,
			custom: function ({ series, dataPointIndex, w }) {
				let originalDate = '';
				const targetArray = chartResponse?.data || [];

				if (targetArray[dataPointIndex]) {
					const timestamp = targetArray[dataPointIndex]?.timestamp || '';
					if (timestamp) {
						const date = new Date(timestamp);
						originalDate = `${String(date.getDate()).padStart(2, '0')}/${String(
							date.getMonth() + 1
						).padStart(2, '0')}/${date.getFullYear()} ${String(
							date.getHours()
						).padStart(2, '0')}:${String(date.getMinutes()).padStart(
							2,
							'0'
						)}:${String(date.getSeconds()).padStart(2, '0')}`;
					}
				}

				let tooltipContent = `
        <div class="apexcharts-tooltip-custom" style="padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <div style="font-weight: bold; margin-bottom: 8px; color: #6B7280; font-size: 13px; padding: 6px 10px; background-color: #f4f7f6; border-radius: 4px;">${originalDate}</div>
      `;

				w.globals.seriesNames.forEach((name, index) => {
					const value = series[index][dataPointIndex];
					const color = w.config.series[index]?.color || '#4A90E2';
					tooltipContent += `
          <div style="display: flex; align-items: center; margin-bottom: 6px; padding: 0 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
            <span style="flex: 1; color: #4B5563; font-size: 12px;">${name}:</span>
            <span style="font-weight: bold; color: #1F2937; margin-left: 15px; font-size: 12px;">${
							value !== undefined ? value : 'N/A'
						}</span>
          </div>`;
				});

				tooltipContent += '</div>';
				return tooltipContent;
			},
		},
		legend: {
			show: true,
			position: 'top',
			horizontalAlign: 'center',
		},
	};

	const chartSeries = [
		{
			name: `${slaveName} (${chartResponse?.unit || ''})`,
			data: chartResponse?.data?.map((item) => item.value),
			color: '#4A90E2',
		},
	];

	return (
		<>
			<Box width={{ xs: '100%', sm: 200 }}>
				<CustomSelect
					label="Parameter"
					value={tab}
					size="small"
					fullWidth
					options={parametersData}
					onChange={(e) => {
						const selected = parametersData.find(
							(t) => t.value === e.target.value
						);
						if (!selected) {
							return;
						}
						handleTabChange(selected.value, selected.desc);
					}}
				/>
			</Box>
			<Box height={355} mt={1}>
				{chartLoading ? (
					<Loading />
				) : chartResponse?.data?.length ? (
					<ReactApexChart
						options={chartOptions}
						series={chartSeries}
						type="line"
						height={350}
						width="100%"
					/>
				) : (
					<NoDataFound />
				)}
			</Box>
		</>
	);
};

const FuelLevelCard = ({
	currentLiters = 780,
	totalPercentage = 91.91,
	isOnline,
}) => {
	return (
		<Box
			sx={{
				width: '100%',
				borderRadius: 1,
				display: 'flex',
				flexDirection: 'column',
				mb: 1,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<LocalGasStation sx={{ color: '#2E4355', fontSize: '1.4rem' }} />
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 700,
							color: '#1A202C',
							fontFamily: 'Inter, sans-serif',
						}}
					>
						Fuel Level
					</Typography>
				</Box>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 800,
						color: '#0A223E',
						fontFamily: 'Inter, sans-serif',
					}}
				>
					{totalPercentage}%
				</Typography>
			</Box>

			<Box sx={{ width: '100%', my: 0.5 }}>
				<LinearProgress
					variant="determinate"
					value={totalPercentage}
					sx={{
						height: 12,
						borderRadius: 6,
						backgroundColor: 'rgba(0,0,0,0.03)',
						'& .MuiLinearProgress-bar': {
							borderRadius: 6,
							background: `linear-gradient(90deg, ${
								isOnline ? '#5a7c60bb' : '#f78d8d'
							} 0%, ${isOnline ? '#2E7D3D' : '#eb6d6d'} 100%)`,
						},
					}}
				/>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<Box sx={{ display: 'flex', flexDirection: 'column' }}>
					<Typography
						variant="caption"
						sx={{ color: '#A0AEC0', fontWeight: 600 }}
					>
						0%
					</Typography>
					<Typography
						variant="body2"
						sx={{
							fontWeight: 700,
							color: '#2E4355',
							mt: 0.5,
						}}
					>
						{currentLiters} Ltrs
					</Typography>
				</Box>
				<Typography
					variant="caption"
					sx={{ color: '#A0AEC0', fontWeight: 600 }}
				>
					100%
				</Typography>
			</Box>
		</Box>
	);
};

const MetricBlock = ({
	label,
	status,
	consumption,
	rateOfFlow,
	latestTimestamp,
	totalizer,
	handleOpenModal,
}) => {
	const isOnline = status?.toLowerCase() === 'online';

	return (
		<Box
			sx={{
				p: 1,
				bgcolor: isOnline ? '#e8f5e9' : '#f2f2f2',
				borderRadius: '16px',
			}}
		>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Box width="calc(100% - 65px)">
					<ResponsiveTextWrapper
						value={label}
						variant="h6"
						fontWeight="bold"
						color="text.primary"
					/>
				</Box>

				<Chip
					label={status?.toUpperCase()}
					size="small"
					variant="outlined"
					sx={{
						fontWeight: 'bold',
						color: isOnline ? 'success.main' : 'error.main',
						borderColor: isOnline ? 'success.main' : 'error.main',
					}}
				/>
			</Stack>

			{(totalizer || formatTimestamp(latestTimestamp)) && (
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={1}
					gap={1}
				>
					<Box width="65%">
						<ResponsiveTextWrapper
							value={formatTimestamp(latestTimestamp)}
							color="#595959"
							fontWeight={500}
							fontSize="14px"
						/>
					</Box>

					<Box width="35%" textAlign="end">
						<ResponsiveTextWrapper
							value={`${totalizer?.toFixed(1)} m³`}
							variant="subtitle1"
							fontWeight={500}
						/>
					</Box>
				</Stack>
			)}

			<FuelLevelCard isOnline={isOnline} />
			<Box
				sx={{
					bgcolor: 'rgba(0,0,0,0.03)',
					borderRadius: 1,
					mb: 1,
					width: '100%',
				}}
			>
				<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: 'bold',
									border: 0,
									width: { xs: '50%', lg: '60%' },
								}}
							>
								<ResponsiveTextWrapper
									fontSize="16px"
									fontWeight="bold"
									value="Parameter"
								/>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: 'bold',
									border: 0,
									width: { xs: '50%', lg: '40%' },
								}}
							>
								<ResponsiveTextWrapper
									fontSize="16px"
									fontWeight="bold"
									value="Value"
								/>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{[
							{
								name: 'Consumption',
								value: `${Number(consumption ?? 0).toFixed(2)} KLD`,
								Icon: Opacity,
							},
							{
								name: 'Rate of Flow',
								value: `${Number(rateOfFlow ?? 0).toFixed(2)} m³/h`,
								Icon: Speed,
							},
						].map((row) => {
							const RowIcon = row.Icon;

							return (
								<TableRow key={row.name}>
									<TableCell
										sx={{ border: 0, py: 0.5, width: { xs: '50%', lg: '60%' } }}
									>
										<Box sx={{ display: 'flex', alignItems: 'center' }}>
											<RowIcon
												sx={{
													fontSize: '14px',
													color: '#1976d2',
													mr: 1,
													flexShrink: 0,
												}}
											/>
											<Box width="calc(100% - 14px - 8px)">
												<ResponsiveTextWrapper
													fontSize="14px"
													color="#333333"
													fontWeight={500}
													value={row.name}
												/>
											</Box>
										</Box>
									</TableCell>
									<TableCell
										align="right"
										sx={{ border: 0, py: 0.5, width: { xs: '50%', lg: '40%' } }}
									>
										<ResponsiveTextWrapper
											fontSize="14px"
											color="#333333"
											fontWeight={500}
											value={row.value}
										/>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</Box>

			<Divider sx={{ mb: 0.5 }} />

			<Button
				onClick={handleOpenModal}
				size="small"
				startIcon={<Insights />}
				disableElevation
				variant="contained"
				fullWidth
				sx={{
					fontWeight: 'bold',
					borderRadius: '16px',
				}}
			>
				TREND
			</Button>
		</Box>
	);
};

const FuelMachineList = () => {
	const { slavesData, parametersData } = useCommonData();
	const { selectedApp } = useApplications();
	const [machineListData, setMachineListData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [modalDetails, setModalDetails] = useState(null);

	const machinesData = machineListData?.machines || [];

	const filteredMachines = useMemo(() => {
		if (slavesId === null || slavesId === '' || !machinesData.length) {
			return machinesData;
		}

		return machinesData.filter((mac) => mac.slave_id === slavesId);
	}, [machinesData, slavesId]);

	const handleTabChange = (tab, tabDesc) => {
		setModalDetails((prev) => ({
			...prev,
			tab,
			tabDesc,
		}));
	};

	const handleOpenModal = (item) => {
		const defaultTab = parametersData?.[0] || {};
		setModalDetails({
			isOpen: true,
			data: item,
			tab: defaultTab?.value,
			tabDesc: defaultTab?.desc,
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.FUEL_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('Fuel machine list fetch failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMachineListData();
	}, []);

	const MachineListHeader = ({
		slaveOptions,
		setSlavesId,
		slavesId,
		handleDownload,
		isDownloadDisabled,
	}) => {
		return (
			<Box
				sx={{
					pb: 1,
					borderBottom: '1px dashed',
					borderColor: 'divider',
				}}
			>
				<Stack
					direction="row"
					spacing={2}
					alignItems="center"
					justifyContent="space-between"
				>
					<Box sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}>
						<CustomAutocomplete
							options={slaveOptions}
							onChange={(option) =>
								setSlavesId(
									option?.value === undefined || option?.value === null
										? null
										: option.value
								)
							}
							value={slavesId ?? ''}
							label="Search Devices..."
							size="small"
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									backgroundColor: '#f9f9f9',
									transition: '0.3s',
									'&:hover': {
										backgroundColor: '#fff',
									},
								},
							}}
						/>
					</Box>

					<Tooltip title="Download Report">
						<span>
							<IconButton
								size="large"
								disabled={isDownloadDisabled}
								color="primary"
								onClick={handleDownload}
								sx={{ width: 36, height: 36 }}
							>
								<DownloadForOffline sx={{ width: 36, height: 36 }} />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Box>
		);
	};

	return (
		<>
			<Box
				sx={{
					height: {
						xs: 'calc(100vh - 56px - 16px)',
						sm: 'calc(100vh - 64px - 16px)',
					},
				}}
			>
				<MachineListHeader
					slaveOptions={
						slavesData?.map((f) => ({
							label: f?.slave_name,
							value: f?.slave_id,
						})) ?? []
					}
					setSlavesId={setSlavesId}
					slavesId={slavesId}
					handleDownload={() => handleDownload(filteredMachines, selectedApp)}
					isDownloadDisabled={!filteredMachines?.length || isLoading}
				/>

				<Grid container height="calc(100% - 44px - 8px)" pt={1} overflow="auto">
					<Grid item xs={12}>
						{isLoading ? (
							<TemperatureMachineListSkeleton />
						) : filteredMachines?.length ? (
							<Grid container rowGap={1} columnSpacing={1}>
								{filteredMachines.map((mc, ind) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										lg={3}
										key={`water-machine-${ind + 1}`}
									>
										<CustomCard childrenOtherProps={{ height: '100%' }}>
											<MetricBlock
												label={mc?.slave_name || ''}
												status={mc?.status}
												consumption={mc?.consumption}
												rateOfFlow={mc?.rate_of_flow}
												latestTimestamp={mc?.latest_ts}
												totalizer={mc?.totalizer}
												mtd={mc?.mtd}
												handleOpenModal={() => handleOpenModal(mc)}
											/>
										</CustomCard>
									</Grid>
								))}
							</Grid>
						) : (
							<NoDataFound />
						)}
					</Grid>
				</Grid>
			</Box>

			<PremiumModal
				open={Boolean(modalDetails?.isOpen)}
				onClose={handleCloseModal}
				title={`${modalDetails?.data?.slave_name} - ${modalDetails?.tabDesc}`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					<ModalContentForTrend
						handleTabChange={handleTabChange}
						tab={modalDetails?.tab}
						slaveId={modalDetails?.data?.slave_id}
						slaveName={modalDetails?.data?.slave_name}
					/>
				) : null}
			</PremiumModal>
		</>
	);
};

export default FuelMachineList;
