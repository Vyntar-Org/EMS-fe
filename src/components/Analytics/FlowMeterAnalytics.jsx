import { RestartAlt, Search, Timeline } from '@mui/icons-material';
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Grid,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import { memo, useCallback, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { UNIQUE_PASTEL_BGS } from '../../constants/energyAnalytics';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	getCategoricalColors,
	getChartOptions,
	getChartSeries,
} from '../../helpers/chartConfig';
import { basePickerStyles } from '../../helpers/common';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import { CustomDatePicker } from '../common/CustomDatePicker';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

// Same colorblind-safe palette the dashboards use, one accent per
// comparison row (cycled), so each row's chrome reads as a deliberate
// identity instead of a random pastel fill.
const ROW_ACCENTS = getCategoricalColors(6);
// Distinct from any single row's accent — signals "this combines every row"
// rather than belonging to one of them.
const MERGE_ACCENT = getCategoricalColors(7)[6];

const getDefaultDateRange = () => [dayjs().subtract(24, 'hour'), dayjs()];

// ApexCharts performance falls off well before this — keep categories and
// series capped to the same figure so the x-axis always lines up with the
// data points actually rendered.
const MAX_POINTS = 300;

const extractActiveKeys = (currentSelectedParams) =>
	currentSelectedParams?.flatMap((param) =>
		param.value ? param.value.split(',') : []
	) || [];

const buildRowChart = (rawAnalytics, activeKeys) => {
	if (!rawAnalytics?.length) {
		return { options: null, series: [] };
	}

	const actualKey = Object.keys(rawAnalytics[0])[1];

	return {
		options: getChartOptions('line', rawAnalytics, {
			chartTitle: 'Flow Meter Analytics Trend',
			tooltipFixed: false,
			xLabel: 'Time',
			yLabel: 'Value',
			colors: getCategoricalColors(8),
			categoryOpts: {
				key: 'timestamp',
				format: 'datetime',
				maxPoints: MAX_POINTS,
			},
			labels: activeKeys,
		}),
		series: getChartSeries(
			rawAnalytics,
			{ actual: actualKey, actualLabel: actualKey },
			MAX_POINTS
		),
	};
};

const GlobalFiltersRow = memo(
	({
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
					<CustomDatePicker
						mode="datetimerangepicker"
						onChange={onDateChange}
						value={dateTime || ''}
					/>
				</Grid>

				<Grid
					item
					xs={12}
					sm="auto"
					ml="auto"
					display="flex"
					alignItems="center"
					gap={1.5}
				>
					{showMergeOption && (
						<FormControlLabel
							control={
								<Checkbox
									checked={mergeCompare}
									onChange={(e) => onMergeChange(e.target.checked)}
									size="small"
								/>
							}
							label="Merge All Devices into One Chart"
							sx={{
								whiteSpace: 'nowrap',
								mr: 0,
								'.MuiFormControlLabel-label': {
									fontSize: '14px',
									fontWeight: 600,
								},
							}}
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
	)
);
GlobalFiltersRow.displayName = 'GlobalFiltersRow';

const DeviceFilterRow = memo(
	({
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
			sx={{
				py: 1.5,
				px: 2,
				bgcolor: 'background.paper',
				borderRadius: 2,
				mb: 1,
			}}
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
						onChange={(val) =>
							handleFieldChange(comparisonId, 'parameters', val)
						}
						value={payload?.parameters || []}
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
	)
);
DeviceFilterRow.displayName = 'DeviceFilterRow';

const AnalyticsRow = memo(
	({
		id,
		index,
		rawAnalytics,
		currentSelectedParams,
		isLoading,
		payload,
		payloads,
		slaveOptions,
		parametersData,
		handleFieldChange,
		handleSearch,
		handleReset,
		showCancel,
	}) => {
		const activeKeys = useMemo(
			() => extractActiveKeys(currentSelectedParams),
			[currentSelectedParams]
		);

		const { options: chartOptions, series: chartSeries } = useMemo(
			() => buildRowChart(rawAnalytics, activeKeys),
			[rawAnalytics, activeKeys]
		);

		const filteredSlaveOptions = useMemo(() => {
			const selectedDeviceIdsInOtherRows = Object.keys(payloads)
				.filter((rowId) => Number(rowId) !== id)
				.map((rowId) => payloads[rowId]?.slave_id?.value)
				.filter(Boolean);
			return slaveOptions.filter(
				(option) => !selectedDeviceIdsInOtherRows.includes(option.value)
			);
		}, [payloads, id, slaveOptions]);

		const uniqueBgColor = UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];
		const accent = ROW_ACCENTS[index % ROW_ACCENTS.length];
		const deviceLabel = payload?.slave_id?.label || `Device Segment ${id}`;

		return (
			<Box
				sx={{
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					p: 1.25,
					borderRadius: '18px',
					bgcolor: uniqueBgColor,
					border: '1px solid',
					borderColor: (t) =>
						alpha(accent, t.palette.mode === 'dark' ? 0.32 : 0.22),
					boxShadow: (t) =>
						t.palette.mode === 'dark'
							? `0 2px 6px ${alpha('#000', 0.3)}, 0 10px 26px ${alpha(
									'#000',
									0.22
							  )}`
							: `0 1px 3px ${alpha('#0F233E', 0.06)}, 0 8px 22px ${alpha(
									'#0F233E',
									0.06
							  )}`,
					transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
					'&:hover': {
						borderColor: alpha(accent, 0.5),
					},
				}}
			>
				<Box
					display="flex"
					alignItems="center"
					gap={1}
					mb={1}
					minWidth={0}
					flexShrink={0}
				>
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: '9px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
							bgcolor: alpha(accent, 0.16),
							color: accent,
							'& svg': { fontSize: 17 },
						}}
					>
						<Timeline />
					</Box>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 700,
							minWidth: 0,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{deviceLabel} Analysis{' '}
						{rawAnalytics?.length > 1200 &&
							`(Downsampled from ${rawAnalytics.length} points)`}
					</Typography>
				</Box>

				<DeviceFilterRow
					comparisonId={id}
					slaveOptions={filteredSlaveOptions}
					payload={payload}
					handleFieldChange={handleFieldChange}
					handleSearch={handleSearch}
					handleReset={handleReset}
					showCancel={showCancel}
					parameterOptions={parametersData}
				/>

				<Box flex={1} minHeight={0}>
					{isLoading ? (
						<Loading />
					) : !chartSeries.length ? (
						<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
					) : (
						<ReactApexChart
							options={chartOptions}
							series={chartSeries}
							type="line"
							height="100%"
							width="100%"
						/>
					)}
				</Box>
			</Box>
		);
	}
);
AnalyticsRow.displayName = 'AnalyticsRow';

const MergedAnalyticsRow = memo(({ rows, isAnyLoading }) => {
	const { mergedOptions, mergedSeries } = useMemo(() => {
		const rowsWithData = rows.filter((row) => row.rawAnalytics?.length);
		const baseRow = rowsWithData[0];

		return {
			mergedOptions: baseRow
				? getChartOptions('line', baseRow.rawAnalytics, {
						chartTitle: 'Flow Meter Analytics Trend',
						tooltipFixed: false,
						xLabel: 'Time',
						yLabel: 'Value',
						colors: getCategoricalColors(8),
						categoryOpts: {
							key: 'timestamp',
							format: 'datetime',
							maxPoints: MAX_POINTS,
						},
						labels: baseRow.activeKeys,
				  })
				: null,
			mergedSeries: rowsWithData.flatMap((row) => {
				const actualKey = Object.keys(row.rawAnalytics[0])[1];
				return getChartSeries(
					row.rawAnalytics,
					{
						actual: actualKey,
						actualLabel: `${row.deviceLabel} - ${actualKey}`,
					},
					MAX_POINTS
				);
			}),
		};
	}, [rows]);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				p: 1.25,
				borderRadius: '18px',
				bgcolor: 'surface.muted',
				border: '1px solid',
				borderColor: (t) =>
					alpha(MERGE_ACCENT, t.palette.mode === 'dark' ? 0.32 : 0.22),
				boxShadow: (t) =>
					t.palette.mode === 'dark'
						? `0 2px 6px ${alpha('#000', 0.3)}, 0 10px 26px ${alpha(
								'#000',
								0.22
						  )}`
						: `0 1px 3px ${alpha('#0F233E', 0.06)}, 0 8px 22px ${alpha(
								'#0F233E',
								0.06
						  )}`,
			}}
		>
			<Box
				display="flex"
				alignItems="center"
				gap={1}
				mb={0.5}
				minWidth={0}
				flexShrink={0}
			>
				<Box
					sx={{
						width: 30,
						height: 30,
						borderRadius: '9px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
						bgcolor: alpha(MERGE_ACCENT, 0.16),
						color: MERGE_ACCENT,
						'& svg': { fontSize: 17 },
					}}
				>
					<Timeline />
				</Box>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 0 }}>
					Merged Comparison
				</Typography>
			</Box>

			<Typography
				variant="body2"
				sx={{ color: 'text.secondary', mb: 1.5, flexShrink: 0 }}
			>
				{rows.map((row) => row.deviceLabel).join(' merged ')}
			</Typography>

			<Box flex={1} minHeight={0}>
				{isAnyLoading ? (
					<Loading />
				) : !mergedSeries.length ? (
					<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
				) : (
					<ReactApexChart
						options={mergedOptions}
						series={mergedSeries}
						type="line"
						height="100%"
						width="100%"
					/>
				)}
			</Box>
		</Box>
	);
});
MergedAnalyticsRow.displayName = 'MergedAnalyticsRow';

const FlowMeterAnalytics = () => {
	const { slavesData, parametersData } = useCommonData();
	const [globalDateTime, setGlobalDateTime] = useState(getDefaultDateRange());
	const [payloads, setPayloads] = useState({ 1: null });
	const [analyticsDataMap, setAnalyticsDataMap] = useState({});
	const [selectedParamsMap, setSelectedParamsMap] = useState({});
	const [loadingMap, setLoadingMap] = useState({});
	const [rowIds, setRowIds] = useState([1]);
	const [mergeCompare, setMergeCompare] = useState(false);

	const handleFieldChange = useCallback((id, key, value) => {
		setPayloads((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
	}, []);

	const handleSearch = useCallback(
		(id) => {
			setPayloads((prevPayloads) => {
				const currentPayload = prevPayloads[id];
				if (!currentPayload?.slave_id) {
					return prevPayloads;
				}

				setLoadingMap((prev) => ({ ...prev, [id]: true }));
				(async () => {
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

						const url = API_URLS.FLOWMETER_ANALYTICS_DATA(
							slaveId,
							parameterValues,
							formattedStart,
							formattedEnd
						);
						const res = await api.get(url);
						if (res?.success) {
							setAnalyticsDataMap((prev) => ({
								...prev,
								[id]: res.data.analytics,
							}));
							setSelectedParamsMap((prev) => ({
								...prev,
								[id]: currentPayload.parameters,
							}));
						}
					} catch (error) {
						console.error(
							`Flow Meter analytics API error on row ${id}:`,
							error
						);
					} finally {
						setLoadingMap((prev) => ({ ...prev, [id]: false }));
					}
				})();

				return prevPayloads;
			});
		},
		[globalDateTime]
	);

	const handleReset = useCallback((id, shouldRemoveRow = false) => {
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
	}, []);

	const addNewComparisonRow = useCallback(() => {
		setRowIds((prev) => [...prev, Math.max(...prev, 0) + 1]);
	}, []);

	const slaveOptions = useMemo(
		() =>
			slavesData?.map((f) => ({ label: f?.slave_name, value: f?.slave_id })) ||
			[],
		[slavesData]
	);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<GlobalFiltersRow
				dateTime={globalDateTime}
				onDateChange={setGlobalDateTime}
				addNewComparisonRow={addNewComparisonRow}
				mergeCompare={mergeCompare}
				onMergeChange={setMergeCompare}
				showMergeOption={rowIds.length > 1}
			/>

			<Box
				flex={1}
				minHeight={0}
				pt={1}
				overflow="auto"
				display="flex"
				flexDirection="column"
				gap={1}
			>
				{mergeCompare ? (
					<MergedAnalyticsRow
						rows={rowIds.map((id) => ({
							id,
							rawAnalytics: analyticsDataMap[id],
							activeKeys: extractActiveKeys(selectedParamsMap[id]),
							deviceLabel:
								payloads[id]?.slave_id?.label || `Device Segment ${id}`,
						}))}
						isAnyLoading={rowIds.some((id) => loadingMap[id])}
					/>
				) : (
					rowIds.map((id, index) => (
						<AnalyticsRow
							key={id}
							id={id}
							index={index}
							rawAnalytics={analyticsDataMap[id]}
							currentSelectedParams={selectedParamsMap[id]}
							isLoading={loadingMap[id]}
							payload={payloads[id]}
							payloads={payloads}
							slaveOptions={slaveOptions}
							parametersData={parametersData}
							handleFieldChange={handleFieldChange}
							handleSearch={handleSearch}
							handleReset={handleReset}
							showCancel={id !== 1 && rowIds.length > 1}
						/>
					))
				)}
			</Box>
		</Box>
	);
};

export default FlowMeterAnalytics;
