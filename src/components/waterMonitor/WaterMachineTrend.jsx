import {
	Alert,
	Box,
	Button,
	CircularProgress,
	MenuItem,
	TextField,
	Typography,
	useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { waterApiError } from './motorCommandState';
import { formatTrendTimestamp } from './trendTimestamp';
import { getWaterTrend } from './waterMonitorApi';

const parameters = [
	{ label: 'Tank Level', value: 'tank_level' },
	{ label: 'Flowrate', value: 'flowrate' },
	{ label: 'Totalizer', value: 'totalizer' },
];

export default function WaterMachineTrend({ machine, scope }) {
	const theme = useTheme();
	const [parameter, setParameter] = useState('tank_level');
	const [hours, setHours] = useState(24);
	const trend = useQuery({
		queryKey: [
			'water-monitor',
			scope,
			'machine-trend',
			machine.slave_id,
			parameter,
			hours,
		],
		queryFn: ({ signal }) =>
			getWaterTrend({ slaveId: machine.slave_id, parameter, hours, signal }),
		retry: false,
	});
	const label = parameters.find((item) => item.value === parameter).label;
	const points = (trend.data?.points ?? []).filter((point) =>
		Number.isFinite(Date.parse(point.timestamp))
	);
	const unit = trend.data?.meta?.unit;
	return (
		<Box sx={{ minWidth: 0 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: 'minmax(0, 1fr)',
						sm: 'minmax(160px, 220px) minmax(140px, 180px)',
					},
					gap: 2,
					pt: 1,
					mb: 2,
				}}
			>
				<Box>
					<Typography
						component="label"
						id="wm-trend-parameter-label"
						htmlFor="wm-trend-parameter"
						sx={{
							display: 'block',
							mb: 0.75,
							fontSize: 12,
							fontWeight: 600,
							color: 'text.secondary',
						}}
					>
						Parameter
					</Typography>
					<TextField
						select
						fullWidth
						id="wm-trend-parameter"
						SelectProps={{ 'aria-labelledby': 'wm-trend-parameter-label' }}
						size="small"
						value={parameter}
						onChange={(event) => setParameter(event.target.value)}
					>
						{parameters.map((item) => (
							<MenuItem key={item.value} value={item.value}>
								{item.label}
							</MenuItem>
						))}
					</TextField>
				</Box>
				<Box>
					<Typography
						component="label"
						id="wm-trend-period-label"
						htmlFor="wm-trend-period"
						sx={{
							display: 'block',
							mb: 0.75,
							fontSize: 12,
							fontWeight: 600,
							color: 'text.secondary',
						}}
					>
						Period
					</Typography>
					<TextField
						select
						fullWidth
						id="wm-trend-period"
						SelectProps={{ 'aria-labelledby': 'wm-trend-period-label' }}
						size="small"
						value={hours}
						onChange={(event) => setHours(Number(event.target.value))}
					>
						{[6, 12, 24, 48, 168].map((value) => (
							<MenuItem key={value} value={value}>
								{value === 168 ? '7 days' : `${value} hours`}
							</MenuItem>
						))}
					</TextField>
				</Box>
			</Box>
			{trend.isPending ? (
				<Box role="status" sx={{ p: 5, textAlign: 'center' }}>
					<CircularProgress />
					<Typography>Loading trend...</Typography>
				</Box>
			) : trend.isError ? (
				<Alert
					severity="error"
					action={<Button onClick={() => trend.refetch()}>Retry</Button>}
				>
					{waterApiError(trend.error, 'Unable to load trend.')}
				</Alert>
			) : !points.some((point) => point.value !== null) ? (
				<Typography role="status">
					No trend data available for this period.
				</Typography>
			) : (
				<>
					<Typography variant="subtitle2">
						{label}
						{unit ? ` (${unit})` : ''} · Hourly readings
					</Typography>
					<ReactApexChart
						type="line"
						height={320}
						series={[
							{
								name: label,
								data: points.map((point) => ({
									x: Date.parse(point.timestamp),
									y: point.value,
								})),
							},
						]}
						options={{
							chart: {
								animations: { enabled: false },
								toolbar: { show: false },
								background: 'transparent',
								foreColor: theme.palette.text.secondary,
							},
							theme: { mode: theme.palette.mode },
							colors: [theme.palette.success.main],
							stroke: { curve: 'straight', width: 2 },
							markers: { size: 3 },
							xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
							yaxis: { title: { text: unit ?? '' } },
							tooltip: {
								x: { format: 'dd MMM yyyy HH:mm' },
								y: {
									formatter: (value) =>
										value === null
											? 'N/A'
											: `${value}${unit ? ` ${unit}` : ''}`,
								},
							},
							noData: { text: 'No trend data available for this period.' },
						}}
					/>
					{(trend.data.meta.from || trend.data.meta.to) && (
						<Box
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: 1,
								mt: 1.5,
								p: 1.5,
								bgcolor: 'action.hover',
								borderRadius: 2,
								color: 'text.secondary',
							}}
						>
							<Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>
								From:{' '}
								<time dateTime={trend.data.meta.from ?? undefined}>
									{formatTrendTimestamp(trend.data.meta.from)}
								</time>
							</Typography>
							<Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>
								To:{' '}
								<time dateTime={trend.data.meta.to ?? undefined}>
									{formatTrendTimestamp(trend.data.meta.to)}
								</time>
							</Typography>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
