import BoltIcon from '@mui/icons-material/Bolt';
import CompressIcon from '@mui/icons-material/Compress';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ScienceIcon from '@mui/icons-material/Science';
import SensorsIcon from '@mui/icons-material/Sensors';
import SpeedIcon from '@mui/icons-material/Speed';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const APP_ICONS = {
	ENERGY: BoltIcon,
	WATER: WaterDropIcon,
	FUEL: LocalGasStationIcon,
	SOLAR: WbSunnyIcon,
	STP: ScienceIcon,
	TEMPERATURE: DeviceThermostatIcon,
	'FIRE-SAFETY': LocalFireDepartmentIcon,
	FLOWMETER: SpeedIcon,
	COMPRESSOR: CompressIcon,
};

/**
 * KPI-style machine card surface: a mild accent tint washing from the top
 * into the theme paper — soft green wash when the device is online, soft
 * primary-blue otherwise. Works in both light and dark modes.
 */
export const machineCardSx = (isOnline) => ({
	background: (t) => {
		const isDark = t.palette.mode === 'dark';
		const accent = isOnline ? t.palette.success.main : t.palette.primary.main;
		return `linear-gradient(155deg, ${alpha(
			accent,
			isDark ? 0.17 : 0.09
		)} 0%, ${t.palette.background.paper} 55%)`;
	},
	border: '1px solid',
	borderColor: (t) =>
		alpha(
			isOnline ? t.palette.success.main : t.palette.primary.main,
			t.palette.mode === 'dark' ? 0.32 : 0.18
		),
	boxShadow: '0 6px 20px rgba(15, 35, 62, 0.06)',
	transition: 'all 0.25s ease',
	'&:hover': {
		boxShadow: '0 10px 26px rgba(15, 35, 62, 0.12)',
		// transform: 'translateY(-2px)',
	},
});

/**
 * Metric row icons: soft accent-tinted rounded chip behind every icon,
 * derived from the icon's own color so it suits both theme modes.
 * Accepts a hex/rgb string, `row.color`-style values, or 'primary.main'.
 */
export const metricIconSx = (color) => ({
	fontSize: '24px',
	p: '4px',
	borderRadius: '8px',
	mr: 1,
	flexShrink: 0,
	color: color || 'primary.main',
	bgcolor: (t) => {
		const resolved =
			!color || color === 'primary.main' ? t.palette.primary.main : color;
		try {
			return alpha(resolved, t.palette.mode === 'dark' ? 0.24 : 0.12);
		} catch {
			return alpha(
				t.palette.primary.main,
				t.palette.mode === 'dark' ? 0.24 : 0.12
			);
		}
	},
});

/**
 * Circular soft-primary avatar shown at the top-left of every machine card
 * (BMS reference design). Pick the icon via the `app` code.
 */
export const MachineAvatar = ({ app }) => {
	const Icon = APP_ICONS[app] || SensorsIcon;
	return (
		<Avatar
			sx={{
				width: 60,
				height: 60,
				flexShrink: 0,
				bgcolor: (t) =>
					alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.25 : 0.1),
				color: 'primary.main',
				boxShadow: (t) => `0 0 0 1px ${alpha(t.palette.primary.main, 0.18)}`,
			}}
		>
			<Icon fontSize="large" />
		</Avatar>
	);
};

/**
 * "● Healthy / ● Offline" status badge for the machine card footer.
 */
export const MachineHealthBadge = ({ isOnline }) => (
	<Stack direction="row" alignItems="center" gap={0.75} flexShrink={0}>
		<Box
			sx={{
				width: 9,
				height: 9,
				borderRadius: '50%',
				bgcolor: isOnline ? 'success.main' : 'error.main',
				boxShadow: (t) =>
					`0 0 0 3px ${alpha(
						isOnline ? t.palette.success.main : t.palette.error.main,
						0.18
					)}`,
			}}
		/>
		<Typography
			sx={{
				fontSize: '13px',
				fontWeight: 700,
				color: isOnline ? 'success.main' : 'error.main',
			}}
		>
			{isOnline ? 'Healthy' : 'Offline'}
		</Typography>
	</Stack>
);
