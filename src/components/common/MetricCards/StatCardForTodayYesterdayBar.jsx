import { alpha, Box, Divider, Typography } from '@mui/material';

import { formatChartValue } from '../../../helpers/chartConfig';
import CardFooterAnalytics from '../CardFooterAnalytics';
import ResponsiveTextWrapper from '../ResponsiveTextWrapper';

// Same shell as StatCardForTodayYesterday (today/yesterday split, connector
// divider), but the footer trend renders as a bar chart instead of a line
// sparkline, and the unit is caller-supplied rather than a hardcoded "KL" —
// not every metric here is a volume quantity.
const StatCardForTodayYesterdayBar = ({
	value,
	previousValue,
	accent,
	caption,
	unit = 'KL',
	asOf,
	isAnalyticsCard = true,
}) => {
	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				minWidth: 0,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: { xs: 2.5, md: 3.5 },
					width: '100%',
					minWidth: 0,
					px: 4,
				}}
			>
				{[
					{ label: 'Today', value },
					{ label: 'Yesterday', value: previousValue },
				].map((item) => (
					<Box
						key={item.label}
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: { xs: 2.5, md: 3.5 },
							width: '100%',
						}}
					>
						<Box width="100%" textAlign="center">
							<ResponsiveTextWrapper
								color="text.primary"
								fontWeight={700}
								fontSize={{ xs: '10.5px', md: '14px' }}
								value={item.label}
								sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
							/>

							<Box width={100} textAlign="center" mx="auto">
								<Typography
									noWrap
									color={accent}
									fontSize="16px"
									fontWeight={800}
									lineHeight={1.1}
									my={0.5}
								>
									{formatChartValue(item.value) || 0}
									{unit && (
										<Typography
											component="span"
											fontSize="10px"
											fontWeight={700}
											color="text.secondary"
											sx={{ ml: 0.35 }}
										>
											{unit}
										</Typography>
									)}
								</Typography>
							</Box>

							{caption ? (
								<ResponsiveTextWrapper
									color="text.secondary"
									fontWeight={500}
									fontSize={{ xs: '9px', md: '10px' }}
									value={`(${caption})`}
									sx={{ lineHeight: 1.2 }}
								/>
							) : null}
						</Box>
					</Box>
				))}
			</Box>
			<Box
				sx={{
					position: 'relative',
					width: '100%',
					mt: 1,
					px: 4,
				}}
			>
				<Divider
					sx={{
						borderColor: alpha(accent, 0.22),
						borderBottomWidth: 1.5,
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						left: '50%',
						top: -80,
						transform: 'translateX(-50%)',
						width: 2,
						height: 80,
						borderRadius: 999,
						bgcolor: alpha(accent, 0.5),
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						transform: 'translate(-50%, -50%)',
						width: 12,
						height: 12,
						borderRadius: '50%',
						bgcolor: accent,
						border: '3px solid white',
						boxShadow: `0 2px 10px ${alpha(accent, 0.35)}`,
					}}
				/>
			</Box>

			{isAnalyticsCard && (
				<CardFooterAnalytics
					value={value}
					previousValue={previousValue}
					accent={accent}
					variant="bar"
				/>
			)}

			{asOf && (
				<ResponsiveTextWrapper
					value={asOf}
					color="text.secondary"
					fontWeight={500}
					fontSize={{ xs: '8.5px', md: '9.5px' }}
					sx={{ textAlign: 'right', mt: 0.5, px: 0.5 }}
				/>
			)}
		</Box>
	);
};

export default StatCardForTodayYesterdayBar;
