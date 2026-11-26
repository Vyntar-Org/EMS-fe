import {
	TrendingUpRounded,
	TrendingDownRounded,
	TrendingFlatRounded,
} from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';

import { numericReading, compareWaterReading } from '../../../helpers/oht';

export default function OHTMetric({
	label,
	reading,
	changePct,
	previous,
	comparisonLabel,
	hideEmptyComparison = false,
	labelIcon,
}) {
	const percent = numericReading(changePct);
	const supplied = changePct !== undefined;
	const comparison = supplied
		? percent === null
			? null
			: {
					percent,
					direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat',
			  }
		: compareWaterReading(reading.number, previous);
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
	const explanation =
		supplied && comparison
			? 'Percentage change reported by the backend.'
			: comparison
			  ? 'Previous: ' +
			    comparison.previous +
			    '. ' +
			    (comparison.direction === 'down' && label === 'Totalizer'
						? 'Totalizer decreased; check for reset, rollover or correction.'
						: 'Numeric change from the comparison reading.')
			  : 'No previous reading is available.';
	return (
		<Box data-water-ui="metric metric-inline">
			<Box data-water-ui="metric-copy">
				<Typography component="h3">
					{labelIcon}
					{label}
				</Typography>
				<Box data-water-ui="value-line">
					<Typography data-water-ui="metric-value">{reading.value}</Typography>
					{unit && (
						<Tooltip
							title={
								reading.unit === 'Unit unverified'
									? 'Measurement unit is not verified'
									: 'Configured measurement unit'
							}
						>
							<Typography data-water-ui="metric-unit" tabIndex={0}>
								{unit}
							</Typography>
						</Tooltip>
					)}
				</Box>
			</Box>
			{(!hideEmptyComparison || comparison) && (
				<Box data-water-ui="metric-comparison">
					<Tooltip title={explanation}>
						<span
							tabIndex={0}
							data-water-ui={`change change-${comparison?.direction || 'flat'}${
								comparison && comparison.direction !== 'down'
									? ' change-positive'
									: ''
							}`}
						>
							{comparison && <ChangeIcon />}
							{changeText}
						</span>
					</Tooltip>
					<Typography data-water-ui="comparison-range">
						{comparison
							? comparisonLabel || 'vs. previous'
							: 'No comparison available'}
					</Typography>
				</Box>
			)}
		</Box>
	);
}
