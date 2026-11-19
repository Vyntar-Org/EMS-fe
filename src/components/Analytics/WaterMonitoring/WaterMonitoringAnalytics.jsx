import { Alert, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getCategoricalColors } from '../../../helpers/chartConfig';
import CustomApexChart from '../../common/CustomApexChart';
import NoDataFound from '../../common/errors/NoDataFound';
import { Loading } from '../../common/Loading';
import { getWaterMonitoringMachines } from '../../WaterMonitoring/waterMonitoringService';
import { getDefaultDateRange } from '../waterAnalyticsDates';
import {
	CHART_CANVAS_HEIGHT,
	GlobalFiltersRow,
	MergedWaterAnalysisPanel,
	WaterAnalysisPanel,
} from '../WaterAnalyticsPanels';

import { getWaterMonitoringAnalytics, waterMonitoringAnalyticsError } from './waterMonitoringAnalyticsApi';

const PARAMETERS = [
	{ label: 'Flow Rate', value: 'flow_rate', machineMetric: 'flowrate' },
	{ label: 'Tank Level', value: 'tank_level', machineMetric: 'TankLevel' },
	{
		label: 'Water Consumption',
		value: 'consumption',
		machineMetric: 'totalizer',
	},
	{ label: 'Motor Running Hours', value: 'running_hours', unit: 'hours' },
];

const EMPTY_RESULT =
	'No analytics data is available for the selected device and date range.';
const IDLE_RESULT =
	'Select a device and parameters, then click Analyze to view insights';
const EMPTY_ANALYSIS = { status: 'idle', result: null, error: '' };
const makePanel = (id) => ({ id, payload: {}, ...EMPTY_ANALYSIS });
const COMPARE_COLORS = getCategoricalColors();

const CSV_EXPORT = {
	headerCategory: 'Timestamp (UTC)',
	categoryFormatter: (timestamp) => new Date(timestamp).toISOString(),
	valueFormatter: (value) => value ?? '',
};

function validateFilters(start, end, device, parameter) {
	if (!start?.isValid()) {
		return 'Select a valid start date.';
	}
	if (!end?.isValid()) {
		return 'Select a valid end date.';
	}
	if (start.isAfter(end)) {
		return 'End date must be on or after the start date.';
	}
	if (!device) {
		return 'Select a device.';
	}
	return parameter ? '' : 'Select a parameter.';
}

function alignComparison(results) {
	const timestamps = [
		...new Set(results.flatMap(({ points }) => points.map(({ x }) => x))),
	].sort((a, b) => a - b);
	const labels = results.map(
		({ name, device }) => `${name} · ${device.replace(/[\r\n]+/g, ' ')}`
	);
	const groups = new Map();
	const series = results.map(
		({ points, unit, metric, name, slaveId }, index) => {
			const label = labels[index];
			const seriesName =
				labels.indexOf(label) === labels.lastIndexOf(label)
					? label
					: `${label} (${slaveId})`;
			// Unknown units only share a scale with readings of the same metric.
			const key = unit ? `unit:${unit}` : `metric:${metric}`;
			if (!groups.has(key)) {
				groups.set(key, { title: { text: unit || name }, seriesName: [] });
			}
			groups.get(key).seriesName.push(seriesName);
			const byTime = new Map(points.map((point) => [point.x, point]));
			return {
				name: seriesName,
				data: timestamps.map((x) => byTime.get(x) ?? { x, y: null }),
			};
		}
	);
	const axes = Array.from(groups.values(), (group, index) => ({
		...group,
		opposite: index % 2 === 1,
	}));
	return { series, axes };
}

function WaterMonitoringChart({ series, unit, axes }) {
	const discrete = series.flatMap(({ data }, seriesIndex) =>
		data.flatMap((point, dataPointIndex) =>
			point.y !== null &&
			(data[dataPointIndex - 1]?.y ?? null) === null &&
			(data[dataPointIndex + 1]?.y ?? null) === null
				? [{ seriesIndex, dataPointIndex, size: 4 }]
				: []
		)
	);
	return (
		<CustomApexChart
			series={series}
			xAxesType="datetime"
			height={CHART_CANVAS_HEIGHT}
			unit={unit}
			preservePoints
			csvExport={CSV_EXPORT}
			showSingleSeriesLegend={Boolean(axes)}
			colors={
				axes
					? series.map(
							(_, index) =>
								COMPARE_COLORS[index] ??
								`hsl(${(index * 137.508) % 360}, 65%, 42%)`
					  )
					: undefined
			}
			customOptions={{
				markers: { discrete },
				yaxis: axes,
			}}
		/>
	);
}

export default function WaterMonitoringAnalytics() {
	const [searchParams] = useSearchParams();
	const pendingLinkedDevice = useRef(searchParams.get('slave_id'));
	const [dateRange, setDateRange] = useState(getDefaultDateRange);
	const [panels, setPanels] = useState(() => [makePanel(1)]);
	const [merge, setMerge] = useState(false);
	const nextId = useRef(2);
	const requests = useRef(new Map());

	const machines = useQuery({
		queryKey: ['water-monitoring', 'analytics-machines'],
		queryFn: ({ signal }) => getWaterMonitoringMachines({ signal }),
		retry: false,
	});
	const slaveOptions = useMemo(
		() =>
			(machines.data?.machines ?? []).map((machine) => ({
				label: machine.slave_name,
				value: machine.slave_id,
				metrics: machine.metrics,
			})),
		[machines.data]
	);
	useEffect(() => {
		const device = slaveOptions.find(
			({ value }) => value === pendingLinkedDevice.current
		);
		if (device) {
			pendingLinkedDevice.current = null;
			setPanels((current) =>
				current.map((panel) =>
					panel.id === 1
						? {
								...panel,
								...EMPTY_ANALYSIS,
								payload: { ...panel.payload, slave_id: device },
						  }
						: panel
				)
			);
		}
	}, [slaveOptions]);

	useEffect(() => {
		const pending = requests.current;
		return () => {
			pending.forEach((request) => request.abort());
			pending.clear();
		};
	}, []);

	function updatePanel(id, update) {
		setPanels((current) =>
			current.map((panel) => (panel.id === id ? update(panel) : panel))
		);
	}

	function cancelRequest(id) {
		requests.current.get(id)?.abort();
		requests.current.delete(id);
	}

	function changeDate(nextRange) {
		requests.current.forEach((request) => request.abort());
		requests.current.clear();
		setDateRange(nextRange);
		setPanels((current) =>
			current.map((panel) => ({ ...panel, ...EMPTY_ANALYSIS }))
		);
	}

	function changeField(id, key, value) {
		cancelRequest(id);
		if (id === 1 && key === 'slave_id') {
			pendingLinkedDevice.current = null;
		}
		updatePanel(id, (panel) => ({
			...panel,
			...EMPTY_ANALYSIS,
			payload: { ...panel.payload, [key]: value },
		}));
	}

	function resetPanel(id, remove = false) {
		cancelRequest(id);
		if (id === 1) {
			pendingLinkedDevice.current = null;
		}
		if (remove) {
			setPanels((current) => current.filter((panel) => panel.id !== id));
			if (panels.length === 2) {
				setMerge(false);
			}
			return;
		}
		updatePanel(id, () => makePanel(id));
	}

	async function analyze(id) {
		if (requests.current.has(id)) {
			return;
		}
		const { payload } = panels.find((panel) => panel.id === id);
		const device = slaveOptions.find(
			({ value }) => value === payload.slave_id?.value
		);
		const parameter = payload.parameters?.[0];
		const [start, end] = dateRange;
		const error = validateFilters(start, end, device, parameter);

		if (error) {
			updatePanel(id, (panel) => ({
				...panel,
				...EMPTY_ANALYSIS,
				status: 'error',
				error,
			}));
			return;
		}

		const request = new AbortController();
		requests.current.set(id, request);
		updatePanel(id, (panel) => ({
			...panel,
			...EMPTY_ANALYSIS,
			status: 'loading',
		}));
		try {
			const { points, unit: apiUnit } = await getWaterMonitoringAnalytics(
				{
					slave_id: device.value,
					parameters: parameter.value,
					start_datetime: start.format('YYYY-MM-DD[T]HH:mm:ss'),
					end_datetime: end.format('YYYY-MM-DD[T]HH:mm:ss'),
				},
				{ signal: request.signal }
			);
			if (requests.current.get(id) !== request) {
				return;
			}

			const unit =
				apiUnit ||
				parameter.unit ||
				device.metrics?.[parameter.machineMetric]?.unit ||
				'';
			const name = unit ? `${parameter.label} (${unit})` : parameter.label;
			const result = points.some(({ y }) => y !== null)
				? {
						points,
						unit,
						name,
						metric: parameter.value,
						slaveId: device.value,
						device: device.label,
				  }
				: null;
			updatePanel(id, (panel) => ({
				...panel,
				status: result ? 'ready' : 'empty',
				result,
			}));
		} catch (error) {
			if (requests.current.get(id) === request) {
				updatePanel(id, (panel) => ({
					...panel,
					status: 'error',
					error: waterMonitoringAnalyticsError(error),
				}));
			}
		} finally {
			if (requests.current.get(id) === request) {
				requests.current.delete(id);
			}
		}
	}

	const analyzed = panels.flatMap(({ result }) => (result ? [result] : []));
	const isAnyLoading = panels.some(({ status }) => status === 'loading');
	const comparison =
		merge && !isAnyLoading && analyzed.length
			? alignComparison(analyzed)
			: null;
	const usedDevices = new Set(
		panels.map(({ payload }) => payload.slave_id?.value)
	);

	return (
		<Box height="100%" display="flex" flexDirection="column">
			<GlobalFiltersRow
				dateTime={dateRange}
				onDateChange={changeDate}
				addNewComparisonRow={() => {
					const panel = makePanel(nextId.current++);
					setPanels((current) => [...current, panel]);
				}}
				mergeCompare={merge}
				onMergeChange={setMerge}
				showMergeOption={panels.length > 1}
				wrapActions
			/>
			<Box
				flex={1}
				minHeight={0}
				pt={1}
				overflow="auto"
				display="grid"
				gridTemplateColumns="minmax(0, 1fr)"
				alignItems="start"
				gap={1.25}
			>
				{machines.isError && (
					<Alert severity="error">
						Unable to load devices. Please try again.
					</Alert>
				)}
				{machines.isSuccess && !slaveOptions.length && (
					<Alert severity="info">No devices are available for analytics.</Alert>
				)}
				{merge ? (
					<MergedWaterAnalysisPanel
						deviceLabels={analyzed.map(({ device }) => device)}
					>
						<Box height={CHART_CANVAS_HEIGHT}>
							{isAnyLoading ? (
								<Loading />
							) : comparison ? (
								<WaterMonitoringChart series={comparison.series} axes={comparison.axes} />
							) : (
								<NoDataFound message="Select devices and parameters, then click Analyze to view the merged comparison" />
							)}
						</Box>
					</MergedWaterAnalysisPanel>
				) : (
					panels.map(({ id, payload, status, error, result }, index) => (
						<WaterAnalysisPanel
							key={id}
							id={id}
							index={index}
							payload={payload}
							slaveOptions={slaveOptions.filter(
								({ value }) =>
									!usedDevices.has(value) || payload.slave_id?.value === value
							)}
							parametersData={PARAMETERS}
							handleFieldChange={changeField}
							handleSearch={analyze}
							handleReset={resetPanel}
							showCancel={id !== 1}
							disableAnalyze={status === 'loading'}
						>
							<Box height={CHART_CANVAS_HEIGHT}>
								{status === 'loading' ? (
									<Loading />
								) : error ? (
									<Alert severity="error">{error}</Alert>
								) : result ? (
									<WaterMonitoringChart
										series={[{ name: result.name, data: result.points }]}
										unit={result.unit}
									/>
								) : (
									<NoDataFound
										message={status === 'empty' ? EMPTY_RESULT : IDLE_RESULT}
									/>
								)}
							</Box>
						</WaterAnalysisPanel>
					))
				)}
			</Box>
		</Box>
	);
}
