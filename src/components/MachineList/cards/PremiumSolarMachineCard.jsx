import {
	DeviceThermostatRounded,
	EqualizerRounded,
	TrendingDownRounded,
	TrendingUpRounded,
	WarningAmberRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { SOLAR_TREND_TAB_OPTIONS } from '../../../constants/solarMachineList';
import { api } from '../../../helpers/api';
import { API_URLS } from '../../../helpers/apiUrls';
import { formatNumber } from '../../../helpers/formatters';
import { getTemperatureStatus } from '../../../helpers/temperatureStatus';
import { MachineTemperatureGauge } from '../../common/MachineCardBits';
import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';
import PremiumMachineCard from '../../common/PremiumMachineCard';

const GREEN = '#16A34A';
const RED = '#EF1745';

const getChange = (rows) => {
	const values = (Array.isArray(rows) ? rows : [])
		.map((row) => Number(row?.value ?? row))
		.filter(Number.isFinite);
	if (values.length < 2 || values.at(-2) === 0) {
		return 0;
	}
	return ((values.at(-1) - values.at(-2)) / Math.abs(values.at(-2))) * 100;
};

const ChangeBadge = ({ value }) => {
	const isFlat = Math.abs(value) < 0.05;
	const isPositive = value > 0;
	const color = isFlat ? '#526987' : isPositive ? GREEN : RED;
	const Icon = isPositive ? TrendingUpRounded : TrendingDownRounded;
	return (
		<Box sx={{ flexShrink: 0, textAlign: 'right' }}>
			<Stack direction="row" alignItems="center" spacing={0.2} sx={{ px: 0.5, py: 0.25, borderRadius: 1, bgcolor: alpha(color, 0.08) }}>
				<Icon sx={{ color, fontSize: 14 }} />
				<Typography sx={{ color, fontSize: '0.65rem', fontWeight: 900 }}>
					{isPositive ? '+' : ''}{formatNumber(value, 1, { fallback: '0' })}%
				</Typography>
			</Stack>
			<Typography sx={{ mt: 0.12, color: 'text.secondary', fontSize: '0.48rem' }}>vs. last hour</Typography>
		</Box>
	);
};

const SolarMetric = ({ label, value, unit, color, change, span }) => (
	<Box sx={{ gridColumn: `span ${span}`, position: 'relative', minWidth: 0, minHeight: 49, p: 0.6, pl: 1.05, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, boxShadow: '0 3px 10px rgba(37,69,111,.04)', '&::before': { content: '""', position: 'absolute', left: 0, top: 7, bottom: 7, width: 3, borderRadius: '0 4px 4px 0', bgcolor: color } }}>
		<Stack direction="row" justifyContent="space-between" spacing={0.35}>
			<Box minWidth={0}>
				<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.59rem', fontWeight: 600 }}>{label}</Typography>
				<Typography noWrap sx={{ color: 'text.primary', fontSize: '0.82rem', fontWeight: 900 }}>
					{formatNumber(value, 2, { fallback: '0' })}{unit ? ` ${unit}` : ''}
				</Typography>
			</Box>
			<ChangeBadge value={change} />
		</Stack>
	</Box>
);

const Summary = ({ label, value, Icon, color }) => (
	<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.45} minWidth={0}>
		<Icon sx={{ color, fontSize: 19 }} />
		<Box minWidth={0}>
			<Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.53rem' }}>{label}</Typography>
			<Typography noWrap sx={{ color, fontSize: '0.65rem', fontWeight: 900 }}>{value}</Typography>
		</Box>
	</Stack>
);

const PremiumSolarMachineCard = ({
	title,
	status,
	lastUpdated,
	inletTemperature,
	outletTemperature,
	flowTemperature,
	instantFlow,
	pressure,
	slaveId,
	onOpenTrend,
}) => {
	const [changes, setChanges] = useState({});
	const outletStatus = getTemperatureStatus(outletTemperature);
	const isOnline = status?.toLowerCase() === 'online';

	useEffect(() => {
		let active = true;
		if (!slaveId) {
			return () => { active = false; };
		}
		Promise.all(
			SOLAR_TREND_TAB_OPTIONS.map(async ({ tab }) => {
				try {
					const response = await api.get(API_URLS.SOLAR_MACHINE_LIST_TREND(slaveId, tab));
					return [tab, getChange(response?.data?.data || response?.data?.trends)];
				} catch {
					return [tab, 0];
				}
			})
		).then((entries) => {
			if (active) {
				setChanges(Object.fromEntries(entries));
			}
		});
		return () => { active = false; };
	}, [slaveId]);

	const delta = Number(outletTemperature) - Number(inletTemperature);
	const average = (Number(outletTemperature) + Number(inletTemperature)) / 2;
	const metrics = [
		['Instant Flow', instantFlow, 'm³/hr', '#14B8A6', 'instant_flow', 2],
		['Flow Temperature', flowTemperature, '°C', '#8B19F5', 'flow_temperature', 2],
		['Pressure', pressure, '', '#1689E8', 'pressure', 2],
		['Inlet Temperature', inletTemperature, '°C', '#FFA900', 'inlet_temperature', 3],
		['Outlet Temperature', outletTemperature, '°C', '#EF1745', 'outlet_temperature', 3],
	];

	return (
		<PremiumMachineCard app="SOLAR" title={title} status={status} lastUpdated={lastUpdated} onOpenTrend={onOpenTrend}>
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 0.55 }}>
				{metrics.map(([label, value, unit, color, key, span]) => (
					<SolarMetric key={label} label={label} value={value} unit={unit} color={color} change={changes[key] || 0} span={span} />
				))}
			</Box>

			<Box sx={{ mt: 0.55, p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius }}>
				<Stack direction="row" justifyContent="space-between" mb={0.35}>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.58rem', fontWeight: 600 }}>System Heat / Operating Range</Typography>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.48rem' }}>Hot</Typography>
				</Stack>
				<MachineTemperatureGauge value={outletTemperature} statusColor={outletStatus?.color} statusLabel={outletStatus ? `Outlet ${outletStatus.label} · ${outletStatus.range}` : ''} />
				<Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.48rem' }}>Cool</Typography>
			</Box>

			<Box sx={{ mt: 0.55, minHeight: 41, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: MACHINE_CARD_DESIGN.sectionRadius, overflow: 'hidden', '& > * + *': { borderLeft: '1px solid', borderColor: 'divider' } }}>
				<Summary label="Temp Delta" value={`${formatNumber(delta, 2, { fallback: '0' })} °C`} Icon={DeviceThermostatRounded} color={RED} />
				<Summary label="Avg Temp" value={`${formatNumber(average, 2, { fallback: '0' })} °C`} Icon={EqualizerRounded} color="#365B8C" />
				<Summary label="Status" value={isOnline ? 'Stable' : 'Needs Attention'} Icon={WarningAmberRounded} color={isOnline ? GREEN : RED} />
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumSolarMachineCard;
