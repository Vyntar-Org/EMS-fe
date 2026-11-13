import { Box } from '@mui/material';
import { CalendarMonthOutlined } from '@mui/icons-material';
import { metricReading, numericReading } from './waterMonitorApi';
import WaterMetric from './WaterMetric';

// Supplied summaries only: never infer daily/monthly aggregates from a single reading.
function summaryReading(summary, unit, unavailable) {
	return metricReading(
		{
			latest: { value: summary?.value },
			metrics: {
				value: { unit: summary?.unit || unit, precision: summary?.precision },
			},
		},
		'value',
		unavailable
	);
}
function Sparkline({ values, label }) {
	if (
		!Array.isArray(values) ||
		values.length < 2 ||
		values.some((value) => numericReading(value) === null)
	)
		return null;
	const points = values.map(Number);
	const min = Math.min(...points),
		max = Math.max(...points);
	const line = points
		.map(
			(value, index) =>
				`${(index / (points.length - 1)) * 160},${
					22 - ((value - min) / (max - min || 1)) * 17
				}`
		)
		.join(' ');
	return (
		<svg
			className="wm-period-sparkline"
			viewBox="0 0 160 26"
			preserveAspectRatio="none"
			role="img"
			aria-label={label}
		>
			<polygon points={`0,26 ${line} 160,26`} fill="#f2385714" />
			<polyline
				points={line}
				fill="none"
				stroke="#f23857"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}
export default function WaterMachineSummary({ machine, unavailable, preview }) {
	const summary = machine.summary ?? {};
	return (
		<>
			<Box className="wm-period-grid">
				{[
					{ key: 'today', label: 'Today' },
					{ key: 'mtd', label: 'MTD' },
				].map(({ key, label, unit }) => {
					const data = summary[key];
					const reading = summaryReading(data, unit, unavailable);
					return (
						<Box key={key} className="wm-period-panel">
							<WaterMetric
								label={label}
								hideEmptyComparison
								labelIcon={<CalendarMonthOutlined />}
								reading={reading}
								previous={unavailable ? null : data?.previous}
								comparisonLabel={data?.comparison_label}
							/>
							{reading.number !== null && (
								<Sparkline
									values={data?.trend}
									label={`${preview ? 'Demo ' : ''}${label} supplied trend`}
								/>
							)}
						</Box>
					);
				})}
			</Box>
		</>
	);
}
