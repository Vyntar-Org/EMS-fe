import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomApexChart from '../common/CustomApexChart';
import { useWaterConfig } from './useWaterMachines';
import {
	configuredPath,
	getWaterData,
	numericReading,
} from './waterMonitorApi';

const metrics = {
	TankLevel: 'Tank Level',
	flowrate: 'Flow Rate',
	totalizer: 'Totalizer',
	motorRunState: 'Motor Status',
};

export default function WaterMonitorAnalytics() {
	const [params] = useSearchParams();
	const slaveId = params.get('slave_id');
	const config = useWaterConfig();
	const [metric, setMetric] = useState('TankLevel');
	const [range, setRange] = useState(() => ({
		from: new Date(Date.now() - 6 * 3600000).toISOString(),
		to: new Date().toISOString(),
	}));
	const path = configuredPath(config.history_url);
	const query = new URLSearchParams({
		slave_id: slaveId ?? '',
		parameter: metric,
		from_datetime: range.from,
		to_datetime: range.to,
	});
	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey: ['water-monitor', 'history', path, slaveId, metric, range],
		queryFn: async ({ signal }) => {
			const payload = await getWaterData(
				`${path}${path.includes('?') ? '&' : '?'}${query}`,
				signal
			);
			if (!Array.isArray(payload?.readings))
				throw new Error('Invalid history response.');
			return payload;
		},
		enabled: Boolean(path && slaveId),
		retry: false,
	});
	const points = (data?.readings ?? [])
		.map((reading) => ({
			x: Date.parse(reading.timestamp),
			y: numericReading(reading[metric]),
		}))
		.filter((point) => Number.isFinite(point.x))
		.sort((a, b) => a.x - b.x);
	return (
		<Box sx={{ overflow: 'auto' }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
				<TextField
					select
					size="small"
					label="Metric"
					value={metric}
					onChange={(event) => setMetric(event.target.value)}
				>
					{Object.entries(metrics).map(([key, label]) => (
						<MenuItem key={key} value={key}>
							{label}
						</MenuItem>
					))}
				</TextField>
				<Button
					disabled={isFetching}
					onClick={() =>
						setRange({
							from: new Date(Date.now() - 6 * 3600000).toISOString(),
							to: new Date().toISOString(),
						})
					}
				>
					Latest six hours
				</Button>
			</Stack>
			{!slaveId ? (
				<Alert severity="info">Select a machine using View Trend.</Alert>
			) : !path ? (
				<Alert severity="info">
					Water Monitoring historical API configuration is required.
				</Alert>
			) : error ? (
				<Alert
					severity="error"
					action={
						<Button disabled={isFetching} onClick={() => refetch()}>
							Retry
						</Button>
					}
				>
					Unable to load history.
				</Alert>
			) : isLoading ? (
				<Alert severity="info">Loading historical readings…</Alert>
			) : !points.some((point) => point.y !== null) ? (
				<Alert severity="info">
					No historical readings available for this metric.
				</Alert>
			) : (
				<>
					<Alert severity="info">
						Slave {slaveId} · {metrics[metric]} ·{' '}
						{data?.metrics?.[metric]?.unit ||
							(metric === 'motorRunState'
								? '0 = Stopped, 1 = Running'
								: 'Unit unverified')}
					</Alert>
					<CustomApexChart
						series={[{ name: metrics[metric], data: points }]}
						type="line"
						xAxesType="datetime"
						height={380}
					/>
				</>
			)}
		</Box>
	);
}
