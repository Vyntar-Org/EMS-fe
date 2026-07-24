import { Insights } from '@mui/icons-material';
import { Box, Button, Chip, Divider, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatTimestamp } from '../../helpers/common';

import { AnimatedMachineAvatar, APP_ACCENT_COLOR } from './MachineCardBits';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

/**
 * Shared premium shell for machine-list cards: an app-themed icon on a
 * colorful accent wash, title + status pill, timestamp, an optional
 * Today/MTD stat row, and a TREND button always last — separated by clean
 * dividers. Each app's own metric content is passed as `children` so every
 * app keeps its own dedicated data layout while sharing the same chrome.
 * This component makes no network calls of its own — trend data lives in
 * one place: the modal opened by the TREND button.
 */
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
	const accent =
		accentColor || (isOnline ? APP_ACCENT_COLOR[app] : null) || '#DC2626';

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				p: 1.5,
				borderRadius: '20px',
				border: '2px solid',
				borderColor: (t) =>
					alpha(accent, t.palette.mode === 'dark' ? 0.36 : 0.24),
				background: (t) =>
					`linear-gradient(155deg, ${alpha(
						accent,
						t.palette.mode === 'dark' ? 0.22 : 0.11
					)} 0%, ${t.palette.background.paper} 58%)`,
			}}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="flex-start"
				gap={1}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={1.25}
					minWidth={0}
					flex={1}
				>
					<AnimatedMachineAvatar app={app} isOnline={isOnline} />
					<Box minWidth={0} flex={1}>
						<ResponsiveTextWrapper
							value={title}
							variant="h6"
							fontWeight={700}
							color="text.primary"
						/>
						<ResponsiveTextWrapper
							value={formatTimestamp(lastUpdated)}
							color="text.secondary"
							fontWeight={500}
							fontSize="12.5px"
						/>
					</Box>
				</Stack>

				<Chip
					label={status?.toUpperCase()}
					size="small"
					sx={{
						flexShrink: 0,
						fontWeight: 700,
						fontSize: '11px',
						color: isOnline ? 'success.main' : 'error.main',
						bgcolor: (t) =>
							alpha(
								isOnline ? t.palette.success.main : t.palette.error.main,
								t.palette.mode === 'dark' ? 0.2 : 0.12
							),
						border: 'none',
					}}
				/>
			</Stack>

			<Divider
				sx={{
					my: 1,
					borderColor: (t) =>
						alpha(accent, t.palette.mode === 'dark' ? 0.28 : 0.16),
				}}
			/>

			<Box width="100%">{children}</Box>

			{todayMtd && (
				<>
					<Divider
						sx={{
							my: 1,
							borderColor: (t) =>
								alpha(accent, t.palette.mode === 'dark' ? 0.28 : 0.16),
						}}
					/>
					<Stack
						direction="row"
						justifyContent="space-between"
						gap={1}
						px={0.25}
					>
						<Box minWidth={0} flex={1}>
							<ResponsiveTextWrapper
								value={todayMtd.todayLabel || 'Today'}
								fontSize="12px"
								color="text.secondary"
								fontWeight={500}
							/>
							<ResponsiveTextWrapper
								value={todayMtd.todayValue}
								fontSize="17px"
								color="text.primary"
								fontWeight={700}
							/>
						</Box>
						<Box minWidth={0} flex={1} textAlign="right">
							<ResponsiveTextWrapper
								value={todayMtd.mtdLabel || 'MTD'}
								fontSize="12px"
								color="text.secondary"
								fontWeight={500}
								sx={{ textAlign: 'right' }}
							/>
							<ResponsiveTextWrapper
								value={todayMtd.mtdValue}
								fontSize="17px"
								color="text.primary"
								fontWeight={700}
								sx={{ textAlign: 'right' }}
							/>
						</Box>
					</Stack>
				</>
			)}

			<Box flex={1} />

			{footer !== null && (
				<>
					<Divider
						sx={{
							mt: 1,
							mb: 0.75,
							borderColor: (t) =>
								alpha(accent, t.palette.mode === 'dark' ? 0.28 : 0.16),
						}}
					/>
					<Stack direction="row" justifyContent="flex-end" alignItems="center">
						{footer || (
							<Button
								onClick={onOpenTrend}
								size="small"
								startIcon={<Insights fontSize="small" />}
								disableElevation
								variant="contained"
								fullWidth
								sx={{
									fontWeight: 700,
									fontSize: '12px',
									borderRadius: '14px',
									py: 0.75,
									bgcolor: accent,
									'&:hover': { bgcolor: accent, filter: 'brightness(0.92)' },
								}}
							>
								TREND
							</Button>
						)}
					</Stack>
				</>
			)}
		</Box>
	);
};

export default PremiumMachineCard;
