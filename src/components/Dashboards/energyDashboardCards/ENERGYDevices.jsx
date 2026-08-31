import {
	MonitorHeartRounded,
	ShowChartRounded,
	TrendingDownRounded,
} from '@mui/icons-material';
import { Box, Stack, Typography, alpha } from '@mui/material';

import { formatNumber } from '../../../helpers/formatters';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

const ONLINE_COLOR = '#16A34A';
const OFFLINE_COLOR = '#DC2626';
const ACCENT = '#2563EB';

const TotalDevices = ({ value, label = 'Total Devices' }) => (
	<>
		<Stack spacing={0.1} minWidth={66}>
			<Typography
				variant="caption"
				sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.15 }}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					color: 'text.primary',
					fontSize: '1.25rem',
					fontWeight: 800,
					lineHeight: 1,
				}}
			>
				{value}
			</Typography>
		</Stack>
	</>
);

const DeviceRing = ({ percent }) => {
	const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

	return (
		<Box
			role="img"
			aria-label={`${clamped}% of fuel stations online`}
			sx={{
				width: 'clamp(78px, 9vw, 112px)',
				aspectRatio: '1',
				flexShrink: 0,
				borderRadius: '50%',
				p: '8px',
				background: (theme) =>
					`conic-gradient(from 135deg, ${ONLINE_COLOR} 0deg ${
						clamped * 3.6
					}deg, ${alpha(
						theme.palette.text.secondary,
						theme.palette.mode === 'dark' ? 0.2 : 0.12
					)} ${clamped * 3.6}deg 360deg)`,
				boxShadow: `0 6px 18px ${alpha(
					ONLINE_COLOR,
					0.2
				)}, inset 0 1px 2px ${alpha('#FFFFFF', 0.65)}`,
				'@container (max-width: 330px)': {
					width: 76,
					p: '6px',
				},
			}}
		>
			<Stack
				sx={{
					height: '100%',
					borderRadius: '50%',
					alignItems: 'center',
					justifyContent: 'center',
					color: ACCENT,
					backgroundColor: 'background.paper',
					boxShadow: (theme) =>
						`inset 0 2px 8px ${alpha(theme.palette.text.primary, 0.1)}`,
				}}
			>
				<Typography fontSize="18px" fontWeight={900} lineHeight={1}>
					{clamped}%
				</Typography>
				<Typography fontSize="8px" fontWeight={700} color="text.secondary">
					ONLINE
				</Typography>
			</Stack>
		</Box>
	);
};

const CountChip = ({ label, value, percent, color, isOnline }) => {
	const TrendIcon = isOnline ? ShowChartRounded : TrendingDownRounded;

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'stretch',
				height: 64,
				overflow: 'hidden',
				borderRadius: '14px',
				border: (theme) =>
					`1px solid ${alpha(
						color,
						theme.palette.mode === 'dark' ? 0.28 : 0.12
					)}`,
				backgroundColor: 'background.paper',
				boxShadow: (theme) =>
					theme.palette.mode === 'dark'
						? `0 5px 14px ${alpha('#000000', 0.24)}`
						: `0 5px 14px ${alpha('#24405F', 0.13)}, inset 0 1px 0 ${alpha(
								'#FFFFFF',
								0.9
						  )}`,
				'@container (max-width: 330px)': {
					height: 60,
					borderRadius: '11px',
				},
			}}
		>
			<Box
				sx={{
					width: 42,
					flexShrink: 0,
					display: 'grid',
					placeItems: 'center',
					background: `linear-gradient(145deg, ${alpha(
						color,
						0.06
					)} 0%, ${alpha(color, 0.2)} 100%)`,
					boxShadow: `inset -1px 0 0 ${alpha(color, 0.16)}`,
					'@container (max-width: 330px)': { width: 30 },
				}}
			>
				<Box
					sx={{
						width: 16,
						height: 16,
						borderRadius: '50%',
						background: `linear-gradient(145deg, ${alpha(
							'#FFFFFF',
							0.45
						)} 0%, ${color} 45%)`,
						boxShadow: `0 2px 5px ${alpha(color, 0.4)}`,
					}}
				/>
			</Box>

			<Stack
				justifyContent="center"
				sx={{
					flex: 1,
					minWidth: 0,
					px: 1.5,
					py: 1,
					'@container (max-width: 330px)': { px: 0.75, py: 0.6 },
				}}
			>
				<Typography
					sx={{
						color,
						fontSize: '0.78rem',
						fontWeight: 800,
						lineHeight: 1,
						letterSpacing: '0.04em',
					}}
				>
					{label}
				</Typography>
				<Typography
					sx={{ color, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1 }}
				>
					{value}
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: 'text.secondary', fontSize: '0.72rem', lineHeight: 1.1 }}
				>
					{percent}% of total
				</Typography>
			</Stack>

			<Box
				sx={{
					alignSelf: 'center',
					mr: 0.75,
					width: 38,
					height: 38,
					flexShrink: 0,
					display: 'grid',
					placeItems: 'center',
					borderRadius: '50%',
					color,
					backgroundColor: alpha(color, 0.1),
					'@container (max-width: 360px)': { display: 'none' },
				}}
			>
				<TrendIcon sx={{ fontSize: 22 }} />
			</Box>
		</Box>
	);
};

export const OnlineOfflineSummaryCard = ({
	data,
	title = 'Total Devices',
	titleIcon = <MonitorHeartRounded />,
	accentColor = ACCENT,
	showRing = false,
}) => {
	const online = Number(data?.online) || 0;
	const offline = Number(data?.offline) || 0;
	const total = Number(data?.total) || online + offline;
	const percentage = (value) => {
		if (!total) {
			return 0;
		}
		return formatNumber((value / total) * 100, 2, { fallback: '0' });
	};

	return (
		<CustomCard
			titleIcon={titleIcon}
			title={<TotalDevices value={total} label={title} />}
			accentColor={accentColor}
			sx={{ containerType: 'inline-size' }}
		>
			{data ? (
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					sx={{
						height: '100%',
						px: 0.25,
						'@container (max-width: 330px)': { gap: 0.5, px: 0 },
					}}
				>
					{showRing && (
						<Box
							sx={{
								width: 'clamp(90px, 34%, 120px)',
								flexShrink: 0,
								display: 'grid',
								placeItems: 'center',
								'@container (max-width: 330px)': { width: 78 },
								'@container (max-width: 270px)': { display: 'none' },
							}}
						>
							<DeviceRing percent={percentage(online)} />
						</Box>
					)}
					<Stack
						justifyContent="center"
						gap={1.25}
						sx={{ flex: 1, width: '100%', minWidth: 0 }}
					>
						<CountChip
							label="ONLINE"
							value={online}
							percent={percentage(online)}
							color={ONLINE_COLOR}
							isOnline
						/>
						<CountChip
							label="OFFLINE"
							value={offline}
							percent={percentage(offline)}
							color={OFFLINE_COLOR}
						/>
					</Stack>
				</Stack>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

const ENERGYDevices = ({ data }) => <OnlineOfflineSummaryCard data={data} />;

export default ENERGYDevices;
