import { DownloadForOffline } from '@mui/icons-material';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { formatTimestamp } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

import PremiumWaterMachineCard from './cards/PremiumWaterMachineCard';

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

const ModalContentForTrend = ({ slaveId, slaveName }) => {
	const [chartResponse, setChartResponse] = useState(null);
	const [chartLoading, setChartLoading] = useState(true);

	const fetchTrendModalChartData = async () => {
		if (!slaveId) {
			setChartResponse(null);
			return;
		}

		try {
			setChartLoading(true);
			const res = await api.get(API_URLS.WATER_MACHINE_LIST_TREND(slaveId));
			if (res?.success) {
				setChartResponse({
					data: res?.data?.data || [],
					unit: res?.meta?.unit || '',
				});
			}
		} catch (error) {
			console.error('water trend API failed:', error);
			setChartResponse(null);
		} finally {
			setChartLoading(false);
		}
	};

	useEffect(() => {
		fetchTrendModalChartData();
	}, [slaveId]);

	const chartOptions = {
		chart: {
			type: 'line',
			// Subtle lift under the line so it reads as a premium chart
			// rather than a flat plot.
			dropShadow: {
				enabled: true,
				top: 4,
				left: 0,
				blur: 4,
				opacity: 0.12,
			},
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
					const color = w.config.series[index]?.color || APP_ACCENT_COLOR.WATER;
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
			color: APP_ACCENT_COLOR['WATER'],
		},
	];

	return (
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
				<NoDataFound message="No machine readings received yet — data appears once the device reports" />
			)}
		</Box>
	);
};

const WaterMachineList = () => {
	const { slavesData } = useCommonData();
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

	const handleOpenModal = (item) => {
		setModalDetails({
			isOpen: true,
			data: item,
			desc: 'Last 6 hours Flow Rate data',
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.WATER_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('Water machine list fetch failed:', error);
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
									backgroundColor: 'surface.muted',
									transition: '0.3s',
									'&:hover': {
										backgroundColor: 'background.paper',
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
										<PremiumWaterMachineCard
											title={mc?.slave_name || ''}
											status={mc?.status}
											lastUpdated={mc?.latest_ts}
											metrics={[
												{
													label: 'Inlet Flowrate',
													value: `${Number(mc?.rate_of_flow ?? 0).toFixed(
														2
													)} m³/hr`,
												},
												{
													label: 'Inlet Totalizer',
													value: `${Number(mc?.totalizer ?? 0).toFixed(2)} m³`,
												},
											]}
											today={`${Number(mc?.consumption ?? 0).toFixed(2)} KLD`}
											mtd={`${Number(mc?.mtd ?? 0).toFixed(2)} KLD`}
											consumption={mc?.consumption}
											mtdValue={mc?.mtd}
											slaveId={mc?.slave_id}
											trendUrl={API_URLS.WATER_MACHINE_LIST_TREND(mc?.slave_id)}
											onOpenTrend={() => handleOpenModal(mc)}
										/>
									</Grid>
								))}
							</Grid>
						) : (
							<NoDataFound message="No machine readings received yet — data appears once the device reports" />
						)}
					</Grid>
				</Grid>
			</Box>

			<PremiumModal
				open={Boolean(modalDetails?.isOpen)}
				onClose={handleCloseModal}
				title={`${modalDetails?.data?.slave_name} - ${modalDetails?.desc}`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					<ModalContentForTrend
						slaveId={modalDetails?.data?.slave_id}
						slaveName={modalDetails?.data?.slave_name}
					/>
				) : null}
			</PremiumModal>
		</>
	);
};

export default WaterMachineList;
