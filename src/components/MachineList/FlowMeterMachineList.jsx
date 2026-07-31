import { DownloadForOffline } from '@mui/icons-material';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Papa from 'papaparse';
import { memo, useEffect, useState, useMemo } from 'react';

import { useApplications } from '../../contexts/ApplicationContext';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { getChartSeries } from '../../helpers/chartConfig';
import CustomApexChart from '../common/CustomApexChart';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

import PremiumFlowCardMachineCard from './cards/PremiumFlowCardMachineCard';

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
	const metricLabelsSet = new Set();
	filteredMachines.forEach((card) => {
		card.metrics?.forEach((m) => metricLabelsSet.add(m.label));
	});
	const metricLabels = Array.from(metricLabelsSet);

	const headers = ['Card Name', 'Status', ...metricLabels];

	const rows = filteredMachines.map((card) => {
		const metricMap = {};
		card.metrics?.forEach((m) => {
			metricMap[m.label] = `${m.value ?? ''} ${m.unit || ''}`.trim();
		});

		return [
			card.card_name || 'N/A',
			card.status || 'N/A',
			...metricLabels.map((label) => metricMap[label] ?? 'N/A'),
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

const ModalContentForTrend = memo(
	({ handleTabChange, tab, slaveId, parameters }) => {
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
					API_URLS.FLOWMETER_MACHINE_LIST_TREND(slaveId, parameter)
				);
				if (res?.success) {
					setChartResponse({
						data: res?.data?.trends || [],
					});
				}
			} catch (error) {
				console.error('flow meter trend API failed:', error);
				setChartResponse(null);
			} finally {
				setChartLoading(false);
			}
		};

		useEffect(() => {
			fetchTrendModalChartData(tab);
		}, [tab, slaveId]);

		const activeTab = parameters?.find((t) => t.value === tab);

		return (
			<>
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
				<Box height={355} mt={1} overflow="hidden">
					{chartLoading ? (
						<Loading />
					) : chartResponse?.data?.length ? (
						<CustomApexChart
							series={getChartSeries(chartResponse.data, {
								actual: activeTab?.label,
								actualLabel: activeTab?.label,
							})}
							type="line"
							colors={[APP_ACCENT_COLOR.FLOWMETER]}
							xAxesType="datetime"
							height={350}
							// title={`${activeTab?.desc ? `${activeTab.desc} — ` : ''}${
							// 	activeTab?.label || 'Flow Meter'
							// } Trend`}
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

const FlowMeterMachineList = () => {
	const { slavesData } = useCommonData();
	const { selectedApp } = useApplications();
	const [machineListData, setMachineListData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [modalDetails, setModalDetails] = useState(null);

	const machinesData = machineListData?.cards || [];

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

	const handleOpenModal = (item, parameters) => {
		const defaultTab = parameters?.[0] || {};
		setModalDetails({
			isOpen: true,
			data: item,
			tab: defaultTab?.value,
			tabDesc: defaultTab?.desc,
			parameterOptions: parameters,
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.FLOWMETER_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('STP machine list fetch failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMachineListData();
	}, []);

	const remapWaterMetricsData = (apiResponse, cardName) => {
		if (!Array.isArray(apiResponse)) {
			return [];
		}

		const levelMetrics = apiResponse.filter((item) =>
			item.metric_key.includes('Level')
		);
		const motorMetrics = apiResponse.filter((item) =>
			item.metric_key.includes('Motor')
		);

		return [
			{
				label: 'Level',
				value: levelMetrics.map((m) => m.metric_key).join(', '),
				desc: cardName,
			},
			{
				label: 'Motor',
				value: motorMetrics.map((m) => m.metric_key).join(', '),
				desc: cardName,
			},
		];
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
								{filteredMachines.map((mc, ind) => {
									const filterParamsAlone = mc?.metrics?.filter(
										(f) =>
											!['today_consumption', 'mtd_consumption'].includes(
												f?.metric_key
											)
									);

									const paramOptions =
										mc?.ui_card_type === 'TANK_CARD'
											? remapWaterMetricsData(filterParamsAlone, mc?.card_name)
											: filterParamsAlone?.map((i) => ({
													value: i.metric_key,
													desc: mc?.card_name,
													label: i.label,
											  }));

									return (
										<Grid
											item
											xs={12}
											sm={6}
											md={4}
											lg={3}
											key={`water-machine-${ind + 1}`}
										>
											<PremiumFlowCardMachineCard
												app="FLOWMETER"
												cardType={mc?.ui_card_type}
												title={mc?.card_name || ''}
												status={mc?.status}
												lastUpdated={mc?.last_updated}
												today={`${
													mc?.metrics?.find(
														(v) => v?.metric_key === 'today_consumption'
													)?.value || 0
												} KLD`}
												mtd={`${
													mc?.metrics?.find(
														(v) => v?.metric_key === 'mtd_consumption'
													)?.value || 0
												} KLD`}
												todayValue={
													mc?.metrics?.find(
														(v) => v?.metric_key === 'today_consumption'
													)?.value || 0
												}
												mtdValue={
													mc?.metrics?.find(
														(v) => v?.metric_key === 'mtd_consumption'
													)?.value || 0
												}
												slaveId={mc?.slave_id}
												trendUrl={API_URLS.FLOWMETER_MACHINE_LIST_TREND(
													mc?.slave_id,
													paramOptions?.[0]?.value
												)}
												onOpenTrend={() => handleOpenModal(mc, paramOptions)}
												metrics={mc?.metrics?.filter(
													(f) =>
														!['today_consumption', 'mtd_consumption'].includes(
															f?.metric_key
														)
												)}
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
				title={`${modalDetails?.tabDesc} - Trend`}
				confirmText={null}
				cancelText={null}
			>
				{modalDetails?.isOpen ? (
					<ModalContentForTrend
						handleTabChange={handleTabChange}
						tab={modalDetails?.tab}
						slaveId={modalDetails?.data?.slave_id}
						parameters={modalDetails?.parameterOptions}
					/>
				) : null}
			</PremiumModal>
		</>
	);
};

export default FlowMeterMachineList;
