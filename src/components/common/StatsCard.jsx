import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import { Box, Stack, Typography, alpha } from '@mui/material';

import CustomCard from './CustomCard';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

const TREND_ICON = {
	up: ArrowUpwardRounded,
	down: ArrowDownwardRounded,
	flat: RemoveRounded,
};

/**
 * Standard KPI tile: icon + title + a prominently emphasized primary value,
 * optional supporting text, and an optional trend badge. Built on CustomCard
 * so it shares its accent/elevation language rather than forking it.
 *
 * trend: { direction: 'up' | 'down' | 'flat', label: string, tone?: 'success' | 'warning' | 'error' | 'neutral' }
 */
const StatsCard = ({
	icon,
	title,
	value,
	supportingText,
	trend,
	accentColor,
	flat = true,
	...cardProps
}) => {
	const TrendIcon = trend ? TREND_ICON[trend.direction] || RemoveRounded : null;
	const trendTone =
		trend?.tone ||
		(trend?.direction === 'up'
			? 'success'
			: trend?.direction === 'down'
				? 'error'
				: 'neutral');

	return (
		<CustomCard
			title={title}
			icon={icon}
			accentColor={accentColor}
			flat={flat}
			{...cardProps}
		>
			<Stack justifyContent="center" flex={1} gap={0.5} minWidth={0}>
				<ResponsiveTextWrapper
					value={String(value ?? '—')}
					variant="h4"
					fontWeight={800}
					color="text.accent"
					letterSpacing="-0.5px"
				/>
				{supportingText && (
					<Typography
						variant="caption"
						sx={{ color: 'text.secondary', fontWeight: 500 }}
					>
						{supportingText}
					</Typography>
				)}
				{trend && (
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.5,
							alignSelf: 'flex-start',
							mt: 0.5,
							px: 1,
							py: 0.25,
							borderRadius: '999px',
							bgcolor: (t) =>
								alpha(
									trendTone === 'neutral'
										? t.palette.text.secondary
										: t.palette[trendTone].main,
									t.palette.mode === 'dark' ? 0.2 : 0.12
								),
						}}
					>
						{TrendIcon && (
							<TrendIcon
								sx={{
									fontSize: 14,
									color: trendTone === 'neutral' ? 'text.secondary' : `${trendTone}.main`,
								}}
							/>
						)}
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: trendTone === 'neutral' ? 'text.secondary' : `${trendTone}.main`,
							}}
						>
							{trend.label}
						</Typography>
					</Box>
				)}
			</Stack>
		</CustomCard>
	);
};

export default StatsCard;
