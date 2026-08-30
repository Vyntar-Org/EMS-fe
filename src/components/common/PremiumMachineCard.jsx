import {
	CalendarMonthRounded,
	ChevronRightRounded,
	InsightsRounded,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatTimestamp } from '../../helpers/common';
import {
	AnimatedMachineAvatar,
	APP_ACCENT_COLOR,
	MiniSparkline,
} from './MachineCardBits';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

/** Shared shell matching the Compressor / Spinning machine-list card. */
const PremiumMachineCard = ({
	app,
	title,
	status,
	lastUpdated,
	todayMtd,
	onOpenTrend,
	footer,
	accentColor,
	children,
}) => {
	const isOnline = status?.toLowerCase() === 'online';
	const statusColor = isOnline ? '#16A34A' : '#EF3340';
	const statusLabel = isOnline ? 'ONLINE' : 'OFFLINE';
	const accent = accentColor || APP_ACCENT_COLOR[app] || statusColor;

	return (
		<Box
			sx={{
				height: '100%',
				width: '100%',
				maxWidth: '100%',
				boxSizing: 'border-box',
				p: 1,
				borderRadius: '20px',
				border: '1px solid',
				borderColor: (t) => alpha(t.palette.primary.main, 0.11),
				bgcolor: 'background.paper',
				boxShadow: '0 12px 35px rgba(37,69,111,.10)',
				display: 'flex',
				flexDirection: 'column',
				minHeight: 360,
				gap: 0.6,
				minWidth: 0,
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
							bgcolor: 'background.paper',
							border: '3px solid rgba(255,255,255,.85)',
							boxShadow: '0 7px 16px rgba(28,48,76,.16)',
							'& .MuiAvatar-root': {
								width: 50,
								height: 50,
								color: accent,
								bgcolor: 'transparent',
								background: 'transparent',
								boxShadow: 'none',
							},
						}}
					>
						<AnimatedMachineAvatar app={app} isOnline={isOnline} />
					</Box>
					<Box minWidth={0} flex={1} zIndex={1} pt={2}>
						<ResponsiveTextWrapper
							value={title}
							fontSize="16px"
							fontWeight={800}
							color="text.primary"
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
							color="text.secondary"
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

			<Box width="100%" minWidth={0}>
				{children}
			</Box>

			{todayMtd && (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: '12px',
						boxShadow: '0 5px 14px rgba(37,69,111,.06)',
						overflow: 'hidden',
					}}
				>
					{[
						[todayMtd.todayLabel || 'Today', todayMtd.todayValue],
						[todayMtd.mtdLabel || 'MTD', todayMtd.mtdValue],
					].map(([label, value], index) => (
						<Box
							key={label}
							minWidth={0}
							sx={{
								minHeight: 68,
								p: 0.75,
								borderLeft: index ? '1px solid' : 0,
								borderColor: 'divider',
								background: (t) =>
									`linear-gradient(155deg, ${alpha(statusColor, 0.035)}, ${
										t.palette.background.paper
									} 65%)`,
							}}
						>
							<Stack
								direction="row"
								alignItems="center"
								spacing={0.55}
								color={statusColor}
							>
								<CalendarMonthRounded sx={{ fontSize: 15 }} />
								<ResponsiveTextWrapper
									value={label}
									fontSize="11px"
									color="text.secondary"
									fontWeight={500}
								/>
							</Stack>
							<ResponsiveTextWrapper
								value={value}
								fontSize="15px"
								color="text.primary"
								fontWeight={800}
								sx={{
									mt: 0.2,
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}
							/>
							<Box
								sx={{ width: '100%', height: 18, mt: 0.2 }}
								aria-hidden="true"
							>
								<MiniSparkline
									data={
										index === 0
											? [32, 40, 36, 47, 42, 51, 45, 58]
											: [29, 37, 33, 43, 39, 48, 44, 56]
									}
									color="#F26A7A"
									width="100%"
									height={18}
								/>
							</Box>
						</Box>
					))}
				</Box>
			)}

			<Box flex={1} />
			{footer !== null &&
				(footer || (
					<Button
						onClick={onOpenTrend}
						fullWidth
						variant="contained"
						startIcon={<InsightsRounded />}
						endIcon={<ChevronRightRounded />}
						sx={{
							minHeight: 34,
							borderRadius: '10px',
							fontSize: 12.5,
							fontWeight: 800,
							background: isOnline
								? 'linear-gradient(105deg,#16A34A 0%,#22C55E 100%)'
								: 'linear-gradient(105deg,#F23857 0%,#FF5A24 100%)',
							boxShadow: `0 6px 14px ${alpha(statusColor, 0.22)}`,
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
				))}
		</Box>
	);
};

export default PremiumMachineCard;
