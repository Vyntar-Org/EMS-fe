import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { Box, Stack, alpha } from '@mui/material';
import PropTypes from 'prop-types';

import { formatChartValue } from '../../../helpers/chartConfig';
import { MiniProgressBar } from '../MachineCardBits';
import ResponsiveTextWrapper from '../ResponsiveTextWrapper';

/**
 * Compact metric card — the deliberately different sibling to the big
 * centered Today/Yesterday KPI tiles: a small icon + label header, one
 * value line, and the existing `MiniProgressBar` (today's value as a share
 * of today/yesterday) instead of a dual-number split. Built for short,
 * stacked secondary-metric slots where the full KPI layout doesn't fit
 * without scrolling — this renders its own header rather than going
 * through `CustomCard`'s title slot, since that header's large icon chip
 * is what didn't fit in that vertical budget.
 */
const CompactSecondaryMetricCard = ({
	title,
	icon: Icon,
	value,
	previousValue,
	unit = 'KL',
	accent,
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

	// Today's share of (today + yesterday) — not today/max(today, yesterday),
	// which pins at 100% any time today is the larger of the two (i.e. most
	// of the time) and never actually moves.
	const total = current + previous;
	const todayPct = total > 0 ? (current / total) * 100 : 0;

	return (
		<Box
			sx={{
				height: '100%',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				minWidth: 0,
				gap: 0.5,
			}}
		>
			<Stack direction="row" alignItems="center" gap={0.75} minWidth={0}>
				{Icon && (
					<Box
						sx={{
							width: 24,
							height: 24,
							flexShrink: 0,
							borderRadius: '7px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: accent,
							bgcolor: (t) =>
								alpha(accent, t.palette.mode === 'dark' ? 0.22 : 0.13),
							'& svg': { fontSize: 14 },
						}}
					>
						<Icon />
					</Box>
				)}
				<Box minWidth={0} flex={1}>
					<ResponsiveTextWrapper
						value={title}
						color="text.secondary"
						fontWeight={700}
						fontSize="10.5px"
						sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
					/>
				</Box>
				<TrendIcon sx={{ fontSize: 13, color: accent, flexShrink: 0 }} />
			</Stack>

			<ResponsiveTextWrapper
				value={`${formatChartValue(current)}${unit ? ` ${unit}` : ''}`}
				fontWeight={800}
				fontSize={{ xs: '17px', md: '19px' }}
				color={accent}
				sx={{ lineHeight: 1.05 }}
			/>

			<MiniProgressBar
				percent={todayPct}
				color={accent}
				label="vs Yesterday"
				value={`${formatChartValue(previous)}${unit ? ` ${unit}` : ''}`}
			/>
		</Box>
	);
};

CompactSecondaryMetricCard.propTypes = {
	title: PropTypes.string,
	icon: PropTypes.elementType,
	value: PropTypes.number,
	previousValue: PropTypes.number,
	unit: PropTypes.string,
	accent: PropTypes.string,
};

export default CompactSecondaryMetricCard;
