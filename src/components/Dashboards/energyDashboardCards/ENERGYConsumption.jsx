import { CalendarMonthRounded, ElectricBoltRounded } from '@mui/icons-material';
import { alpha, Box, Stack, Typography } from '@mui/material';

import { formatNumber } from '../../../helpers/formatters';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import { MiniSparkline } from '../../common/MachineCardBits';

const ACCENT = '#F2A900';
const SPARKLINE_DATA = [10, 18, 14, 26, 22, 31, 12, 24, 19, 34, 25, 31];

const PERIODS = [
	{ key: 'mtd', label: 'MTD' },
	{ key: 'today', label: 'Today', featured: true },
	{ key: 'yesterday', label: 'Yesterday' },
];

const PeriodCard = ({ period, data, unit }) => {
	const featured = period.featured;

	return (
		<Box
			sx={{
				flex: 1,
				minWidth: 0,
				height: '100%',
				px: { xs: 0.65, sm: 0.85, xl: 1.1 },
				py: 0.7,
				borderRadius: '12px',
				border: '1px solid',
				borderColor: featured ? alpha(ACCENT, 0.5) : 'divider',
				background: (theme) =>
					featured
						? `linear-gradient(145deg, ${alpha(
								ACCENT,
								theme.palette.mode === 'dark' ? 0.14 : 0.08
						  )}, ${alpha(ACCENT, 0.02)})`
						: alpha(theme.palette.background.paper, 0.7),
				boxShadow: featured ? `0 8px 22px ${alpha(ACCENT, 0.13)}` : 'none',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				transform: featured ? 'scale(1.04)' : 'none',
			}}
		>
			<Stack direction="row" alignItems="center" spacing={0.55} minWidth={0}>
				<Box
					sx={{
						width: 24,
						height: 24,
						borderRadius: '8px',
						display: 'grid',
						placeItems: 'center',
						flexShrink: 0,
						color: featured ? ACCENT : 'text.secondary',
						bgcolor: featured ? alpha(ACCENT, 0.13) : 'action.hover',
					}}
				>
					<CalendarMonthRounded sx={{ fontSize: 15 }} />
				</Box>
				<Typography
					sx={{
						fontSize: { xs: '0.59rem', sm: '0.66rem', xl: '0.72rem' },
						fontWeight: 800,
						textTransform: 'uppercase',
						letterSpacing: '0.035em',
						color: featured ? ACCENT : 'text.primary',
						whiteSpace: 'nowrap',
					}}
				>
					{period.label}
				</Typography>
			</Stack>

			<Box mt={0.4}>
				<Typography
					sx={{
						fontSize: { xs: '1.15rem', sm: '1.35rem', xl: '1.55rem' },
						lineHeight: 1,
						fontWeight: 800,
						letterSpacing: '-0.035em',
						color: featured ? ACCENT : 'text.primary',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{formatNumber(data?.value, 2, { fallback: '0', useGrouping: false })}
				</Typography>
				<Typography
					sx={{ mt: 0.15, fontSize: '0.61rem', fontWeight: 700, color: ACCENT }}
				>
					{unit}
				</Typography>
			</Box>

			<Box sx={{ height: 20, my: 0.25, opacity: featured ? 1 : 0.9 }}>
				<MiniSparkline
					color={ACCENT}
					data={SPARKLINE_DATA}
					height={20}
					width="100%"
				/>
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				spacing={0.5}
				sx={{ pt: 0.45, borderTop: '1px solid', borderColor: 'divider' }}
			>
				<Box
					sx={{
						width: 22,
						height: 22,
						borderRadius: '50%',
						display: 'grid',
						placeItems: 'center',
						fontSize: '0.75rem',
						fontWeight: 800,
						color: featured ? ACCENT : 'text.secondary',
						bgcolor: featured ? alpha(ACCENT, 0.12) : 'action.hover',
						flexShrink: 0,
					}}
				>
					₹
				</Box>
				<Typography
					sx={{
						minWidth: 0,
						fontSize: { xs: '0.65rem', sm: '0.72rem', xl: '0.78rem' },
						fontWeight: 800,
						color: 'text.primary',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{formatNumber(data?.cost, 2, { fallback: '0', useGrouping: false })}
				</Typography>
			</Stack>
		</Box>
	);
};

const ENERGYConsumption = ({ data }) => (
	<CustomCard accentColor={ACCENT} disableContentPadding>
		{data ? (
			<Box
				sx={{
					height: '100%',
					p: { xs: 1, sm: 1.15 },
					display: 'flex',
					flexDirection: 'column',
					background: (theme) =>
						`linear-gradient(145deg, ${alpha(
							ACCENT,
							theme.palette.mode === 'dark' ? 0.08 : 0.025
						)} 0%, transparent 50%)`,
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					spacing={1}
					mb={0.8}
				>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.85}
						minWidth={0}
					>
						<Box
							sx={{
								width: 50,
								height: 50,
								borderRadius: '11px',
								display: 'grid',
								placeItems: 'center',
								color: ACCENT,
								bgcolor: alpha(ACCENT, 0.09),
								border: `1px solid ${alpha(ACCENT, 0.16)}`,
								boxShadow: `0 6px 16px ${alpha(ACCENT, 0.12)}`,
							}}
						>
							<ElectricBoltRounded sx={{ fontSize: 25 }} />
						</Box>
						<Box minWidth={0}>
							<Typography
								sx={{
									fontSize: { xs: '1rem', xl: '1.15rem' },
									lineHeight: 1.1,
									fontWeight: 800,
									whiteSpace: 'nowrap',
								}}
							>
								Energy Consumption
							</Typography>
							{/* <Typography
								sx={{
									mt: 0.2,
									fontSize: '0.58rem',
									color: 'text.secondary',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}
							>
								Real-time energy usage and costs
							</Typography> */}
						</Box>
					</Stack>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.55}
						flexShrink={0}
					>
						<Box
							sx={{
								width: 7,
								height: 7,
								borderRadius: '50%',
								bgcolor: ACCENT,
								boxShadow: `0 0 0 4px ${alpha(ACCENT, 0.1)}`,
							}}
						/>
						<Typography
							sx={{
								fontSize: '0.65rem',
								fontWeight: 600,
								color: 'text.secondary',
							}}
						>
							Live
						</Typography>
					</Stack>
				</Stack>

				<Stack direction="row" spacing={1.2} flex={1} minHeight={0}>
					{PERIODS.map((period) => (
						<PeriodCard
							key={period.key}
							period={period}
							data={data?.[period.key]}
							unit={data?.unit || ''}
						/>
					))}
				</Stack>
			</Box>
		) : (
			<NoDataFound message="Waiting for live device data — readings appear automatically" />
		)}
	</CustomCard>
);

export default ENERGYConsumption;
