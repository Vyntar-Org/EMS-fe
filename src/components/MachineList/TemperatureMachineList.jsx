import { DownloadForOffline } from '@mui/icons-material';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Papa from 'papaparse';
import { memo, useEffect, useMemo, useState } from 'react';

import { TEMPERATURE_TREND_TAB_OPTIONS } from '../../constants/temperatureMachineList';
import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { getChartSeries } from '../../helpers/chartConfig';
import { formatTimestamp } from '../../helpers/common';
import CustomApexChart from '../common/CustomApexChart';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

import PremiumTemperatureMachineCard from './cards/PremiumTemperatureMachineCard';

const getMachineSlaveId = (machine) => machine?.slave_id ?? machine?.id;

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

const handleDownload = (filteredMachines, selectedApp) => {
	const headers = [
		'Room Name',
		'ID',
		'Device UID',
		'Slave Index',
		'Status',
		'Temperature (°C)',
		'Humidity (%)',
		'Battery (V)',
		'Last Updated',
	];

	const rows = filteredMachines.map((machine) => [
		machine.name || 'N/A',
		machine.id ?? 'N/A',
		machine.device_uid || 'N/A',
		machine.slave_index ?? 'N/A',
		machine.status || 'N/A',
		Number(machine.temperature ?? 0).toFixed(2),
		Number(machine.humidity ?? 0).toFixed(1),
		Number(machine.battery ?? 0).toFixed(2),
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
	link.download = `${selectedApp}_machine_list_${new Date()
		.toISOString()
		.slice(0, 10)}.csv`;

	document.body.appendChild(link);
	link.click();

	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const ModalContentForTrend = memo(
	({ handleTabChange, tab, slaveId, slaveName }) => {
		const [chartResponse, setChartResponse] = useState(null);
		const [chartLoading, setChartLoading] = useState(true);

		const fetchTrendModalChartData = async (parameter) => {
			if (!slaveId || !parameter) {
				setChartResponse(null);
				return;
			}

			try {
				setChartLoading(true);
				const res = await api.get(
					API_URLS.TEMPERATURE_MACHINE_LIST_TREND(slaveId, parameter)
				);
				if (res?.success) {
					setChartResponse({
						data: res?.data?.data || [],
						unit: res?.meta?.unit || '',
					});
				}
			} catch (error) {
				console.error('Temperature trend API failed:', error);
				setChartResponse(null);
			} finally {
				setChartLoading(false);
			}
		};

		useEffect(() => {
			fetchTrendModalChartData(tab);
		}, [slaveId]);

		const activeTab = TEMPERATURE_TREND_TAB_OPTIONS.find((t) => t.tab === tab);

		const chartColors = [APP_ACCENT_COLOR.TEMPERATURE];
		const chartTitle = `${slaveName || 'Temperature Machine'} — ${
			activeTab?.label || 'Trend'
		}`;

		const chartSeries = getChartSeries(chartResponse?.data || [], {
			actual: 'value',
			actualLabel: `${slaveName || ''} ${activeTab?.label || ''}`.trim(),
		});

		return (
			<>
				<Box width={{ xs: '100%', sm: 200 }}>
					<CustomSelect
						label="Parameter"
						value={tab}
						size="small"
						fullWidth
						options={TEMPERATURE_TREND_TAB_OPTIONS.map((option) => ({
							value: option.tab,
							label: option.label,
						}))}
						onChange={(e) => {
							const selected = TEMPERATURE_TREND_TAB_OPTIONS.find(
								(t) => t.tab === e.target.value
							);
							if (!selected) {
								return;
							}
							fetchTrendModalChartData(selected.tab);
							handleTabChange(selected.tab, selected.tabDesc);
						}}
					/>
				</Box>

				<Box height={355} mt={1}>
					{chartLoading ? (
						<Loading />
					) : chartResponse?.data?.length ? (
						<CustomApexChart
							series={chartSeries}
							type="line"
							colors={chartColors}
							xAxesType="datetime"
							height={350}
							unit={chartResponse?.unit}
							// title={chartTitle}
						/>
					) : (
						<NoDataFound message="No machine readings received yet — data appears once the device reports" />
					)}
				</Box>
			</>
		);
	}
);
ModalContentForTrend.displayName = 'ModalContentForTrend';

const TemperatureMachineList = () => {
	const { slavesData } = useCommonData();
	const { selectedApp } = useApplications();
	const [machineListData, setMachineListData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [modalDetails, setModalDetails] = useState(null);

	const machines = machineListData?.machines || [];

	const filteredMachines = useMemo(() => {
		if (slavesId === null || slavesId === '' || !machines.length) {
			return machines;
		}
		return machines.filter(
			(m) => String(getMachineSlaveId(m)) === String(slavesId)
		);
	}, [machines, slavesId]);

	const handleTabChange = (tab, tabDesc) => {
		setModalDetails((prev) => ({
			...prev,
			tab,
			tabDesc,
		}));
	};

	const handleOpenModal = (item) => {
		setModalDetails({
			isOpen: true,
			data: item,
			tab: 'temperature',
			tabDesc: 'Last 6 hours Temperature data',
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.TEMPERATURE_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('Temperature machine list fetch failed:', error);
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
								{filteredMachines.map((mc) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										lg={3}
										key={`temperature-machine-${mc.id}`}
									>
										<PremiumTemperatureMachineCard
											title={mc?.name || ''}
											status={mc?.status}
											temperature={mc?.temperature}
											pressure={mc?.pressure}
											humidity={mc?.humidity}
											battery={mc?.battery}
											lastUpdated={mc?.last_updated}
											slaveId={getMachineSlaveId(mc)}
											trendUrl={API_URLS.TEMPERATURE_MACHINE_LIST_TREND(
												getMachineSlaveId(mc),
												TEMPERATURE_TREND_TAB_OPTIONS[0].tab
											)}
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
				title={`${modalDetails?.data?.name} - ${modalDetails?.tabDesc}`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					<ModalContentForTrend
						handleTabChange={handleTabChange}
						tab={modalDetails?.tab}
						slaveId={getMachineSlaveId(modalDetails?.data)}
						slaveName={modalDetails?.data?.name}
					/>
				) : null}
			</PremiumModal>
		</>
	);
};

export default TemperatureMachineList;
