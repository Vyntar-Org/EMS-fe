import { Balance } from '@mui/icons-material';
import {
	Box,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

const ACCENT = '#4A3AA7';

const UNITS = [
	{ value: 'A', label: 'Current', title: 'Current (Amperes)' },
	{ value: 'V', label: 'Voltage', title: 'Voltage (Volts)' },
];

const PhaseMetric = memo(({ label, value, unit, color }) => (
	<Box
		sx={{
			minWidth: 0,
			p: 0.75,
			borderRadius: 2,
			border: '1px solid',
			borderColor: 'divider',
			bgcolor: 'background.paper',
			boxShadow: '0 3px 10px rgba(15, 35, 62, 0.06)',
			textAlign: 'center',
			position: 'relative',
			overflow: 'hidden',
			'&::after': {
				content: '""',
				position: 'absolute',
				left: 7,
				right: 7,
				bottom: 0,
				height: 3,
				borderRadius: '3px 3px 0 0',
				bgcolor: color,
			},
		}}
	>
		<Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
			<Box
				sx={{
					width: 20,
					height: 20,
					borderRadius: '50%',
					display: 'grid',
					placeItems: 'center',
					bgcolor: color,
					color: '#fff',
					fontSize: 11,
					fontWeight: 800,
				}}
			>
				{label.slice(-1)}
			</Box>
			<Typography
				noWrap
				fontSize="10px"
				color="text.secondary"
				fontWeight={600}
			>
				{label}
			</Typography>
		</Box>
		<Typography
			noWrap
			mt={0.25}
			fontSize="14px"
			fontWeight={800}
			color="text.primary"
		>
			{value ?? 0}
			{unit}
		</Typography>
	</Box>
));

PhaseMetric.displayName = 'PhaseMetric';

const ENERGYLoadBalance = ({ slavesId }) => {
	const [loadBalanceData, setLoadBalanceData] = useState(null);
	const [loadType, setLoadType] = useState('A');

	const fetchLoadBalanceData = useCallback(async () => {
		try {
			const res = await api.get(
				`${API_URLS.EMS_DASHBOARD_LOAD_BALANCE}?slave_id=${slavesId || 0}`
			);
			if (res?.success) {
				setLoadBalanceData(res.data);
			}
		} catch (error) {
			console.error('Failed to fetch load balance loadBalanceData:', error);
		}
	}, [slavesId]);

	useEffect(() => {
		if (slavesId) {
			fetchLoadBalanceData();
		}
	}, [slavesId, fetchLoadBalanceData]);

	const loadToggle = useMemo(
		() => (
			<ToggleButtonGroup
				value={loadType}
				exclusive
				onChange={(_e, val) => val && setLoadType(val)}
				size="small"
				aria-label="load type"
				sx={{
					width: '100%',
					height: '28px',
					bgcolor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					'& .MuiToggleButton-root': {
						border: 'none',
						color: 'text.secondary',
						flex: 1,
						px: 1.25,
						fontSize: '11px',
						fontWeight: 700,
					},
					'& .MuiToggleButton-root.Mui-selected': {
						bgcolor: ACCENT,
						color: '#FFFFFF',
						'&:hover': { bgcolor: ACCENT },
					},
				}}
			>
				{UNITS.map(({ value, label, title }) => (
					<Tooltip key={value} title={title} arrow placement="top">
						<ToggleButton value={value} aria-label={title}>
							{label}
						</ToggleButton>
					</Tooltip>
				))}
			</ToggleButtonGroup>
		),
		[loadType]
	);

	const dataMapper = useMemo(() => {
		const isCurrent = loadType === 'A';
		const target = isCurrent
			? loadBalanceData?.current
			: loadBalanceData?.voltage;
		const unit = target?.unit || '';

		return isCurrent
			? {
					one: { value: target?.ir, unit, label: 'Phase R' },
					two: { value: target?.iy, unit, label: 'Phase Y' },
					three: { value: target?.ib, unit, label: 'Phase B' },
					overall: {
						value: target?.lbi,
						unit: '%',
						label: 'Current imbalance',
					},
			  }
			: {
					one: { value: target?.rv, unit, label: 'Phase R' },
					two: { value: target?.yv, unit, label: 'Phase Y' },
					three: { value: target?.bv, unit, label: 'Phase B' },
					overall: {
						value: target?.volt_ub,
						unit: '%',
						label: 'Voltage imbalance',
					},
			  };
	}, [loadType, loadBalanceData]);

	return (
		<CustomCard
			titleIcon={<Balance />}
			title="Load Balance"
			accentColor={ACCENT}
		>
			{loadBalanceData ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						gap: 0.75,
					}}
				>
					{loadToggle}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 1,
							px: 1,
							borderRadius: 2.5,
							border: '1px solid',
							borderColor: 'divider',
							background: (theme) =>
								theme.palette.mode === 'dark'
									? 'linear-gradient(135deg, rgba(74,58,167,0.22), rgba(74,58,167,0.06))'
									: 'linear-gradient(135deg, rgba(74,58,167,0.10), rgba(74,58,167,0.02))',
						}}
					>
						<Box minWidth={0}>
							{/* <Typography
								noWrap
								fontSize="11px"
								fontWeight={700}
								color="text.secondary"
							>
								{dataMapper.overall.label}
							</Typography> */}
							<Typography
								noWrap
								fontSize={{ xs: '24px', }}
								lineHeight={1.05}
								fontWeight={900}
								color={ACCENT}
							>
								{dataMapper.overall.value ?? 0}
								<Typography component="span" fontSize="13px" fontWeight={800}>
									{dataMapper.overall.unit}
								</Typography>
							</Typography>
						</Box>

						<Box
							sx={{
								my:0.5,
								width: 30,
								height: 30,
								borderRadius: '50%',
								display: 'grid',
								placeItems: 'center',
								bgcolor: ACCENT,
								color: '#fff',
								fontSize: 14,
								fontWeight: 900,
								boxShadow: '0 5px 14px rgba(74,58,167,0.28)',
							}}
						>
							{loadType}
						</Box>
					</Box>

					<Grid container spacing={0.75}>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.one} color="#2563EB" />
						</Grid>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.two} color="#16A34A" />
						</Grid>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.three} color="#F59E0B" />
						</Grid>
					</Grid>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device loadBalanceData — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYLoadBalance;
