import { Balance, CheckCircle, Error, Warning } from '@mui/icons-material';
import {
	Box,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { formatNumber } from '../../../helpers/formatters';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

const ACCENT = '#4A3AA7';

const PHASE_COLORS = {
	R: '#E53935',
	Y: '#FBC02D',
	B: '#1E88E5',
};

const THRESHOLDS = {
	V: {
		normal: 1,
		warning: 2,
		normalText: '≤1%',
		warningText: '>1% to 2%',
		criticalText: '>2%',
	},
	A: {
		normal: 6,
		warning: 10,
		normalText: '≤5–6%',
		warningText: '>6% to 10%',
		criticalText: '>10%',
	},
};

const PhaseMetric = memo(({ phase, value, unit, color }) => (
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
					// width: 20,
					width: 16,
					// height: 14,
					height: 16,
					borderRadius: '50%',
					display: 'grid',
					placeItems: 'center',
					bgcolor: color,
					color: '#fff',
					fontSize: 11,
					fontWeight: 800,
				}}
			>
				{phase}
			</Box>
			<Typography
				noWrap
				fontSize="10px"
				color="text.secondary"
				fontWeight={600}
			>
				Phase {phase}
			</Typography>
		</Box>
		<Typography
			noWrap
			mt={0.25}
			fontSize="14px"
			fontWeight={800}
			color="text.primary"
		>
			{formatNumber(value, 2, { fallback: '0' })}
			{unit}
		</Typography>
	</Box>
));

PhaseMetric.displayName = 'PhaseMetric';

const ThresholdBar = memo(({ value, type }) => {
	const threshold = THRESHOLDS[type];
	const rawValue = Number.parseFloat(value);
	// The API already returns the calculated imbalance percentage. Use it as-is
	// for both the displayed reading and threshold classification.
	const imbalanceValue = Number.isFinite(rawValue) ? rawValue : 0;
	const displayValue = formatNumber(imbalanceValue, 2, { fallback: '0' });

	const status =
		imbalanceValue <= threshold.normal
			? {
					label: 'Normal',
					color: '#16A34A',
					Icon: CheckCircle,
					markerPosition: 16.67,
			  }
			: imbalanceValue <= threshold.warning
			  ? {
						label: 'Warning',
						color: '#F59E0B',
						Icon: Warning,
						markerPosition: 50,
			    }
			  : {
						label: 'Critical',
						color: '#DC2626',
						Icon: Error,
						markerPosition: 83.33,
			    };
	const { Icon } = status;

	return (
		<Box>
			<Box display="flex" alignItems="flex-end" justifyContent="space-between">
				<Box>
					{/* <Typography fontSize="9px" fontWeight={700} color="text.secondary">
						{type === 'A' ? 'Current' : 'Voltage'} unbalance
					</Typography> */}
					<Typography
						fontSize="23px"
						lineHeight={1}
						fontWeight={900}
						color={status.color}
					>
						{displayValue}
						<Typography component="span" fontSize="12px" fontWeight={800}>
							%
						</Typography>
					</Typography>
				</Box>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.4,
						px: 0.8,
						py: 0.35,
						borderRadius: 5,
						color: status.color,
						bgcolor: `${status.color}14`,
						border: `1px solid ${status.color}35`,
					}}
				>
					<Icon
						sx={{
							fontSize: '13px !important',
							p: '0 !important',
							bgcolor: 'transparent !important',
							boxShadow: 'none !important',
						}}
					/>
					<Typography fontSize="9px" fontWeight={800}>
						{status.label}
					</Typography>
				</Box>
			</Box>

			<Box mt={0.65} position="relative" pt={0.7}>
				<Box
					sx={{
						position: 'absolute',
						left: `calc(${status.markerPosition}% - 1px)`,
						top: 0,
						width: 2,
						height: 13,
						bgcolor: 'text.primary',
						borderRadius: 1,
						zIndex: 1,
					}}
				/>
				<Box
					display="flex"
					height={7}
					borderRadius={4}
					overflow="hidden"
					boxShadow="inset 0 1px 2px rgba(0,0,0,.18)"
				>
					<Box bgcolor="#16A34A" flex={1} />
					<Box bgcolor="#F59E0B" flex={1} />
					<Box bgcolor="#DC2626" flex={1} />
				</Box>
			</Box>

			<Box display="flex" justifyContent="space-between" gap={0.5} mt={0.35}>
				{[
					['#16A34A', `Normal ${threshold.normalText}`],
					['#F59E0B', `Warning ${threshold.warningText}`],
					['#DC2626', `Critical ${threshold.criticalText}`],
				].map(([color, label]) => (
					<Box
						key={label}
						display="flex"
						alignItems="center"
						gap={0.3}
						minWidth={0}
					>
						<Box
							width={6}
							height={6}
							borderRadius="50%"
							bgcolor={color}
							flexShrink={0}
						/>
						<Typography noWrap fontSize="7.5px" color="text.secondary">
							{label}
						</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
});

ThresholdBar.displayName = 'ThresholdBar';

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
					width: 126,
					height: '27px',
					bgcolor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					'& .MuiToggleButton-root': {
						border: 'none',
						color: 'text.secondary',
						flex: 1,
						px: 0.75,
						fontSize: '9px',
						fontWeight: 700,
					},
					'& .MuiToggleButton-root.Mui-selected': {
						bgcolor: ACCENT,
						color: '#FFFFFF',
						'&:hover': { bgcolor: ACCENT },
					},
				}}
			>
				<ToggleButton value="A" aria-label="Current (Amperes)">
					Current
				</ToggleButton>
				<ToggleButton value="V" aria-label="Voltage (Volts)">
					Voltage
				</ToggleButton>
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
					one: { value: target?.ir, unit, phase: 'R' },
					two: { value: target?.iy, unit, phase: 'Y' },
					three: { value: target?.ib, unit, phase: 'B' },
					overall: {
						value: target?.lbi,
						unit: '%',
						label: 'Current imbalance',
					},
			  }
			: {
					one: { value: target?.rv, unit, phase: 'R' },
					two: { value: target?.yv, unit, phase: 'Y' },
					three: { value: target?.bv, unit, phase: 'B' },
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
			headerAction={loadToggle}
			sx={{
				'& .MuiCardContent-root > .MuiBox-root:first-of-type': {
					alignItems: 'center',
				},
			}}
		>
			{loadBalanceData ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						gap: 0.6,
					}}
				>
					<Box
						sx={{
							px: 1,
							py: 0.65,
							borderRadius: 1,
							border: '1px solid',
							borderColor: 'divider',
							// background: (theme) =>
							// 	theme.palette.mode === 'dark'
							// 		? 'linear-gradient(135deg, rgba(74,58,167,0.22), rgba(74,58,167,0.06))'
							// 		: 'linear-gradient(135deg, rgba(74,58,167,0.10), rgba(74,58,167,0.02))',
						}}
					>
						<ThresholdBar value={dataMapper.overall.value} type={loadType} />
					</Box>

					<Grid container spacing={0.75}>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.one} color={PHASE_COLORS.R} />
						</Grid>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.two} color={PHASE_COLORS.Y} />
						</Grid>
						<Grid item xs={4}>
							<PhaseMetric {...dataMapper.three} color={PHASE_COLORS.B} />
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
