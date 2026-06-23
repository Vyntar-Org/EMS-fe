import { DownloadForOffline, Insights } from '@mui/icons-material';
import {
	Box,
	Button,
	Chip,
	Divider,
	Grid,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
} from '@mui/material';
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
import CustomCard from '../common/CustomCard';
import { CustomSelect } from '../common/CustomSelect';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import PremiumModal from '../common/PremiumModal';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import StatusChips from '../common/StatusChips';
import TemperatureMachineListSkeleton from '../skeletonLoaders/TemperatureMachineListSkeleton';

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

const ModalContentForTrend = ({
	handleTabChange,
	tab,
	slaveId,
	parameters,
}) => {
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
						const selected = parameters.find((t) => t.value === e.target.value);
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
					<ReactApexChart
						options={getChartOptions('line', chartResponse.data, {
							xLabel: '',
							yLabel: '',
							categoryOpts: { key: 'timestamp', format: 'time' },
						})}
						series={getChartSeries(chartResponse.data, {
							actual: activeTab?.label,
							actualLabel: activeTab?.label,
						})}
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

const WaterLevelTableRows = ({ groupedMetricsData }) => {
	const findMetric = (key) =>
		groupedMetricsData?.find((m) => m.metric_key === key);

	const level1 = findMetric('Level 1');
	const level2 = findMetric('Level 2');
	const motor1 = findMetric('Motor 1 Status');
	const motor2 = findMetric('Motor 2 Status');

	const rowsConfig = [
		{
			left: {
				label: 'Water Level',
				value: level1?.value,
				color:
					level1?.status_color || (level1?.value === 'Full' ? 'RED' : 'GREEN'),
			},
			right: {
				label: 'Water Level',
				value: level2?.value,
				color:
					level2?.status_color || (level2?.value === 'Low' ? 'RED' : 'GREEN'),
			},
		},
		{
			left: {
				label: 'Motor Status',
				value: motor1?.value,
				color: motor1?.status_color,
			},
			right: {
				label: 'Motor Status',
				value: motor2?.value,
				color: motor2?.status_color,
			},
		},
	];

	return (
		<>
			{rowsConfig.map((row, index) => (
				<TableRow key={index}>
					<TableCell
						sx={{
							border: 0,
							py: 0.5,
							width: '50%',
							px: 0.5,
							backgroundColor: '#f8fafcb1',
							borderRight: '1px solid #cdd0d4',
						}}
					>
						<Box
							width="100%"
							display="flex"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box width="calc(100% - 40px - 4px)" textAlign="left">
								<ResponsiveTextWrapper
									fontSize="14px"
									color="#333333"
									fontWeight={500}
									value={row.left.label}
								/>
							</Box>

							<StatusChips value={String(row.left.value ?? 'Nil')} />
						</Box>
					</TableCell>

					<TableCell
						align="right"
						sx={{
							border: 0,
							py: 0.5,
							width: '50%',
							px: 0.5,
							backgroundColor: '#f8fafcb1',
						}}
					>
						<Box
							width="100%"
							display="flex"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box width="calc(100% - 41px - 4px)" textAlign="left">
								<ResponsiveTextWrapper
									fontSize="14px"
									color="#333333"
									fontWeight={500}
									value={row.right.label}
								/>
							</Box>
							<StatusChips value={String(row.right.value ?? 'Nil')} />
						</Box>
					</TableCell>
				</TableRow>
			))}
		</>
	);
};
const MetricBlock = ({
	label,
	status,
	lastUpdated,
	today,
	mtd,
	handleOpenModal,
	metrics,
	cardType,
}) => {
	const isOnline = status?.toLowerCase() === 'online';
	const isTankCard = cardType === 'TANK_CARD';
	const isFlowCard = cardType === 'FLOW_CARD';

	return (
		<Box
			sx={{
				p: 1,
				bgcolor: isOnline ? '#e8f5e9' : '#f2f2f2',
				borderRadius: '16px',
				height: '100%',
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

			{formatTimestamp(lastUpdated) && (
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={1}
					gap={1}
				>
					<Box width="100%">
						<ResponsiveTextWrapper
							value={formatTimestamp(lastUpdated)}
							color="#595959"
							fontWeight={500}
							fontSize="14px"
						/>
					</Box>
				</Stack>
			)}

			<Box
				sx={{
					bgcolor: 'rgba(0,0,0,0.03)',
					borderRadius: 1,
					mb: 1,
					width: '100%',
					height: isFlowCard
						? 'calc(100% - 32px - 24px - 51px - 16px)'
						: 'calc(100% - 32px - 24px - 38px - 16px)',
				}}
			>
				<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: 'bold',
									border: 0,
									width: '50%',
									...(isTankCard ? { px: 0.5, textAlign: 'center' } : {}),
								}}
							>
								<ResponsiveTextWrapper
									fontSize="16px"
									fontWeight="bold"
									value={isTankCard ? 'Collection Tank' : 'Parameter'}
								/>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: 'bold',
									border: 0,
									width: '50%',
									...(isTankCard ? { px: 0.5, textAlign: 'center' } : {}),
								}}
							>
								<ResponsiveTextWrapper
									fontSize="16px"
									fontWeight="bold"
									value={isTankCard ? 'Filter out' : 'Value'}
								/>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{isTankCard ? (
							<WaterLevelTableRows groupedMetricsData={metrics} />
						) : (
							metrics.map((row) => (
								<TableRow key={row.metric_key}>
									<TableCell sx={{ border: 0, py: 0.5, width: '50%' }}>
										<ResponsiveTextWrapper
											fontSize="14px"
											color="#333333"
											fontWeight={500}
											value={row.label}
										/>
									</TableCell>
									<TableCell
										align="right"
										sx={{ border: 0, py: 0.5, width: '50%' }}
									>
										<ResponsiveTextWrapper
											fontSize="14px"
											color="#333333"
											fontWeight={500}
											value={Number(row?.value ?? 0).toFixed(2)}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Box>

			<Divider sx={{ mb: 0.5 }} />

			<Grid
				container
				spacing={1}
				justifyContent={isFlowCard ? 'space-between' : 'end'}
				alignItems="end"
			>
				{isFlowCard ? (
					<>
						<Grid item xs={4}>
							<ResponsiveTextWrapper
								value="Today"
								variant="caption"
								color="text.secondary"
							/>

							<ResponsiveTextWrapper
								value={today}
								variant="body1"
								fontWeight="bold"
							/>
						</Grid>

						<Grid item xs={4}>
							<ResponsiveTextWrapper
								value="MTD"
								variant="caption"
								color="text.secondary"
							/>

							<ResponsiveTextWrapper
								value={mtd}
								variant="body1"
								fontWeight="bold"
							/>
						</Grid>
					</>
				) : null}

				<Grid item xs={4}>
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
				</Grid>
			</Grid>
		</Box>
	);
};

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
											<CustomCard childrenOtherProps={{ height: '100%' }}>
												<MetricBlock
													cardType={mc?.ui_card_type}
													label={mc?.card_name || ''}
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
													handleOpenModal={() =>
														handleOpenModal(mc, paramOptions)
													}
													metrics={mc?.metrics?.filter(
														(f) =>
															![
																'today_consumption',
																'mtd_consumption',
															].includes(f?.metric_key)
													)}
												/>
											</CustomCard>
										</Grid>
									);
								})}
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
