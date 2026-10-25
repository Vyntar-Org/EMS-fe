import { FileDownload, Search } from '@mui/icons-material';
import {
	Box,
	Button,
	CircularProgress,
	Grid,
	Tab,
	Tabs,
	tabsClasses,
	Tooltip,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import {
	WEATHER_REPORT_TABS,
	WEATHER_REPORT_TYPES,
} from '../../constants/weatherStationReports';
import { triggerFileDownload } from '../../helpers/common';
import {
	getDownloadFileName,
	getWeatherStationErrorMessage,
	weatherStationApi,
} from '../../helpers/weatherStationApi';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTable } from '../common/CustomTable';
import NoDataFound from '../common/errors/NoDataFound';
import { useToast } from '../common/PremiumToast';
import PremiumLoader from '../Dashboards/weatherStationDashboardCards/PremiumLoader';

const getDefaultPayload = () => ({
	month: dayjs(),
	year: dayjs(),
});

const formatReportParams = (payload) => ({
	month: payload?.month?.isValid?.() ? payload.month.format('M') : '',
	year: payload?.year?.isValid?.() ? payload.year.format('YYYY') : '',
});

const getReportRows = (response) => {
	if (Array.isArray(response)) {
		return response;
	}
	return Array.isArray(response?.rows) ? response.rows : [];
};

const formatColumnLabel = (key) => {
	if (key === 'rainfall_mm') {
		return 'Rainfall (mm)';
	}
	return key
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

const ReportsHeader = ({
	selectedTab,
	onTabChange,
	payload,
	setPayload,
	onSearch,
	onDownload,
	loading,
	downloadLoading,
}) => {
	const isDaywise = selectedTab === WEATHER_REPORT_TYPES.DAYWISE;

	return (
		<Box sx={{ pb: 1, borderBottom: '2px dashed', borderColor: 'divider' }}>
			<Tabs
				value={selectedTab}
				onChange={(_event, value) => onTabChange(value)}
				variant="scrollable"
				scrollButtons="auto"
				allowScrollButtonsMobile
				sx={{
					[`& .${tabsClasses.scrollButtons}`]: {
						'&.Mui-disabled': { opacity: 0.3 },
					},
					'& .MuiTabs-scroller': { height: '40px' },
					'& .MuiTab-root': {
						textTransform: 'none',
						fontSize: '0.95rem',
						color: 'text.secondary',
						minHeight: '40px',
						p: 0,
						mr: 3,
						'&.Mui-selected': { color: 'primary.main', fontWeight: 1000 },
					},
					'& .MuiTabs-indicator': { backgroundColor: 'secondary.main' },
				}}
			>
				{WEATHER_REPORT_TABS.map((tab) => (
					<Tab
						disableRipple
						key={tab.value}
						label={tab.label}
						value={tab.value}
					/>
				))}
			</Tabs>

			<Grid container gap={2} alignItems="center" mt={0.5}>
				{isDaywise && (
					<Grid item xs sm md={2}>
						<CustomDatePicker
							label="Select Month"
							mode="monthpicker"
							onChange={(month) =>
								setPayload((previous) => ({ ...previous, month }))
							}
							value={payload.month}
						/>
					</Grid>
				)}

				<Grid item xs sm md={2}>
					<CustomDatePicker
						label="Select Year"
						mode="yearpicker"
						onChange={(year) =>
							setPayload((previous) => ({ ...previous, year }))
						}
						value={payload.year}
					/>
				</Grid>

				<Grid item xs="auto">
					<Tooltip title="Search">
						<span>
							<Button
								disabled={loading}
								variant="contained"
								onClick={onSearch}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
								}}
							>
								<Search sx={{ fontSize: 20, color: '#fff' }} />
							</Button>
						</span>
					</Tooltip>
				</Grid>

				<Grid item xs={12} md={4} display="flex" ml="auto" justifyContent="end">
					<Button
						disableElevation
						disabled={downloadLoading || loading}
						variant="contained"
						startIcon={
							downloadLoading ? (
								<CircularProgress size={18} thickness={5} color="inherit" />
							) : (
								<FileDownload sx={{ fontSize: 20 }} />
							)
						}
						onClick={onDownload}
						sx={{
							height: 42,
							px: 2.5,
							borderRadius: '12px',
							textTransform: 'none',
							fontWeight: 600,
							color: '#fff',
							minWidth: 180,
						}}
					>
						{downloadLoading ? 'Preparing Excel...' : 'Download Excel'}
					</Button>
				</Grid>
			</Grid>
		</Box>
	);
};

const WeatherStationReports = () => {
	const { showToast } = useToast();
	const [selectedTab, setSelectedTab] = useState(
		WEATHER_REPORT_TYPES.DAYWISE
	);
	const [payload, setPayload] = useState(getDefaultPayload);
	const [submittedParams, setSubmittedParams] = useState(() =>
		formatReportParams(getDefaultPayload())
	);
	const isDaywise = selectedTab === WEATHER_REPORT_TYPES.DAYWISE;
	const paramsAreValid = Boolean(
		submittedParams.year && (!isDaywise || submittedParams.month)
	);

	const reportQuery = useQuery({
		queryKey: ['weather', 'reports', selectedTab, submittedParams],
		queryFn: ({ signal }) =>
			isDaywise
				? weatherStationApi.getDaywiseRainfallReport(submittedParams, {
						signal,
				  })
				: weatherStationApi.getMonthwiseRainfallReport(submittedParams, {
						signal,
				  }),
		enabled: paramsAreValid,
		placeholderData: (previousData) => previousData,
	});

	const rows = useMemo(
		() => getReportRows(reportQuery.data),
		[reportQuery.data]
	);
	const columns = useMemo(() => {
		const keys = Array.from(
			new Set(rows.flatMap((row) => Object.keys(row || {})))
		);
		const preferredFirstKey = isDaywise ? 'date' : 'month';
		keys.sort((a, b) => {
			if (a === preferredFirstKey) {
				return -1;
			}
			if (b === preferredFirstKey) {
				return 1;
			}
			return 0;
		});

		return keys.map((key) => ({
			accessorKey: key,
			header: formatColumnLabel(key),
			size: 150,
			cell: (info) => {
				const value = info.getValue();
				if (key === 'date' && value && dayjs(value).isValid()) {
					return dayjs(value).format('DD MMM YYYY');
				}
				return value === null || value === undefined || value === ''
					? '—'
					: String(value);
			},
		}));
	}, [isDaywise, rows]);

	const downloadMutation = useMutation({
		mutationFn: () => {
			const params = formatReportParams(payload);
			return isDaywise
				? weatherStationApi.downloadDaywiseRainfallReport(params)
				: weatherStationApi.downloadMonthwiseRainfallReport(params);
		},
		onSuccess: (response) => {
			const label = isDaywise ? 'daywise' : 'monthwise';
			const url = URL.createObjectURL(response.data);
			triggerFileDownload(
				url,
				getDownloadFileName(
					response.headers,
					`weather_${label}_rainfall_${dayjs().format(
						'YYYY-MM-DD'
					)}.xlsx`
				)
			);
			URL.revokeObjectURL(url);
		},
		onError: (error) =>
			showToast(
				getWeatherStationErrorMessage(error, 'Unable to download report.'),
				'error'
			),
	});

	const validateAndFormatPayload = () => {
		const params = formatReportParams(payload);
		if (!params.year || (isDaywise && !params.month)) {
			showToast(
				isDaywise ? 'Select a valid month and year.' : 'Select a valid year.',
				'error'
			);
			return null;
		}
		return params;
	};

	const handleTabChange = (nextTab) => {
		const nextPayload = getDefaultPayload();
		setSelectedTab(nextTab);
		setPayload(nextPayload);
		setSubmittedParams(formatReportParams(nextPayload));
	};

	const loading = reportQuery.isLoading || reportQuery.isFetching;

	return (
		<Box
			sx={{ height: { xs: 'calc(100vh - 80px)', sm: 'calc(100vh - 88px)' } }}
		>
			<ReportsHeader
				selectedTab={selectedTab}
				onTabChange={handleTabChange}
				payload={payload}
				setPayload={setPayload}
				onSearch={() => {
					const params = validateAndFormatPayload();
					if (params) {
						setSubmittedParams(params);
					}
				}}
				onDownload={() => {
					if (validateAndFormatPayload()) {
						downloadMutation.mutate();
					}
				}}
				loading={loading}
				downloadLoading={downloadMutation.isPending}
			/>

			<Box
				height={{ xs: 'calc(100% - 158px)', md: 'calc(100% - 101px)' }}
				pt={1}
				overflow="auto"
			>
				{loading ? (
					<PremiumLoader />
				) : reportQuery.error ? (
					<NoDataFound
						message={getWeatherStationErrorMessage(
							reportQuery.error,
							'Unable to load the rainfall report.'
						)}
					/>
				) : !rows.length ? (
					<NoDataFound message="No rainfall report data exists for the selected period." />
				) : (
					<CustomTable data={rows} columns={columns} fillWidth />
				)}
			</Box>
		</Box>
	);
};

export default WeatherStationReports;
