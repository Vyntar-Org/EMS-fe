import {
	AccessTimeRounded,
	CheckCircleRounded,
	DeviceThermostatRounded,
	EqualizerRounded,
	InfoOutlined,
	OpacityRounded,
	TrendingUpRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { FIRE_SAFETY_TREND_TAB_OPTIONS } from '../../../constants/fireSafetyMachineList';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { formatNumber } from '../../../helpers/formatters';
import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import { MachineTemperatureGauge } from '../../common/MachineCardBits';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const GREEN = '#0AA65B';

const toValues = (response) =>
	(response?.data?.data || response?.data?.trends || [])
		.map((row) => Number(row?.value ?? row))
		.filter(Number.isFinite)
		.slice(-24);

const percentChange = (values) => {
	if (values.length < 2 || values.at(-2) === 0) {
		return 0;
	}
	return ((values.at(-1) - values.at(-2)) / Math.abs(values.at(-2))) * 100;
};

const FireMetric = ({ label, value, unit, Icon, color, change }) => (
	<Box sx={{ position: 'relative', minWidth: 0, minHeight: 51, p: 0.6, pl: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, boxShadow: '0 3px 10px rgba(37,69,111,.04)', '&::before': { content: '""', position: 'absolute', left: 0, top: 7, bottom: 7, width: 3, borderRadius: '0 4px 4px 0', bgcolor: color } }}>
		<Stack direction="row" alignItems="center" spacing={0.65}>
			<Box sx={{ width: 32, height: 32, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '50%', color, bgcolor: alpha(color, 0.1) }}>
				<Icon sx={{ fontSize: 20 }} />
			</Box>
			<Box minWidth={0} flex={1}>
				<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 600 }}>{label}</Typography>
				<Typography noWrap sx={{ color: 'text.primary', fontSize: '0.87rem', fontWeight: 900 }}>
					{formatNumber(value, 2, { fallback: '0' })} {unit}
				</Typography>
				<Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.1, width: 'fit-content', px: 0.45, py: 0.1, borderRadius: 0.8, color: change < 0 ? 'error.main' : 'success.main', bgcolor: (theme) => alpha(change < 0 ? theme.palette.error.main : theme.palette.success.main, 0.08) }}>
					<TrendingUpRounded sx={{ fontSize: 11, transform: change < 0 ? 'rotate(180deg)' : 'none' }} />
					<Typography sx={{ fontSize: '0.48rem', fontWeight: 900 }}>{change >= 0 ? '+' : ''}{formatNumber(change, 1, { fallback: '0' })}%</Typography>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.43rem' }}>vs. last hour</Typography>
				</Stack>
			</Box>
		</Stack>
	</Box>
);

const InlineTrend = ({ values, current }) => {
	const points = values.length > 1 ? values : [Number(current) || 0, Number(current) || 0];
	const min = Math.min(...points);
	const max = Math.max(...points);
	const line = points.map((value, index) => `${(index / (points.length - 1)) * 240},${29 - ((value - min) / (max - min || 1)) * 17}`).join(' ');
	return (
		<Box sx={{ p: 0.55, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius }}>
			<Stack direction="row" alignItems="center" spacing={0.4}>
				<TrendingUpRounded sx={{ color: GREEN, fontSize: 14 }} />
				<Typography sx={{ fontSize: '0.56rem', fontWeight: 800 }}>Temperature Trend</Typography>
				<Typography sx={{ color: 'text.secondary', fontSize: '0.45rem' }}>(Last 24 Hours)</Typography>
			</Stack>
			<Stack direction="row" alignItems="center" spacing={0.65}>
				<Box component="svg" viewBox="0 0 240 34" preserveAspectRatio="none" aria-label="Temperature trend for the last 24 hours" sx={{ width: '100%', height: 32 }}>
					<polygon points={`0,34 ${line} 240,34`} fill={alpha(GREEN, 0.13)} />
					<polyline points={line} fill="none" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
					<circle cx="240" cy={line.split(' ').at(-1)?.split(',')[1]} r="3.5" fill={GREEN} />
				</Box>
				<Box sx={{ minWidth: 62, py: 0.45, textAlign: 'center', borderRadius: 1.2, bgcolor: alpha(GREEN, 0.08) }}>
					<Typography sx={{ color: GREEN, fontSize: '0.74rem', fontWeight: 900 }}>{formatNumber(current, 2, { fallback: '0' })} °C</Typography>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.45rem' }}>Now</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

const Summary = ({ label, value, caption, Icon, color }) => (
	<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.4} minWidth={0}>
		<Box sx={{ width: 27, height: 27, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '50%', color, bgcolor: alpha(color, 0.1) }}><Icon sx={{ fontSize: 17 }} /></Box>
		<Box minWidth={0}>
			<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.49rem' }}>{label}</Typography>
			<Typography noWrap sx={{ color, fontSize: '0.63rem', fontWeight: 900 }}>{value}</Typography>
			{caption && <Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.4rem' }}>{caption}</Typography>}
		</Box>
	</Stack>
);

const PremiumFireSafetyMachineCard = ({ title, status, temperature, waterLevel, lastUpdated, slaveId, onOpenTrend }) => {
	const [trends, setTrends] = useState({ temperature: [], water_level: [] });
	const tempStatus = getTemperatureStatus(temperature);
	const isOnline = status?.toLowerCase() === 'online';

	useEffect(() => {
		let active = true;
		if (!slaveId) {
			return () => { active = false; };
		}
		Promise.all(FIRE_SAFETY_TREND_TAB_OPTIONS.map(async ({ tab }) => {
			try {
				const response = await api.get(API_URLS.FIRE_SAFETY_MACHINE_LIST_TREND(slaveId, tab, 24));
				return [tab, toValues(response)];
			} catch {
				return [tab, []];
			}
		})).then((entries) => active && setTrends(Object.fromEntries(entries)));
		return () => { active = false; };
	}, [slaveId]);

	const averageLevel = useMemo(() => {
		const values = trends.water_level;
		return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : Number(waterLevel);
	}, [trends.water_level, waterLevel]);

	return (
		<PremiumMachineCard app="FIRE-SAFETY" title={title} status={status} lastUpdated={lastUpdated}  onOpenTrend={onOpenTrend}>
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.6 }}>
				<FireMetric label="Temperature" value={temperature} unit="°C" Icon={DeviceThermostatRounded} color={GREEN} change={percentChange(trends.temperature)} />
				<FireMetric label="Water Level" value={waterLevel} unit="m" Icon={OpacityRounded} color="#7C3AED" change={percentChange(trends.water_level)} />
			</Box>

			<Box sx={{ mt: 0.55, p: 0.55, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.35}>
					<Stack direction="row" alignItems="center" spacing={0.45}><EqualizerRounded sx={{ color: GREEN, fontSize: 15 }} /><Box><Typography sx={{ fontSize: '0.55rem', fontWeight: 900 }}>Operating Range</Typography><Typography sx={{ color: 'text.secondary', fontSize: '0.42rem' }}>Current values in optimal operating range</Typography></Box></Stack>
				<Stack direction="row" alignItems="center" spacing={0.4}><Typography sx={{ px: 0.55, py: 0.15, borderRadius: 1, color: tempStatus?.color, bgcolor: alpha(tempStatus?.color || GREEN, 0.08), fontSize: '0.45rem', fontWeight: 900 }}>{tempStatus?.label || 'OPTIMAL'}</Typography><InfoOutlined sx={{ color: 'text.secondary', fontSize: 13 }} /></Stack>
				</Stack>
				<MachineTemperatureGauge value={temperature} statusColor={tempStatus?.color} statusLabel={tempStatus ? `${tempStatus.label} · ${tempStatus.range}` : ''} />
				<Stack direction="row" justifyContent="space-between" mt={0.2}><Typography sx={{ color: 'text.secondary', fontSize: '0.4rem' }}>COLD</Typography><Typography sx={{ color: 'text.secondary', fontSize: '0.4rem' }}>OPTIMAL</Typography><Typography sx={{ color: 'text.secondary', fontSize: '0.4rem' }}>HOT</Typography></Stack>
			</Box>

			<Box mt={0.55}><InlineTrend values={trends.temperature} current={temperature} /></Box>
			<Box sx={{ mt: 0.55, minHeight: 38, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, overflow: 'hidden', '& > * + *': { borderLeft: '1px solid', borderColor: 'divider' } }}>
				<Summary label="Last Hour" value={`${formatNumber(trends.temperature.at(-1) ?? temperature, 1, { fallback: '0' })} °C`} Icon={AccessTimeRounded} color="#1689E8" />
				<Summary label="Avg Level (7d)" value={`${formatNumber(averageLevel, 2, { fallback: '0' })} m`} Icon={OpacityRounded} color="#7C3AED" />
				<Summary label="Status" value={isOnline ? 'Stable' : 'Attention'} caption={isOnline ? 'All systems normal' : 'Check system'} Icon={CheckCircleRounded} color={isOnline ? GREEN : '#EF3340'} />
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumFireSafetyMachineCard;
