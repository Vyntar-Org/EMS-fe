import {
	AdjustRounded,
	BarChartRounded,
	CalendarMonthRounded,
	ChevronRightRounded,
	CycloneRounded,
	DeviceThermostatRounded,
	DownloadForOfflineRounded,
	InfoOutlined,
	PowerSettingsNewRounded,
	SettingsRounded,
	TrendingUpRounded,
	TuneRounded,
} from '@mui/icons-material';
import {
	Box,
	Button,
	Chip,
	Grid,
	IconButton,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';

import { SOLAR_TREND_TAB_OPTIONS } from '../../constants/solarMachineList';
import { useCommonData } from '../../contexts/CommonDataContext';
import { api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import { getChartSeries } from '../../helpers/chartConfig';
import { formatTimestamp } from '../../helpers/common';
import { formatNumber } from '../../helpers/formatters';
import CustomApexChart from '../common/CustomApexChart';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import NoDataFound from '../common/errors/NoDataFound';
import { Loading } from '../common/Loading';
import { MACHINE_CARD_DESIGN } from '../common/machineCardDesign';
import PremiumModal from '../common/PremiumModal';

const AHU_IMAGE = '/assets/ahu/ahu-unit.png';
const getMachineId = (machine) => machine?.slave_id ?? machine?.id;

const AHUMetric = ({ icon, label, value, color, change }) => (
	<Box
		sx={{
			position: 'relative',
			display: 'flex',
			alignItems: 'center',
			gap: 1,
			minWidth: 0,
			p: 1,
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			'&::before': {
				content: '""',
				position: 'absolute',
				left: 0,
				top: 8,
				bottom: 8,
				width: 4,
				borderRadius: '0 4px 4px 0',
				bgcolor: color,
			},
		}}
	>
		<Box
			sx={{
				width: 38,
				height: 38,
				display: 'grid',
				placeItems: 'center',
				borderRadius: '50%',
				color,
				bgcolor: alpha(color, 0.1),
				flexShrink: 0,
				'& svg': { fontSize: 22 },
			}}
		>
			{icon}
		</Box>
		<Box minWidth={0}>
			<Typography
				noWrap
				sx={{
					fontSize: MACHINE_CARD_DESIGN.metricLabelSize,
					color: 'text.secondary',
					fontWeight: 600,
				}}
			>
				{label}
			</Typography>
			<Typography
				noWrap
				sx={{ fontSize: '1rem', color: 'text.primary', fontWeight: 800 }}
			>
				{value}
			</Typography>
			<Box
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 0.35,
					mt: 0.25,
					px: 0.6,
					py: 0.2,
					borderRadius: 1,
					bgcolor: alpha(color, 0.09),
				}}
			>
				<TrendingUpRounded sx={{ color, fontSize: 13 }} />
				<Typography
					sx={{
						color,
						fontSize: MACHINE_CARD_DESIGN.helperSize,
						fontWeight: 800,
					}}
				>
					{Number(change) >= 0 ? '+' : ''}
					{formatNumber(change, 1, { fallback: '0.0' })}%
				</Typography>
				<Typography
					sx={{
						color: 'text.secondary',
						fontSize: MACHINE_CARD_DESIGN.helperSize,
					}}
				>
					vs. last hour
				</Typography>
			</Box>
		</Box>
	</Box>
);

const AHUTemperatureRange = ({ machine, value }) => {
	const minimum = Number(
		machine?.minimum_temperature ?? machine?.min_temperature ?? 20
	);
	const maximum = Number(
		machine?.maximum_temperature ?? machine?.max_temperature ?? 30
	);
	const numericValue = Number(value);
	const percent = Number.isFinite(numericValue)
		? Math.max(
				0,
				Math.min(
					100,
					((numericValue - minimum) / (maximum - minimum || 1)) * 100
				)
		  )
		: 0;
	const zone =
		percent < 35 ? 'COOL ZONE' : percent > 70 ? 'WARM ZONE' : 'OPTIMAL';

	return (
		<Box
			sx={{
				p: 1,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				spacing={1}
			>
				<Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
					<BarChartRounded sx={{ color: 'success.main', fontSize: 27 }} />
					<Box minWidth={0}>
						<Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>
							Temperature Control Range
						</Typography>
						<Typography
							noWrap
							sx={{
								fontSize: MACHINE_CARD_DESIGN.helperSize,
								color: 'text.secondary',
							}}
						>
							Current RA temperature relative to desired operating range
						</Typography>
					</Box>
				</Stack>
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<Chip
						label={zone}
						size="small"
						color={zone === 'OPTIMAL' ? 'success' : 'warning'}
						sx={{
							height: 22,
							fontSize: MACHINE_CARD_DESIGN.statusSize,
							fontWeight: 800,
						}}
					/>
					<InfoOutlined color="primary" sx={{ fontSize: 17 }} />
				</Stack>
			</Stack>
			<Box
				sx={{
					position: 'relative',
					height: 8,
					mt: 0.9,
					borderRadius: 99,
					background:
						'linear-gradient(90deg,#1976ed,#00b85d 30%,#ffd323 55%,#ff7b00 76%,#e71832)',
					'&::after': {
						content: '""',
						position: 'absolute',
						left: `${percent}%`,
						top: '50%',
						width: 18,
						height: 18,
						borderRadius: '50%',
						bgcolor: 'background.paper',
						border: '3px solid #ef6c00',
						boxShadow: 1,
						transform: 'translate(-50%,-50%)',
					},
				}}
			/>
			<Box
				sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', mt: 0.5 }}
			>
				{[
					['COOL', 'Lower temperature', 'left'],
					['OPTIMAL', 'Target operating range', 'center'],
					['WARM', 'Higher temperature', 'right'],
				].map(([label, caption, align]) => (
					<Box key={label} textAlign={align}>
						<Typography
							sx={{
								fontSize: MACHINE_CARD_DESIGN.helperSize,
								color: 'text.secondary',
								fontWeight: 800,
								lineHeight: 1.1,
							}}
						>
							{label}
						</Typography>
						<Typography
							sx={{
								fontSize: '0.55rem',
								color: 'text.disabled',
								fontStyle: 'italic',
								lineHeight: 1.1,
							}}
						>
							{caption}
						</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
};

const AHUInlineTrend = ({ machine, currentValue }) => {
	const [points, setPoints] = useState([]);

	useEffect(() => {
		let active = true;
		api
			.get(
				API_URLS.AHU_MACHINE_LIST_TREND(
					getMachineId(machine),
					SOLAR_TREND_TAB_OPTIONS[0].tab
				)
			)
			.then((response) => {
				if (!active) {
					return;
				}
				const values = (response?.data?.data || [])
					.map((point) => Number(point?.value))
					.filter(Number.isFinite)
					.slice(-24);
				setPoints(values);
			})
			.catch(() => active && setPoints([]));
		return () => {
			active = false;
		};
	}, [machine]);

	const min = Math.min(...points, 0);
	const max = Math.max(...points, 1);
	const polyline = points
		.map((point, index) => {
			const x = points.length > 1 ? (index / (points.length - 1)) * 300 : 150;
			const y = 52 - ((point - min) / (max - min || 1)) * 42;
			return `${x},${y}`;
		})
		.join(' ');
	const areaPoints = points.length > 1 ? `0,60 ${polyline} 300,60` : '';

	return (
		<Box
			sx={{
				p: 1,
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
			}}
		>
			<Stack direction="row" alignItems="center">
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<TrendingUpRounded color="success" sx={{ fontSize: 18 }} />
					<Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>
						RA Temperature Trend
					</Typography>
					<Typography
						sx={{
							fontSize: MACHINE_CARD_DESIGN.helperSize,
							color: 'text.secondary',
						}}
					>
						(Last 24 Hours)
					</Typography>
				</Stack>
			</Stack>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr auto',
					gap: 1,
					alignItems: 'center',
					mt: 0.5,
				}}
			>
				<Box
					sx={{ display: 'grid', gridTemplateColumns: '22px 1fr', minWidth: 0 }}
				>
					<Stack justifyContent="space-between" sx={{ height: 62, py: 0.25 }}>
						{[32, 26, 14].map((label) => (
							<Typography
								key={label}
								sx={{
									fontSize: '0.5rem',
									color: 'text.secondary',
									lineHeight: 1,
								}}
							>
								{label}
							</Typography>
						))}
					</Stack>
					<Box minWidth={0}>
						<Box sx={{ height: 62 }}>
							{points.length > 1 ? (
								<Box
									component="svg"
									viewBox="0 0 300 60"
									preserveAspectRatio="none"
									sx={{ width: '100%', height: '100%' }}
									aria-label="RA temperature trend for the last 24 hours"
								>
									{[12, 30, 48].map((y) => (
										<line
											key={y}
											x1="0"
											y1={y}
											x2="300"
											y2={y}
											stroke="#cbd5e1"
											strokeDasharray="5 5"
											strokeWidth="1"
										/>
									))}
									<polygon points={areaPoints} fill={alpha('#16A34A', 0.15)} />
									<polyline
										points={polyline}
										fill="none"
										stroke="#16A34A"
										strokeWidth="3"
										strokeLinejoin="round"
										strokeLinecap="round"
									/>
								</Box>
							) : (
								<Box height="100%" display="grid" sx={{ placeItems: 'center' }}>
									<Typography
										sx={{
											fontSize: MACHINE_CARD_DESIGN.helperSize,
											color: 'text.secondary',
										}}
									>
										No trend readings available
									</Typography>
								</Box>
							)}
						</Box>
						<Stack direction="row" justifyContent="space-between">
							{['12:00 am', '6:00 am', '12:00 pm', '6:00 pm'].map((label) => (
								<Typography
									key={label}
									sx={{ fontSize: '0.48rem', color: 'text.secondary' }}
								>
									{label}
								</Typography>
							))}
						</Stack>
					</Box>
				</Box>
				<Box
					sx={{
						minWidth: 70,
						py: 0.8,
						px: 1,
						textAlign: 'center',
						borderRadius: 1.5,
						color: 'success.dark',
						bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
					}}
				>
					<Typography sx={{ fontSize: '1rem', fontWeight: 900 }}>
						{formatNumber(currentValue, 1, { fallback: '-' })} °C
					</Typography>
					<Typography
						sx={{
							fontSize: MACHINE_CARD_DESIGN.helperSize,
							color: 'text.secondary',
						}}
					>
						Now
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

const AHUOperatingStatus = ({ machine }) => {
	const items = [
		{
			label: 'Setpoint',
			value: `${formatNumber(
				machine?.setpoint_temperature ?? machine?.setpoint,
				1,
				{ fallback: '-' }
			)} °C`,
			icon: <AdjustRounded />,
			color: '#2563EB',
		},
		{
			label: 'AHU Mode',
			value: machine?.mode || machine?.ahu_mode || '-',
			icon: <SettingsRounded />,
			color: '#7C3AED',
		},
		{
			label: 'AHU Status',
			value: machine?.ahu_status || machine?.operating_status || '-',
			caption: machine?.status_description || 'Unit is stopped',
			icon: <PowerSettingsNewRounded />,
			color: '#E11D48',
		},
	];
	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
				gap: 0.75,
			}}
		>
			{items.map((item) => (
				<Stack
					key={item.label}
					direction="row"
					alignItems="center"
					spacing={0.6}
					minWidth={0}
					sx={{
						pl: item.label === 'Setpoint' ? 0 : 0.75,
						borderLeft: item.label === 'Setpoint' ? 0 : '1px solid',
						borderColor: 'divider',
					}}
				>
					<Box
						sx={{
							width: 30,
							height: 30,
							display: 'grid',
							placeItems: 'center',
							borderRadius: '50%',
							color: item.color,
							bgcolor: alpha(item.color, 0.1),
							flexShrink: 0,
							'& svg': { fontSize: 18 },
						}}
					>
						{item.icon}
					</Box>
					<Box minWidth={0}>
						<Typography
							noWrap
							sx={{
								fontSize: MACHINE_CARD_DESIGN.helperSize,
								color: 'text.secondary',
							}}
						>
							{item.label}
						</Typography>
						<Typography
							noWrap
							sx={{
								fontSize: MACHINE_CARD_DESIGN.metricValueSize,
								fontWeight: 800,
								color: item.color,
							}}
						>
							{item.value}
						</Typography>
						{item.caption ? (
							<Typography
								noWrap
								sx={{
									fontSize: '0.52rem',
									color: 'text.secondary',
									lineHeight: 1.1,
								}}
							>
								{item.caption}
							</Typography>
						) : null}
					</Box>
				</Stack>
			))}
		</Box>
	);
};

const AHUCard = ({ machine, onOpenTrend }) => {
	const isOnline = machine?.status?.toLowerCase() === 'online';
	const statusColor = isOnline ? '#16A34A' : '#EF3340';
	const raTemperature = machine?.ra_temperature ?? machine?.inlet_temperature;
	const actuatorStatus = machine?.actuator_status ?? machine?.pressure;
	const raChange =
		machine?.ra_temperature_change ?? machine?.temperature_change;
	const actuatorChange =
		machine?.actuator_status_change ?? machine?.pressure_change;

	return (
		<Box
			sx={{
				width: '100%',
				height: '100%',
				minWidth: 0,
				p: 1.5,
				display: 'flex',
				flexDirection: 'column',
				gap: 1.25,
				border: '1px solid',
				borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
				borderRadius: MACHINE_CARD_DESIGN.cardRadius,
				bgcolor: 'background.paper',
				boxShadow: '0 12px 30px rgba(37,69,111,.10)',
			}}
		>
			<Box
				sx={{
					display: 'flex',
					position: 'relative',
					alignItems: 'center',
					gap: 1,
					minWidth: 0,
					p: 1,
					pb: 2.5,
					border: '1px solid',
					borderColor: alpha(statusColor, 0.35),
					borderRadius: MACHINE_CARD_DESIGN.sectionRadius,
					background: `linear-gradient(115deg, ${alpha(
						statusColor,
						0.12
					)}, ${alpha(statusColor, 0.025)})`,
					'&::after': {
						content: '""',
						position: 'absolute',
						right: 62,
						bottom: 0,
						width: 110,
						height: 42,
						opacity: 0.35,
						backgroundImage: `radial-gradient(${statusColor} 1px, transparent 1px)`,
						backgroundSize: '8px 8px',
					},
				}}
			>
				<Box
					sx={{
						width: 48,
						height: 48,
						display: 'grid',
						placeItems: 'center',
						borderRadius: '50%',
						bgcolor: 'background.paper',
						color: 'primary.main',
						boxShadow: 1,
						flexShrink: 0,
					}}
				>
					<Box
						sx={{
							position: 'relative',
							display: 'grid',
							placeItems: 'center',
							'&::before, &::after': {
								content: '""',
								position: 'absolute',
								top: '50%',
								width: 4,
								height: 23,
								borderRadius: 4,
								bgcolor: 'text.secondary',
								transform: 'translateY(-50%)',
							},
							'&::before': { left: -7 },
							'&::after': { right: -7 },
						}}
					>
						<CycloneRounded sx={{ fontSize: 31, color: 'text.secondary' }} />
					</Box>
				</Box>
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography
						noWrap
						sx={{ fontSize: MACHINE_CARD_DESIGN.titleSize, fontWeight: 800 }}
					>
						{machine?.name || machine?.slave_name || 'AHU'}
					</Typography>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.5}
						mt={0.4}
						color="text.secondary"
					>
						<CalendarMonthRounded sx={{ fontSize: 14 }} />
						<Typography
							noWrap
							sx={{ fontSize: MACHINE_CARD_DESIGN.helperSize }}
						>
							{formatTimestamp(machine?.last_updated || machine?.latest_ts) ||
								'-'}
						</Typography>
					</Stack>
					<Typography
						noWrap
						sx={{
							mt: 0.35,
							fontSize: '0.55rem',
							color: 'text.secondary',
							letterSpacing: '0.14em',
						}}
					>
						REAL-TIME MONITORING · HW ID:{' '}
						{machine?.device_uid || getMachineId(machine) || '-'}
					</Typography>
				</Box>
				<Chip
					label={isOnline ? 'ONLINE' : 'OFFLINE'}
					icon={<AdjustRounded />}
					size="small"
					sx={{
						height: 24,
						color: statusColor,
						bgcolor: alpha(statusColor, 0.08),
						border: `1px solid ${alpha(statusColor, 0.35)}`,
						fontSize: MACHINE_CARD_DESIGN.statusSize,
						fontWeight: 800,
						'& .MuiChip-icon': { color: statusColor, fontSize: 13 },
					}}
				/>
				<Typography
					sx={{
						position: 'absolute',
						right: 10,
						bottom: 6,
						zIndex: 1,
						fontSize: '0.5rem',
						color: 'text.secondary',
						fontWeight: 700,
						letterSpacing: '0.14em',
					}}
				>
					SMART · CONTROLLED · EFFICIENT
				</Typography>
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
					gap: 1,
				}}
			>
				<AHUMetric
					icon={<DeviceThermostatRounded />}
					label="RA Temperature (PT1000)"
					value={`${formatNumber(raTemperature, 2, { fallback: '-' })} °C`}
					color="#16A34A"
					change={raChange}
				/>
				<AHUMetric
					icon={<SettingsRounded />}
					label="Actuator Status"
					value={
						machine?.actuator_status !== null &&
						machine?.actuator_status !== undefined
							? `${formatNumber(actuatorStatus, 1, { fallback: '-' })}%`
							: `${formatNumber(actuatorStatus, 2, { fallback: '-' })}%`
					}
					color="#7C3AED"
					change={actuatorChange}
				/>
			</Box>

			<Box
				sx={{
					height: { xs: 150, sm: 175, xl: 190 },
					display: 'grid',
					placeItems: 'center',
					py: 0.5,
					overflow: 'hidden',
				}}
			>
				<Box
					component="img"
					src={AHU_IMAGE}
					alt={`${machine?.name || 'AHU'} airflow diagram`}
					sx={{
						width: '100%',
						height: '100%',
						objectFit: 'contain',
						objectPosition: 'center',
					}}
				/>
			</Box>

			<AHUTemperatureRange machine={machine} value={raTemperature} />
			<AHUInlineTrend machine={machine} currentValue={raTemperature} />
			<AHUOperatingStatus machine={machine} />
			<Button
				onClick={() => onOpenTrend(machine)}
				fullWidth
				variant="contained"
				color={isOnline ? 'success' : 'error'}
				startIcon={<TuneRounded />}
				endIcon={<ChevronRightRounded />}
				sx={{
					minHeight: 36,
					borderRadius: 1.5,
					fontSize: MACHINE_CARD_DESIGN.actionSize,
					fontWeight: 800,
					'& .MuiButton-endIcon': { position: 'absolute', right: 12 },
				}}
			>
				Control AHU
			</Button>
		</Box>
	);
};

const AHUTrend = ({ machine }) => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				setLoading(true);
				const response = await api.get(
					API_URLS.AHU_MACHINE_LIST_TREND(
						getMachineId(machine),
						SOLAR_TREND_TAB_OPTIONS[0].tab
					)
				);
				if (active) {
					setData(response?.data?.data || []);
				}
			} catch (error) {
				console.error('AHU trend API failed:', error);
				if (active) {
					setData([]);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [machine]);

	if (loading) {
		return <Loading />;
	}
	if (!data.length) {
		return <NoDataFound message="No AHU trend readings available" />;
	}

	return (
		<Box height={420}>
			<CustomApexChart
				series={getChartSeries(data, {
					actual: 'value',
					actualLabel: machine?.name || 'AHU',
				})}
				type="line"
				colors={['#16A34A']}
				xAxesType="datetime"
				height="100%"
			/>
		</Box>
	);
};

const downloadMachines = (machines) => {
	const csv = Papa.unparse(
		machines.map((machine) => ({
			Name: machine?.name || machine?.slave_name || 'AHU',
			Status: machine?.status || 'N/A',
			'RA Temperature':
				machine?.ra_temperature ?? machine?.inlet_temperature ?? '',
			'Outlet Temperature': machine?.outlet_temperature ?? '',
			'Flow Temperature': machine?.flow_temperature ?? '',
			'Instant Flow': machine?.instant_flow ?? '',
			Pressure: machine?.pressure ?? '',
		}))
	);
	const url = URL.createObjectURL(
		new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
	);
	const link = document.createElement('a');
	link.href = url;
	link.download = `AHU_machine_list_${new Date()
		.toISOString()
		.slice(0, 10)}.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

const AHUMachineList = () => {
	const { slavesData } = useCommonData();
	const [machineListData, setMachineListData] = useState(null);
	const [selectedSlaveId, setSelectedSlaveId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [trendMachine, setTrendMachine] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const response = await api.get(API_URLS.AHU_MACHINE_LIST_DATA);
				if (response?.success) {
					setMachineListData(response.data);
				}
			} catch (error) {
				console.error('AHU machine list fetch failed:', error);
				setMachineListData(null);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const machines = machineListData?.machines || [];
	const filteredMachines = useMemo(
		() =>
			selectedSlaveId === null || selectedSlaveId === undefined
				? machines
				: machines.filter(
						(machine) =>
							String(getMachineId(machine)) === String(selectedSlaveId)
				  ),
		[machines, selectedSlaveId]
	);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				spacing={1}
				pb={1}
				borderBottom="1px solid"
				borderColor="divider"
			>
				<Box sx={{ width: { xs: '100%', sm: 300 } }}>
					<CustomAutocomplete
						options={(slavesData || []).map((slave) => ({
							label: slave.slave_name,
							value: slave.slave_id,
						}))}
						value={selectedSlaveId ?? ''}
						onChange={(option) => setSelectedSlaveId(option?.value ?? null)}
						label="Search AHU devices..."
						size="small"
					/>
				</Box>
				<Tooltip title="Download report">
					<span>
						<IconButton
							color="primary"
							disabled={!filteredMachines.length || loading}
							onClick={() => downloadMachines(filteredMachines)}
						>
							<DownloadForOfflineRounded />
						</IconButton>
					</span>
				</Tooltip>
			</Stack>

			<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pt: 1.5 }}>
				{loading ? (
					<Loading />
				) : filteredMachines.length ? (
					<Grid container spacing={2}>
						{filteredMachines.map((machine) => (
							<Grid
								item
								xs={12}
								md={6}
								xl={6}
								key={getMachineId(machine)}
								sx={{ display: 'flex' }}
							>
								<AHUCard machine={machine} onOpenTrend={setTrendMachine} />
							</Grid>
						))}
					</Grid>
				) : (
					<NoDataFound message="No AHU machines available" />
				)}
			</Box>

			<PremiumModal
				open={Boolean(trendMachine)}
				onClose={() => setTrendMachine(null)}
				title={`${
					trendMachine?.name || trendMachine?.slave_name || 'AHU'
				} - Temperature Trend`}
				confirmText={null}
				cancelText={null}
				type="chart"
			>
				{trendMachine ? <AHUTrend machine={trendMachine} /> : null}
			</PremiumModal>
		</Box>
	);
};

export default AHUMachineList;
