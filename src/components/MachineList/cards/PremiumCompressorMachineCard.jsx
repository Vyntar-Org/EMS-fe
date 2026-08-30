import {
	AccessTimeRounded,
	CalendarMonthRounded,
	ChevronRightRounded,
	CompressRounded,
	HistoryRounded,
	InsightsRounded,
	PlayArrowRounded,
	QueryStatsRounded,
	StopRounded,
	TimerOutlined,
	WifiOffRounded,
	WifiRounded,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatTimestamp } from '../../../helpers/common';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const GREEN = '#16A34A';
const RED = '#EF3340';

const shown = (value) =>
	value === null || value === undefined || value === '' || value === 'N/A'
		? '-'
		: value;

const SoftIcon = ({ children, color, size = 34 }) => (
	<Box
		sx={{
			width: size,
			height: size,
			borderRadius: '50%',
			display: 'grid',
			placeItems: 'center',
			flexShrink: 0,
			color,
			bgcolor: alpha(color, 0.1),
			'& svg': { fontSize: size * 0.58 },
		}}
	>
		{children}
	</Box>
);

const PeriodHeading = ({ icon, children }) => (
	<Stack
		direction="row"
		alignItems="center"
		justifyContent="center"
		spacing={0.4}
		minWidth={0}
		sx={{ color: '#365B8C', '& svg': { fontSize: 17 } }}
	>
		{icon}
		<Typography
			fontSize="8.5px"
			fontWeight={700}
			lineHeight={1.15}
			textAlign="center"
		>
			{children}
		</Typography>
	</Stack>
);

const PremiumCompressorMachineCard = ({
	title,
	status,
	lastUpdated,
	statusFrom,
	lastStoppageStart,
	lastStoppageEnd,
	lastStoppageDuration,
	previous8Count,
	previous24Count,
	previous8Duration,
	previous24Duration,
	onStoppageClick,
	onOpenTrend,
}) => {
	const isOnline = status?.toLowerCase() === 'online';
	const statusColor = isOnline ? GREEN : RED;
	const statusLabel = isOnline ? 'ONLINE' : 'OFFLINE';

	return (
		<Box
			sx={{
				height: '100%',
				width: '100%',
				maxWidth: '100%',
				boxSizing: 'border-box',
				minHeight: 430,
				p: 1,
				borderRadius: '20px',
				border: '1px solid',
				borderColor: (t) => alpha(t.palette.primary.main, 0.11),
				bgcolor: 'background.paper',
				boxShadow: '0 12px 35px rgba(37,69,111,.10)',
				display: 'flex',
				flexDirection: 'column',
				gap: 0.85,
				transition: (t) =>
					t.transitions.create(['transform', 'box-shadow', 'border-color'], {
						duration: t.transitions.duration.short,
					}),
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: `0 16px 34px ${alpha(statusColor, 0.18)}`,
					borderColor: alpha(statusColor, 0.28),
				},
			}}
		>
			<Box
				sx={{
					position: 'relative',
					overflow: 'hidden',
					minHeight: 104,
					borderRadius: '15px',
					border: `1px solid ${alpha(statusColor, 0.42)}`,
					background: `linear-gradient(120deg, ${alpha(
						statusColor,
						0.16
					)}, ${alpha(statusColor, 0.04)} 72%)`,
					boxShadow: `0 7px 18px ${alpha(statusColor, 0.12)}`,
					'&::after': {
						content: '""',
						position: 'absolute',
						right: -35,
						bottom: -48,
						width: 190,
						height: 100,
						borderRadius: '50%',
						background: `radial-gradient(circle, ${alpha(
							statusColor,
							0.2
						)} 1px, transparent 1.5px)`,
						backgroundSize: '9px 9px',
						transform: 'rotate(-12deg)',
					},
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					spacing={1}
					height="100%"
					p={1.05}
				>
					<Box
						sx={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							display: 'grid',
							placeItems: 'center',
							flexShrink: 0,
							color: '#35B879',
							bgcolor: 'background.paper',
							border: '3px solid rgba(255,255,255,.85)',
							boxShadow: '0 7px 16px rgba(28,48,76,.16)',
							'& svg': { fontSize: 30 },
						}}
					>
						<CompressRounded />
					</Box>
					<Box minWidth={0} flex={1} zIndex={1} pt={2}>
						<ResponsiveTextWrapper
							value={title}
							fontSize="16px"
							fontWeight={800}
							color="#0B2043"
							lineHeight={1.15}
							sx={{
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						/>
						<Stack
							direction="row"
							alignItems="center"
							spacing={0.5}
							mt={0.45}
							color="#50627D"
						>
							<CalendarMonthRounded sx={{ fontSize: 17 }} />
							<ResponsiveTextWrapper
								value={formatTimestamp(lastUpdated) || '-'}
								fontSize="11px"
								fontWeight={500}
								sx={{ whiteSpace: 'normal', lineHeight: 1.15 }}
							/>
						</Stack>
					</Box>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.6}
					sx={{
						position: 'absolute',
						top: 9,
						right: 9,
						px: 0.8,
						py: 0.35,
						borderRadius: '999px',
						color: statusColor,
						bgcolor: alpha(statusColor, 0.07),
						border: `1px solid ${alpha(statusColor, 0.35)}`,
					}}
				>
					<Box width={9} height={9} borderRadius="50%" bgcolor={statusColor} />
					<Typography fontSize="10px" fontWeight={800}>
						{statusLabel}
					</Typography>
				</Stack>
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1.1fr .9fr',
					alignItems: 'center',
					minHeight: 52,
					px: 0.8,
					borderRadius: '12px',
					border: '1px solid',
					borderColor: 'divider',
					boxShadow: '0 5px 14px rgba(37,69,111,.07)',
				}}
			>
				<Stack direction="row" alignItems="center" spacing={0.8} minWidth={0}>
					<SoftIcon color={statusColor} size={29}>
						{isOnline ? <WifiRounded /> : <WifiOffRounded />}
					</SoftIcon>
					<Box minWidth={0}>
						<Typography fontSize="10px" color="text.secondary">
							Current Status
						</Typography>
						<Typography
							noWrap
							fontSize="12px"
							fontWeight={800}
							color={statusColor}
						>
							{statusLabel}
						</Typography>
					</Box>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.7}
					minWidth={0}
					sx={{ pl: 1, borderLeft: '1px solid', borderColor: 'divider' }}
				>
					<SoftIcon color="#496789" size={29}>
						<HistoryRounded />
					</SoftIcon>
					<Box minWidth={0}>
						<Typography fontSize="9.5px" color="text.secondary">
							Since
						</Typography>
						<ResponsiveTextWrapper
							value={statusFrom || '-'}
							fontSize="10.5px"
							fontWeight={600}
							sx={{
								whiteSpace: 'normal',
								lineHeight: 1.15,
								overflow: 'visible',
							}}
						/>
					</Box>
				</Stack>
			</Box>

			<Box>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={0.5}
				>
					<Stack direction="row" alignItems="center" spacing={0.7}>
						<Box width={3} height={17} borderRadius={2} bgcolor={statusColor} />
						<Typography fontSize="12.5px" fontWeight={800} color="#102746">
							Last Stoppage
						</Typography>
					</Stack>
					<Button
						onClick={() => onStoppageClick?.(24)}
						startIcon={<CalendarMonthRounded />}
						endIcon={<ChevronRightRounded />}
						sx={{
							p: 0,
							minWidth: 0,
							color: '#169B52',
							fontSize: 10,
							textTransform: 'none',
						}}
					>
						View History
					</Button>
				</Stack>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: '1.05fr 1.2fr .75fr',
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: '12px',
						p: 0.7,
						boxShadow: '0 5px 14px rgba(37,69,111,.06)',
					}}
				>
					{[
						[
							'START TIME',
							lastStoppageStart,
							<PlayArrowRounded key="start" />,
							'#20A66A',
						],
						['END TIME', lastStoppageEnd, <StopRounded key="end" />, '#EF3340'],
						[
							'DURATION',
							lastStoppageDuration,
							<AccessTimeRounded key="duration" />,
							'#D91D32',
						],
					].map(([label, value, icon, color], index) => (
						<Box
							key={label}
							minWidth={0}
							px={0.6}
							sx={{
								borderLeft: index ? '1px solid' : 'none',
								borderColor: 'divider',
							}}
						>
							<Typography
								textAlign="center"
								fontSize="8px"
								fontWeight={800}
								color="text.secondary"
							>
								{label}
							</Typography>
							<Stack
								direction="row"
								alignItems="center"
								justifyContent="center"
								spacing={0.4}
								mt={0.55}
								minWidth={0}
							>
								{icon ? (
									<SoftIcon color={color} size={23}>
										{icon}
									</SoftIcon>
								) : null}
								<ResponsiveTextWrapper
									value={shown(value)}
									fontSize="9.5px"
									fontWeight={700}
									sx={{
										textAlign: 'center',
										whiteSpace: 'normal',
										overflow: 'visible',
										wordBreak: 'break-word',
									}}
								/>
							</Stack>
						</Box>
					))}
				</Box>
			</Box>

			<Box
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: '12px',
					p: 0.75,
					boxShadow: '0 5px 14px rgba(37,69,111,.06)',
				}}
			>
				<Box
					display="grid"
					gridTemplateColumns="1fr .78fr .78fr"
					alignItems="center"
					mb={0.55}
				>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.55}
						minWidth={0}
					>
						<QueryStatsRounded sx={{ color: '#6577E8', fontSize: 18 }} />
						<Typography fontSize="10px" fontWeight={800} lineHeight={1.1}>
							Stoppages History
						</Typography>
					</Stack>
					<PeriodHeading icon={<HistoryRounded />}>
						Previous 8 hrs
					</PeriodHeading>
					<PeriodHeading icon={<CalendarMonthRounded />}>
						Previous 24 hrs
					</PeriodHeading>
				</Box>
				<Box
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: '10px',
						px: 0.65,
					}}
				>
					{[
						[
							'No. of Stoppages',
							previous8Count ?? 0,
							previous24Count ?? 0,
							false,
						],
						[
							'Stoppage Duration',
							shown(previous8Duration),
							shown(previous24Duration),
							true,
						],
					].map(([label, first, second, duration], row) => (
						<Box
							key={label}
							sx={{
								display: 'grid',
								gridTemplateColumns: '1fr .78fr .78fr',
								alignItems: 'center',
								minHeight: 40,
								borderTop: row ? '1px dashed' : 'none',
								borderColor: 'divider',
							}}
						>
							<Typography fontSize="9.5px" fontWeight={650} lineHeight={1.15}>
								{label}
							</Typography>
							{[first, second].map((cell, index) => (
								<Box
									key={index}
									textAlign="center"
									sx={{ borderLeft: '1px solid', borderColor: 'divider' }}
								>
									{duration ? (
										<Stack
											direction="row"
											alignItems="center"
											justifyContent="center"
											spacing={0.35}
										>
											<TimerOutlined sx={{ color: '#2874C6', fontSize: 15 }} />
											<Typography
												fontSize="8.5px"
												fontWeight={650}
												lineHeight={1.1}
											>
												{cell}
											</Typography>
										</Stack>
									) : (
										<Box
											component="button"
											onClick={() =>
												Number(cell) > 0 && onStoppageClick?.(index ? 24 : 8)
											}
											sx={{
												border: 0,
												borderRadius: '8px',
												px: 1.1,
												py: 0.2,
												bgcolor: alpha(GREEN, 0.11),
												color: '#16894F',
												font: 'inherit',
												fontSize: 15,
												fontWeight: 800,
												cursor: Number(cell) > 0 ? 'pointer' : 'default',
											}}
										>
											{cell}
										</Box>
									)}
								</Box>
							))}
						</Box>
					))}
				</Box>
			</Box>

			<Box flex={1} />
			<Button
				onClick={onOpenTrend}
				fullWidth
				variant="contained"
				startIcon={<InsightsRounded />}
				endIcon={<ChevronRightRounded />}
				sx={{
					minHeight: 36,
					borderRadius: '10px',
					fontSize: 12.5,
					fontWeight: 800,
					background: isOnline
						? 'linear-gradient(105deg,#16A34A 0%,#22C55E 100%)'
						: 'linear-gradient(105deg,#F23857 0%,#FF5A24 100%)',
					boxShadow: `0 6px 14px ${alpha(statusColor, 0.22)}`,
					'& .MuiButton-startIcon svg': { fontSize: 18 },
					'& .MuiButton-endIcon': { position: 'absolute', right: 14 },
					'&:hover': {
						background: isOnline
							? 'linear-gradient(105deg,#138A3F 0%,#1DAA50 100%)'
							: 'linear-gradient(105deg,#DB2947 0%,#E84B19 100%)',
					},
				}}
			>
				TREND
			</Button>
		</Box>
	);
};

export default PremiumCompressorMachineCard;
