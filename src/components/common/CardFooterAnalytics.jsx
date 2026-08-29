import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { MiniBarSparkline, MiniSparkline } from './MachineCardBits';
import { formatNumber } from '../../helpers/formatters';

// Curated decorative curves — the footer only ever has two real numbers
// (today/yesterday), which draws as a flat, unappealing 2-point line. These
// give the sparkline a natural multi-point shape that still points the
// right direction; they are not a rendering of real historical data.
// Each point zigzags against the previous one (never strictly monotonic) —
// a purely increasing/decreasing sequence draws as a near-straight diagonal
// ramp, which reads as "flat" next to a real wavy sparkline. The net first
// -> last direction still points the right way for each trend.
const UP_TRENDS = [
	[42, 46, 43, 48, 45, 51, 47, 53, 58],
	[30, 34, 31, 37, 33, 40, 36, 45],
];
const DOWN_TRENDS = [
	[58, 54, 57, 51, 55, 48, 52, 44, 40],
	[45, 41, 44, 38, 42, 35, 39, 32],
];
// Pronounced up/down zigzag (not a gentle drift) so a "no change"/"no prior
// data" reading never reads as a flat line next to the up/down variants.
const NEUTRAL_TRENDS = [
	[40, 46, 38, 45, 39, 46, 41],
	[43, 37, 45, 38, 44, 37, 42],
];

// Picks one of the curated curves by direction — and, within that
// direction, the steeper variant for a larger % swing — so the decorative
// shape still hints at magnitude without representing real values. Exactly
// 0% change (or no prior value to compare against) always gets a neutral
// zigzag rather than "up", so it never gets misread as real growth.
const getSparklineData = (percentChange, hasComparison) => {
	if (!hasComparison || percentChange === 0) {
		return NEUTRAL_TRENDS[
			Math.abs(Math.round(percentChange)) % NEUTRAL_TRENDS.length
		];
	}
	const variants = percentChange >= 0 ? UP_TRENDS : DOWN_TRENDS;
	const variantIndex = Math.abs(percentChange) >= 15 ? 0 : 1;
	return variants[variantIndex];
};

// Compact "today vs yesterday" footer for KPI cards — a small sparkline on
// the left, a percentage-change chip (with trend icon) on the right, both
// tinted with the card's own accent color so the footer reads as part of
// the same card rather than a bolted-on widget.
const CardFooterAnalytics = ({
	value,
	previousValue,
	accent,
	comparisonLabel = 'vs Yesterday',
	variant = 'line', // 'line' | 'bar'
	// if true, the footer is rendered on a full-width analytics card rather than a KPI card
}) => {
	const current = Number(value) || 0;
	const previous = Number(previousValue) || 0;
	const hasComparison = previous !== 0;
	const percentChange = hasComparison
		? ((current - previous) / previous) * 100
		: 0;

	const TrendIcon = !hasComparison
		? TrendingFlat
		: percentChange >= 0
		  ? TrendingUp
		  : TrendingDown;

	return (
		<Stack
			direction="row"
			alignItems="center"
			spacing={1.25}
			sx={{
				mt: 1.25,
				p: 1,
				borderRadius: '14px',
				bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.14 : 0.08),
				border: '1px solid',
				borderColor: alpha(accent, 0.16),
				boxShadow: (t) =>
					t.palette.mode === 'dark'
						? `0 2px 8px ${alpha('#000', 0.24)}`
						: `0 2px 8px ${alpha(accent, 0.1)}`,
			}}
		>
			<Box sx={{ flex: 1, minWidth: 48, height: 28, flexShrink: 0 }}>
				{variant === 'bar' ? (
					<MiniBarSparkline
						data={getSparklineData(percentChange, hasComparison)}
						color={accent}
						width="100%"
						height={28}
					/>
				) : (
					<MiniSparkline
						data={getSparklineData(percentChange, hasComparison)}
						color={accent}
						width="100%"
						height={28}
					/>
				)}
			</Box>

			<Divider
				orientation="vertical"
				flexItem
				sx={{ borderStyle: 'dashed', borderColor: alpha(accent, 0.28) }}
			/>

			<Stack
				direction="row"
				alignItems="center"
				spacing={0.5}
				sx={{
					flexShrink: 0,
					// pl: 1.25,
					// borderLeft: '1px dashed',
					borderColor: alpha(accent, 0.3),
				}}
			>
				{/* <Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 22,
						height: 22,
						borderRadius: '50%',
						bgcolor: alpha(accent, 0.16),
						color: accent,
						flexShrink: 0,
						'& svg': { fontSize: 14 },
					}}
				>
					<TrendIcon />
				</Box> */}
				<Typography
					sx={{
						fontSize: '11px',
						fontWeight: 700,
						color: accent,
						whiteSpace: 'nowrap',
					}}
				>
					{hasComparison
						? `${percentChange >= 0 ? '+' : ''}${formatNumber(percentChange)}%`
						: '—'}{' '}
					<Typography
						component="span"
						sx={{ fontSize: '10px', fontWeight: 600, color: 'text.secondary' }}
					>
						{comparisonLabel}
					</Typography>
				</Typography>
			</Stack>
		</Stack>
	);
};

export default CardFooterAnalytics;
