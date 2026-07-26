import { DownloadForOffline } from '@mui/icons-material';
import {
	Box,
	Grid,
	IconButton,
	Stack,
	Tab,
	Tabs,
	Tooltip,
} from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import {
	KEY_PARAMETER_OPTIONS,
	TREND_TAB_OPTIONS,
} from '../../constants/energyMachineList';
import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { formatTimestamp } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import EnergyMachineListSkeleton from '../skeletonLoaders/EnergyMachineListSkeleton';

import PremiumEnergyMachineCard from './cards/PremiumEnergyMachineCard';

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
						onChange={(e) => setSlavesId(e?.value || '')}
						value={slavesId || ''}
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

const handleDownload = (filteredMachines, selectedApp) => {
	const headers = [
		'Machine Name',
		'ID',
		'Status',
		'R-Volts',
		'Y-Volts',
		'B-Volts',
		'R-Amps',
		'Y-Amps',
		'B-Amps',
		'Active Power (kW)',
		'PF',
		'Frequency (Hz)',
		'Today (kWh)',
		'MTD (kWh)',
		'Last Updated',
	];

	const rows = filteredMachines.map((machine) => {
		const isOnline = machine.status === 'online';
		const latest = machine.latest || {};
		const energy = machine.energy || {};

		return [
			machine.name || 'N/A',
			machine.slave_id || 'N/A',
			isOnline ? 'Online' : 'Offline',
			Number(latest.rv || 0).toFixed(2),
			Number(latest.yv || 0).toFixed(2),
			Number(latest.bv || 0).toFixed(2),
			Number(latest.ir || 0).toFixed(1),
			Number(latest.iy || 0).toFixed(1),
			Number(latest.ib || 0).toFixed(1),
			Number(latest.actpr_t || 0).toFixed(2),
			Number(latest.pf_t || 0).toFixed(2),
			Number(latest.fq || 0).toFixed(2),
			Number(energy.today || 0).toFixed(1),
			Number(energy.mtd || 0).toFixed(1),
			latest.last_ts ? formatTimestamp(latest.last_ts) : 'N/A',
		];
	});

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

const ModalContentForTrend = ({
	handleTabChange,
	tab,
	keyParam,
	slaveId,
	slaveName,
}) => {
	const [chartResponse, setChartResponse] = useState(null);
	const [chartLoading, setChartLoading] = useState(true);

	const fetchTrendModalChartData = async (selectedTab, keyForParameter) => {
		if (!slaveId) {
			setChartResponse(null);
			return;
		}

		let API_URL_NAME = '';

		if (selectedTab === 'ACTIVE_POWER') {
			API_URL_NAME = API_URLS.EMS_MACHINE_LIST_ACTIVE_POWER(slaveId);
		}
		if (selectedTab === 'KEY_PARAMETERS' && keyForParameter === 'voltage') {
			API_URL_NAME = API_URLS.EMS_MACHINE_LIST_VOLTAGE(slaveId);
		}
		if (selectedTab === 'KEY_PARAMETERS' && keyForParameter === 'current') {
			API_URL_NAME = API_URLS.EMS_MACHINE_LIST_CURRENT(slaveId);
		}
		if (selectedTab === 'KEY_PARAMETERS' && keyForParameter === 'pf') {
			API_URL_NAME = API_URLS.EMS_MACHINE_LIST_POWER_FACTOR(slaveId);
		}
		if (selectedTab === 'KEY_PARAMETERS' && keyForParameter === 'frequency') {
			API_URL_NAME = API_URLS.EMS_MACHINE_LIST_FREQUENCY(slaveId);
		}

		if (!API_URL_NAME) {
			setChartResponse(null);
			return;
		}

		try {
			setChartLoading(true);
			const res = await api.get(API_URL_NAME);
			if (res?.success) {
				setChartResponse(res?.data);
			}
		} catch (error) {
			console.error('Modal Trend API calls failed:', error);
			setChartResponse(null);
		} finally {
			setChartLoading(false);
		}
	};

	useEffect(() => {
		if (tab === 'ACTIVE_POWER') {
			fetchTrendModalChartData(tab);
		}
	}, [tab]);

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

				if (targetArray && targetArray[dataPointIndex]) {
					const item = targetArray[dataPointIndex];
					const timestamp = item?.timestamp || '';
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
					const color =
						w.config.series[index]?.color ||
						['#E34D4D', '#F8C537', '#4A90E2', '#EF4444', '#8B5CF6', '#2563EB'][
							index % 6
						];
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

	const getCurrentChartSeries = () => {
		switch (tab) {
			case 'ACTIVE_POWER':
				return [
					{
						name: `${slaveName} Active Power`,
						data: chartResponse?.data?.map((item) => item.value),
						color: APP_ACCENT_COLOR.ENERGY,
					},
				];
			case 'KEY_PARAMETERS':
				switch (keyParam) {
					case 'voltage':
						return [
							{
								name: 'R-Voltage',
								data: chartResponse?.data?.map((item) => item.rv),
								color: '#E34D4D',
							},
							{
								name: 'Y-Voltage',
								data: chartResponse?.data?.map((item) => item.yv),
								color: '#F8C537',
							},
							{
								name: 'B-Voltage',
								data: chartResponse?.data?.map((item) => item.bv),
								color: '#4A90E2',
							},
						];
					case 'current':
						return [
							{
								name: 'R-Current',
								data: chartResponse?.data?.map((item) => item.i_r),
								color: '#E34D4D',
							},
							{
								name: 'Y-Current',
								data: chartResponse?.data?.map((item) => item.i_y),
								color: '#F8C537',
							},
							{
								name: 'B-Current',
								data: chartResponse?.data?.map((item) => item.i_b),
								color: '#4A90E2',
							},
						];

					case 'pf':
						return [
							{
								name: `${slaveName} Power Factor`,
								data: chartResponse?.data?.map((item) => item.value),
								color: '#E34D4D',
							},
						];

					case 'frequency':
						return [
							{
								name: `${slaveName} Frequency`,
								data: chartResponse?.data?.map((item) => item.value),
								color: '#E34D4D',
							},
						];
				}
				break;
			default:
				return [];
		}
	};

	const chartSeries = getCurrentChartSeries();

	return (
		<>
			<Box
				display="flex"
				justifyContent="space-between"
				flexDirection={{ xs: 'column', sm: 'row' }}
			>
				<Tabs
					value={tab}
					onChange={(e, val) => {
						if (!val) {
							return;
						}

						const { tabDesc, tab: newTab } =
							TREND_TAB_OPTIONS?.find((t) => t.tab === val) || {};

						if (newTab === 'KEY_PARAMETERS') {
							// Default to the first real key parameter (skip the
							// "None" placeholder) instead of leaving the chart
							// empty until the user manually picks one.
							const defaultKeyParam = KEY_PARAMETER_OPTIONS.find(
								(k) => k.value
							);
							fetchTrendModalChartData(newTab, defaultKeyParam?.value);
							handleTabChange(
								newTab,
								defaultKeyParam?.desc,
								defaultKeyParam?.value
							);
							return;
						}

						handleTabChange(newTab, tabDesc);
					}}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						'& .MuiTabs-scroller': {
							height: '40px',
						},
						'& .MuiTab-root': {
							textTransform: 'none',
							fontSize: '0.95rem',

							color: 'primary.main',
							minHeight: '32px',
							transition: 'all 0.3s ease',
							p: 0,
							mr: 3,
							'&.Mui-selected': {
								color: 'primary.main',
								fontWeight: 1000,
							},
						},
						'& .MuiTabs-indicator': {
							backgroundColor: 'rgb(245, 213, 71)',
							height: 3,
							borderRadius: '3px 3px 0 0',
							pr: 3,
						},
					}}
				>
					{TREND_TAB_OPTIONS.map((app) => (
						<Tab
							disableRipple
							key={app.tab}
							label={
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									{app.label}
								</Box>
							}
							value={app.tab}
						/>
					))}
				</Tabs>

				{tab === 'KEY_PARAMETERS' && (
					<Box width={{ sm: '200px' }}>
						<CustomSelect
							value={keyParam}
							options={KEY_PARAMETER_OPTIONS}
							label="Key Parameters"
							size="small"
							onChange={(e) => {
								const { desc } =
									KEY_PARAMETER_OPTIONS?.find(
										(k) => k.value === e?.target?.value
									) || {};
								fetchTrendModalChartData(tab, e?.target?.value);
								handleTabChange(tab, desc, e?.target?.value);
							}}
						/>
					</Box>
				)}
			</Box>

			<Box height={355}>
				{tab === 'KEY_PARAMETERS' && !keyParam ? (
					<NoDataFound message="Need to select 'Key Parameters' to get details" />
				) : chartLoading ? (
					<Loading />
				) : (
					<ReactApexChart
						options={chartOptions}
						series={chartSeries}
						type="line"
						height={350}
						width="100%"
					/>
				)}
			</Box>
		</>
	);
};

const EnergyMachineList = () => {
	const { slavesData } = useCommonData();
	const { selectedApp } = useApplications();
	const [machineListData, setMachineListData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [modalDetails, setModalDetails] = useState(null);

	const handleTabChange = (tab, tabDesc, keyParam) => {
		setModalDetails({
			...modalDetails,
			tab,
			tabDesc,
			keyParam,
		});
	};

	const handleOpenModal = (item) => {
		setModalDetails({
			isOpen: true,
			data: item,
			tab: 'ACTIVE_POWER',
			tabDesc: 'Last 6 hours Active Power data',
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};
	const filteredMachines = useMemo(() => {
		const machinesData = machineListData?.machines || [];

		if (!slavesId || !machinesData?.length) {
			return machinesData;
		}

		return machinesData.filter((mac) => mac.slave_id === slavesId);
	}, [machineListData, slavesId]);

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.EMS_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('One of the API calls failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMachineListData();
	}, []);

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
					slaveOptions={slavesData?.map((f) => ({
						label: f?.slave_name,
						value: f?.slave_id,
					}))}
					setSlavesId={setSlavesId}
					slavesId={slavesId}
					handleDownload={() => handleDownload(filteredMachines, selectedApp)}
					isDownloadDisabled={!filteredMachines?.length || isLoading}
				/>

				<Grid container height="calc(100% - 41px - 8px)" pt={1} overflow="auto">
					<Grid item xs={12}>
						{isLoading ? (
							<EnergyMachineListSkeleton />
						) : filteredMachines?.length ? (
							<Grid container rowGap={1} columnSpacing={1}>
								{filteredMachines.map((mc) => {
									return (
										<Grid
											item
											xs={12}
											sm={6}
											md={4}
											lg={3}
											key={`machine-card-${mc.slave_id}-${mc.name}`}
										>
											<PremiumEnergyMachineCard
												title={mc?.name || ''}
												status={mc?.status}
												lastUpdated={mc?.latest?.last_ts || 0}
												total={mc?.latest?.acte_im || 0}
												phaseRV={mc?.latest?.rv || 0}
												phaseRA={mc?.latest?.ir || 0}
												phaseYV={mc?.latest?.yv || 0}
												phaseYA={mc?.latest?.iy || 0}
												phaseBV={mc?.latest?.bv || 0}
												phaseBA={mc?.latest?.ib || 0}
												activePower={mc?.latest?.actpr_t || 0}
												powerFactor={mc?.latest?.pf_t || 0}
												frequency={mc?.latest?.fq || 0}
												today={mc?.energy?.today || 0}
												mtd={mc?.energy?.mtd || 0}
												slaveId={mc?.slave_id}
												trendUrl={API_URLS.EMS_MACHINE_LIST_ACTIVE_POWER(
													mc?.slave_id
												)}
												onOpenTrend={() => handleOpenModal(mc)}
											/>
										</Grid>
									);
								})}
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
				title={`${modalDetails?.data?.name} - ${modalDetails?.tabDesc}`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					<ModalContentForTrend
						handleTabChange={handleTabChange}
						tab={modalDetails?.tab}
						keyParam={modalDetails?.keyParam}
						slaveId={modalDetails?.data?.slave_id}
						slaveName={modalDetails?.data?.name}
					/>
				) : null}
			</PremiumModal>
		</>
	);
};

export default EnergyMachineList;
