import { Box } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';

import { WATER_LOG_COLUMN_MAPPING } from '../../constants/waterLogs';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { buildAnalyticsPointSeries } from '../../helpers/chartConfig';
import CustomApexChart from '../common/CustomApexChart';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';

import { getDefaultDateRange } from './waterAnalyticsDates';
import {
	CHART_CANVAS_HEIGHT,
	GlobalFiltersRow,
	MergedWaterAnalysisPanel,
	WaterAnalysisPanel,
} from './WaterAnalyticsPanels';

// Stable module-scope function (not recreated per render) so components
// that depend on its output can memoize against a real change in selection.
const extractActiveKeys = (currentSelectedParams) =>
	currentSelectedParams?.flatMap((param) =>
		param.value ? param.value.split(',') : []
	) || [];

const getProcessedChartData = (rawAnalytics, activeKeys) => {
	if (!rawAnalytics?.data || rawAnalytics.data.length === 0) {
		return { series: [], categories: [] };
	}

	const rawData = rawAnalytics.data;
	const maxPoints = 300;
	return {
		series: buildAnalyticsPointSeries(
			rawData,
			activeKeys,
			WATER_LOG_COLUMN_MAPPING,
			maxPoints
		),
	};
};

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
		const activeKeys = useMemo(
			() => extractActiveKeys(currentSelectedParams),
			[currentSelectedParams]
		);

		const processedData = useMemo(
			() => getProcessedChartData(rawAnalytics, activeKeys),
			[rawAnalytics, activeKeys]
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

		return (
			<WaterAnalysisPanel
				id={id}
				index={index}
				payload={payload}
				titleSuffix={
					rawAnalytics?.data?.length > 1200
						? ` (Downsampled from ${rawAnalytics.data.length} points)`
						: ' '
				}
				slaveOptions={filteredSlaveOptions}
				handleFieldChange={handleFieldChange}
				handleSearch={handleSearch}
				handleReset={handleReset}
				showCancel={showCancel}
				parametersData={parametersData}
			>
				<Box height={CHART_CANVAS_HEIGHT}>
					{isLoading ? (
						<Loading />
					) : !processedData.series.length ? (
						<NoDataFound message="Select a device and parameters, then click Analyze to view insights" />
					) : (
						<CustomApexChart
							series={processedData.series}
							type="line"
							xAxesType="datetime"
							height={CHART_CANVAS_HEIGHT}
						/>
					)}
				</Box>
			</WaterAnalysisPanel>
		);
	}
);
AnalyticsRow.displayName = 'AnalyticsRow';

// One combined chart across every comparison row — used instead of
// `AnalyticsRow` when "Merge all compare" is checked. Combines + memoizes
// per-row chart data in one place instead of recomputing it on every
// keystroke anywhere on the page.
const MergedAnalyticsRow = memo(({ rows, isAnyLoading }) => {
	const { mergedSeries } = useMemo(() => {
		const rowsWithData = rows
			.map((row) => ({
				...row,
				processedData: getProcessedChartData(row.rawAnalytics, row.activeKeys),
			}))
			.filter((row) => row.processedData.series.length);

		return {
			mergedSeries: rowsWithData.flatMap((row) =>
				row.processedData.series.map((series) => ({
					...series,
					name: `${row.deviceLabel} - ${series.name}`,
				}))
			),
		};
	}, [rows]);

	return (
		<MergedWaterAnalysisPanel deviceLabels={rows.map((row) => row.deviceLabel)}>
			<Box height={CHART_CANVAS_HEIGHT}>
				{isAnyLoading ? (
					<Loading />
				) : !mergedSeries.length ? (
					<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
				) : (
					<CustomApexChart
						series={mergedSeries}
						type="line"
						xAxesType="datetime"
						height={CHART_CANVAS_HEIGHT}
					/>
				)}
			</Box>
		</MergedWaterAnalysisPanel>
	);
});
MergedAnalyticsRow.displayName = 'MergedAnalyticsRow';

const WaterAnalytics = () => {
	const { slavesData, parametersData } = useCommonData();
	const analyticsParameterOptions = useMemo(
		() =>
			(parametersData || []).filter(
				(option) =>
					!['timestamp', 'metric_name', 'totalizer'].includes(option.value)
			),
		[parametersData]
	);
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

						const url = API_URLS.WATER_ANALYTICS_DATA(
							slaveId,
							parameterValues,
							formattedStart,
							formattedEnd
						);
						const res = await api.get(url);
						if (res?.success) {
							setAnalyticsDataMap((prev) => ({ ...prev, [id]: res.data }));
							setSelectedParamsMap((prev) => ({
								...prev,
								[id]: currentPayload.parameters,
							}));
						}
					} catch (error) {
						console.error(`Water analytics API error on row ${id}:`, error);
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
							parametersData={analyticsParameterOptions}
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

export default WaterAnalytics;
