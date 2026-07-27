import { DownloadForOffline } from '@mui/icons-material';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { getChartOptions, getChartSeries } from '../../helpers/chartConfig';
import { formatTimestamp } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

import PremiumFuelMachineCard from './cards/PremiumFuelMachineCard';

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

	const activeParam = parametersData?.find((p) => p.value === tab);

	const chartOptions = getChartOptions('line', chartResponse?.data || [], {
		xLabel: 'Time',
		yLabel:
			chartResponse?.unit || activeParam?.desc || activeParam?.label || 'Value',
		colors: [APP_ACCENT_COLOR.FUEL],
		categoryOpts: { key: 'timestamp', format: 'time' },
		chartTitle: `${slaveName || 'Fuel Machine'} — ${
			activeParam?.desc || activeParam?.label || 'Trend'
		}`,
	});

	const chartSeries = getChartSeries(chartResponse?.data || [], {
		actual: 'value',
		actualLabel: `${slaveName || 'Fuel'} (${chartResponse?.unit || ''})`,
	});

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
					<NoDataFound message="No machine readings received yet — data appears once the device reports" />
				)}
			</Box>
		</>
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
								aria-label="Download report"
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
										<PremiumFuelMachineCard
											title={mc?.slave_name || ''}
											status={mc?.status}
											lastUpdated={mc?.latest_ts}
											consumption={mc?.consumption}
											rateOfFlow={mc?.rate_of_flow}
											totalizer={mc?.totalizer}
											mtd={mc?.mtd}
											slaveId={mc?.slave_id}
											trendUrl={API_URLS.FUEL_MACHINE_LIST_TREND(
												mc?.slave_id,
												parametersData?.[0]?.value
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
				title={`${modalDetails?.data?.slave_name} - ${modalDetails?.tabDesc}`}
				confirmText={null}
				cancelText={null}
				maxWidth="md"
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
