import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import { Box, Skeleton, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { SPACING, TYPE_SCALE } from '../../theme/colors';

import CustomCard, { accentFromTitle } from './CustomCard';
import EmptyState from './EmptyState';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

const TREND_ICON = {
	up: ArrowUpwardRounded,
	down: ArrowDownwardRounded,
	flat: RemoveRounded,
};

// Two responsive size tiers — only the icon/value scale shifts between them,
// every other measurement (spacing, chip sizes, footer zone) stays fixed so
// a "compact" card still reads as the same design system, just denser.
const SIZE = {
	comfortable: { icon: 36, iconGlyph: 19, value: TYPE_SCALE.kpiValue },
	compact: { icon: 32, iconGlyph: 17, value: TYPE_SCALE.kpiValueCompact },
};

const CardSkeleton = () => (
	<Stack sx={{ height: '100%', justifyContent: 'space-between' }}>
		<Stack direction="row" alignItems="center" gap={SPACING.sm}>
			<Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
			<Skeleton variant="text" width="50%" height={14} />
		</Stack>
		<Skeleton variant="text" width="60%" height={38} />
		<Skeleton variant="rounded" width="100%" height={8} sx={{ borderRadius: '99px' }} />
	</Stack>
);

// A single "label: value" chip — the shared unit for any de-emphasized
// secondary metric (yesterday's reading, a related total, ...). Deliberately
// much quieter than the hero value: this is where the visual weight this
// card *isn't* placing on a number goes.
const SecondaryMetric = ({ label, value, unit }) => (
	<Stack direction="row" alignItems="baseline" gap={0.5} minWidth={0}>
		<Box flexShrink={0}>
			<ResponsiveTextWrapper
				value={label}
				color="text.secondary"
				fontWeight={600}
				fontSize="10.5px"
				textTransform="uppercase"
				sx={{ letterSpacing: '0.3px' }}
			/>
		</Box>
		<Box minWidth={0}>
			<ResponsiveTextWrapper
				value={`${value?.toLocaleString?.() ?? value ?? 0}${unit ? ` ${unit}` : ''}`}
				color="text.primary"
				fontWeight={700}
				fontSize="11.5px"
			/>
		</Box>
	</Stack>
);

/**
 * The one shared anatomy for every dashboard KPI tile — deliberately its own
 * header (not CustomCard's chart-card header) so the visual hierarchy can be
 * KPI-specific: a small icon+eyebrow-label row, then one dominant value (the
 * thing the eye should land on first), an optional trend chip, optional
 * quiet secondary metrics, and a fixed-position "analytics" footer zone for
 * whatever visualization (progress bar, mini chart, donut, sparkline, ...)
 * best fits this particular metric. Every card gets identical spacing,
 * padding, icon size/position, and typography; only icon/title/value/color/
 * analytics differ between call sites.
 */
const DashboardCard = ({
	icon,
	title,
	accentColor,
	value,
	unit,
	trend,
	secondaryMetrics = [],
	analytics,
	supportingText,
	asOf,
	hasData = true,
	loading = false,
	emptyMessage = 'Waiting for live device data — readings appear automatically',
	size = 'comfortable',
	...cardProps
}) => {
	const accent = accentColor || accentFromTitle(title);
	const s = SIZE[size] || SIZE.comfortable;
	const TrendIcon = trend ? TREND_ICON[trend.direction] || RemoveRounded : null;
	const trendTone =
		trend?.tone ||
		(trend?.direction === 'up'
			? 'success'
			: trend?.direction === 'down'
				? 'error'
				: 'neutral');

	return (
		<CustomCard flat accentColor={accent} disableContentPadding {...cardProps}>
			<Box
				sx={{
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					p: SPACING.lg,
					gap: SPACING.sm,
				}}
			>
				{/* Header: icon badge + eyebrow label — identity, not emphasis */}
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					gap={SPACING.sm}
				>
					<Stack direction="row" alignItems="center" gap={SPACING.sm} minWidth={0}>
						{icon && (
							<Box
								sx={{
									width: s.icon,
									height: s.icon,
									flexShrink: 0,
									borderRadius: '10px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: accent,
									background: (t) =>
										`linear-gradient(135deg, ${alpha(
											accent,
											t.palette.mode === 'dark' ? 0.3 : 0.14
										)} 0%, ${alpha(
											accent,
											t.palette.mode === 'dark' ? 0.12 : 0.05
										)} 100%)`,
									boxShadow: `0 0 0 1px ${alpha(accent, 0.22)}`,
									'& svg': { fontSize: s.iconGlyph },
								}}
							>
								{icon}
							</Box>
						)}
						<Box minWidth={0}>
							<ResponsiveTextWrapper
								value={title}
								color="text.secondary"
								{...TYPE_SCALE.kpiLabel}
							/>
						</Box>
					</Stack>
					{asOf && (
						<ResponsiveTextWrapper
							value={asOf}
							color="text.secondary"
							fontWeight={500}
							fontSize="10px"
							sx={{ flexShrink: 0, width: 'auto' }}
						/>
					)}
				</Stack>

				{loading ? (
					<CardSkeleton />
				) : !hasData ? (
					<Box flex={1} minHeight={0}>
						<EmptyState message={emptyMessage} />
					</Box>
				) : (
					<>
						{/* The dominant element — everything above exists to identify
						    this number, everything below exists to add context to it */}
						<Stack direction="row" alignItems="baseline" gap={0.75} minWidth={0}>
							<Box minWidth={0} flexShrink={1}>
								<ResponsiveTextWrapper
									value={`${value?.toLocaleString?.() ?? value ?? 0}`}
									color={accent}
									sx={{ lineHeight: 1.05, ...TYPE_SCALE[size === 'compact' ? 'kpiValueCompact' : 'kpiValue'] }}
								/>
							</Box>
							{unit && (
								<Box flexShrink={0}>
									<ResponsiveTextWrapper
										value={unit}
										color="text.secondary"
										sx={TYPE_SCALE.unit}
									/>
								</Box>
							)}
							{trend && (
								<Stack
									direction="row"
									alignItems="center"
									gap={0.25}
									flexShrink={0}
									sx={{
										ml: 'auto',
										px: 0.75,
										py: 0.25,
										borderRadius: '999px',
										bgcolor: (t) =>
											alpha(
												trendTone === 'neutral'
													? t.palette.text.secondary
													: t.palette[trendTone].main,
												t.palette.mode === 'dark' ? 0.18 : 0.1
											),
									}}
								>
									{TrendIcon && (
										<TrendIcon
											sx={{
												fontSize: 13,
												color:
													trendTone === 'neutral'
														? 'text.secondary'
														: `${trendTone}.main`,
											}}
										/>
									)}
									<Box flexShrink={0}>
										<ResponsiveTextWrapper
											value={trend.label}
											fontWeight={700}
											fontSize="11px"
											color={trendTone === 'neutral' ? 'text.secondary' : `${trendTone}.main`}
										/>
									</Box>
								</Stack>
							)}
						</Stack>

						{secondaryMetrics.length > 0 && (
							<Stack direction="row" flexWrap="wrap" gap={SPACING.lg}>
								{secondaryMetrics.map((m, i) => (
									<SecondaryMetric key={m.label || i} {...m} />
								))}
							</Stack>
						)}

						{supportingText && (
							<ResponsiveTextWrapper
								value={supportingText}
								color="text.secondary"
								sx={TYPE_SCALE.analytics}
							/>
						)}

						{/* Fixed-position analytics/progress zone — same slot on every
						    card regardless of which visualization best fits this metric */}
						{analytics && (
							<Box sx={{ mt: 'auto', pt: SPACING.xs }}>{analytics}</Box>
						)}
					</>
				)}
			</Box>
		</CustomCard>
	);
};

export default DashboardCard;
