import { Box, Stack, Typography, alpha } from '@mui/material';

import ResponsiveTextWrapper from '../ResponsiveTextWrapper';

// Hero-number layout for count-type metrics (e.g. connected station count)
// that have no "today vs yesterday" reading and no volume unit — forcing
// those into the Today/Yesterday KLD card shape misrepresents the metric,
// so this shows the number itself as the single visual focus instead.
//
// Also used for any value that has no comparison (an API `previous` of
// null): `unit` adds a unit after the number, and `statusLabel` (the compact
// variant's green-dot badge) can be set to null for non-station values.
// The compact value is 24px at the standard 4-tile height (unchanged) and
// grows with the tile's own height (`cqh`) up to 36px when fewer stacked
// tiles give each one a taller slot.
const COMPACT_VALUE_FONT_SIZE = { xs: '22px', md: 'clamp(24px, 15cqh, 36px)' };
const HERO_VALUE_FONT_SIZE = { xs: '30px', sm: '36px', md: '44px', lg: '50px' };

const StatCardLiveCount = ({
	value,
	label,
	accent,
	asOf,
	compact = false,
	icon: Icon,
	unit = '',
	statusLabel = 'Connected',
}) => (
	<Box
		sx={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			gap: compact ? 0.55 : 0.75,
			width: '100%',
			minWidth: 0,
			px: compact ? 0.5 : 2,
			// Only the compact tile always has a fixed slot height; the hero
			// variant can be content-sized (phone top row), where size
			// containment would collapse it.
			containerType: compact ? 'size' : undefined,
		}}
	>
		{compact && label ? (
			<Stack
				direction="row"
				alignItems="center"
				gap={0.75}
				width="100%"
				minWidth={0}
			>
				{Icon && (
					<Box
						sx={{
							width: 26,
							height: 26,
							borderRadius: '8px',
							display: 'grid',
							placeItems: 'center',
							flexShrink: 0,
							color: accent,
							bgcolor: alpha(accent, 0.13),
							boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.16)}`,
							'& svg': { fontSize: 16 },
						}}
					>
						<Icon />
					</Box>
				)}
				<ResponsiveTextWrapper
					value={label}
					color="text.secondary"
					fontWeight={700}
					fontSize="10.5px"
					sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
				/>
			</Stack>
		) : label ? (
			<ResponsiveTextWrapper
				value={label}
				color="text.secondary"
				fontWeight={700}
				fontSize={compact ? '10.5px' : { xs: '10.5px', md: '12.5px' }}
				sx={{
					textTransform: 'uppercase',
					letterSpacing: '0.4px',
					textAlign: 'center',
				}}
			/>
		) : null}

		<Box
			sx={
				compact
					? {
							width: '100%',
							px: 1,
							py: 0.55,
							borderRadius: '10px',
							background: `linear-gradient(120deg, ${alpha(
								accent,
								0.14
							)}, ${alpha(accent, 0.035)})`,
							border: `1px solid ${alpha(accent, 0.18)}`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
					  }
					: undefined
			}
		>
			{unit ? (
				<Stack
					direction="row"
					alignItems="baseline"
					justifyContent={compact ? 'flex-start' : 'center'}
					gap={0.5}
					minWidth={0}
				>
					<ResponsiveTextWrapper
						value={String(value ?? 0)}
						fontWeight={800}
						fontSize={compact ? COMPACT_VALUE_FONT_SIZE : HERO_VALUE_FONT_SIZE}
						color={accent}
						sx={{ lineHeight: 1, minWidth: 0 }}
					/>
					<Typography
						component="span"
						fontSize={compact ? '10px' : '12px'}
						fontWeight={700}
						color="text.secondary"
						flexShrink={0}
					>
						{unit}
					</Typography>
				</Stack>
			) : (
				<ResponsiveTextWrapper
					value={String(value ?? 0)}
					fontWeight={800}
					fontSize={compact ? COMPACT_VALUE_FONT_SIZE : HERO_VALUE_FONT_SIZE}
					color={accent}
					sx={{ lineHeight: 1, textAlign: compact ? 'left' : 'center' }}
				/>
			)}
			{compact && statusLabel && (
				<Stack
					direction="row"
					alignItems="center"
					gap={0.45}
					ml={1}
					flexShrink={0}
				>
					<Box
						width={7}
						height={7}
						borderRadius="50%"
						bgcolor="success.main"
						sx={{
							boxShadow: (t) =>
								`0 0 0 3px ${alpha(t.palette.success.main, 0.14)}`,
						}}
					/>
					<ResponsiveTextWrapper
						value={statusLabel}
						color="text.secondary"
						fontSize="9px"
						fontWeight={600}
					/>
				</Stack>
			)}
		</Box>

		{asOf && (
			<ResponsiveTextWrapper
				value={asOf}
				color="text.secondary"
				fontWeight={500}
				fontSize={{ xs: '9px', md: '10.5px' }}
				sx={{ textAlign: 'center' }}
			/>
		)}
	</Box>
);

export default StatCardLiveCount;
