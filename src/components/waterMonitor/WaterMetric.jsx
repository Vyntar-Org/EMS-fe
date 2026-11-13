import { Box, Tooltip, Typography } from '@mui/material';
import {
	TrendingUpRounded,
	TrendingDownRounded,
	TrendingFlatRounded,
} from '@mui/icons-material';
import { compareWaterReading } from './waterMachinePresentation';

export default function WaterMetric({
	label,
	reading,
	flow,
	previous,
	comparisonLabel,
	hideEmptyComparison = false,
	labelIcon,
}) {
	const comparison = compareWaterReading(reading.number, previous);
	const ChangeIcon =
		comparison?.direction === 'up'
			? TrendingUpRounded
			: comparison?.direction === 'down'
			  ? TrendingDownRounded
			  : TrendingFlatRounded;
	const unit =
		reading.unit === 'Unit unverified'
			? reading.number === null
				? ''
				: 'Unit N/A'
			: reading.unit;
	const changeText = comparison
		? comparison.percent !== null
			? (comparison.percent > 0 ? '+' : '') +
			  comparison.percent.toFixed(1) +
			  '%'
			: comparison.delta === 0
			  ? '0%'
			  : 'New value'
		: 'N/A';
	const explanation = comparison
		? 'Previous: ' +
		  comparison.previous +
		  '. ' +
		  (comparison.direction === 'down' && label === 'Totalizer'
				? 'Totalizer decreased; check for reset, rollover or correction.'
				: 'Numeric change from the comparison reading.')
		: 'No previous reading is available.';
	return (
		<Box className="wm-metric wm-metric-inline">
			<Box className="wm-metric-copy">
				<Typography component="h3">
					{labelIcon}
					{label}
				</Typography>
				<Box className="wm-value-line">
					<Typography className="wm-metric-value">{reading.value}</Typography>
					{unit && (
						<Tooltip
							title={
								reading.unit === 'Unit unverified'
									? 'Measurement unit is not verified'
									: 'Configured measurement unit'
							}
						>
							<Typography className="wm-metric-unit" tabIndex={0}>
								{unit}
							</Typography>
						</Tooltip>
					)}
				</Box>
			</Box>
			{(!hideEmptyComparison || comparison) && (
				<Box className="wm-metric-comparison">
					<Tooltip title={explanation}>
						<span
							tabIndex={0}
							className={
								'wm-change wm-change-' + (comparison?.direction || 'flat')
							}
						>
							<ChangeIcon />
							{changeText}
						</span>
					</Tooltip>
					<Typography className="wm-comparison-range">
						{comparison ? comparisonLabel || 'vs. previous' : 'No history'}
					</Typography>
				</Box>
			)}
		</Box>
	);
}
