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
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
	parameterConfig,
	WEATHER_SOLAR_REPORTS_ALLOW_MONTH,
	WEATHER_SOLAR_REPORTS_API_DATA_KEY_CONFIG,
	WEATHER_SOLAR_REPORTS_TAB_OPTIONS,
} from '../../constants/weatherStationReports';
import { weatherStationApi as api } from '../../helpers/api';
import { API_URLS } from '../../helpers/apiUrls';
import {
	transformDynamicDataToDailyMatrix,
	triggerFileDownload,
} from '../../helpers/common';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTable } from '../common/CustomTable';
import NoDataFound from '../common/errors/NoDataFound';
import PremiumLoader from '../Dashboards/weatherStationDashboardCards/PremiumLoader';
import { useToast } from '../common/PremiumToast';

const ReportsHeader = ({
	selectedTab,
	handleTabChange,
	payload,
	setPayload,
	handleSearch,
	handleExcelDownload,
	isDownloadLoading,
	loading,
}) => {
	const handleFieldCh = (key, value) => {
		setPayload((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	return (
		<Box
			sx={{
				pb: 1,
				borderBottom: '2px dashed',
				borderColor: 'divider',
			}}
		>
			<Tabs
				value={selectedTab}
				onChange={(e, val) => {
					if (!val) {
						return;
					}
					handleTabChange(val);
				}}
				variant="scrollable"
				scrollButtons="auto"
				allowScrollButtonsMobile
				sx={{
					[`& .${tabsClasses.scrollButtons}`]: {
						'&.Mui-disabled': { opacity: 0.3 },
					},
					'& .MuiTabs-scroller': {
						height: '40px',
					},
					'& .MuiTab-root': {
						textTransform: 'none',
						fontSize: '0.95rem',
						color: 'text.secondary',
						minHeight: '40px',
						transition: 'all 0.3s ease',
						p: 0,
						mr: 3,
						'&.Mui-selected': {
							color: 'primary.main',
							fontWeight: 1000,
						},
					},
					'& .MuiTabs-indicator': {
						backgroundColor: 'secondary.main',
					},
				}}
			>
				{WEATHER_SOLAR_REPORTS_TAB_OPTIONS.map((app) => (
					<Tab
						disableRipple
						key={app.tab}
						label={
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								{app.label}
							</Box>
						}
						value={app.tab}
					/>
				))}
			</Tabs>

			<Grid container gap={2} alignItems="center" mt={0.5}>
				{WEATHER_SOLAR_REPORTS_ALLOW_MONTH.includes(selectedTab) && (
					<Grid item xs sm md={2}>
						<CustomDatePicker
							label="Select Month"
							mode="monthpicker"
							onChange={(val) => handleFieldCh('month', val)}
							value={payload?.month || ''}
						/>
					</Grid>
				)}

				<Grid item xs sm md={2}>
					<CustomDatePicker
						label="Select Year"
						mode="yearpicker"
						onChange={(val) => handleFieldCh('year', val)}
						value={payload?.year || ''}
					/>
				</Grid>

				<Grid item xs="auto">
					<Tooltip title="Search">
						<span>
							<Button
								disabled={loading}
								variant="contained"
								onClick={handleSearch}
								sx={{
									width: 40,
									height: 40,
									minWidth: 0,
									p: 0,
									borderRadius: 2,
									boxShadow: 'none',
									color: '#fff',
									bgcolor: 'primary.main',
								}}
							>
								<Search sx={{ fontSize: 20, color: '#fff' }} />
							</Button>
						</span>
					</Tooltip>
				</Grid>

				<Grid
					item
					xs={12}
					md={4}
					display="flex"
					gap={2}
					ml="auto"
					justifyContent="end"
				>
					<Button
						disableElevation
						disabled={isDownloadLoading || loading}
						variant="contained"
						startIcon={
							isDownloadLoading ? (
								<CircularProgress size={18} thickness={5} color="inherit" />
							) : (
								<FileDownload sx={{ fontSize: 20 }} />
							)
						}
						onClick={handleExcelDownload}
						sx={{
							height: 42,
							px: 2.5,
							borderRadius: '12px',
							textTransform: 'none',
							fontWeight: 600,
							fontSize: '0.9rem',
							letterSpacing: '0.2px',
							color: '#fff',
							bgcolor: 'primary.main',
							minWidth: 180,

							'&:hover': {
								bgcolor: 'primary.dark',
							},

							'&.Mui-disabled': {
								bgcolor: 'brand.navySoft',
								color: '#fff',
							},
						}}
					>
						{isDownloadLoading ? 'Preparing Excel...' : 'Download Excel'}
					</Button>
				</Grid>
			</Grid>
		</Box>
	);
};

const WeatherSolarReports = () => {
	const { showToast } = useToast();
	const [selectedTab, setSelectedTab] = useState(
		'WEATHER_SOLAR_REPORTS_DATE_WISE_CONSUMPTION_DATA'
	);
	const [loading, setLoading] = useState(true);
	const [reportsData, setReportsData] = useState(null);
	const [payload, setPayload] = useState({
		month: dayjs(new Date()),
		year: dayjs(new Date()),
	});
	const [isDownloadLoading, setIsDownloadLoading] = useState(null);

	const { tableData, tableColumns } = useMemo(() => {
		const config = WEATHER_SOLAR_REPORTS_API_DATA_KEY_CONFIG[selectedTab];

		const firstResult = transformDynamicDataToDailyMatrix(
			reportsData,
			{
				dateKey: config.dateKey,
				valueKey: config.valueKey,
			},
			{
				accessorKey: 'parameter',
				header: 'Parameter',
				size: 160,
			}
		);

		const tableData = [
			...firstResult.tableData.map((row) => ({
				...row,
				parameter: parameterConfig?.[config.valueKey],
			})),
		];

		if (config.valueKey1) {
			const secondResult = transformDynamicDataToDailyMatrix(reportsData, {
				dateKey: config.dateKey,
				valueKey: config.valueKey1,
			});

			tableData.push(
				...secondResult.tableData.map((row) => ({
					...row,
					parameter: parameterConfig?.[config.valueKey1],
				}))
			);
		}

		return {
			tableData,
			tableColumns: firstResult.tableColumns,
		};
	}, [reportsData, selectedTab]);
	const fetchReportsData = async (curTab, newPayload, isDownload = false) => {
		if (!curTab) {
			return;
		}

		const isMonthAllowed = WEATHER_SOLAR_REPORTS_ALLOW_MONTH.includes(curTab);

		if (isMonthAllowed && (!newPayload?.month || !newPayload?.year)) {
			if (!isDownload) {
				return;
			}
			showToast('Missing month or year', 'error');
			return;
		}

		if (!isMonthAllowed && !newPayload?.year) {
			if (!isDownload) {
				return;
			}
			showToast('Missing year', 'error');
			return;
		}

		if (isDownload) {
			setIsDownloadLoading(true);
		} else {
			setLoading(true);
		}

		try {
			const monthObj = newPayload?.month;
			const yearObj = newPayload?.year;
			const formattedMonthObj = monthObj?.isValid?.()
				? monthObj.format('M')
				: '';
			const formattedYearObj = yearObj?.isValid?.()
				? yearObj.format('YYYY')
				: '';

			const newApiUrl = isDownload
				? API_URLS[`${curTab}_DOWNLOAD`](formattedYearObj, formattedMonthObj)
				: API_URLS[curTab](formattedYearObj, formattedMonthObj);

			const res = await api.get(newApiUrl, {
				responseType: isDownload ? 'blob' : 'json',
			});

			if (isDownload) {
				return res;
			}
			// if (res?.success) {

			setReportsData(res?.rows || null);
			// }
		} catch (error) {
			console.error(`API Error:`, error);
		} finally {
			if (isDownload) {
				setIsDownloadLoading(false);
			} else {
				setLoading(false);
			}
		}
	};

	const handleTabChange = (tabVal) => {
		setSelectedTab(tabVal);
		setPayload({
			month: dayjs(new Date()),
			year: dayjs(new Date()),
		});
		setReportsData(null);
		fetchReportsData(tabVal, {
			month: dayjs(new Date()),
			year: dayjs(new Date()),
		});
	};

	const handleSearch = () => {
		fetchReportsData(selectedTab, payload);
	};

	const handleExcelDownload = async () => {
		const response = await fetchReportsData(selectedTab, payload, true);

		if (!response) {
			return;
		}

		const blob = response.data;

		const url = URL.createObjectURL(blob);

		triggerFileDownload(
			url,
			`${
				WEATHER_SOLAR_REPORTS_TAB_OPTIONS?.find((w) => w.tab === selectedTab)
					?.label
			} Reports ${dayjs().format('YYYY-MM-DD')}.xlsx`
		);

		URL.revokeObjectURL(url);
	};

	useEffect(() => {
		fetchReportsData(selectedTab, payload);
	}, []);

	return (
		<Box
			sx={{
				height: {
					xs: 'calc(100vh - 56px - 24px)',
					sm: 'calc(100vh - 64px - 24px)',
				},
			}}
		>
			<ReportsHeader
				selectedTab={selectedTab}
				handleTabChange={handleTabChange}
				handleSearch={handleSearch}
				payload={payload}
				setPayload={setPayload}
				handleExcelDownload={handleExcelDownload}
				isDownloadLoading={isDownloadLoading}
				loading={loading}
				// slavesId={slavesId}
				// setSlavesId={setSlavesId}
				// slavesData={slavesData}
			/>

			<Box
				height={{
					xs: 'calc(100% - 158px)',
					md: 'calc(100% - 101px)',
				}}
				pt={1}
				overflow="auto"
			>
				{loading ? (
					<PremiumLoader />
				) : !reportsData || !tableData?.length ? (
					<NoDataFound
						message="No report data"
						description="No records for the selected period — try a different month or year."
					/>
				) : (
					<CustomTable data={tableData} columns={tableColumns} />
				)}
			</Box>
		</Box>
	);
};

export default WeatherSolarReports;
