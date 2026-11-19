import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { smartParseDate } from '../../helpers/dateParse';
import CustomApexChart from '../common/CustomApexChart';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { APP_ACCENT_COLOR } from '../common/MachineCardBits';

import { waterApiError } from './motorCommandState';
import { waterMachineTitle } from './waterMachinePresentation';
import { getWaterTrend } from './waterMonitorApi';

const parameters = [
	{ label: 'Tank Level', value: 'tank_level' },
	{ label: 'Flow Rate', value: 'flowrate' },
	{ label: 'Totalizer', value: 'totalizer' },
];
const colors = [APP_ACCENT_COLOR.WATER];

export default function WaterMachineTrend({ machine, scope }) {
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
	const unit = trend.data?.meta?.unit;
	// Preserve missing readings as chart gaps and discard unusable timestamps.
	const points = (trend.data?.points ?? []).flatMap(({ timestamp, value }) => {
		const date = smartParseDate(timestamp);
		return date ? [[date.valueOf(), value]] : [];
	});
	const title = waterMachineTitle(machine);
	return (
		<Box minWidth={0}>
			<Stack direction="row" spacing={1.5} sx={{ maxWidth: 420, pt: 1 }}>
				<TextField
					select
					fullWidth
					label="Parameter"
					size="small"
					value={parameter}
					onChange={(event) => setParameter(event.target.value)}
				>
					{parameters.map(({ value, label: optionLabel }) => (
						<MenuItem key={value} value={value}>
							{optionLabel}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					fullWidth
					label="Period"
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
			</Stack>
			<Box
				height={{
					xs: 'min(320px, calc(90dvh - 140px))',
					sm: 'min(500px, calc(80vh - 150px))',
				}}
				mt={1}
			>
				{trend.isPending ? (
					<Loading />
				) : trend.isError ? (
					<Alert
						severity="error"
						action={<Button onClick={() => trend.refetch()}>Retry</Button>}
					>
						{waterApiError(trend.error, 'Unable to load trend.')}
					</Alert>
				) : points.some(([, value]) => value !== null) ? (
					<CustomApexChart
						series={[
							{
								name: `${title} · ${label}${unit ? ` (${unit})` : ''}`,
								data: points,
							},
						]}
						type="line"
						colors={colors}
						xAxesType="datetime"
						height="100%"
						unit={unit}
					/>
				) : (
					<NoDataFound message="No machine readings received yet — data appears once the device reports" />
				)}
			</Box>
		</Box>
	);
}
