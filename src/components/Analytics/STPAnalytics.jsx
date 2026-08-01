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

import { UNIQUE_PASTEL_BGS } from '../../constants/energyAnalytics';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	getCategoricalColors,
	getChartSeries,
} from '../../helpers/chartConfig';
import { basePickerStyles } from '../../helpers/common';
import CustomApexChart from '../common/CustomApexChart';
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

const buildRowChart = (rawAnalytics) => {
	if (!rawAnalytics?.length) {
		return { series: [] };
	}

	const actualKey = Object.keys(rawAnalytics[0])[1];

	return {
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

// Per-chart canvas height cap — the compact grid relies on every row
// having the same predictable height so N comparison rows tile into a
// dense 2-column matrix instead of each stretching to fill leftover
// vertical space (which is what forced the old full-height stack to
// scroll for anything beyond a single row).
const CHART_CANVAS_HEIGHT = 350;

const AnalyticsRow = memo(
	({
		id,
		index,
		rawAnalytics,
		currentSelectedParams,
		isLoading,
		payload,
		slaveOptions,
		usedDeviceIds,
		parametersData,
		handleFieldChange,
		handleSearch,
		handleReset,
		showCancel,
	}) => {
		const { series: chartSeries } = useMemo(
			() => buildRowChart(rawAnalytics),
			[rawAnalytics]
		);

		const filteredSlaveOptions = useMemo(
			() =>
				slaveOptions.filter(
					(option) =>
						!usedDeviceIds.includes(option.value) ||
						payload?.slave_id?.value === option.value
				),
			[slaveOptions, usedDeviceIds, payload?.slave_id?.value]
		);

		const uniqueBgColor = UNIQUE_PASTEL_BGS[index % UNIQUE_PASTEL_BGS.length];
		const accent = ROW_ACCENTS[index % ROW_ACCENTS.length];
		const deviceLabel = payload?.slave_id?.label || `Device Segment ${id}`;

		return (
			<Box
				sx={{
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

				<Box height={CHART_CANVAS_HEIGHT}>
					{isLoading ? (
						<Loading />
					) : !chartSeries.length ? (
						<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
					) : (
						<CustomApexChart
							series={chartSeries}
							type="line"
							colors={getCategoricalColors(8)}
							xAxesType="datetime"
							height={CHART_CANVAS_HEIGHT}
						/>
					)}
				</Box>
			</Box>
		);
	}
);
AnalyticsRow.displayName = 'AnalyticsRow';

const MergedAnalyticsRow = memo(({ rows, isAnyLoading }) => {
	const { mergedSeries } = useMemo(() => {
		const rowsWithData = rows.filter((row) => row.rawAnalytics?.length);

		return {
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
				gridColumn: '1 / -1',
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

			<Box height={CHART_CANVAS_HEIGHT}>
				{isAnyLoading ? (
					<Loading />
				) : !mergedSeries.length ? (
					<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
				) : (
					<CustomApexChart
						series={mergedSeries}
						type="line"
						colors={getCategoricalColors(8)}
						xAxesType="datetime"
						height={CHART_CANVAS_HEIGHT}
					/>
				)}
			</Box>
		</Box>
	);
});
MergedAnalyticsRow.displayName = 'MergedAnalyticsRow';

const STPAnalytics = () => {
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

						const url = API_URLS.STP_ANALYTICS_DATA(
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
						console.error(`STP analytics API error on row ${id}:`, error);
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

	// Stable across renders unless payloads actually changes — passing this
	// (instead of the raw `payloads` map) into AnalyticsRow means each row's
	// memo() only breaks when a real relevant change happens, not on every
	// keystroke/click anywhere else in the screen.
	const usedDeviceIds = useMemo(
		() =>
			Object.values(payloads)
				.map((p) => p?.slave_id?.value)
				.filter(Boolean),
		[payloads]
	);

	// Stable reference for MergedAnalyticsRow's `rows` prop — an inline
	// rowIds.map(...) literal rebuilds a new array (and row objects) every
	// render, defeating both this component's memo() and its own internal
	// useMemo.
	const mergedRows = useMemo(
		() =>
			rowIds.map((id) => ({
				id,
				rawAnalytics: analyticsDataMap[id],
				activeKeys: extractActiveKeys(selectedParamsMap[id]),
				deviceLabel: payloads[id]?.slave_id?.label || `Device Segment ${id}`,
			})),
		[rowIds, analyticsDataMap, selectedParamsMap, payloads]
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
				display="grid"
				gridTemplateColumns="1fr"
				alignItems="start"
				gap={1.25}
			>
				{mergeCompare ? (
					<MergedAnalyticsRow
						rows={mergedRows}
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
							slaveOptions={slaveOptions}
							usedDeviceIds={usedDeviceIds}
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

export default STPAnalytics;
