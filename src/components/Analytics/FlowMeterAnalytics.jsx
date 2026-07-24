import { RestartAlt, Search } from '@mui/icons-material';
import { Box, Button, Checkbox, FormControlLabel, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { UNIQUE_PASTEL_BGS } from '../../constants/energyAnalytics';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { getChartOptions, getChartSeries } from '../../helpers/chartConfig';
import { basePickerStyles } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

const GlobalFiltersRow = ({
	dateTime,
	onDateChange,
	addNewComparisonRow,
	mergeCompare,
	onMergeChange,
	showMergeOption,
}) => (
	<Box
		sx={{
			pb: 2,
			borderBottom: '1px dashed',
			borderColor: 'divider',
			display: 'flex',
			gap: 2,
		}}
	>
		<Grid container alignItems="end" spacing={2}>
			<Grid item xs={12} md={8} lg={6}>
				{/* <Typography
					variant="subtitle2"
					sx={{ mb: 0.5, color: 'text.secondary' }}
				>
					Global Date/Time
				</Typography> */}
				<CustomDatePicker
					mode="datetimerangepicker"
					onChange={onDateChange}
					value={dateTime || ''}
				/>
			</Grid>

			<Grid item xs={12} sm="auto" ml="auto" display="flex" alignItems="center" gap={1.5}>
				{showMergeOption && (
					<FormControlLabel
						control={
							<Checkbox
								checked={mergeCompare}
								onChange={(e) => onMergeChange(e.target.checked)}
								size="small"
							/>
						}
						label="Merge all compare"
						sx={{ whiteSpace: 'nowrap', mr: 0 }}
					/>
				)}
				{!mergeCompare && (
					<Button
						fullWidth
						size="large"
						disableElevation
						sx={{
							fontWeight: 'bold',
							borderRadius: '16px',
						}}
						variant="contained"
						color="secondary"
						onClick={addNewComparisonRow}
					>
						+ Add Device To Compare
					</Button>
				)}
			</Grid>
		</Grid>
	</Box>
);

const DeviceFilterRow = ({
	comparisonId,
	slaveOptions,
	payload,
	handleFieldChange,
	handleSearch,
	handleReset,
	showCancel,
	parameterOptions,
}) => (
	<Box
		sx={{ py: 1.5, px: 2, bgcolor: 'background.paper', borderRadius: 2, mb: 1 }}
	>
		<Grid container spacing={2} alignItems="center">
			<Grid item xs={12} md={3.5}>
				<CustomAutocomplete
					options={slaveOptions}
					onChange={(val) => handleFieldChange(comparisonId, 'slave_id', val)}
					value={payload?.slave_id || ''}
					label="Select Device"
					size="small"
					sx={basePickerStyles}
				/>
			</Grid>
			<Grid item xs={12} md={4.5}>
				<CustomAutocomplete
					multiple
					options={parameterOptions}
					onChange={(val) => handleFieldChange(comparisonId, 'parameters', val)}
					value={payload?.parameters || ''}
					label="Select Parameters"
					size="small"
					sx={basePickerStyles}
				/>
			</Grid>
			<Grid
				item
				xs={12}
				md={4}
				display="flex"
				gap={1}
				justifyContent="flex-end"
			>
				<Button
					variant="contained"
					onClick={() => handleSearch(comparisonId)}
					startIcon={<Search />}
					size="small"
					disableElevation
					sx={{
						fontWeight: 'bold',
						borderRadius: '8px',
					}}
				>
					Analyze
				</Button>
				<Button
					variant="outlined"
					color="inherit"
					onClick={() => handleReset(comparisonId)}
					size="small"
					disableElevation
					sx={{
						fontWeight: 'bold',
						borderRadius: '8px',
					}}
				>
					<RestartAlt fontSize="small" />
				</Button>
				{showCancel && (
					<Button
						variant="outlined"
						color="error"
						onClick={() => handleReset(comparisonId, true)}
						size="small"
						disableElevation
						sx={{
							fontWeight: 'bold',
							borderRadius: '8px',
						}}
					>
						Cancel
					</Button>
				)}
			</Grid>
		</Grid>
	</Box>
);

const FlowMeterAnalytics = () => {
	const { slavesData, parametersData } = useCommonData();
	const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
	const [payloads, setPayloads] = useState({ 1: null });
	const [analyticsDataMap, setAnalyticsDataMap] = useState({});
	const [selectedParamsMap, setSelectedParamsMap] = useState({});
	const [loadingMap, setLoadingMap] = useState({});
	const [rowIds, setRowIds] = useState([1]);
	const [mergeCompare, setMergeCompare] = useState(false);

	const handleFieldChange = (id, key, value) => {
		setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
	};

	const handleSearch = async (id) => {
		const currentPayload = payloads[id];
		if (!currentPayload?.slave_id) {
			return;
		}

		setLoadingMap((prev) => ({ ...prev, [id]: true }));
		try {
			const slaveId = currentPayload.slave_id?.value ?? '';
			const parameterValues = currentPayload.parameters
				? currentPayload.parameters
						.map((p) => p?.value)
						.filter(Boolean)
						.join(',')
				: '';

			const startDateObj = globalDateTime?.[0];
			const endDateObj = globalDateTime?.[1];
			const formattedStart = startDateObj?.isValid?.()
				? startDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';
			const formattedEnd = endDateObj?.isValid?.()
				? endDateObj.format('YYYY-MM-DD[T]HH:mm:ss')
				: '';

			const newApiUrl = API_URLS.FLOWMETER_ANALYTICS_DATA(
				slaveId,
				parameterValues,
				formattedStart,
				formattedEnd
			);
			const res = await api.get(newApiUrl);
			if (res?.success) {
				setAnalyticsDataMap((prev) => ({ ...prev, [id]: res.data.analytics }));
				setSelectedParamsMap((prev) => ({
					...prev,
					[id]: currentPayload.parameters,
				}));
			}
		} catch (error) {
			console.error(`API Error on row ${id}:`, error);
		} finally {
			setLoadingMap((prev) => ({ ...prev, [id]: false }));
		}
	};

	const handleReset = (id, shouldRemoveRow = false) => {
		if (shouldRemoveRow && id !== 1) {
			setRowIds((prev) => prev.filter((rowId) => rowId !== id));
			setPayloads((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setAnalyticsDataMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setSelectedParamsMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
			setLoadingMap((prev) => {
				const c = { ...prev };
				delete c[id];
				return c;
			});
		} else {
			setPayloads((prev) => ({ ...prev, [id]: null }));
			setAnalyticsDataMap((prev) => ({ ...prev, [id]: null }));
			setSelectedParamsMap((prev) => ({ ...prev, [id]: null }));
		}
	};

	const addNewComparisonRow = () => {
		const nextId = Math.max(...rowIds, 0) + 1;
		setRowIds((prev) => [...prev, nextId]);
	};

	const slaveOptions =
		slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
		[];

	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 16px)',
					sm: 'calc(100vh - 64px - 16px)',
				},
			}}
		>
			<GlobalFiltersRow
				dateTime={globalDateTime}
				onDateChange={(val) => setGlobalDateTime(val)}
				addNewComparisonRow={addNewComparisonRow}
				mergeCompare={mergeCompare}
				onMergeChange={setMergeCompare}
				showMergeOption={rowIds.length > 1}
			/>

			<Box
				height={{ xs: 'calc(100% - 115px)', md: 'calc(100% - 58px)' }}
				pt={1}
				overflow="auto"
				display="flex"
				flexDirection="column"
				gap={1}
			>
				{(() => {
					const rowsComputed = rowIds.map((id, index) => {
						const rawAnalytics = analyticsDataMap[id];
						const currentSelectedParams = selectedParamsMap[id];
						const isLoading = loadingMap[id];

						const activeKeys =
							currentSelectedParams?.flatMap((param) =>
								param.value ? param.value.split(',') : []
							) || [];

						const selectedDeviceIdsInOtherRows = Object.keys(payloads)
							.filter((rowId) => Number(rowId) !== id)
							.map((rowId) => payloads[rowId]?.slave_id?.value)
							.filter(Boolean);

						const filteredSlaveOptions = slaveOptions.filter(
							(option) => !selectedDeviceIdsInOtherRows.includes(option.value)
						);

						const uniqueBgColor =
							UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];

						const deviceLabel =
							payloads[id]?.slave_id?.label || `Device Segment ${id}`;

						return {
							id,
							rawAnalytics,
							isLoading,
							activeKeys,
							filteredSlaveOptions,
							uniqueBgColor,
							deviceLabel,
						};
					});

					if (mergeCompare) {
						const rowsWithData = rowsComputed.filter(
							(row) => row.rawAnalytics?.length
						);
						const baseRow = rowsWithData[0];
						const mergedSeries = rowsWithData.flatMap((row) => {
							const actualKey = Object.keys(row.rawAnalytics[0])[1];
							return getChartSeries(row.rawAnalytics, {
								actual: actualKey,
								actualLabel: `${row.deviceLabel} - ${actualKey}`,
							});
						});
						const isAnyLoading = rowsComputed.some((row) => row.isLoading);

						return (
							<Box
								sx={{
									p: 1,
									borderRadius: 3,
									bgcolor: 'surface.muted',
									boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
								}}
							>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									Merged Comparison
								</Typography>

								{rowsComputed.map((row) => (
									<DeviceFilterRow
										key={row.id}
										comparisonId={row.id}
										slaveOptions={row.filteredSlaveOptions}
										payload={payloads[row.id]}
										handleFieldChange={handleFieldChange}
										handleSearch={handleSearch}
										handleReset={handleReset}
										showCancel={rowIds.length > 1}
										parameterOptions={parametersData}
									/>
								))}

								<Box sx={{ height: { xs: 500, sm: 380 } }} overflow="hidden">
									{isAnyLoading ? (
										<Loading />
									) : !mergedSeries.length ? (
										<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
									) : (
										<ReactApexChart
											options={getChartOptions('line', baseRow.rawAnalytics, {
												xLabel: '',
												yLabel: '',
												categoryOpts: { key: 'timestamp', format: 'datetime' },
												labels: baseRow.activeKeys,
											})}
											series={mergedSeries}
											type="line"
											height="100%"
											width="100%"
										/>
									)}
								</Box>
							</Box>
						);
					}

					return rowsComputed.map((row) => (
						<Box
							key={row.id}
							sx={{
								p: 1,
								borderRadius: 3,
								bgcolor: row.uniqueBgColor,
								transition: 'background-color 0.3s ease',
								boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
							}}
						>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
								{row.deviceLabel} Analysis{' '}
								{row.rawAnalytics?.length > 1200 &&
									`(Downsampled from ${row.rawAnalytics.length} points)`}
							</Typography>

							<DeviceFilterRow
								comparisonId={row.id}
								slaveOptions={row.filteredSlaveOptions}
								payload={payloads[row.id]}
								handleFieldChange={handleFieldChange}
								handleSearch={handleSearch}
								handleReset={handleReset}
								showCancel={rowIds.length > 1}
								parameterOptions={parametersData}
							/>

							<Box sx={{ height: { xs: 500, sm: 380 } }} overflow="hidden">
								{row.isLoading ? (
									<Loading />
								) : !row.rawAnalytics?.length ? (
									<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
								) : (
									<ReactApexChart
										options={getChartOptions('line', row.rawAnalytics, {
											xLabel: '',
											yLabel: '',
											categoryOpts: { key: 'timestamp', format: 'datetime' },
											labels: row.activeKeys,
										})}
										series={getChartSeries(row.rawAnalytics, {
											actual: Object.keys(row.rawAnalytics[0])[1],
											actualLabel: Object.keys(row.rawAnalytics[0])[1],
										})}
										type="line"
										height="100%"
										width="100%"
									/>
								)}
							</Box>
						</Box>
					));
				})()}
			</Box>
		</Box>
	);
};

export default FlowMeterAnalytics;
