import React, { useEffect, useMemo, useState, useRef } from 'react';
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
	Tabs,
	Tab,
	Typography,
	TableContainer,
	CircularProgress,
} from '@mui/material';
import { CustomAutocomplete } from '../common/CustomAutocomplete';
import {
	DownloadForOffline,
	Insights,
	BarChart,
	TableChart,
} from '@mui/icons-material';
import NoDataFound from '../common/errors/NoDataFound';
import CustomCard from '../common/CustomCard';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper';
import { MachineAvatar, machineCardSx } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';
import { Loading } from '../common/Loading';
import ReactApexChart from 'react-apexcharts';
import Papa from 'papaparse';

import { useCommonData } from '../../contexts/CommonDataContext';
import { useApplications } from '../../contexts/ApplicationContext';
import { API_URLS } from '../../helpers/apiUrls';
import { api } from '../../helpers/api';
import { formatTimestamp } from '../../helpers/common';

// --- Helper Functions ---

const parseDowntimeDate = (dateStr) => {
	if (!dateStr) return null;
	// Handle "DD-MM-YYYY HH:mm" format
	const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
	if (!parts) return null;
	return new Date(
		parseInt(parts[3]),
		parseInt(parts[2]) - 1,
		parseInt(parts[1]),
		parseInt(parts[4]),
		parseInt(parts[5])
	).getTime();
};

const parseFlexibleDate = (dateStr) => {
	if (!dateStr) return null;
	const nativeTs = new Date(dateStr).getTime();
	if (!isNaN(nativeTs) && nativeTs > 0) return nativeTs;
	return parseDowntimeDate(dateStr);
};

const formatMinutesToDuration = (totalMinutes) => {
	const isNegative = totalMinutes < 0;
	const absMinutes = Math.abs(totalMinutes);
	const hours = Math.floor(absMinutes / 60);
	const minutes = absMinutes % 60;
	const sign = isNegative ? '-' : '';
	return `${sign}${String(hours).padStart(2, '0')} hr ${String(
		minutes
	).padStart(2, '0')} m`;
};

// --- Constants ---

const DEFAULT_TREND_OPTIONS = [
	{ label: 'Status', value: 'status', desc: 'Last 6 hours status data' },
];

const createTrendOptions = (latest = {}) => {
	const keys = Object.keys(latest || {}).filter(
		(key) => key !== 'last_ts' && key !== 'timestamp' && key !== 'time'
	);

	if (!keys.length) {
		return DEFAULT_TREND_OPTIONS;
	}

	return keys.map((key) => ({
		label: key
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase()),
		value: key,
		desc: `Last 6 hours ${key.replace(/_/g, ' ')}`,
	}));
};

// --- Components ---

const MachineListHeader = ({
	slaveOptions,
	setSlavesId,
	slavesId,
	handleDownload,
	isDownloadDisabled,
}) => (
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
					onChange={(e) => setSlavesId(e?.value || '')}
					value={slavesId || ''}
					label="Search Devices..."
					size="small"
					sx={{
						'& .MuiOutlinedInput-root': {
							borderRadius: 2,
							backgroundColor: 'surface.muted',
							transition: '0.3s',
							'&:hover': {
								backgroundColor: 'background.paper',
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

const CompressorMetricBlock = ({
	machine,
	handleOpenModal,
	onStoppageClick,
}) => {
	const latest = machine?.latest || {};
	const rawStatus =
		machine?.current_status?.status ||
		machine?.status ||
		latest?.status ||
		'Unknown';
	const status = String(rawStatus);
	const isOnline = status?.toLowerCase() === 'online';

	const lastUpdated =
		machine?.current_status?.last_updated ||
		latest?.last_ts ||
		machine?.last_updated ||
		machine?.last_ts;

	const statusFrom =
		machine?.current_status?.since_display ||
		machine?.current_status?.status_from ||
		latest?.status_from ||
		latest?.status_since ||
		latest?.from ||
		machine?.status_from ||
		'';

	const name =
		machine?.name ||
		machine?.slave_name ||
		machine?.device_uid ||
		machine?.compressor_no ||
		'Unnamed Device';

	const lastStoppageStart =
		machine?.last_stoppage?.start_time ||
		machine?.last_stoppage?.start ||
		latest?.stop_start ||
		latest?.last_stop_start;

	const lastStoppageEnd =
		machine?.last_stoppage?.end_time ||
		machine?.last_stoppage?.end ||
		latest?.stop_end ||
		latest?.last_stop_end;

	const lastStoppageDuration =
		machine?.last_stoppage?.duration ||
		latest?.stop_duration ||
		latest?.last_stop_duration ||
		machine?.last_stoppage?.duration_display ||
		'N/A';

	const previous8Count =
		machine?.history_8h?.count ??
		machine?.previous_8hrs_stoppages ??
		machine?.stoppages_previous_8hrs ??
		machine?.stoppages_8hrs ??
		0;

	const previous24Count =
		machine?.history_24h?.count ??
		machine?.previous_24hrs_stoppages ??
		machine?.stoppages_previous_24hrs ??
		machine?.stoppages_24hrs ??
		0;

	const previous8Duration =
		machine?.history_8h?.total_duration ??
		machine?.previous_8hrs_duration ??
		machine?.stoppage_duration_previous_8hrs ??
		machine?.stoppage_duration_8hrs ??
		'N/A';

	const previous24Duration =
		machine?.history_24h?.total_duration ??
		machine?.previous_24hrs_duration ??
		machine?.stoppage_duration_previous_24hrs ??
		machine?.stoppage_duration_24hrs ??
		'N/A';

	return (
		<Box
			sx={{
				p: 1,
				...machineCardSx(isOnline),
				borderRadius: '16px',
				minHeight: 340,
			}}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				spacing={1}
				sx={{ mb: 1 }}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					sx={{ flex: 1, minWidth: 0 }}
				>
					<MachineAvatar app="COMPRESSOR" />
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<ResponsiveTextWrapper
							value={name}
							variant="h6"
							fontWeight="bold"
							color="text.primary"
						/>
					</Box>
				</Stack>

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
						color="text.secondary"
						fontWeight={500}
						fontSize="14px"
					/>
				</Box>
			</Stack>

			<Divider sx={{ mb: 1 }} />

			<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
				<ResponsiveTextWrapper
					value="Current Status:"
					fontWeight="bold"
					color="text.primary"
					fontSize="14px"
				/>
				<Box
					sx={{
						bgcolor: isOnline ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
						borderRadius: '999px',
						px: 2,
						py: 0.5,
					}}
				>
					<ResponsiveTextWrapper
						value={status?.toUpperCase()}
						color={isOnline ? 'success.main' : 'error.main'}
						fontWeight="bold"
						fontSize="12px"
					/>
				</Box>
				{statusFrom ? (
					<ResponsiveTextWrapper
						value={`from ${statusFrom}`}
						color="text.secondary"
						fontSize="12px"
						fontWeight="bold"
						align="center"
					/>
				) : null}
			</Stack>

			<Box sx={{ mb: 1 }}>
				<ResponsiveTextWrapper
					value="Last Stoppage"
					fontWeight="bold"
					fontSize="14px"
				/>
				<Table size="small" sx={{ mt: 1, width: '100%', tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								Start Time
							</TableCell>
							<TableCell
								align="center"
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								End Time
							</TableCell>
							<TableCell
								align="center"
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								Duration
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell sx={{ border: 0, p: 0.5, fontSize: '12px' }}>
								{lastStoppageStart || '-'}
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px' }}
							>
								{lastStoppageEnd || '-'}
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px' }}
							>
								{lastStoppageDuration || '-'}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Box>

			<Box sx={{ mb: 1 }}>
				<Table size="small" sx={{ mt: 1, width: '100%', tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell
								align=""
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								Stoppages History
							</TableCell>
							<TableCell
								align="center"
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								Previous 8hrs
							</TableCell>
							<TableCell
								align="center"
								sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '13px' }}
							>
								Previous 24hrs
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell
								sx={{ border: 0, p: 0.5, fontSize: '12px', fontWeight: 'bold' }}
							>
								No. of Stoppages
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px', fontWeight: 'bold' }}
							>
								<Box
									component="span"
									onClick={() =>
										previous8Count > 0 && onStoppageClick(machine, 8)
									}
									sx={{
										cursor: previous8Count > 0 ? 'pointer' : 'default',
										color: previous8Count > 0 ? '#2F6FB0' : 'inherit',
										fontWeight: 600,
										'&:hover':
											previous8Count > 0 ? { textDecoration: 'underline' } : {},
									}}
								>
									{previous8Count}
								</Box>
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px', fontWeight: 'bold' }}
							>
								<Box
									component="span"
									onClick={() =>
										previous24Count > 0 && onStoppageClick(machine, 24)
									}
									sx={{
										cursor: previous24Count > 0 ? 'pointer' : 'default',
										color: previous24Count > 0 ? '#2F6FB0' : 'inherit',
										fontWeight: 600,
										'&:hover':
											previous24Count > 0
												? { textDecoration: 'underline' }
												: {},
									}}
								>
									{previous24Count}
								</Box>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell
								sx={{ border: 0, p: 0.5, fontSize: '12px', fontWeight: 'bold' }}
							>
								Stoppage Duration
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px' }}
							>
								{previous8Duration}
							</TableCell>
							<TableCell
								align="center"
								sx={{ border: 0, p: 0.5, fontSize: '12px' }}
							>
								{previous24Duration}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				justifyContent="flex-end"
				gap={1}
				mt={0.5}
			>
				<Button
					onClick={() => handleOpenModal(machine)}
					size="small"
					startIcon={<Insights />}
					disableElevation
					variant="contained"
					sx={{
						fontWeight: 'bold',
						borderRadius: '16px',
						mt: 1,
					}}
				>
					TREND
				</Button>
			</Stack>
		</Box>
	);
};

const handleDownload = (filteredMachines, selectedApp) => {
	const headers = [
		'Machine Name',
		'Compressor No',
		'Slave ID',
		'Status',
		'Since',
		'Last Stoppage Start',
		'Last Stoppage End',
		'Duration',
		'Stoppages (8h)',
		'Stoppage Duration (8h)',
		'Stoppages (24h)',
		'Stoppage Duration (24h)',
		'Last Updated',
	];

	const rows = filteredMachines.map((machine) => {
		const latest = machine?.latest || {};
		const status =
			machine?.current_status?.status ||
			machine?.status ||
			latest?.status ||
			'N/A';
		const since =
			machine?.current_status?.since_display ||
			machine?.current_status?.status_from ||
			latest?.status_from ||
			latest?.status_since ||
			machine?.status_from ||
			'N/A';
		const lastUpdated =
			machine?.current_status?.last_updated ||
			latest?.last_ts ||
			machine?.last_updated ||
			machine?.last_ts;

		const lastStoppageStart =
			machine?.last_stoppage?.start_time ||
			machine?.last_stoppage?.start ||
			latest?.stop_start ||
			latest?.last_stop_start ||
			'-';
		const lastStoppageEnd =
			machine?.last_stoppage?.end_time ||
			machine?.last_stoppage?.end ||
			latest?.stop_end ||
			latest?.last_stop_end ||
			'-';
		const lastStoppageDuration =
			machine?.last_stoppage?.duration ||
			latest?.stop_duration ||
			latest?.last_stop_duration ||
			machine?.last_stoppage?.duration_display ||
			'-';

		const count8h =
			machine?.history_8h?.count ??
			machine?.previous_8hrs_stoppages ??
			machine?.stoppages_previous_8hrs ??
			machine?.stoppages_8hrs ??
			0;
		const duration8h =
			(machine?.history_8h?.total_duration ??
				machine?.previous_8hrs_duration ??
				machine?.stoppage_duration_previous_8hrs ??
				machine?.stoppage_duration_8hrs) ||
			'-';
		const count24h =
			machine?.history_24h?.count ??
			machine?.previous_24hrs_stoppages ??
			machine?.stoppages_previous_24hrs ??
			machine?.stoppages_24hrs ??
			0;
		const duration24h =
			(machine?.history_24h?.total_duration ??
				machine?.previous_24hrs_duration ??
				machine?.stoppage_duration_previous_24hrs ??
				machine?.stoppage_duration_24hrs) ||
			'-';

		return [
			machine?.name ||
				machine?.slave_name ||
				machine?.compressor_no ||
				machine?.device_uid ||
				'N/A',
			machine?.compressor_no || 'N/A',
			machine?.slave_id ?? 'N/A',
			status,
			since,
			lastStoppageStart,
			lastStoppageEnd,
			lastStoppageDuration,
			count8h,
			duration8h,
			count24h,
			duration24h,
			lastUpdated ? formatTimestamp(lastUpdated) : 'N/A',
		];
	});

	const csvContent = Papa.unparse({ fields: headers, data: rows });
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

// --- New Stoppage History Modal Component ---

const StoppageHistoryModal = ({ open, onClose, machine, hours }) => {
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState(0);
	const [stoppages, setStoppages] = useState([]);
	const [summary, setSummary] = useState(null);
	const [windowRange, setWindowRange] = useState(null);

	// Ref to access stoppages inside the tooltip function
	const stoppagesRef = useRef([]);
	useEffect(() => {
		stoppagesRef.current = stoppages;
	}, [stoppages]);

	useEffect(() => {
		if (open && machine) {
			fetchData();
		}
	}, [open, machine, hours]);

	const fetchData = async () => {
		setLoading(true);
		setActiveTab(0);
		setStoppages([]);
		setSummary(null);
		try {
			const slaveId = machine?.slave_id || machine?.id;
			const res = await api.get(
				API_URLS.COMPRESSOR_DOWNTIME_HISTORY(slaveId, hours)
			);

			if (res?.meta?.window) {
				setWindowRange(res.meta.window);
			} else {
				const now = new Date();
				const fromTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
				setWindowRange({ from: fromTime.toISOString(), to: now.toISOString() });
			}

			if (res?.data?.periods) {
				setStoppages(
					res.data.periods.map((p) => ({
						start_time: p.start_time,
						end_time: p.end_time,
						duration: p.duration,
						durationSeconds: p.duration_seconds,
						isOngoing: p.ongoing || false,
					}))
				);
			}

			if (res?.meta?.summary) {
				setSummary(res.meta.summary);
			}
		} catch (err) {
			console.error('Error fetching downtime history:', err);
		} finally {
			setLoading(false);
		}
	};

	// Chart Series Logic - Mirroring Code 1 Logic
	const chartSeries = useMemo(() => {
		if (!windowRange?.from || !windowRange?.to) return [];

		const fromTs = parseFlexibleDate(windowRange.from);
		const toTs = parseFlexibleDate(windowRange.to);
		if (fromTs == null || toTs == null) return [];

		const sorted = [...stoppages]
			.map((p, idx) => ({
				...p,
				originalIndex: idx,
				startTs: parseDowntimeDate(p.start_time),
				endTs: p.end_time ? parseDowntimeDate(p.end_time) : null,
			}))
			.filter((p) => p.startTs != null && !isNaN(p.startTs))
			.sort((a, b) => a.startTs - b.startTs);

		if (sorted.length === 0) return [];

		const points = [];

		// 1. Start with Online
		points.push({ x: fromTs, y: 1 });

		// 2. Process stoppages
		for (const stop of sorted) {
			points.push({ x: stop.startTs, y: 0 }); // Go Offline

			if (stop.endTs != null && !isNaN(stop.endTs)) {
				points.push({ x: stop.endTs, y: 1 }); // Go Online
			}
		}

		// 3. End state
		const lastStop = sorted[sorted.length - 1];
		if (lastStop.endTs == null || isNaN(lastStop.endTs)) {
			points.push({ x: toTs, y: 0 }); // End Offline
		} else {
			points.push({ x: toTs, y: 1 }); // End Online
		}

		return [{ name: 'Connectivity', data: points }];
	}, [stoppages, windowRange]);

	// Chart Options - Mirroring Code 1 Design
	const chartOptions = useMemo(
		() => ({
			chart: {
				type: 'area',
				height: 350,
				toolbar: {
					show: true,
					tools: {
						download: true,
						selection: false,
						zoom: false,
						zoomin: false,
						zoomout: false,
						pan: false,
						reset: false,
					},
				},
				zoom: { enabled: false },
				background: '#FFFFFF',
				animations: { enabled: false, dynamicAnimation: { enabled: false } },
			},
			stroke: {
				curve: 'stepline',
				width: 2,
				colors: ['#30b44a'],
			},
			fill: {
				type: 'solid',
				colors: ['#30b44a'],
				opacity: 0.2,
			},
			dataLabels: { enabled: false },
			grid: {
				borderColor: '#ebe5e5',
				strokeDashArray: 0,
			},
			xaxis: {
				type: 'datetime',
				title: { text: 'Time', style: { color: '#6B7280', fontSize: '12px' } },
				labels: {
					style: { colors: '#6B7280', fontSize: '11px' },
					datetimeUTC: false,
				},
				min: windowRange?.from
					? parseFlexibleDate(windowRange.from)
					: undefined,
				max: windowRange?.to ? parseFlexibleDate(windowRange.to) : undefined,
			},
			yaxis: {
				title: {
					text: 'Status',
					style: { color: '#6B7280', fontSize: '12px' },
				},
				min: -0.1,
				max: 1.1,
				tickAmount: 2,
				labels: {
					style: { colors: '#6B7280', fontSize: '11px' },
					formatter: function (val) {
						if (val >= 0.9) return 'Online';
						if (val <= 0.1) return 'Offline';
						return '';
					},
				},
			},
			tooltip: {
				enabled: true,
				theme: 'light',
				x: { format: 'dd MMM HH:mm' },
				custom: function ({ seriesIndex, dataPointIndex, w }) {
					const dataPoint =
						w.globals.initialSeries[seriesIndex]?.data[dataPointIndex];
					if (!dataPoint) return '';

					const date = new Date(dataPoint.x);
					const formattedDate = date.toLocaleString();
					const value = dataPoint.y;
					const statusText = value === 1 ? 'Online' : 'Offline';
					const statusColor = value === 1 ? '#30b44a' : '#e34d4d';

					const currentStoppages = stoppagesRef.current;
					let durationText = '';
					let isOngoing = false;

					if (value === 0) {
						const ts = dataPoint.x;
						// Find matching stoppage with tolerance
						const match = currentStoppages.find((p) => {
							const sTs = parseDowntimeDate(p.start_time);
							return sTs !== null && Math.abs(sTs - ts) < 2000;
						});
						if (match) {
							durationText = match.duration || '';
							isOngoing = match.isOngoing || false;
						}
					}

					return `<div style="padding:10px;background-color:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
            <div style="font-weight:bold;margin-bottom:8px;color:#333;font-size:12px;">${formattedDate}</div>
            <div style="display:flex;align-items:center;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${statusColor};margin-right:8px;"></span>
                <span style="flex:1;color:#333;font-size:12px;">Status:</span>
                <span style="font-weight:bold;color:${statusColor};margin-left:5px;font-size:12px;">${statusText}</span>
            </div>
            ${
							value === 0 && durationText
								? `<div style="display:flex;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid #f0f0f0;">
                <span style="flex:1;color:#333;font-size:12px;">Duration:</span>
                <span style="font-weight:bold;color:#e34d4d;margin-left:5px;font-size:12px;">${durationText}</span>
            </div>`
								: ''
						}
            ${
							isOngoing
								? `<div style="margin-top:6px;text-align:right;"><span style="display:inline-block;font-size:9px;color:#e34d4d;font-weight:700;background:#fae8e8;padding:2px 8px;border-radius:4px;letter-spacing:0.5px;">● ONGOING</span></div>`
								: ''
						}
        </div>`;
				},
			},
			legend: { show: false },
		}),
		[windowRange]
	);

	const handleTableDownload = () => {
		const headers = ['#', 'Start Time', 'End Time', 'Duration'];
		const rows = stoppages.map((item, index) => [
			index + 1,
			`"${item.start_time || '-'}"`,
			`"${item.isOngoing ? 'Ongoing' : item.end_time}"`,
			`"${item.duration || '-'}"`,
		]);

		const totalDuration =
			summary?.total_downtime ||
			formatMinutesToDuration(
				Math.round(
					stoppages.reduce(
						(sum, item) => sum + (item.durationSeconds || 0),
						0
					) / 60
				)
			);
		rows.push(['', '', '', '']);
		rows.push(['Total Stoppages:', stoppages.length, '', '']);
		rows.push(['Total Duration:', `"${totalDuration}"`, '', '']);

		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${machine?.name || 'Compressor'}_stoppages_${hours}h.csv`;
		link.click();
	};

	return (
		<PremiumModal
			open={open}
			onClose={onClose}
			title={`${machine?.name || machine?.slave_name} — Last ${hours} hrs`}
			confirmText={null}
			cancelText={null}
		>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
					<Tab
						icon={<BarChart sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Chart"
					/>
					<Tab
						icon={<TableChart sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Data"
					/>
				</Tabs>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{activeTab === 0 && (
						<Box sx={{ height: 350 }}>
							{chartSeries[0]?.data?.length > 0 ? (
								<ReactApexChart
									options={chartOptions}
									series={chartSeries}
									type="area"
									height={320}
								/>
							) : (
								<NoDataFound message="No machine readings received yet — data appears once the device reports" />
							)}
						</Box>
					)}

					{activeTab === 1 && (
						<Box>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
								<Button
									size="small"
									startIcon={<DownloadForOffline />}
									onClick={handleTableDownload}
									disabled={stoppages.length === 0}
								>
									Download CSV
								</Button>
							</Box>
							{stoppages.length > 0 ? (
								<TableContainer sx={{ maxHeight: 300 }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow>
												<TableCell>#</TableCell>
												<TableCell>Start Time</TableCell>
												<TableCell>End Time</TableCell>
												<TableCell>Duration</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{stoppages.map((item, idx) => (
												<TableRow
													key={idx}
													sx={{
														bgcolor: item.isOngoing ? '#fff5f5' : 'inherit',
													}}
												>
													<TableCell>{idx + 1}</TableCell>
													<TableCell sx={{ fontFamily: 'monospace' }}>
														{item.start_time || '-'}
													</TableCell>
													<TableCell
														sx={{
															fontFamily: 'monospace',
															color: item.isOngoing
																? 'error.main'
																: 'text.primary',
															fontWeight: item.isOngoing ? 'bold' : 'normal',
														}}
													>
														{item.isOngoing ? 'Ongoing' : item.end_time || '-'}
													</TableCell>
													<TableCell sx={{ fontFamily: 'monospace' }}>
														{item.duration || '-'}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							) : (
								<NoDataFound message="No machine readings received yet — data appears once the device reports" />
							)}

							{stoppages.length > 0 && (
								<Box
									sx={{
										mt: 2,
										p: 1.5,
										bgcolor: 'surface.muted',
										borderRadius: 1,
										display: 'flex',
										justifyContent: 'space-between',
									}}
								>
									<Typography variant="body2">
										Total Stoppages:{' '}
										<strong>{summary?.count ?? stoppages.length}</strong>
									</Typography>
									<Typography variant="body2">
										Total Duration:{' '}
										<strong>
											{summary?.total_downtime ??
												formatMinutesToDuration(
													Math.round(
														stoppages.reduce(
															(sum, i) => sum + (i.durationSeconds || 0),
															0
														) / 60
													)
												)}
										</strong>
									</Typography>
								</Box>
							)}
						</Box>
					)}
				</>
			)}
		</PremiumModal>
	);
};

const ModalContentForTrend = ({
	handleTabChange,
	tab,
	tabDesc,
	slaveId,
	slaveName,
	trendOptions,
}) => {
	const [chartResponse, setChartResponse] = useState(null);
	const [chartLoading, setChartLoading] = useState(true);
	const [downtimeHistory, setDowntimeHistory] = useState(null);

	const fetchTrendAndDowntime = async (parameter) => {
		if (!slaveId || !parameter) {
			setChartResponse(null);
			setDowntimeHistory(null);
			setChartLoading(false);
			return;
		}

		try {
			setChartLoading(true);

			const [trendRes, downtimeRes] = await Promise.all([
				api.get(API_URLS.COMPRESSOR_MACHINE_LIST_TREND(slaveId, parameter)),
				// api.get(API_URLS.COMPRESSOR_DOWNTIME_HISTORY(slaveId, 48)),
			]);

			if (trendRes?.success) {
				setChartResponse({
					data: trendRes?.data?.data || [],
					unit: trendRes?.meta?.unit || '',
				});
			} else {
				setChartResponse(null);
			}

			if (downtimeRes?.success) {
				setDowntimeHistory(downtimeRes?.data || null);
			} else {
				setDowntimeHistory(null);
			}
		} catch (error) {
			console.error('Compressor trend/downtime API failed:', error);
			setChartResponse(null);
			setDowntimeHistory(null);
		} finally {
			setChartLoading(false);
		}
	};

	useEffect(() => {
		fetchTrendAndDowntime(tab);
	}, [slaveId, tab]);

	const isStatusTrend = tab === 'status';
	const chartData = chartResponse?.data || [];

	// ─── FIXED: Handle both numeric (1/0) and string ("online"/"offline") status values ───
	const chartSeries = useMemo(() => {
		if (!chartData.length) return [];

		if (isStatusTrend) {
			const data = [];

			chartData.forEach((item) => {
				const startTime = new Date(item.start).getTime();
				const endTime = new Date(item.end).getTime();

				// Robust check: handles 1, "1", "online", true
				const rawStatus = item.status;
				const isOnline =
					rawStatus === 1 ||
					rawStatus === '1' ||
					String(rawStatus).toLowerCase() === 'online' ||
					rawStatus === true;

				const yVal = isOnline ? 1 : 0;

				data.push({ x: startTime, y: yVal });
				data.push({ x: endTime, y: yVal });
			});

			// Sort by time to ensure proper line connection
			data.sort((a, b) => a.x - b.x);

			// Match series name 'Connectivity' from Code 1
			return [{ name: 'Connectivity', data: data }];
		} else {
			return [
				{
					name: `${tabDesc || 'Trend'}`,
					data: chartData.map((item) => {
						const value = item.value ?? item[tab];
						return typeof value === 'number'
							? Number(value)
							: Number(value || 0);
					}),
				},
			];
		}
	}, [chartData, isStatusTrend, tab, tabDesc]);

	// ─── Applied Code 1 Design to Status Trend ───
	const chartOptions = useMemo(() => {
		const baseOptions = {
			chart: {
				type: isStatusTrend ? 'area' : 'line',
				toolbar: { show: !isStatusTrend },
				zoom: { enabled: !isStatusTrend },
				background: '#FFFFFF',
				animations: {
					enabled: false,
					dynamicAnimation: {
						enabled: false,
					},
				},
			},
			grid: {
				borderColor: '#ebe5e5',
				strokeDashArray: 0,
				xaxis: { lines: { show: false } },
				yaxis: { lines: { show: false } },
			},
			tooltip: {
				enabled: true,
				theme: 'light',
				style: { fontSize: '12px' },
			},
			legend: { show: false },
		};

		if (isStatusTrend) {
			return {
				...baseOptions,
				chart: {
					...baseOptions.chart,
					toolbar: {
						show: true,
						tools: {
							download: true,
							selection: false,
							zoom: false,
							zoomin: false,
							zoomout: false,
							pan: false,
							reset: false,
						},
					}, // Exact match to Code 1
					zoom: { enabled: false }, // Exact match to Code 1
				},
				stroke: {
					curve: 'stepline',
					width: 2,
					colors: ['#30b44a'],
				},
				fill: {
					type: 'solid',
					colors: ['#30b44a'],
					opacity: 0.2,
				},
				colors: ['#30b44a'],
				dataLabels: { enabled: false },
				xaxis: {
					type: 'datetime',
					title: {
						text: 'Time',
						style: { color: '#6B7280', fontSize: '12px' },
					},
					labels: {
						style: { colors: '#6B7280', fontSize: '11px' },
						datetimeUTC: false,
					},
				},
				yaxis: {
					title: {
						text: 'Status',
						style: { color: '#6B7280', fontSize: '12px' },
					},
					min: -0.1,
					max: 1.1,
					tickAmount: 2,
					labels: {
						style: { colors: '#6B7280', fontSize: '11px' },
						formatter: function (val) {
							if (val >= 0.9) return 'Online';
							if (val <= 0.1) return 'Offline';
							return '';
						},
					},
				},
				markers: { size: 0 },
				tooltip: {
					...baseOptions.tooltip,
					x: { format: 'dd MMM HH:mm' },
					// Exact Tooltip Design from Code 1
					custom: function ({ series, seriesIndex, dataPointIndex, w }) {
						const dataPoint =
							w.globals.initialSeries[seriesIndex].data[dataPointIndex];
						const date = new Date(dataPoint.x);
						const formattedDate = date.toLocaleString();
						const value = dataPoint.y;
						const statusText = value === 1 ? 'Online' : 'Offline';
						const statusColor = value === 1 ? '#30b44a' : '#e34d4d';
						return `<div style="padding:10px;background-color:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    <div style="font-weight:bold;margin-bottom:8px;color:#333;font-size:12px;">${formattedDate}</div>
                    <div style="display:flex;align-items:center;">
                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${statusColor};margin-right:8px;"></span>
                        <span style="flex:1;color:#333;font-size:12px;">Status:</span>
                        <span style="font-weight:bold;color:${statusColor};margin-left:5px;font-size:12px;">${statusText}</span>
                    </div>
                </div>`;
					},
				},
			};
		} else {
			// Default logic for non-status trends
			const chartCategories = chartData.map((item) => {
				const timestamp =
					item.start || item.timestamp || item.time || item.date;
				if (!timestamp) return '';
				return new Date(timestamp).toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				});
			});
			return {
				...baseOptions,
				stroke: { curve: 'smooth', width: 2 },
				markers: { size: 0 },
				xaxis: {
					title: {
						text: 'Time',
						style: { color: '#6B7280', fontSize: '12px' },
					},
					categories: chartCategories,
					labels: {
						style: { colors: '#6B7280', fontSize: '11px' },
						rotate: -45,
					},
					tooltip: { enabled: false },
				},
				yaxis: {
					title: {
						text: chartResponse?.unit || '',
						style: { color: '#6B7280', fontSize: '12px' },
					},
					labels: { style: { colors: '#6B7280', fontSize: '11px' } },
				},
			};
		}
	}, [isStatusTrend, chartData, chartResponse?.unit]);

	return (
		<Box>
			<Stack spacing={2} mb={2}>
				{chartLoading ? (
					<Loading />
				) : chartData.length ? (
					<Box sx={{ width: '100%', overflow: 'hidden' }}>
						<ReactApexChart
							options={chartOptions}
							series={chartSeries}
							type={isStatusTrend ? 'area' : 'line'}
							height={320}
							width="100%"
						/>
					</Box>
				) : (
					<NoDataFound message="No machine readings received yet — data appears once the device reports" />
				)}
			</Stack>
		</Box>
	);
};

const CompressorMachineList = () => {
	const { slavesData } = useCommonData();
	const { selectedApp } = useApplications();
	const [machineListData, setMachineListData] = useState(null);
	const [slavesId, setSlavesId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [modalDetails, setModalDetails] = useState(null);

	const [stoppageModal, setStoppageModal] = useState({
		open: false,
		machine: null,
		hours: 8,
	});

	const trendOptions = useMemo(
		() => createTrendOptions(machineListData?.machines?.[0]?.latest),
		[machineListData]
	);

	const defaultTrend = trendOptions?.[0] || DEFAULT_TREND_OPTIONS[0];

	const handleTabChange = (value) => {
		const selectedOption =
			trendOptions.find((option) => option.value === value) || defaultTrend;
		setModalDetails((prev) => ({
			...prev,
			tab: selectedOption.value,
			tabDesc: selectedOption.desc,
		}));
	};

	const handleOpenModal = (item) => {
		setModalDetails({
			isOpen: true,
			data: item,
			tab: defaultTrend.value,
			tabDesc: defaultTrend.desc,
		});
	};

	const handleCloseModal = () => {
		setModalDetails(null);
	};

	const handleStoppageClick = (machine, hours) => {
		setStoppageModal({ open: true, machine, hours });
	};

	const filteredMachines = useMemo(() => {
		const machines = machineListData?.machines || [];
		return machines.filter((machine) => {
			const matchesSlave =
				!slavesId || machine?.slave_id === slavesId || machine?.id === slavesId;
			return matchesSlave;
		});
	}, [machineListData, slavesId]);

	const fetchMachineListData = async () => {
		setIsLoading(true);
		try {
			const res = await api.get(API_URLS.COMPRESSOR_MACHINE_LIST_DATA);
			if (res?.success) {
				setMachineListData(res?.data);
			}
		} catch (error) {
			console.error('Compressor machine list API error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMachineListData();
	}, []);

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
					slaveOptions={slavesData?.map((slave) => ({
						label: slave?.slave_name,
						value: slave?.slave_id,
					}))}
					setSlavesId={setSlavesId}
					slavesId={slavesId}
					handleDownload={() => handleDownload(filteredMachines, selectedApp)}
					isDownloadDisabled={!filteredMachines?.length || isLoading}
				/>

				<Grid container height="calc(100% - 44px - 8px)" pt={1} overflow="auto">
					<Grid item xs={12}>
						{isLoading ? (
							<Loading />
						) : filteredMachines?.length ? (
							<Grid container rowGap={1} columnSpacing={1}>
								{filteredMachines.map((machine) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										key={`compressor-machine-${
											machine?.slave_id || machine?.id
										}`}
									>
										<CustomCard childrenOtherProps={{ height: '100%' }}>
											<CompressorMetricBlock
												machine={machine}
												handleOpenModal={handleOpenModal}
												onStoppageClick={handleStoppageClick}
											/>
										</CustomCard>
									</Grid>
								))}
							</Grid>
						) : (
							<NoDataFound message="No machine readings received yet — data appears once the device reports" />
						)}
					</Grid>
				</Grid>
			</Box>

			{/* Trend Modal */}
			<PremiumModal
				open={Boolean(modalDetails?.isOpen)}
				onClose={handleCloseModal}
				title={`${
					modalDetails?.data?.name ||
					modalDetails?.data?.slave_name ||
					'Compressor'
				} - ${modalDetails?.tabDesc || 'Trend'}`}
				confirmText={null}
				cancelText={null}
			>
				{Boolean(modalDetails?.isOpen) ? (
					<ModalContentForTrend
						handleTabChange={handleTabChange}
						tab={modalDetails?.tab}
						tabDesc={modalDetails?.tabDesc}
						slaveId={modalDetails?.data?.slave_id || modalDetails?.data?.id}
						slaveName={
							modalDetails?.data?.name || modalDetails?.data?.device_uid
						}
						trendOptions={trendOptions}
					/>
				) : null}
			</PremiumModal>

			{/* Stoppage History Modal */}
			<StoppageHistoryModal
				open={stoppageModal.open}
				onClose={() =>
					setStoppageModal({ open: false, machine: null, hours: 8 })
				}
				machine={stoppageModal.machine}
				hours={stoppageModal.hours}
			/>
		</>
	);
};

export default CompressorMachineList;
